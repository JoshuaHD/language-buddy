export interface Language {
    id: number;
    code: string;
    iso3: string;
    name_common: string;
    name_native: string | null;
    alt_names: string[] | null;
    search_tokens: string[] | null;
    search_normalized: string | null;
    scripts: string[] | null;
    regions: string[] | null;
    rtl: boolean;
    living: boolean;
    created_at: string;
    updated_at: string;
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
