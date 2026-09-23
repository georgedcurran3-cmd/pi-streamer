import { createServerFn } from "@tanstack/react-start";

/**
 * TMDB proxy. The API key never leaves the server and responses are cached in
 * the worker so the Raspberry Pi re-fetches as little as possible.
 */

const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

type CacheEntry = { at: number; value: unknown };
const cache = new Map<string, CacheEntry>();
const TTL = 1000 * 60 * 30;

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env["TMDB_API_KEY"];
  if (!key) throw new Error("TMDB_API_KEY_MISSING");

  const search = new URLSearchParams({ language: "en-GB", ...params, api_key: key });
  const url = `${TMDB}${path}?${search.toString()}`;
  const cacheKey = `${path}?${new URLSearchParams({ language: "en-GB", ...params }).toString()}`;

  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB request failed (${res.status})`);
  const value = (await res.json()) as T;

  if (cache.size > 300) cache.clear();
  cache.set(cacheKey, { at: Date.now(), value });
  return value;
}

export type MediaItem = {
  id: number;
  type: "movie" | "tv";
  title: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  date: string;
  rating: number;
};

type RawItem = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

export function img(path: string | null | undefined, size = "w500") {
  return path ? `${IMG}/${size}${path}` : null;
}

function normalise(raw: RawItem, fallbackType: "movie" | "tv"): MediaItem {
  const type = (raw.media_type === "tv" || raw.media_type === "movie"
    ? raw.media_type
    : fallbackType) as "movie" | "tv";
  return {
    id: raw.id,
    type,
    title: raw.title ?? raw.name ?? "Untitled",
    overview: raw.overview ?? "",
    poster: img(raw.poster_path, "w342"),
    backdrop: img(raw.backdrop_path, "w1280"),
    date: raw.release_date ?? raw.first_air_date ?? "",
    rating: Math.round((raw.vote_average ?? 0) * 10) / 10,
  };
}

function list(results: RawItem[] | undefined, fallbackType: "movie" | "tv") {
  return (results ?? [])
    .filter((r) => (r.media_type ? r.media_type !== "person" : true))
    .map((r) => normalise(r, fallbackType))
    .filter((r) => r.poster || r.backdrop);
}

/** Everything the home screen needs, in one round trip. */
export const getHomeFeed = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const [trending, nowPlaying, popularMovies, popularTv, topRated, upcoming] =
      await Promise.all([
        tmdbFetch<{ results: RawItem[] }>("/trending/all/week"),
        tmdbFetch<{ results: RawItem[] }>("/movie/now_playing", { region: "GB" }),
        tmdbFetch<{ results: RawItem[] }>("/movie/popular"),
        tmdbFetch<{ results: RawItem[] }>("/tv/popular"),
        tmdbFetch<{ results: RawItem[] }>("/movie/top_rated"),
        tmdbFetch<{ results: RawItem[] }>("/movie/upcoming", { region: "GB" }),
      ]);

    return {
      ok: true as const,
      trending: list(trending.results, "movie"),
      newReleases: list(nowPlaying.results, "movie"),
      popularMovies: list(popularMovies.results, "movie"),
      popularTv: list(popularTv.results, "tv"),
      recommended: list(topRated.results, "movie"),
      upcoming: list(upcoming.results, "movie"),
    };
  } catch (error) {
    return {
      ok: false as const,
      reason: error instanceof Error ? error.message : "TMDB_ERROR",
      trending: [],
      newReleases: [],
      popularMovies: [],
      popularTv: [],
      recommended: [],
      upcoming: [],
    };
  }
});

export const getCatalog = createServerFn({ method: "GET" })
  .inputValidator((input: { type: "movie" | "tv"; genre?: number | null; page?: number }) => input)
  .handler(async ({ data }) => {
    const type = data.type === "tv" ? "tv" : "movie";
    try {
      const params: Record<string, string> = {
        sort_by: "popularity.desc",
        page: String(data.page ?? 1),
        "vote_count.gte": "50",
      };
      if (data.genre) params["with_genres"] = String(data.genre);

      const [discover, genres, trending, top] = await Promise.all([
        tmdbFetch<{ results: RawItem[] }>(`/discover/${type}`, params),
        tmdbFetch<{ genres: { id: number; name: string }[] }>(`/genre/${type}/list`),
        tmdbFetch<{ results: RawItem[] }>(`/trending/${type}/week`),
        tmdbFetch<{ results: RawItem[] }>(`/${type}/top_rated`),
      ]);

      return {
        ok: true as const,
        items: list(discover.results, type),
        genres: genres.genres,
        trending: list(trending.results, type),
        topRated: list(top.results, type),
      };
    } catch (error) {
      return {
        ok: false as const,
        reason: error instanceof Error ? error.message : "TMDB_ERROR",
        items: [],
        genres: [] as { id: number; name: string }[],
        trending: [] as MediaItem[],
        topRated: [] as MediaItem[],
      };
    }
  });

export type TitleDetails = {
  ok: boolean;
  reason?: string;
  id: number;
  type: "movie" | "tv";
  title: string;
  tagline: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  year: string;
  runtime: string;
  rating: number;
  genres: string[];
  director: string | null;
  cast: { id: number; name: string; character: string; photo: string | null }[];
  trailerKey: string | null;
  similar: MediaItem[];
  seasons: { number: number; name: string; episodes: number; poster: string | null }[];
};

export const getTitle = createServerFn({ method: "GET" })
  .inputValidator((input: { type: "movie" | "tv"; id: number }) => input)
  .handler(async ({ data }): Promise<TitleDetails> => {
    const empty: TitleDetails = {
      ok: false,
      id: data.id,
      type: data.type,
      title: "",
      tagline: "",
      overview: "",
      poster: null,
      backdrop: null,
      year: "",
      runtime: "",
      rating: 0,
      genres: [],
      director: null,
      cast: [],
      trailerKey: null,
      similar: [],
      seasons: [],
    };

    try {
      const raw = await tmdbFetch<any>(`/${data.type}/${data.id}`, {
        append_to_response: "credits,videos,similar",
      });

      const runtimeMins: number =
        data.type === "movie" ? (raw.runtime ?? 0) : (raw.episode_run_time?.[0] ?? 0);
      const hours = Math.floor(runtimeMins / 60);
      const mins = runtimeMins % 60;

      const trailer =
        (raw.videos?.results ?? []).find(
          (v: any) => v.site === "YouTube" && v.type === "Trailer",
        ) ?? (raw.videos?.results ?? []).find((v: any) => v.site === "YouTube");

      return {
        ok: true,
        id: raw.id,
        type: data.type,
        title: raw.title ?? raw.name ?? "Untitled",
        tagline: raw.tagline ?? "",
        overview: raw.overview ?? "",
        poster: img(raw.poster_path, "w500"),
        backdrop: img(raw.backdrop_path, "original"),
        year: (raw.release_date ?? raw.first_air_date ?? "").slice(0, 4),
        runtime: runtimeMins ? (hours ? `${hours}h ${mins}m` : `${mins}m`) : "",
        rating: Math.round((raw.vote_average ?? 0) * 10) / 10,
        genres: (raw.genres ?? []).map((g: any) => g.name),
        director:
          (raw.credits?.crew ?? []).find((c: any) => c.job === "Director")?.name ??
          (raw.created_by ?? [])[0]?.name ??
          null,
        cast: (raw.credits?.cast ?? []).slice(0, 18).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character ?? "",
          photo: img(c.profile_path, "w185"),
        })),
        trailerKey: trailer?.key ?? null,
        similar: list(raw.similar?.results, data.type).slice(0, 18),
        seasons: (raw.seasons ?? [])
          .filter((s: any) => s.season_number > 0)
          .map((s: any) => ({
            number: s.season_number,
            name: s.name,
            episodes: s.episode_count,
            poster: img(s.poster_path, "w342"),
          })),
      };
    } catch (error) {
      return { ...empty, reason: error instanceof Error ? error.message : "TMDB_ERROR" };
    }
  });

export const getSeason = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number; season: number }) => input)
  .handler(async ({ data }) => {
    try {
      const raw = await tmdbFetch<any>(`/tv/${data.id}/season/${data.season}`);
      return {
        ok: true as const,
        name: raw.name as string,
        episodes: (raw.episodes ?? []).map((e: any) => ({
          number: e.episode_number as number,
          name: e.name as string,
          overview: (e.overview ?? "") as string,
          still: img(e.still_path, "w300"),
          air: (e.air_date ?? "") as string,
          runtime: (e.runtime ?? 0) as number,
        })),
      };
    } catch (error) {
      return {
        ok: false as const,
        reason: error instanceof Error ? error.message : "TMDB_ERROR",
        name: "",
        episodes: [] as {
          number: number;
          name: string;
          overview: string;
          still: string | null;
          air: string;
          runtime: number;
        }[],
      };
    }
  });

export const searchAll = createServerFn({ method: "GET" })
  .inputValidator((input: { query: string }) => input)
  .handler(async ({ data }) => {
    const q = data.query.trim();
    if (!q) return { ok: true as const, movies: [], shows: [] };
    try {
      const raw = await tmdbFetch<{ results: RawItem[] }>("/search/multi", {
        query: q,
        include_adult: "false",
      });
      const all = list(raw.results, "movie");
      return {
        ok: true as const,
        movies: all.filter((i) => i.type === "movie"),
        shows: all.filter((i) => i.type === "tv"),
      };
    } catch (error) {
      return {
        ok: false as const,
        reason: error instanceof Error ? error.message : "TMDB_ERROR",
        movies: [] as MediaItem[],
        shows: [] as MediaItem[],
      };
    }
  });

/** YouTube search. Uses the official Data API when a key is configured. */
export const searchYouTube = createServerFn({ method: "GET" })
  .inputValidator((input: { query: string }) => input)
  .handler(async ({ data }) => {
    const key = process.env["YOUTUBE_API_KEY"];
    if (!key) return { ok: false as const, reason: "YOUTUBE_API_KEY_MISSING", videos: [] };
    const q = data.query.trim();
    if (!q) return { ok: true as const, videos: [] };

    try {
      const params = new URLSearchParams({
        part: "snippet",
        type: "video",
        maxResults: "24",
        q,
        key,
      });
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      if (!res.ok) throw new Error(`YouTube request failed (${res.status})`);
      const json = (await res.json()) as any;
      return {
        ok: true as const,
        videos: (json.items ?? []).map((i: any) => ({
          id: i.id.videoId as string,
          title: i.snippet.title as string,
          channel: i.snippet.channelTitle as string,
          thumb: (i.snippet.thumbnails?.high?.url ?? i.snippet.thumbnails?.medium?.url) as string,
          published: i.snippet.publishedAt as string,
        })),
      };
    } catch (error) {
      return {
        ok: false as const,
        reason: error instanceof Error ? error.message : "YOUTUBE_ERROR",
        videos: [] as { id: string; title: string; channel: string; thumb: string; published: string }[],
      };
    }
  });

export const getYouTubeTrending = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["YOUTUBE_API_KEY"];
  if (!key) return { ok: false as const, reason: "YOUTUBE_API_KEY_MISSING", videos: [] };
  try {
    const params = new URLSearchParams({
      part: "snippet",
      chart: "mostPopular",
      regionCode: "GB",
      maxResults: "24",
      key,
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
    if (!res.ok) throw new Error(`YouTube request failed (${res.status})`);
    const json = (await res.json()) as any;
    return {
      ok: true as const,
      videos: (json.items ?? []).map((i: any) => ({
        id: i.id as string,
        title: i.snippet.title as string,
        channel: i.snippet.channelTitle as string,
        thumb: (i.snippet.thumbnails?.high?.url ?? i.snippet.thumbnails?.medium?.url) as string,
        published: i.snippet.publishedAt as string,
      })),
    };
  } catch (error) {
    return {
      ok: false as const,
      reason: error instanceof Error ? error.message : "YOUTUBE_ERROR",
      videos: [] as { id: string; title: string; channel: string; thumb: string; published: string }[],
    };
  }
});
