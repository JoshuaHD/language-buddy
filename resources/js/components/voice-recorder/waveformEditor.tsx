import WavesurferPlayer from '@wavesurfer/react';
import { PauseIcon, PlayIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import RecordPlugin from 'wavesurfer.js/plugins/record';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AudioRateSlider from '@/components/voice-recorder/audioRateSlider';
import RecordAudioButton from '@/components/voice-recorder/recordAudioButton';
import RegionEditor from '@/components/voice-recorder/regionEditor';
import { setupRegionManager } from '@/utils/waveform/regionManager';

const formatTime = (seconds: number) =>
    [seconds / 60, seconds % 60]
        .map((v) => `0${Math.floor(v)}`.slice(-2))
        .join(':');

interface WaveformEditorProps {
    url?: string;
    onRecordEnd: (blob: Blob, regions: any[]) => void;
    initialRegions?: any[];
    onRegionsChange?: (regions: any[]) => void;
}

export default function WaveformEditor({
    url,
    onRecordEnd,
    initialRegions = [],
    onRegionsChange,
}: WaveformEditorProps) {
    const initialLoopRegion = true;
    const initialAutoplay = true;
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
    const [usedUrl, setUsedUrl] = useState(
        url ?? '/audio/100-milliseconds-of-silence.ogg',
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [loopRegion, setLoopRegion] = useState(initialLoopRegion);
    const [autoplay, setAutoplay] = useState(initialAutoplay);
    const [audioRate, setAudioRate] = useState(1);
    const [regions, setRegions] = useState<any[]>(initialRegions);

    const isDirty = useMemo(() => {
        const audioChanged =
            usedUrl !== (url ?? '/audio/100-milliseconds-of-silence.ogg');
        const regionsChanged =
            JSON.stringify(regions) !== JSON.stringify(initialRegions);

        return audioChanged || regionsChanged;
    }, [usedUrl, regions, initialRegions, url]);

    // Get the record plugin instance from wavesurfer if it's available
    const recordPlugin = useMemo(() => {
        return wavesurfer
            ?.getActivePlugins()
            .find((p) => p instanceof RecordPlugin);
    }, [wavesurfer]);

    const regionsPlugin = useMemo(() => {
        return wavesurfer
            ?.getActivePlugins()
            .find((p) => p instanceof RegionsPlugin) as any;
    }, [wavesurfer]);

    const regionActions = useMemo(() => {
        if (!wavesurfer || !regionsPlugin) {
            return null;
        }

        return setupRegionManager(wavesurfer, regionsPlugin, {
            loopRegion: initialLoopRegion,
            autoPlay: initialAutoplay,
            onRegionsChange: (newRegions: any[]) => {
                setRegions([...newRegions]);
                onRegionsChange?.([...newRegions]);
            },
        });
    }, [
        wavesurfer,
        regionsPlugin,
        initialLoopRegion,
        initialAutoplay,
        onRegionsChange,
    ]);

    // Keep loopRegion in sync with the manager
    useEffect(() => {
        regionActions?.setLoop(loopRegion);
    }, [loopRegion, regionActions]);

    useEffect(() => {
        regionActions?.setAutoplay(autoplay);
    }, [autoplay, regionActions]);

    // 3. Create plugins inside useMemo, but DON'T assign to the ref here
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
        setIsPlaying(false);
    };

    function handleRegionLoop() {
        setLoopRegion(!loopRegion);
    }

    function handleAutoplay() {
        setAutoplay(!autoplay);
    }

    function handleRecordEnd(blob: Blob) {
        const blobUrl = URL.createObjectURL(blob);
        setUsedUrl(blobUrl);
    }

    async function handleSubmitRecording() {
        const response = await fetch(usedUrl);

        const blob = await response.blob();

        onRecordEnd(blob, regions);
    }

    return (
        <div className={'rounded-lg border bg-card p-4 shadow-sm'}>
            <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">
                    Duration: {formatTime(wavesurfer?.getDuration() ?? 0)}
                </div>
            </div>
            <div id="timeline" />
            <WavesurferPlayer
                height={100}
                waveColor="lightblue"
                barGap={3}
                barWidth={3}
                barRadius={30}
                url={usedUrl}
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
                        disabled={!url && !recordPlugin}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </Button>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={loopRegion}
                            onCheckedChange={() => handleRegionLoop()}
                        />
                        <span className="text-sm">Loop Region</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={autoplay}
                            onCheckedChange={() => handleAutoplay()}
                        />
                        <span className="text-sm">Autoplay</span>
                    </div>
                    <div>
                        <span className="mr-2 text-sm">
                            Speed: ({audioRate})
                        </span>
                        <AudioRateSlider
                            wavesurfer={wavesurfer}
                            onChange={(newRate: number) =>
                                setAudioRate(newRate)
                            }
                        />
                    </div>
                </div>
                <div className={'flex items-center justify-between gap-1'}>
                    <RecordAudioButton
                        recordPlugin={recordPlugin}
                        onRecordEnd={handleRecordEnd}
                    />
                    <Button onClick={handleSubmitRecording} disabled={!isDirty}>
                        Save
                    </Button>
                </div>
            </div>

            <div className="mt-4 space-y-1">
                <h3 className="text-sm font-bold">Regions:</h3>
                <RegionEditor regions={regions} regionActions={regionActions} />
            </div>
        </div>
    );
}
