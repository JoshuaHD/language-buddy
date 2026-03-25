<?php

use App\Models\Language;
use App\Models\Recording;
use App\Models\Sentence;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->withoutMiddleware(PreventRequestForgery::class);
    Storage::fake('public');
    $this->user = User::factory()->create();
    $this->language = Language::factory()->create(['name' => 'English']);
});

test('can view the voice recorder page with data', function () {
    $sentence = Sentence::factory()->create(['user_id' => $this->user->id, 'language_id' => $this->language->id]);

    $this->actingAs($this->user)
        ->get(route('app.record'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('app/voiceRecorder')
            ->has('languages', 1)
            ->has('sentences', 1)
            ->where('sentences.0.content', $sentence->content)
        );
});

test('can create a sentence', function () {
    $this->actingAs($this->user)
        ->postJson(route('app.record.sentences.store'), [
            'content' => 'Hello world',
            'language_id' => $this->language->id,
        ])
        ->assertRedirect(); // Controller returns back() which is a redirect

    $this->assertDatabaseHas('sentences', [
        'content' => 'Hello world',
        'language_id' => $this->language->id,
        'user_id' => $this->user->id,
    ]);
});

test('can delete a sentence and its recordings from disk', function () {
    $sentence = Sentence::factory()->create(['user_id' => $this->user->id]);

    // Create a recording with a file
    $file = UploadedFile::fake()->create('recording.webm', 100);
    $path = $file->store('recordings', 'public');

    $recording = Recording::factory()->create([
        'sentence_id' => $sentence->id,
        'user_id' => $this->user->id,
        'path' => '/storage/'.$path,
    ]);

    Storage::disk('public')->assertExists($path);

    $this->actingAs($this->user)
        ->deleteJson(route('app.record.sentences.destroy', $sentence))
        ->assertRedirect();

    $this->assertDatabaseMissing('sentences', ['id' => $sentence->id]);
    $this->assertDatabaseMissing('recordings', ['id' => $recording->id]);
    Storage::disk('public')->assertMissing($path);
});

test('can store a recording with regions', function () {
    $sentence = Sentence::factory()->create(['user_id' => $this->user->id]);
    $audio = UploadedFile::fake()->create('recording.webm', 100);
    $regions = [
        ['start' => 0, 'end' => 1, 'content' => 'First', 'color' => 'red'],
        ['start' => 1, 'end' => 2, 'content' => 'Second', 'color' => 'blue'],
    ];

    $this->actingAs($this->user)
        ->postJson(route('app.record.recordings.store', $sentence), [
            'audio' => $audio,
            'options' => [
                'regions' => json_encode($regions),
            ],
        ])
        ->assertRedirect();

    $recording = Recording::where('sentence_id', $sentence->id)->first();
    expect($recording->options['regions'])->toHaveCount(2)
        ->and($recording->options['regions'][0]['content'])->toBe('First');

    Storage::disk('public')->assertExists(str_replace('/storage/', '', $recording->path));
});

test('can update a recording with new audio and regions', function () {
    $sentence = Sentence::factory()->create(['user_id' => $this->user->id]);

    // Initial recording
    $oldFile = UploadedFile::fake()->create('old.webm', 100);
    $oldPath = $oldFile->store('recordings', 'public');
    $recording = Recording::factory()->create([
        'sentence_id' => $sentence->id,
        'user_id' => $this->user->id,
        'path' => '/storage/'.$oldPath,
        'options' => ['regions' => [['start' => 0, 'end' => 1, 'content' => 'Old']]],
    ]);

    Storage::disk('public')->assertExists($oldPath);

    // Update with new audio and new regions
    $newAudio = UploadedFile::fake()->create('new.webm', 200);
    $newRegions = [['start' => 0, 'end' => 2, 'content' => 'New', 'color' => 'green']];

    $this->actingAs($this->user)
        ->postJson(route('app.record.recordings.update', $recording), [
            '_method' => 'PATCH',
            'audio' => $newAudio,
            'options' => [
                'regions' => json_encode($newRegions),
            ],
        ])
        ->assertRedirect();

    $recording->refresh();

    // Check old file deleted, new exists
    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists(str_replace('/storage/', '', $recording->path));

    // Check regions updated
    expect($recording->options['regions'])->toHaveCount(1)
        ->and($recording->options['regions'][0]['content'])->toBe('New');
});

test('old recording file is deleted from disk when a new one is uploaded', function () {
    $recording = Recording::factory()->create([
        'user_id' => $this->user->id,
        'path' => '/storage/recordings/old-file.webm',
    ]);

    Storage::disk('public')->put('recordings/old-file.webm', 'content');
    Storage::disk('public')->assertExists('recordings/old-file.webm');

    $newAudio = UploadedFile::fake()->create('new-file.webm', 100);

    $this->actingAs($this->user)
        ->postJson(route('app.record.recordings.update', $recording), [
            '_method' => 'PATCH',
            'audio' => $newAudio,
        ])
        ->assertRedirect();

    Storage::disk('public')->assertMissing('recordings/old-file.webm');
});

test('cannot save the 100-milliseconds-of-silence file to the api', function () {
    // this tests needs to happen client side
    // if wavesurfer is initialized deactivate save button
    // - also deactivate regions plugin

    expect(false)->toBeTrue();
});

test('can update only regions of a recording', function () {
    // when a new recording for an existing recording is started the old regions should disappear
    // so that the user can create new regions for that region

    expect(false)->toBeTrue();
});
