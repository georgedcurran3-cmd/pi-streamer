import { supabase } from "@/integrations/supabase/client";

/** My List + Continue Watching, scoped to this TV's pairing code. */

export type SavedItem = {
  item_key: string;
  media_type: string;
  tmdb_id: number | null;
  video_id: string | null;
  title: string;
  poster: string | null;
  backdrop: string | null;
};

export type ProgressItem = SavedItem & {
  season: number | null;
  episode: number | null;
  subtitle: string | null;
  position_seconds: number;
  duration_seconds: number;
  updated_at: string;
};

export async function fetchMyList(code: string) {
  const { data, error } = await supabase
    .from("my_list")
    .select("item_key, media_type, tmdb_id, video_id, title, poster, backdrop")
    .eq("code", code)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedItem[];
}

export async function toggleMyList(code: string, item: SavedItem) {
  const { data } = await supabase
    .from("my_list")
    .select("item_key")
    .eq("code", code)
    .eq("item_key", item.item_key)
    .maybeSingle();

  if (data) {
    await supabase.from("my_list").delete().eq("code", code).eq("item_key", item.item_key);
    return false;
  }
  await supabase.from("my_list").insert({ code, ...item });
  return true;
}

export async function fetchContinueWatching(code: string) {
  const { data, error } = await supabase
    .from("watch_progress")
    .select("*")
    .eq("code", code)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as ProgressItem[];
}

export async function saveProgress(
  code: string,
  entry: Partial<ProgressItem> & { item_key: string; media_type: string; title: string },
) {
  await supabase.from("watch_progress").upsert(
    { code, ...entry, updated_at: new Date().toISOString() },
    { onConflict: "code,item_key" },
  );
}

export async function clearProgress(code: string, itemKey: string) {
  await supabase.from("watch_progress").delete().eq("code", code).eq("item_key", itemKey);
}
