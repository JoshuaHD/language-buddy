import { DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FileDownloadButton = {
    url: string
}
export function FileDownloadButton({url}: FileDownloadButton) {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = url;

        if (url.startsWith('blob')) {
            link.download = `recording-${new Date().getTime()}.webm`;
        } else {
            link.download = url;
        }

        link.click();
    };

    return (
        <Button onClick={handleDownload}>
            <DownloadIcon />
        </Button>
    );
}
