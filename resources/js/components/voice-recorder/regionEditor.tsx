import { LockIcon, TrashIcon } from 'lucide-react';
import {  useEffect, useRef } from 'react';
import type {ChangeEvent} from 'react';
import type { Region } from 'wavesurfer.js/plugins/regions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type RegionEditorProps = {
    regions: Region[];
    regionActions: any;
    focusedRegionId?: string | null;
    setFocusedRegionId?: (id: string | null) => void;
};

export default function RegionEditor({
    regions,
    regionActions,
    focusedRegionId,
    setFocusedRegionId,
}: RegionEditorProps) {
    return (
        <>
            {[...regions]
                .sort((a, b) => a.start - b.start)
                .map((region) => {
                    return (
                        <RegionItem
                            key={region.id}
                            region={region}
                            regionActions={regionActions}
                            isFocused={focusedRegionId === region.id}
                            onFocused={() => setFocusedRegionId?.(null)}
                        />
                    );
                })}
        </>
    );
}

function RegionItem({
    region,
    regionActions,
    isFocused,
    onFocused,
}: {
    region: Region;
    regionActions: any;
    isFocused: boolean;
    onFocused: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus();
            onFocused();
        }
    }, [isFocused, onFocused]);

    function rgbaStringToHex(rgba: string) {
        const match = rgba.match(
            /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/i,
        );

        if (!match) {
            return '#000000';
        }

        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);

        return (
            '#' +
            [r, g, b]
                .map((x) => x.toString(16).padStart(2, '0'))
                .join('')
        );
    }

    function hexToRgba(hex: string, alpha: number) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Handle content extraction from Region instance or options
    const contentValue: string = (
        (region as any).options?.content ||
        (typeof region.content === 'string'
            ? region.content
            : (region.content as HTMLElement)?.innerText || '')
    ).trim();

    return (
        <div className="flex items-center justify-between gap-1 text-xs">
            <input
                className={'opacity-20'}
                value={rgbaStringToHex(region.color)}
                type={'color'}
                onChange={(e) => {
                    region.setOptions({
                        color: hexToRgba(e.target.value, 0.2),
                    });
                    regionActions?.sync();
                }}
            />
            <span className="whitespace-nowrap">
                {region.start.toFixed(2)}s +
                {(region.end - region.start).toFixed(2)}s
            </span>
            <Input
                ref={inputRef}
                value={contentValue}
                placeholder="Region label..."
                className="h-7 py-1"
                onFocus={() => {
                    regionActions?.playRegion(region.id);
                }}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value;
                    region.setOptions({
                        content: value || ' ',
                    });
                    regionActions?.sync();
                }}
            />
            <Button
                variant={'outline'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => {
                    region.setOptions({
                        drag: !region.drag,
                        resize: !region.resize,
                    });
                    regionActions?.sync();
                }}
            >
                <LockIcon size={12} color={region.drag ? 'gray' : 'red'} />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={!region.drag}
                onClick={() => {
                    region.remove();
                }}
            >
                <TrashIcon size={12} />
            </Button>
        </div>
    );
}
