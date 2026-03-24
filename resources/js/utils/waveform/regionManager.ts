import type WaveSurfer from 'wavesurfer.js';
import type RegionsPlugin from 'wavesurfer.js/plugins/regions';
import type { Region } from 'wavesurfer.js/plugins/regions';

type RegionManagerOptions = {
    loopRegion: boolean;
    onRegionsChange: (newRegions: Region[]) => void;
    autoPlay: boolean;
    initialRegions?: any[];
};

export const setupRegionManager = (
    ws: WaveSurfer,
    regionsPlugin: RegionsPlugin,
    options: RegionManagerOptions,
) => {
    let activeRegion: any = null;
    let currentOptions = { ...options };

    const notify = () => {
        if (currentOptions?.onRegionsChange) {
            currentOptions.onRegionsChange(regionsPlugin.getRegions());
        }
    };

    // --- EVENT HANDLERS ---
    const handleRegionClicked = (region: any, e: MouseEvent) => {
        e.stopPropagation();
        activeRegion = region;
        region.play();
    };

    const handleDoubleClicked = (region: any, e: MouseEvent) => {
        e.stopPropagation();
        const confirmed = window.confirm('Delete this region?');
        if (!confirmed) return;
        region.remove();
        activeRegion = null;
        notify();
    };

    const handleRegionCreated = (region: any) => {
        // Apply default styles only if it's a new user-created region
        // (addRegion from code doesn't typically trigger this unless dragSelection is used)
        if (!region.color) {
            region.setOptions({
                color: 'rgba(0, 255, 0, 0.2)',
                drag: true,
                resize: true,
            });
        }
        activeRegion = region;
        if (currentOptions.autoPlay) {
            region.play();
        }
        notify();
    };

    const handleRegionUpdated = (region: any) => {
        if (
            currentOptions.autoPlay &&
            activeRegion &&
            activeRegion.id === region.id
        ) {
            region.play();
        }
        notify();
    };

    const handleRegionOut = (region: any) => {
        if (activeRegion && activeRegion.id === region.id) {
            if (currentOptions?.loopRegion) {
                region.play();
                return;
            }
            activeRegion = null;
        }
    };

    const handleInteraction = () => {
        activeRegion = null;
    };

    // --- INITIALIZATION ---
    regionsPlugin.enableDragSelection({
        color: 'rgba(255, 0, 0, 0.1)',
    });

    // Clear existing regions to avoid duplicates on re-init
    regionsPlugin.unAll();

    // Add initial regions from JSON
    if (options.initialRegions) {
        options.initialRegions.forEach((regionData) => {
            // Ensure data is valid for addRegion
            regionsPlugin.addRegion({
                ...regionData,
                content: typeof regionData.content === 'string' ? regionData.content : '',
            });
        });
        // Notify once after all initial regions are added
        notify();
    }

    // Bind listeners
    regionsPlugin.on('region-clicked', handleRegionClicked);
    regionsPlugin.on('region-double-clicked', handleDoubleClicked);
    regionsPlugin.on('region-created', handleRegionCreated);
    regionsPlugin.on('region-updated', handleRegionUpdated);
    regionsPlugin.on('region-removed', notify);
    regionsPlugin.on('region-out', handleRegionOut);
    regionsPlugin.on('region-content-changed', notify);
    ws.on('interaction', handleInteraction);

    // Return actions and cleanup
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
        destroy: () => {
            // Unbind all listeners
            regionsPlugin.un('region-clicked', handleRegionClicked);
            regionsPlugin.un('region-double-clicked', handleDoubleClicked);
            regionsPlugin.un('region-created', handleRegionCreated);
            regionsPlugin.un('region-updated', handleRegionUpdated);
            regionsPlugin.un('region-removed', notify);
            regionsPlugin.un('region-out', handleRegionOut);
            regionsPlugin.un('region-content-changed', notify);
            ws.un('interaction', handleInteraction);
        },
    };
};
