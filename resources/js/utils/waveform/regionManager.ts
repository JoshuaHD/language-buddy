import WaveSurfer  from 'wavesurfer.js';

export const setupRegionManager = (ws: WaveSurfer, regionsPlugin: any, options: any) => {
    let activeRegion: any = null;

    let currentOptions = { ...options };

    regionsPlugin.enableDragSelection({
        color: 'rgba(255, 0, 0, 0.1)', // Default color for new drags
    });

    // remove all existing regions
    regionsPlugin.unAll();

    // Handle Selection & Playback
    regionsPlugin.on('region-clicked', (region: any, e: MouseEvent) => {
        e.stopPropagation();
        console.log('region clicked', currentOptions)

        // Visual feedback: Highlight the active region
        regionsPlugin.getRegions().forEach((r: any) => {
            r.setOptions({ color: 'rgba(0, 0, 0, 0.1)' });
        });
        region.setOptions({ color: 'rgba(255, 165, 0, 0.4)' });

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

        region.play();
    });

    // Optional: If you want it to play immediately after they finish drawing
    regionsPlugin.on('region-updated', (region: any) => {
        // This fires after the mouse is released
        if (activeRegion && activeRegion.id === region.id) {
            region.play();
        }
    });

    // Smart Exit Logic (Stop at end of active region)
    regionsPlugin.on('region-out', (region: any) => {
        if (activeRegion && activeRegion.id === region.id) {
            if(currentOptions?.loopRegion) {
                region.play();

                return;
            }

            //ws.pause();
        }
    });

    // 5. Cleanup: If the user clicks the background, deselect
    ws.on('interaction', () => {
        console.log('interaction')
        activeRegion = null;
        regionsPlugin.getRegions().forEach((r: any) => {
            r.setOptions({ color: 'rgba(100, 149, 237, 0.3)' });
        });
    });

    const manager = {
        instance: regionsPlugin,
        setOptions: (newOptions: any) => {
            currentOptions = { ...currentOptions, ...newOptions };
            console.log('Options updated:', currentOptions);
        },
        // You can also expose explicit actions
        setLoop: (shouldLoop: boolean) => {
            currentOptions.loopRegion = shouldLoop;
        },
    };

    return manager;
};
