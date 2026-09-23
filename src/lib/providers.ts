/**
 * Video source provider.
 *
 * Every playable title is resolved title -> TMDB -> TMDB id -> provider embed.
 * Keeping the URL construction here means the provider can be swapped without
 * touching any screen. The base can be overridden per device in Settings.
 */

export const DEFAULT_PROVIDER_BASE = "https://cinesrc.st";

export function getProviderBase(): string {
  if (typeof window === "undefined") return DEFAULT_PROVIDER_BASE;
  return localStorage.getItem("curran.providerBase") || DEFAULT_PROVIDER_BASE;
}

export function setProviderBase(base: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("curran.providerBase", base.replace(/\/+$/, ""));
}

export function movieEmbedUrl(tmdbId: number, base = getProviderBase()) {
  return `${base.replace(/\/+$/, "")}/embed/movie/${tmdbId}`;
}

export function tvEmbedUrl(
  tmdbId: number,
  season: number,
  episode: number,
  base = getProviderBase(),
) {
  return `${base.replace(/\/+$/, "")}/embed/tv/${tmdbId}/${season}/${episode}`;
}

export function youtubeEmbedUrl(videoId: string) {
  // www.youtube.com (not nocookie) so the Pi's signed-in Chromium session applies.
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export const PEACOCK_URL = "https://www.peacocktv.com/watch/home";
export const YOUTUBE_TV_URL = "https://www.youtube.com/tv";
