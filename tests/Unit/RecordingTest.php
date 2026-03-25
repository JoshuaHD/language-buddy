<?php

use App\Models\Recording;
use App\Models\Sentence;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('it belongs to a user', function () {
    $user = User::factory()->create();
    $recording = Recording::factory()->create(['user_id' => $user->id]);

    expect($recording->user)->toBeInstanceOf(User::class)
        ->and($recording->user->id)->toBe($user->id);
});

test('it belongs to a sentence', function () {
    $sentence = Sentence::factory()->create();
    $recording = Recording::factory()->create(['sentence_id' => $sentence->id]);

    expect($recording->sentence)->toBeInstanceOf(Sentence::class)
        ->and($recording->sentence->id)->toBe($sentence->id);
});

test('it casts options to array', function () {
    $recording = Recording::factory()->create([
        'options' => ['regions' => []],
    ]);

    expect($recording->options)->toBeArray()
        ->and($recording->options)->toHaveKey('regions');
});
