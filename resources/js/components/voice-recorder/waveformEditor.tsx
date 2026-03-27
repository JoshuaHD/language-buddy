import WavesurferPlayer from '@wavesurfer/react';
import { clsx } from 'clsx';
import {
    Check,
    PauseIcon,
    PlayIcon,
    RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import RecordPlugin from 'wavesurfer.js/plugins/record';
import { Button } from '@/components/ui/button';
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
                                                                                                                                                                                                                  const [focusedRegionId, setFocusedRegionId] = useState<string | null>(null);
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
            onFocus: (id) => setFocusedRegionId(id),
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
        ws.pause();
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
        setFocusedRegionId(null);
        regionActions?.clearRegions();
    }

    function handleRecordEnd(blob: Blob) {
        wavesurfer?.pause();
        setIsPlaying(false);
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
        if (url) {
            wavesurfer?.pause();
            setIsPlaying(false);
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
            <div className="waveform-container">
                <WavesurferPlayer
                    height={100}
                    waveColor="lightblue"
                    barGap={3}
                    barWidth={3}
                    barRadius={30}
                    url={usedUrl}
                    autoplay={false}
                    onReady={onReady}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    plugins={plugins}
                    interact={!isDummyUrl}
                />
            </div>

            <div className="mt-4">
                <div
                    className={clsx(
                        'flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-2',
                        isDummyUrl ? 'pointer-events-none opacity-50' : '',
                    )}
                >
                    {/* Playback & Record Group */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant={'outline'}
                            size="sm"
                            className="h-9 w-9 p-0"
                            onClick={() => wavesurfer?.playPause()}
                            disabled={!usedUrl && !recordPlugin}
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <PauseIcon className="h-4 w-4" />
                            ) : (
                                <PlayIcon className="h-4 w-4" />
                            )}
                        </Button>

                        <RecordAudioButton
                            recordPlugin={recordPlugin}
                            onRecordStart={handleRecordStart}
                            onRecordEnd={handleRecordEnd}
                        />
                    </div>

                    {/* Speed Group - Flexible middle */}
                    <div className="flex flex-1 items-center justify-center gap-2 px-4 max-w-[200px]">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Speed
                        </span>
                        <div className="flex-1">
                            <AudioRateSlider
                                wavesurfer={wavesurfer}
                                onChange={(newRate: number) =>
                                    setAudioRate(newRate)
                                }
                            />
                        </div>
                        <span className="min-w-[2.5rem] text-center text-xs font-mono">
                            {audioRate.toFixed(1)}x
                        </span>
                    </div>

                    {/* Persistence Group */}
                    <div className="flex items-center gap-1">
                        {usedUrl !== url && !isDummyUrl && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0"
                                onClick={handleUndo}
                                title="Undo changes"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant={isDirty ? 'default' : 'ghost'}
                            size="sm"
                            className={clsx('h-9 px-3 gap-2', !isDirty && 'text-muted-foreground')}
                            onClick={handleSubmitRecording}
                            disabled={!isDirty || isDummyUrl}
                        >
                            <Check className="h-4 w-4" />
                            <span className="text-xs font-medium text-nowrap">Save</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <RegionEditor
                    regions={regions}
                    regionActions={regionActions}
                    autoplay={autoplay}
                    setAutoplay={setAutoplay}
                    loopRegion={loopRegion}
                    setLoopRegion={setLoopRegion}
                    focusedRegionId={focusedRegionId}
                    setFocusedRegionId={setFocusedRegionId}
                />
            </div>
        </div>
    );
}
