<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'home', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');


Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('/app/record', [App\Http\Controllers\VoiceRecorderController::class, 'index'])->name('app.record');
    Route::post('/app/record/sentences', [App\Http\Controllers\VoiceRecorderController::class, 'storeSentence'])->name('app.record.sentences.store');
    Route::post('/app/record/sentences/{sentence}/recordings', [App\Http\Controllers\VoiceRecorderController::class, 'storeRecording'])->name('app.record.recordings.store');
    Route::patch('/app/record/recordings/{recording}', [App\Http\Controllers\VoiceRecorderController::class, 'updateRecording'])->name('app.record.recordings.update');
});

require __DIR__.'/settings.php';
