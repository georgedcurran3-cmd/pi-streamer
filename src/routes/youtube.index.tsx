import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ExternalLink, Search as SearchIcon } from "lucide-react";
import { getYouTubeTrending, searchYouTube } from "@/lib/tmdb.functions";
import { VideoCard } from "@/components/tv/MediaCard";
import { YOUTUBE_TV_URL } from "@/lib/providers";

export const Route = createFileRoute("/youtube/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "YouTube — Curran TV" },
      { name: "description", content: "Search and play YouTube on your TV, driven from your phone." },
      { property: "og:title", content: "YouTube — Curran TV" },
      {
        property: "og:description",
        content: "Search and play YouTube on your TV, driven from your phone.",
      },
    ],
  }),
  component: YouTubePage,
});

function YouTubePage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/youtube" });
  const [value, setValue] = useState(q);

  useEffect(() => setValue(q), [q]);

  const { data: trending } = useQuery({
    queryKey: ["yt-trending"],
    queryFn: () => getYouTubeTrending(),
    enabled: q.trim().length < 2,
  });

  const { data: results, isFetching } = useQuery({
    queryKey: ["yt-search", q],
    queryFn: () => searchYouTube({ data: { query: q } }),
    enabled: q.trim().length > 1,
  });

  const active = q.trim().length > 1 ? results : trending;
  const needsKey = active && !active.ok && active.reason === "YOUTUBE_API_KEY_MISSING";

  return (
    <div className="pb-16 pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4 px-8 lg:px-14">
        <div>
          <h1 className="text-4xl font-extrabold lg:text-5xl">YouTube</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in on this TV — playback uses your own YouTube account.
          </p>
        </div>
        <a
          href={YOUTUBE_TV_URL}
          className="tvf glass-panel inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
        >
          Open full YouTube <ExternalLink className="size-4" />
        </a>
      </div>

      <form
        className="glass-panel mx-8 mt-6 flex max-w-2xl items-center gap-3 rounded-2xl px-5 py-3 lg:mx-14"
        onSubmit={(event) => {
          event.preventDefault();
          void navigate({ search: { q: value } });
        }}
      >
        <SearchIcon className="size-5 text-muted-foreground" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search YouTube…"
          className="tvf w-full bg-transparent py-1.5 text-lg outline-none placeholder:text-muted-foreground"
        />
      </form>

      <div className="mt-10 px-8 lg:px-14">
        {needsKey ? (
          <div className="glass-panel rounded-2xl p-6 text-sm leading-relaxed text-muted-foreground">
            YouTube search needs a YouTube Data API key. Until one is added you can still open full
            YouTube above and play anything from there — it stays signed in on this TV.
          </div>
        ) : isFetching ? (
          <p className="text-sm text-muted-foreground">Searching…</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(active?.videos ?? []).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
