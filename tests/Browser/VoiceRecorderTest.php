<?php

use App\Models\Language;
use App\Models\Recording;
use App\Models\Sentence;
use App\Models\User;

it('can visit the voice recorder page', function () {
    $user = User::factory()->create();
    Language::factory()->create(['name_common' => 'English']);

    $this->actingAs($user)
        ->visit(route('app.record'))
        ->assertSee('Voice Recorder')
        ->assertSee('Sentences');
});

it('resets regions when starting a updated recording', function () {
    $user = User::factory()->create();
    $language = Language::factory()->create();
    $sentence = Sentence::factory()->create(['user_id' => $user->id, 'language_id' => $language->id]);

    // Create an initial recording with regions
    $recording = Recording::factory()->create([
        'sentence_id' => $sentence->id,
        'user_id' => $user->id,
        'path' => '/audio/maayung-buntag.mp3',
        'options' => ['regions' => [['start' => 0, 'end' => 1, 'content' => 'Test Region']]],
    ]);

    $this->actingAs($user)
        ->visit(route('app.record'))
        ->click('text='.$sentence->content)
        ->assertSee('Recording #'.$recording->id)
        ->click('text=Recording #'.$recording->id)
        ->assertSee('Test Region')
        ->click('Start Recording')
        // wait for microphone ready and recording
        ->assertDontSee('Test Region');

    // this does not work
});

it('restores regions when clicking undo after recording', function () {
    $user = User::factory()->create();
    $language = Language::factory()->create();
    $sentence = Sentence::factory()->create(['user_id' => $user->id, 'language_id' => $language->id]);

    $recording = Recording::factory()->create([
        'sentence_id' => $sentence->id,
        'user_id' => $user->id,
        'path' => '/audio/maayung-buntag.mp3',
        'options' => ['regions' => [['start' => 0, 'end' => 1, 'content' => 'Old Region']]],
    ]);

    $this->actingAs($user)
        ->visit(route('app.record'))
        ->click('text='.$sentence->content)
        ->click('text=Recording #'.$recording->id)
        ->assertSee('Old Region')
        ->click('Record New')
        ->click('undo')
        ->assertSee('Old Region');
})->todo();

it('focuses the input field when a region is created', function () {
    // This requires simulating a drag on the waveform
})->todo();
