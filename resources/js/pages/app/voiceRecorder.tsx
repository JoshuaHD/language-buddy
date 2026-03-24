import { Head, router, useForm } from '@inertiajs/react';
import {
    MicIcon,
    MoreVertical,
    PlayCircleIcon,
    PlusIcon,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    destroyRecording,
    storeRecording,
    storeSentence,
    updateRecording,
} from '@/actions/App/Http/Controllers/VoiceRecorderController';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import WaveformEditor from '@/components/voice-recorder/waveformEditor';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { record } from '@/routes/app';
import type { Language, Recording, Sentence } from '@/types/models';

export default function VoiceRecorderPage({
    languages,
    sentences,
}: {
    languages: Language[];
    sentences: Sentence[];
}) {
    const [selectedSentence, setSelectedSentence] = useState<Sentence | null>(
        null,
    );
    const [selectedRecording, setSelectedRecording] =
        useState<Recording | null>(null);
    const [isRecordingNew, setIsRecordingNew] = useState(false);
    const [isAddSentenceOpen, setIsAddSentenceOpen] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Sync selected sentence/recording when props update (e.g. after save)
    useEffect(() => {
        function updateSelectedSentence() {
            const updated = sentences.find(
                (s) => s.id === selectedSentence?.id,
            );

            if (updated) {
                setSelectedSentence(updated);

                if (selectedRecording) {
                    const updatedRec = updated.recordings.find(
                        (r) => r.id === selectedRecording.id,
                    );

                    if (updatedRec) {
                        setSelectedRecording(updatedRec);
                    } else {
                        setSelectedRecording(null);
                    }
                }
            } else {
                setSelectedSentence(null);
                setSelectedRecording(null);
            }
        }

        if (selectedSentence) {
            updateSelectedSentence();
        }
    }, [selectedRecording, selectedSentence, sentences]);

    const { data, setData, post, processing, reset, errors } = useForm({
        content: '',
        language_id: '',
    });

    const submitSentence = (e: React.FormEvent) => {
        e.preventDefault();
        post(storeSentence().url, {
            onSuccess: () => {
                setIsAddSentenceOpen(false);
                reset();
            },
        });
    };

    const handleRecordEnd = (blob: Blob) => {
        if (!selectedSentence) {
            return;
        }

        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        if (selectedRecording) {
            formData.append('_method', 'PATCH');
            router.post(updateRecording(selectedRecording.id).url, formData, {
                forceFormData: true,
                onSuccess: () => {
                    setSelectedRecording(null);
                },
            });
        } else {
            router.post(storeRecording(selectedSentence.id).url, formData, {
                forceFormData: true,
                onSuccess: () => {
                    setIsRecordingNew(false);
                },
            });
        }
    };

    const handleDeleteRecording = () => {
        if (!selectedRecording) {
            return;
        }

        if (confirm('Are you sure you want to delete this recording?')) {
            router.delete(destroyRecording(selectedRecording.id).url, {
                onSuccess: () => {
                    setSelectedRecording(null);
                },
            });
        }
    };

    const handleRegionsChange = useCallback(
        (regions: any[]) => {
            if (!selectedRecording) {
                return;
            }

            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                router.patch(
                    updateRecording(selectedRecording.id),
                    {
                        options: { regions },
                    },
                    {
                        preserveScroll: true,
                        preserveState: true,
                    },
                );
            }, 1000);
        },
        [selectedRecording],
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: dashboard().url },
                { title: 'Voice Recorder', href: record().url },
            ]}
        >
            <Head title="Voice Recorder" />
            <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
                {/* Left Sidebar: Sentences */}
                <Card
                    data-selected={selectedSentence?.id || '-'}
                    className="w-full min-w-75 flex-col data-selected:hidden data-[selected=-]:flex sm:w-1/3 sm:data-selected:flex"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-bold">
                            Sentences
                        </CardTitle>
                        <Dialog
                            open={isAddSentenceOpen}
                            onOpenChange={setIsAddSentenceOpen}
                        >
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Add
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Sentence</DialogTitle>
                                    <DialogDescription>
                                        Create a new sentence to record audio
                                        for.
                                    </DialogDescription>
                                </DialogHeader>
                                <form
                                    onSubmit={submitSentence}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="language">
                                            Language
                                        </Label>
                                        <Select
                                            onValueChange={(val) =>
                                                setData('language_id', val)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {languages.map((lang) => (
                                                    <SelectItem
                                                        key={lang.id}
                                                        value={lang.id.toString()}
                                                    >
                                                        {lang.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.language_id && (
                                            <p className="text-sm text-red-500">
                                                {errors.language_id}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="content">Content</Label>
                                        <Input
                                            id="content"
                                            value={data.content}
                                            onChange={(e) =>
                                                setData(
                                                    'content',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter the sentence text..."
                                        />
                                        {errors.content && (
                                            <p className="text-sm text-red-500">
                                                {errors.content}
                                            </p>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Create
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        <div className="space-y-2">
                            {sentences.map((sentence) => (
                                <div
                                    key={sentence.id}
                                    className={cn(
                                        'cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50',
                                        selectedSentence?.id === sentence.id &&
                                            'border-primary bg-muted',
                                    )}
                                    onClick={() => {
                                        setSelectedSentence(sentence);
                                        setSelectedRecording(null);
                                        setIsRecordingNew(false);
                                    }}
                                >
                                    <div className="font-medium">
                                        {sentence.content}
                                    </div>
                                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                                        <span>
                                            {
                                                languages.find(
                                                    (l) =>
                                                        l.id ===
                                                        sentence.language_id,
                                                )?.name
                                            }
                                        </span>
                                        <span>
                                            {sentence.recordings.length}{' '}
                                            recordings
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Area */}
                <div className="flex flex-1 flex-col gap-4">
                    {selectedSentence ? (
                        <>
                            <div className={'block sm:hidden'}>
                                <Button
                                    onClick={() => setSelectedSentence(null)}
                                >
                                    back
                                </Button>
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Selected Sentence</CardTitle>
                                    <CardDescription>
                                        {selectedSentence.content}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                setIsRecordingNew(true);
                                                setSelectedRecording(null);
                                            }}
                                            variant={
                                                isRecordingNew
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                        >
                                            <MicIcon className="mr-2 h-4 w-4" />
                                            Record New
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recordings List for Selected Sentence */}
                            {!isRecordingNew && !selectedRecording && (
                                <Card className="flex-1">
                                    <CardHeader>
                                        <CardTitle>Recordings</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {selectedSentence.recordings.map(
                                                (recording) => (
                                                    <div
                                                        key={recording.id}
                                                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:border-primary"
                                                        onClick={() =>
                                                            setSelectedRecording(
                                                                recording,
                                                            )
                                                        }
                                                    >
                                                        <PlayCircleIcon className="h-8 w-8 text-primary" />
                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                Recording #
                                                                {recording.id}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {new Date(
                                                                    recording.created_at,
                                                                ).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                            {selectedSentence.recordings
                                                .length === 0 && (
                                                <div className="col-span-full py-8 text-center text-muted-foreground">
                                                    No recordings yet. Click
                                                    "Record New" to start.
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Waveform Editor */}
                            {(isRecordingNew || selectedRecording) && (
                                <Card className="flex flex-1 flex-col">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span>
                                                {isRecordingNew
                                                    ? 'New Recording'
                                                    : `Editing Recording #${selectedRecording?.id}`}
                                            </span>

                                            {selectedRecording && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={
                                                                handleDeleteRecording
                                                            }
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Recording
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <WaveformEditor
                                            key={
                                                selectedRecording
                                                    ? `rec-${selectedRecording.id}`
                                                    : 'new'
                                            }
                                            url={selectedRecording?.path}
                                            initialRegions={
                                                selectedRecording?.options
                                                    ?.regions || []
                                            }
                                            onRecordEnd={handleRecordEnd}
                                            onRegionsChange={
                                                handleRegionsChange
                                            }
                                        />
                                        <div className="mt-4 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setIsRecordingNew(false);
                                                    setSelectedRecording(null);
                                                }}
                                            >
                                                Cancel / Back
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <div className="hidden h-full items-center justify-center rounded-lg border-2 border-dashed p-4 text-muted-foreground sm:block">
                            Select a sentence to start
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
