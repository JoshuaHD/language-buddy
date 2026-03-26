<?php

namespace App\Http\Controllers;

use App\Models\Language;
use App\Models\Recording;
use App\Models\Sentence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class VoiceRecorderController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('app/voiceRecorder', [
            'languages' => Language::orderBy('name_common')->get(),
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

    public function destroySentence(Sentence $sentence)
    {
        foreach ($sentence->recordings as $recording) {
            $oldPath = str_replace('/storage/', '', $recording->path);
            Storage::disk('public')->delete($oldPath);

            $recording->delete();
        }

        $sentence->delete();

        return back();
    }

    public function storeRecording(Request $request, Sentence $sentence)
    {
        $request->validate([
            'audio' => 'required|file|mimes:mp3,wav,ogg,webm',
            'options' => 'nullable|array',
        ]);

        $path = $request->file('audio')->store('recordings', 'public');

        $options = $request->input('options', []);
        if (isset($options['regions']) && is_string($options['regions'])) {
            $options['regions'] = json_decode($options['regions'], true);
        }

        $sentence->recordings()->create([
            'user_id' => $request->user()->id,
            'path' => '/storage/'.$path,
            'options' => $options,
        ]);

        return back();
    }

    public function updateRecording(Request $request, Recording $recording)
    {
        $validated = $request->validate([
            'options' => 'nullable|array',
            'audio' => 'nullable|file|mimes:mp3,wav,ogg,webm',
        ]);

        if ($request->hasFile('audio')) {
            // Delete old file if it exists
            $oldPath = str_replace('/storage/', '', $recording->path);
            Storage::disk('public')->delete($oldPath);

            $path = $request->file('audio')->store('recordings', 'public');
            $recording->path = '/storage/'.$path;
        }

        if ($request->has('options')) {
            $newOptions = $request->input('options');

            if (isset($newOptions['regions']) && is_string($newOptions['regions'])) {
                $newOptions['regions'] = json_decode($newOptions['regions'], true);
            }

            $recording->options = array_merge($recording->options ?? [], $newOptions);
        }

        $recording->save();

        return back();
    }

    public function destroyRecording(Recording $recording)
    {
        $oldPath = str_replace('/storage/', '', $recording->path);
        Storage::disk('public')->delete($oldPath);

        $recording->delete();

        return back();
    }
}
