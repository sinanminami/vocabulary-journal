export interface WordDefinition {
  partOfSpeech: string;
  meaning: string;
  example?: string;
}

export interface Word {
  id: number;
  word: string;
  pronunciation?: string;
  definitions: WordDefinition[];
  examples: string[];
  pos_tags?: string;
  mastery_level: number;
  review_count: number;
  created_at: string;
}

export interface WordCreateRequest {
  word: string;
  source_url?: string;
  source_context?: string;
  personal_notes?: string;
}

export interface DictionaryLookupResponse {
  word: string;
  pronunciation?: string;
  definitions: WordDefinition[];
  examples: string[];
  pos_tags?: string;
}