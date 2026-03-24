<?php

namespace App\Http\Controllers;

use App\Models\Language;
use App\Models\Recording;
use App\Models\Sentence;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VoiceRecorderController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('app/voiceRecorder', [
            'languages' => Language::all(),
            'sentences' => Sentence::with(['recordings'])->latest()->get(),
        ]);
    }

    public function storeSentence(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'language_id' => 'required|exists:languages,id',
        ]);

        $request->user()->sentences()->create($validated);

        return back();
    }

    public function storeRecording(Request $request, Sentence $sentence)
    {
        $request->validate([
            'audio' => 'required|file|mimes:mp3,wav,ogg,webm',
        ]);

        $path = $request->file('audio')->store('recordings', 'public');

        $sentence->recordings()->create([
            'user_id' => $request->user()->id,
            'path' => '/storage/'.$path,
            'options' => [],
        ]);

        return back();
    }

    public function updateRecording(Request $request, Recording $recording)
    {
        $validated = $request->validate([
            'options' => 'required|array',
        ]);

        $recording->update($validated);

        return back();
    }
}
