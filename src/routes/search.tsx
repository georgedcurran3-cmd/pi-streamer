import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { searchAll, searchYouTube } from "@/lib/tmdb.functions";
import { MediaCard, VideoCard } from "@/components/tv/MediaCard";
import { Row } from "@/components/tv/Row";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Search — Curran TV" },
      { name: "description", content: "Search films, TV series and YouTube from your TV or phone." },
      { property: "og:title", content: "Search — Curran TV" },
      {
        property: "og:description",
        content: "Search films, TV series and YouTube from your TV or phone.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [value, setValue] = useState(q);

  useEffect(() => setValue(q), [q]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchAll({ data: { query: q } }),
    enabled: q.trim().length > 1,
  });

  const { data: yt } = useQuery({
    queryKey: ["search-yt", q],
    queryFn: () => searchYouTube({ data: { query: q } }),
    enabled: q.trim().length > 1,
  });

  return (
    <div className="pb-16 pt-28">
      <div className="px-8 lg:px-14">
        <h1 className="text-4xl font-extrabold lg:text-5xl">Search</h1>
        <form
          className="glass-panel mt-6 flex max-w-2xl items-center gap-3 rounded-2xl px-5 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            void navigate({ search: { q: value } });
          }}
        >
          <SearchIcon className="size-5 text-muted-foreground" />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Films, series, YouTube…"
            className="tvf w-full bg-transparent py-1.5 text-lg outline-none placeholder:text-muted-foreground"
          />
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Tip: type on your phone remote and the results appear here instantly.
        </p>
      </div>

      <div className="mt-10">
        {q.trim().length < 2 ? null : isFetching ? (
          <p className="px-8 text-sm text-muted-foreground lg:px-14">Searching…</p>
        ) : (
          <>
            {data?.movies?.length ? (
              <Row title="Films">
                {data.movies.map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
              </Row>
            ) : null}
            {data?.shows?.length ? (
              <Row title="TV">
                {data.shows.map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
              </Row>
            ) : null}
            {yt?.ok && yt.videos.length ? (
              <Row title="YouTube">
                {yt.videos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </Row>
            ) : null}
            {!data?.movies?.length && !data?.shows?.length && !yt?.videos?.length ? (
              <p className="px-8 text-sm text-muted-foreground lg:px-14">
                Nothing found for “{q}”.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
