import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, SkipForward } from "lucide-react";
import { getSeason, getTitle } from "@/lib/tmdb.functions";
import { movieEmbedUrl, tvEmbedUrl } from "@/lib/providers";
import { readPairCode } from "@/lib/device";
import { saveProgress } from "@/lib/library";
import { setTvStatus } from "@/lib/tv-status";

export const Route = createFileRoute("/watch/$type/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    s: Number(search["s"] ?? 1) || 1,
    e: Number(search["e"] ?? 1) || 1,
  }),
  head: () => ({
    meta: [
      { title: "Now Playing — Curran TV" },
      { name: "description", content: "Full-screen playback on your Curran TV media centre." },
      { property: "og:title", content: "Now Playing — Curran TV" },
      { property: "og:description", content: "Full-screen playback on your Curran TV media centre." },
    ],
  }),
  component: Watch,
});

function Watch() {
  const { type, id } = Route.useParams();
  const { s, e } = Route.useSearch();
  const navigate = useNavigate();
  const [chromeVisible, setChromeVisible] = useState(true);
  const isTv = type === "tv";

  const { data: title } = useQuery({
    queryKey: ["title", type, id],
    queryFn: () => getTitle({ data: { type: isTv ? "tv" : "movie", id: Number(id) } }),
  });

  const { data: seasonData } = useQuery({
    queryKey: ["season", id, s],
    queryFn: () => getSeason({ data: { id: Number(id), season: s } }),
    enabled: isTv,
  });

  const episode = seasonData?.episodes.find((ep) => ep.number === e);
  const src = isTv ? tvEmbedUrl(Number(id), s, e) : movieEmbedUrl(Number(id));
  const subtitle = isTv ? `Season ${s}, Episode ${e}${episode ? ` — ${episode.name}` : ""}` : undefined;

  // Tell the phone remote what's on screen, and record it for Continue Watching.
  useEffect(() => {
    if (!title?.ok) return;
    setTvStatus({
      nowPlaying: {
        title: title.title,
        ...(subtitle ? { subtitle } : {}),
        artwork: title.poster,
        playing: true,
        position: 0,
        duration: 0,
      },
    });

    const code = readPairCode();
    if (code) {
      void saveProgress(code, {
        item_key: isTv ? `tv-${id}-${s}-${e}` : `movie-${id}`,
        media_type: isTv ? "tv" : "movie",
        tmdb_id: Number(id),
        title: title.title,
        subtitle: subtitle ?? null,
        season: isTv ? s : null,
        episode: isTv ? e : null,
        poster: title.poster,
        backdrop: title.backdrop,
      });
    }

    return () => setTvStatus({ nowPlaying: null });
  }, [title?.ok, title?.title, title?.poster, title?.backdrop, subtitle, id, s, e, isTv]);

  // Auto-hide the overlay so playback stays cinematic.
  useEffect(() => {
    let timer = window.setTimeout(() => setChromeVisible(false), 4000);
    const wake = () => {
      setChromeVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setChromeVisible(false), 4000);
    };
    window.addEventListener("mousemove", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  const nextEpisode = () => {
    void navigate({ to: "/watch/$type/$id", params: { type, id }, search: { s, e: e + 1 } });
  };

  return (
    <div className="relative h-screen w-screen bg-black">
      <iframe
        key={src}
        title={title?.title ?? "Playback"}
        src={src}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="origin"
        className="h-full w-full border-0"
      />

      <div
        className={`pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6 transition-opacity duration-300 ${
          chromeVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={() => window.history.back()}
          className="tvf pointer-events-auto inline-flex items-center gap-2 rounded-full glass-panel px-5 py-2.5 text-sm font-semibold"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <div className="pointer-events-none max-w-md rounded-2xl glass-panel px-5 py-3 text-right">
          <p className="text-sm font-semibold">{title?.title ?? "Loading…"}</p>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>

      {isTv ? (
        <div
          className={`absolute bottom-6 right-6 transition-opacity duration-300 ${
            chromeVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={nextEpisode}
            className="tvf inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Next episode <SkipForward className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
