import type WaveSurfer from 'wavesurfer.js';
import type RegionsPlugin from 'wavesurfer.js/plugins/regions';
import type { Region } from 'wavesurfer.js/plugins/regions';

type RegionManagerOptions = {
    loopRegion: boolean;
    onRegionsChange: (newRegions: Region[]) => void;
    onFocus?: (regionId: string) => void;
    autoPlay: boolean;
    initialRegions?: any[];
};

/**
 * Robustly simplify a region instance or JSON object to primitive properties.
 */
export const simplifyRegion = (r: any) => {
    let content = '';

    try {
        if (r.options && r.options.content) {
            content = r.options.content;
        } else if (typeof r.content === 'string') {
            content = r.content;
        } else if (r.content && r.content.innerText) {
            content = r.content.innerText;
        }
    } catch (e) {
        console.error('Error extracting region content', e);
    }

    return {
        id: r.id || `temp-${Date.now()}`,
        start: Number(r.start) || 0,
        end: Number(r.end) || 0,
        content: String(content || '').trim(),
        color: r.color || r.options?.color || 'rgba(0,0,0,0.1)',
        drag: r.drag !== false && r.options?.drag !== false,
        resize: r.resize !== false && r.options?.resize !== false,
        isNew: !!r.isNew,
    };
};

export const setupRegionManager = (
    ws: WaveSurfer,
    regionsPlugin: RegionsPlugin,
    options: RegionManagerOptions,
) => {
    let activeRegion: any = null;
    let currentOptions = { ...options };
    let isInternalUpdate = false;

    const notify = () => {
        if (isInternalUpdate) {
            return;
        }

        if (currentOptions?.onRegionsChange) {
            currentOptions.onRegionsChange(regionsPlugin.getRegions());
        }
    };

    // --- EVENT HANDLERS ---
    const handleRegionClicked = (region: any, e: MouseEvent) => {
        e.stopPropagation();
        activeRegion = region;
        region.play();

        if (!isInternalUpdate) {
            currentOptions.onFocus?.(region.id);
        }
    };

    const handleDoubleClicked = (region: any, e: MouseEvent) => {
        e.stopPropagation();
        const confirmed = window.confirm('Delete this region?');

        if (!confirmed) {
            return;
        }

        region.remove();
        activeRegion = null;
        notify();
    };

    const handleRegionCreated = (region: any) => {
        if (!isInternalUpdate && region.drag === undefined) {
            region.setOptions({
                color: 'rgba(0, 255, 0, 0.2)',
                drag: true,
                resize: true,
                content: '',
            });
            region.isNew = true; // Mark as new for focus
        }

        activeRegion = region;

        if (currentOptions.autoPlay && !isInternalUpdate && !region.isInitial) {
            region.play();
        } else if (!isInternalUpdate && !region.isInitial) {
            ws.pause();
        }

        if (!isInternalUpdate) {
            currentOptions.onFocus?.(region.id);
        }

        notify();
    };

    const handleRegionUpdated = (region: any) => {
        if (currentOptions.autoPlay && activeRegion?.id === region.id) {
            region.play();
        }

        notify();
    };

    const handleRegionOut = (region: any) => {
        if (activeRegion?.id === region.id) {
            const currentTime = ws.getCurrentTime();
            // If we are not near the end, this might be a false positive event
            // often fired at the start of playback in some browsers/versions.

            if (currentTime < region.end - 0.05) {
                return;
            }

            if (currentOptions?.loopRegion) {
                region.play();

                return;
            }

            activeRegion = null;
            ws.pause();
        }
    };

    const handleInteraction = () => {
        activeRegion = null;
    };

    // --- INITIALIZATION ---
    regionsPlugin.enableDragSelection({
        color: 'rgba(255, 0, 0, 0.1)',
    });

    regionsPlugin.clearRegions();

    if (options.initialRegions && options.initialRegions.length > 0) {
        isInternalUpdate = true;
        options.initialRegions.forEach((regionData) => {
            regionsPlugin.addRegion({
                ...regionData,
                isInitial: true,
                content: typeof regionData.content === 'string' ? regionData.content : '',
            });
        });
        isInternalUpdate = false;
        notify();
    }

    // Clean listeners
    regionsPlugin.un('region-clicked', handleRegionClicked);
    regionsPlugin.on('region-clicked', handleRegionClicked);

    regionsPlugin.un('region-double-clicked', handleDoubleClicked);
    regionsPlugin.on('region-double-clicked', handleDoubleClicked);

    regionsPlugin.un('region-created', handleRegionCreated);
    regionsPlugin.on('region-created', handleRegionCreated);

    regionsPlugin.un('region-updated', handleRegionUpdated);
    regionsPlugin.on('region-updated', handleRegionUpdated);

    regionsPlugin.un('region-removed', notify);
    regionsPlugin.on('region-removed', notify);

    regionsPlugin.un('region-out', handleRegionOut);
    regionsPlugin.on('region-out', handleRegionOut);

    ws.un('interaction', handleInteraction);
    ws.on('interaction', handleInteraction);

    return {
        instance: regionsPlugin,
        sync: notify,
        getRegions: () => regionsPlugin.getRegions(),
        setOptions: (newOptions: any) => {
            currentOptions = { ...currentOptions, ...newOptions };
        },
        setLoop: (shouldLoop: boolean) => {
            currentOptions.loopRegion = shouldLoop;
        },
        setAutoplay: (shouldAutoplay: boolean) => {
            currentOptions.autoPlay = shouldAutoplay;
        },
        playRegion: (regionId: string) => {
            const region = regionsPlugin.getRegions().find((r) => r.id === regionId);

            if (region) {
                activeRegion = region;
                region.play();

                if (!isInternalUpdate) {
                    currentOptions.onFocus?.(region.id);
                }
            }
        },
        clearRegions: () => {
            regionsPlugin.clearRegions();
            notify();
        },
        destroy: () => {
            regionsPlugin.un('region-clicked', handleRegionClicked);
            regionsPlugin.un('region-double-clicked', handleDoubleClicked);
            regionsPlugin.un('region-created', handleRegionCreated);
            regionsPlugin.un('region-updated', handleRegionUpdated);
            regionsPlugin.un('region-removed', notify);
            regionsPlugin.un('region-out', handleRegionOut);
            ws.un('interaction', handleInteraction);
            regionsPlugin.clearRegions();
        },
    };
};
