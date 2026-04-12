export type NoteType = "text" | "voice" | "sticky";

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  note_type: NoteType;
  mood_tag: string | null;
  theme_tags: string[] | null;
  protected: boolean;
  location: string | null;
  weather: string | null;
  indexed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntryTheme {
  id: string;
  entry_id: string;
  node_id: string;
  insight: string | null;
  life_map_nodes?: {
    id: string;
    label: string;
    level: number;
  } | null;
}

export interface Insight {
  id: string;
  user_id: string;
  insight_type: "thread" | "connection" | "pattern" | "forgotten" | "evolution";
  title: string;
  description: string | null;
  related_note_ids: string[] | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  onboarded: boolean | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  reflection_type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  entry_count_at_generation: number | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export interface EchoConnection {
  id: string;
  user_id: string;
  source_entry_id: string;
  echo_entry_id: string;
  description: string | null;
  created_at: string;
}
