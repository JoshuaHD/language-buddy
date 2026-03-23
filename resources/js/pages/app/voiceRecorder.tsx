import WavesurferPlayer from '@wavesurfer/react';
import { PauseIcon, PlayIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import RecordPlugin from 'wavesurfer.js/plugins/record';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AudioFileSelect } from '@/components/voice-recorder/audioFileSelect';
import AudioRateSlider from '@/components/voice-recorder/audioRateSlider';
import { FileDownloadButton } from '@/components/voice-recorder/fileDownloadButton';
import RecordAudioButton from '@/components/voice-recorder/recordAudioButton';
import { getCachedRecording, saveRecording } from '@/utils/waveform/audioCache';
import { setupRegionManager } from '@/utils/waveform/regionManager';

const audioUrls = ['/audio/oi-bay.mp3', '/audio/maayung-buntag.mp3'];

const formatTime = (seconds: number) =>
    [seconds / 60, seconds % 60]
        .map((v) => `0${Math.floor(v)}`.slice(-2))
        .join(':');

export default function VoiceRecorder() {
    const initialLoopRegion = true;
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loopRegion, setLoopRegion] = useState(initialLoopRegion);
    const [url, setUrl] = useState(audioUrls[0]);
    const [audioRate, setAudioRate] = useState(1);

    // Get the record plugin instance from wavesurfer if it's available
    const recordPlugin = useMemo(() => {
        return wavesurfer?.getActivePlugins().find((p) => p instanceof RecordPlugin);
    }, [wavesurfer]);

    const regionsPlugin = useMemo(() => {
        return wavesurfer?.getActivePlugins().find((p) => p instanceof RegionsPlugin) as any;
    }, [wavesurfer]);

    const regionActions = useMemo(() => {
        if (!wavesurfer || !regionsPlugin) {
            return null;
        }

        return setupRegionManager(wavesurfer, regionsPlugin, {
            loopRegion: initialLoopRegion,
        });
    }, [wavesurfer, regionsPlugin, initialLoopRegion]);

    // Keep loopRegion in sync with the manager
    useEffect(() => {
        regionActions?.setLoop(loopRegion);
    }, [loopRegion, regionActions]);

    // 2. Load cached recording on mount
    useEffect(() => {
        getCachedRecording().then((blob) => {
            if (blob) {
                const blobUrl = URL.createObjectURL(blob);
                setUrl(blobUrl);
            }
        });
    }, []);

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
    };

    const handleRecordEnd = (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        setUrl(blobUrl);
        // Cache the recording for offline persistence
        saveRecording(blob).catch(console.error);
    };

    const handleAddRegion = () => {
        // 4. Use the ref safely in an event handler
        if (regionActions) {
            regionActions.instance.addRegion({
                start: 6,
                end: 8,
                content: 'User Region',
                color: 'rgba(255, 165, 0, 0.3)',
            });
        }
    };

    function handleRegionLoop() {
        return () => {
            setLoopRegion(!loopRegion);
        };
    }

    return (
        <div className={'p-4'}>
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
                        <AudioRateSlider
                            wavesurfer={wavesurfer}
                            onChange={(newRate: number) =>
                                setAudioRate(newRate)
                            }
                        />
                    </div>
                </div>
                <div className={'flex items-center gap-1'}>
                    <Button variant={'outline'} onClick={handleAddRegion}>
                        Add Region
                    </Button>

                    <RecordAudioButton
                        recordPlugin={recordPlugin}
                        onRecordEnd={handleRecordEnd}
                    />
                    <FileDownloadButton url={url} />
                </div>
            </div>
            <AudioFileSelect
                audioUrls={audioUrls}
                updateUrl={(url) => setUrl(url)}
            />
        </div>
    );
}
