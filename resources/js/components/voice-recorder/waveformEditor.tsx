import WavesurferPlayer from '@wavesurfer/react';
import { clsx } from 'clsx';
import { PauseIcon, PlayIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import RecordPlugin from 'wavesurfer.js/plugins/record';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AudioRateSlider from '@/components/voice-recorder/audioRateSlider';
import RecordAudioButton from '@/components/voice-recorder/recordAudioButton';
import RegionEditor from '@/components/voice-recorder/regionEditor';
import {
    setupRegionManager,
    simplifyRegion,
} from '@/utils/waveform/regionManager';

const formatTime = (seconds: number) =>
    [seconds / 60, seconds % 60]
        .map((v) => `0${Math.floor(v)}`.slice(-2))
        .join(':');

interface WaveformEditorProps {
    url?: string;
    onRecordEnd: (blob: Blob, regions: any[]) => void;
    initialRegions?: any[];
}

export default function WaveformEditor({
    url,
    onRecordEnd,
    initialRegions = [],
}: WaveformEditorProps) {
    const initialLoopRegion = true;
    const initialAutoplay = true;
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
    const dummyAudioUrl = '/audio/100-milliseconds-of-silence.ogg';
    const [usedUrl, setUsedUrl] = useState(url ?? dummyAudioUrl);

    const [isPlaying, setIsPlaying] = useState(false);
    const [loopRegion, setLoopRegion] = useState(initialLoopRegion);
    const [autoplay, setAutoplay] = useState(initialAutoplay);
    const [audioRate, setAudioRate] = useState(1);
    const [regions, setRegions] = useState<any[]>([]);
    const [regionActions, setRegionActions] = useState<any>(null);
    const regionActionsRef = useRef<any>(null);

    const regionsRef = useRef<any[]>([]);
    const lastUrlRef = useRef<string | undefined>(url);

    const isDummyUrl = usedUrl === dummyAudioUrl;

    const isDirty = useMemo(() => {
        const audioChanged = usedUrl !== (url ?? dummyAudioUrl);

        const currentData = JSON.stringify(regions.map(simplifyRegion));
        const initialData = JSON.stringify(initialRegions.map(simplifyRegion));

        return audioChanged || currentData !== initialData;
    }, [usedUrl, regions, initialRegions, url]);

    const recordPlugin = useMemo(() => {
        return wavesurfer
            ?.getActivePlugins()
            .find((p) => p instanceof RecordPlugin);
    }, [wavesurfer]);

    const regionsPlugin = useMemo(() => {
        return (
            (wavesurfer
                ?.getActivePlugins()
                .find((p) => p instanceof RegionsPlugin) as any) || null
        );
    }, [wavesurfer]);

    const initialRegionsRef = useRef(initialRegions);
    const initialLoopRegionRef = useRef(initialLoopRegion);
    const initialAutoplayRef = useRef(initialAutoplay);

    // Setup region manager
    useEffect(() => {
        if (!wavesurfer || !regionsPlugin || isDummyUrl) {
            return;
        }

        // If the URL hasn't changed and we already have a manager, don't re-init.
        // But if it's a blob, always re-init to clear old state correctly.
        if (
            usedUrl === lastUrlRef.current &&
            regionActionsRef.current &&
            !usedUrl.startsWith('blob:')
        ) {
            return;
        }

        lastUrlRef.current = usedUrl;

        // Clear regions from previous recording if this is a fresh blob take
        const effectiveInitialRegions = usedUrl.startsWith('blob:')
            ? []
            : initialRegionsRef.current;

        const actions = setupRegionManager(wavesurfer, regionsPlugin, {
            loopRegion: initialLoopRegionRef.current,
            autoPlay: initialAutoplayRef.current,
            initialRegions: effectiveInitialRegions,
            onRegionsChange: (newRegions: any[]) => {
                regionsRef.current = [...newRegions];
                setRegions([...newRegions]);
            },
        });

        regionActionsRef.current = actions;
        setRegionActions(actions);
        setRegions(actions.getRegions());

        return () => {
            actions.destroy();
            regionActionsRef.current = null;
            setRegionActions(null);
        };
    }, [wavesurfer, regionsPlugin, usedUrl, isDummyUrl]);

    useEffect(() => {
        regionActions?.setLoop(loopRegion);
    }, [loopRegion, regionActions]);

    useEffect(() => {
        regionActions?.setAutoplay(autoplay);
    }, [autoplay, regionActions]);

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

    function handleRecordStart() {
        setRegions([]);
        regionsRef.current = [];
        regionActions?.clearRegions();
    }

    function handleRecordEnd(blob: Blob) {
        const blobUrl = URL.createObjectURL(blob);
        setUsedUrl(blobUrl);
        setRegions([]);
        regionsRef.current = [];
    }

    async function handleSubmitRecording() {
        const response = await fetch(usedUrl);
        const blob = await response.blob();
        onRecordEnd(blob, regionsRef.current);
    }

    function handleUndo() {
        if(url){
            setUsedUrl(url);
        }
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
                interact={!isDummyUrl}
            />

            <div style={{ marginTop: '10px' }}>
                <div
                    className={clsx(
                        'my-1 flex items-center justify-between',
                        isDummyUrl ? 'pointer-events-none opacity-50' : '',
                    )}
                >
                    <Button
                        variant={'outline'}
                        onClick={() => wavesurfer?.playPause()}
                        disabled={!usedUrl && !recordPlugin}
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
                        onRecordStart={handleRecordStart}
                        onRecordEnd={handleRecordEnd}
                    />
                    <div>
                        {usedUrl != url && !isDummyUrl && <Button onClick={handleUndo}>undo</Button>}
                        <Button
                            onClick={handleSubmitRecording}
                            disabled={!isDirty || isDummyUrl}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mt-4 space-y-1">
                <h3 className="text-sm font-bold">Regions:</h3>
                <RegionEditor regions={regions} regionActions={regionActions} />
            </div>
        </div>
    );
}
