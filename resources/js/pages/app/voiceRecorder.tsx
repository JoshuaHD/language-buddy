import WavesurferPlayer from '@wavesurfer/react';
import { PauseIcon, PlayIcon } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import type WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

    // 1. Keep a ref to the regions plugin to use in buttons/functions
    const regionsRef = useRef<any>(null);
    const regionActions = useRef<ReturnType<typeof setupRegionManager> | null>(
        null,
    );

    // 2. Create plugins inside useMemo, but DON'T assign to the ref here
    const plugins = useMemo(
        () => [
            Timeline.create({ container: '#timeline' }),
            RegionsPlugin.create(),
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
                url={audioUrls[0]}
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
            </div>
        </div>
    );
}
