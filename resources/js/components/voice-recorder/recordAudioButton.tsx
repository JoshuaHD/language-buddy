import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { setupRecordManager } from '@/utils/waveform/recordManager';

type RecordAudioButtonProps = {
    recordPlugin: any;
    onRecordStart?: () => void;
    onRecordEnd: (blob: Blob) => void;
};

export default function RecordAudioButton({
    recordPlugin,
    onRecordStart,
    onRecordEnd,
}: RecordAudioButtonProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isBusy, setIsBusy] = useState(false);

    const recordActions = useMemo(() => {
        if (!recordPlugin) {
            return null;
        }

        // ws is unused in setupRecordManager currently
        return setupRecordManager(null as any, recordPlugin);
    }, [recordPlugin]);

    useEffect(() => {
        if (!recordPlugin) {
            return;
        }

        const handleStart = () => {
            setIsRecording(true);
            setIsBusy(false);
        };

        const handleEnd = (blob: Blob) => {
            setIsRecording(false);
            setIsBusy(false);
            onRecordEnd(blob);
        };

        recordPlugin.on('record-start', handleStart);
        recordPlugin.on('record-end', handleEnd);

        return () => {
            recordPlugin.un('record-start', handleStart);
            recordPlugin.un('record-end', handleEnd);
        };
    }, [recordPlugin, onRecordStart, onRecordEnd]);

    const handleToggleRecord = async () => {
        if (isBusy || !recordActions) {
            return;
        }

        setIsBusy(true);

        if (isRecording) {
            recordActions.stop();
        } else {
            try {
                onRecordStart?.();
                await recordActions.start();
            } catch (err) {
                console.error('Failed to start recording:', err);
                setIsBusy(false);
            }
        }
    };

    return (
        <Button
            onClick={handleToggleRecord}
            disabled={isBusy || !recordPlugin}
            style={{
                backgroundColor: isRecording ? 'red' : 'black',
                color: 'white',
                opacity: isBusy || !recordPlugin ? 0.5 : 1,
            }}
        >
            {isBusy
                ? 'Wait...'
                : isRecording
                  ? 'Stop Recording'
                  : 'Start Recording'}
        </Button>
    );
}
