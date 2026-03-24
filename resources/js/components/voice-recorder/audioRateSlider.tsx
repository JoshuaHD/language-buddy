import type { ChangeEvent } from 'react';
import { useState } from 'react';
import type WaveSurfer from 'wavesurfer.js';

type AudioRateSlider = {
    wavesurfer: WaveSurfer | null;
    onChange: (newRate: number) => void;
};
export default function AudioRateSlider({
    wavesurfer,
    onChange,
}: AudioRateSlider) {
    const [audioRate, setAudioRate] = useState(wavesurfer?.getPlaybackRate());
    const handleAudioRateChange = (e: ChangeEvent<HTMLInputElement>) => {
        const rate = e.target.valueAsNumber;

        setAudioRate(rate);
        onChange(rate);

        if (wavesurfer) {
            wavesurfer.setPlaybackRate(rate, true);
        }
    };

    return (
        <input
            value={audioRate ?? 1}
            type={'range'}
            min={'0.25'}
            max={'1.5'}
            step={'0.25'}
            onChange={handleAudioRateChange}
        />
    );
}
