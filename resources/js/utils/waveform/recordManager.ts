import type WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/plugins/record';

export const setupRecordManager = (ws: WaveSurfer, recordPlugin: any) => {
    let recordingBlob: Blob | null = null;
    let recordingTime = 0;

    // --- Listeners ---

    // Fires when the recording is stopped and the audio is ready
    recordPlugin.on('record-end', (blob: Blob) => {
        recordingBlob = blob;
    });

    // Fires periodically while recording
    recordPlugin.on('record-progress', (time: number) => {
        recordingTime = time;
        const debug = false;

        if (debug) {
            console.log(`Recording: ${Math.floor(time / 1000)}s`);
        }
    });

    // --- Exposed Actions ---
    return {
        instance: recordPlugin,

        start: async () => {
            try {
                // Gets mic permissions and starts visualization
                await recordPlugin.startRecording();
            } catch (err) {
                console.error('Microphone access denied:', err);
            }
        },

        stop: () => {
            recordPlugin.stopRecording();
        },

        pause: () => {
            recordPlugin.pauseRecording();
        },

        resume: () => {
            recordPlugin.resumeRecording();
        },

        getBlob: () => recordingBlob,

        getAvailableDevices: async () => {
            return await RecordPlugin.getAvailableAudioDevices();
        },

        setDevice: (deviceId: string) => {
            recordPlugin.startRecording({ deviceId });
        },

        getRecordingTime: () => {
            return recordingTime;
        },
    };
};
