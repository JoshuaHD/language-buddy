import WavesurferPlayer from '@wavesurfer/react';
import { PauseIcon, PlayIcon } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import type WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import RecordPlugin from 'wavesurfer.js/plugins/record';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { setupRecordManager } from '@/utils/waveform/recordManager';
import { setupRegionManager } from '@/utils/waveform/regionManager';

const audioUrls = [
    '/audio/oi-bay.mp3',
    'https://raw.githubusercontent.com/katspaugh/wavesurfer-react/main/examples/audio.wav',
    '/audio/maayung-buntag.mp3',
    'https://raw.githubusercontent.com/katspaugh/wavesurfer-react/main/examples/stereo.mp3',
    'https://raw.githubusercontent.com/katspaugh/wavesurfer-react/main/examples/mono.mp3',
    'https://raw.githubusercontent.com/katspaugh/wavesurfer-react/main/examples/librivox.mp3',
];

const formatTime = (seconds: number) =>
    [seconds / 60, seconds % 60]
        .map((v) => `0${Math.floor(v)}`.slice(-2))
        .join(':');

type VoiceRecorder = {
    test: string;
};
export default function VoiceRecorder() {
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loopRegion, setLoopRegion] = useState(true);
    const [audioRate, setAudioRate] = useState(1);
    const [url, setUrl] = useState(audioUrls[0]);

    const [isRecording, setIsRecording] = useState(false);
    const [isBusy, setIsBusy] = useState(false);

    // 1. Keep a ref to the regions plugin to use in buttons/functions
    const regionActions = useRef<ReturnType<typeof setupRegionManager> | null>(
        null,
    );
    const recordActions = useRef<ReturnType<typeof setupRecordManager> | null>(
        null,
    );

    // 2. Create plugins inside useMemo, but DON'T assign to the ref here
    const plugins = useMemo(
        () => [
            Timeline.create({ container: '#timeline' }),
            RegionsPlugin.create(),
            RecordPlugin.create({
                scrollingWaveform: true,
                renderRecordedAudio: false,
            }),
        ],
        [],
    );

    const onReady = (ws: WaveSurfer) => {
        setWavesurfer(ws);

        const regionsPlugin = ws
            .getActivePlugins()
            .find((p) => p instanceof RegionsPlugin) as any;

        if (regionsPlugin) {
            // Initialize region logic and store the API in a ref
            regionActions.current = setupRegionManager(ws, regionsPlugin, {
                loopRegion,
            });
        }

        const recordPlugin = ws
            .getActivePlugins()
            .find((p) => p instanceof RecordPlugin);

        if (recordPlugin) {
            recordActions.current = setupRecordManager(ws, recordPlugin);

            // Sync recording state to React UI
            recordPlugin.on('record-start', () => {
                setIsRecording(true);
                setIsBusy(false);
            });
            recordPlugin.on('record-end', (blob: Blob) => {
                const blobUrl = URL.createObjectURL(blob);
                setUrl(blobUrl);
                setIsRecording(false);
                setIsBusy(false);
            });
        }
    };
    const handleAddRegion = () => {
        // 4. Use the ref safely in an event handler
        if (regionActions.current) {
            regionActions.current.instance.addRegion({
                start: 6,
                end: 8,
                content: 'User Region',
                color: 'rgba(255, 165, 0, 0.3)',
            });
        }
    };

    const handleAudioRateChange = (e: ChangeEvent<HTMLInputElement>) => {
        const rate = e.target.valueAsNumber;

        setAudioRate(rate);

        if (wavesurfer) {
            wavesurfer.setPlaybackRate(rate, true);
        }
    };

    const handleToggleRecord = async () => {
        if (isBusy || !recordActions.current) {
            return;
        }

        setIsBusy(true);

        if (isRecording) {
            recordActions.current.stop();
        } else {
            try {
                await recordActions.current.start();
            } catch (err) {
                console.error(err);
                setIsBusy(false);
            }
        }
    };

    function handleRegionLoop() {
        return () => {
            setLoopRegion(!loopRegion);
            regionActions.current?.setLoop(!loopRegion);
        };
    }

    return (
        <div className={'p-4'}>
            <div id="timeline" />
            <WavesurferPlayer
                height={100}
                waveColor="lightblue"
                barGap={3}
                barWidth={3}
                barRadius={30}
                url={url}
                onReady={onReady}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                plugins={plugins}
            />

            <div style={{ marginTop: '10px' }}>
                <div className={'my-1 flex items-center justify-between'}>
                    <Button
                        variant={'outline'}
                        onClick={() => wavesurfer?.playPause()}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </Button>

                    <div>
                        <Checkbox
                            checked={loopRegion}
                            onClick={handleRegionLoop()}
                        />{' '}
                        Loop Region
                    </div>
                    <div>
                        Playback Speed: ({audioRate})
                        <input
                            value={audioRate}
                            type={'range'}
                            min={'0.25'}
                            max={'1.5'}
                            step={'0.25'}
                            onChange={handleAudioRateChange}
                        />
                    </div>
                </div>
                <Button variant={'outline'} onClick={handleAddRegion}>
                    Add Region
                </Button>

                <Button
                    onClick={handleToggleRecord}
                    disabled={isBusy}
                    style={{
                        backgroundColor: isRecording ? 'red' : 'black',
                        color: 'white',
                        opacity: isBusy ? 0.5 : 1,
                    }}
                >
                    {isBusy ? 'Wait...' : isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
            </div>
        </div>
    );
}
