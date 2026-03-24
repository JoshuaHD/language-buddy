<?php

use App\Http\Controllers\VoiceRecorderController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'home', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('/app/record', [VoiceRecorderController::class, 'index'])->name('app.record');
    Route::post('/app/record/sentences', [VoiceRecorderController::class, 'storeSentence'])->name('app.record.sentences.store');
    Route::post('/app/record/sentences/{sentence}/recordings', [VoiceRecorderController::class, 'storeRecording'])->name('app.record.recordings.store');
    Route::patch('/app/record/recordings/{recording}', [VoiceRecorderController::class, 'updateRecording'])->name('app.record.recordings.update');
    Route::delete('/app/record/recordings/{recording}', [VoiceRecorderController::class, 'destroyRecording'])->name('app.record.recordings.destroy');
});

require __DIR__.'/settings.php';
