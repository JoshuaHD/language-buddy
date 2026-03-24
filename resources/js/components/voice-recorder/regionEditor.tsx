import { LockIcon, TrashIcon } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type RegionEditor = {
    regions: any[],
    regionActions: any
}
export default function RegionEditor ({regions, regionActions}: RegionEditor) {

    return (
        <>
            {regions
                .toSorted((a, b) => a.start - b.start)
                .map((region) => {
                    function rgbaStringToHex(rgba: string) {
                        const match = rgba.match(
                            /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/i,
                        );

                        if (!match) {
                            return;
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

                    return (
                        <div
                            key={region.id}
                            className="flex items-center justify-between gap-1 text-xs"
                        >
                            <input
                                className={'opacity-20'}
                                value={rgbaStringToHex(region.color) ?? ''}
                                type={'color'}
                                onChange={(e) => {
                                    console.log('color change', e.target.value);

                                    region.setOptions({
                                        color: hexToRgba(e.target.value, 0.2),
                                    });

                                    regionActions?.sync();
                                }}
                            />
                            <span>
                                {region.start.toFixed(2)}s +
                                {(region.end - region.start).toFixed(2)}s
                            </span>
                            <Input
                                value={ ''}
                                onChange={(
                                    e: ChangeEvent<
                                        HTMLInputElement,
                                        HTMLInputElement
                                    >,
                                ) => {
                                    const value = e.target.value;

                                    //region.setContent(value || undefined)
                                    region.setOptions({
                                        content: value || ' ',
                                    });
                                    regionActions?.sync();
                                }}
                            />
                            <Button
                                variant={'outline'}
                                onClick={() => {
                                    region.setOptions({
                                        drag: !region.drag,
                                        resize: !region.resize,
                                    });
                                    regionActions?.sync();
                                }}
                            >
                                <LockIcon
                                    color={region.drag ? 'gray' : 'red'}
                                />
                            </Button>
                            <Button disabled={!region.drag} onClick={() =>{
                                region.remove();

                            }}><TrashIcon /></Button>
                        </div>
                    );
                })}
        </>
    );
}
