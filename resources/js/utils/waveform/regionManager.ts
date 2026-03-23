import type WaveSurfer from 'wavesurfer.js';
import type RegionsPlugin from 'wavesurfer.js/plugins/regions';
import type { Region } from 'wavesurfer.js/plugins/regions';

type RegionManagerOptions = {
    loopRegion: boolean,
    onRegionsChange: (newRegions: Region[] ) => void,
    autoPlay: boolean
}
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

    regionsPlugin.enableDragSelection({
        color: 'rgba(255, 0, 0, 0.1)', // Default color for new drags
    });

    // remove all existing regions
    regionsPlugin.unAll();

    // Handle Selection & Playback
    regionsPlugin.on('region-clicked', (region: any, e: MouseEvent) => {
        e.stopPropagation();

        // Visual feedback: Highlight the active region
        /*regionsPlugin.getRegions().forEach((r: any) => {
            r.setOptions({ color: 'rgba(0, 0, 0, 0.1)' });
        });
        region.setOptions({ color: 'rgba(255, 165, 0, 0.4)' });
*/
        activeRegion = region;
        region.play();
    });

    // Handle Deletion on Double Click
    regionsPlugin.on('region-double-clicked', (region: any, e: MouseEvent) => {
        e.stopPropagation();

        const confirmed = window.confirm('Delete this region');

        if (!confirmed) {
            return;
        }

        region.remove();
        activeRegion = null;
        console.log('Region deleted via double-click');
        notify();
    });

    // When a user finishes dragging to create a new region
    regionsPlugin.on('region-created', (region: any) => {
        console.log('User created a region:', region.start, region.end);

        // Apply a default look to the new user-drawn region
        region.setOptions({
            color: 'rgba(0, 255, 0, 0.2)', // Greenish for new segments
            drag: true,
            resize: true,
        });

        activeRegion = region;

        if(currentOptions.autoPlay){
            region.play();
        }

        notify();
    });

    // Optional: If you want it to play immediately after they finish drawing
    regionsPlugin.on('region-updated', (region: any) => {
        console.log("update")

        // This fires after the mouse is released
        if (currentOptions.autoPlay && activeRegion && activeRegion.id === region.id) {
            region.play();
        }

        notify();
    });

    regionsPlugin.on('region-removed', () => {
        notify();
    });

    // Smart Exit Logic (Stop at end of active region)
    regionsPlugin.on('region-out', (region: any) => {
        if (activeRegion && activeRegion.id === region.id) {
            if (currentOptions?.loopRegion) {
                region.play();

                return;
            }

            activeRegion = null
        }
    });

    regionsPlugin.on('region-content-changed', (e) => {
        console.log('content-changed', e);
        notify();
    });

    // 5. Cleanup: If the user clicks the background, deselect
    ws.on('interaction', (time: number) => {
        console.log('interaction', time);
        activeRegion = null;

        /*regionsPlugin.getRegions().forEach((r: any) => {
            r.setOptions({ color: 'rgba(100, 149, 237, 0.3)' });
        });*/
    });

    return {
        instance: regionsPlugin,
        sync: notify,
        getRegions: () => regionsPlugin.getRegions(),
        setOptions: (newOptions: any) => {
            currentOptions = { ...currentOptions, ...newOptions };
            console.log('Options updated:', currentOptions);
        },

        setLoop: (shouldLoop: boolean) => {
            currentOptions.loopRegion = shouldLoop;
        },

        setAutoplay: (shouldAutoplay: boolean) => {
            currentOptions.autoPlay = shouldAutoplay;
        },
    };
};
