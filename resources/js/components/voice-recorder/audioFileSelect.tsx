import type { ChangeEvent } from 'react';
import { getCachedRecording } from '@/utils/waveform/audioCache';

type AudioFileSelect = {
    audioUrls: string[];
    updateUrl: (url: string) => void;
};
export function AudioFileSelect({updateUrl, audioUrls}: AudioFileSelect) {
    const onChange = (e: ChangeEvent<HTMLSelectElement, HTMLSelectElement>) => {
        const value = e.target.value as any;

        if (value === '-1') {
            getCachedRecording().then((blob) => {
                if (blob) {
                    const blobUrl = URL.createObjectURL(blob);
                    updateUrl(blobUrl);
                }
            });

            return;
        }

        const url: string = audioUrls[value];
        updateUrl(url);
    };

    return (
        <select onChange={onChange}>
            <option value={'-1'}>Local Cache</option>
            {audioUrls.map((url: string, index: number) => (
                <option key={`o-${index}`} value={index}>{url}</option>
            ))}
        </select>
    );
}
