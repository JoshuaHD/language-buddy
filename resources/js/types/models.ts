export interface Language {
    id: number;
    name: string;
    code: string;
}

export interface Recording {
    id: number;
    sentence_id: number;
    user_id: number;
    path: string;
    options: any;
    created_at: string;
    updated_at: string;
}

export interface Sentence {
    id: number;
    content: string;
    language_id: number;
    user_id: number;
    recordings: Recording[];
    created_at: string;
    updated_at: string;
}
