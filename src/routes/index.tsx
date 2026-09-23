import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Info, Play, Star } from "lucide-react";
import { getHomeFeed, getYouTubeTrending } from "@/lib/tmdb.functions";
import { MediaCard, VideoCard } from "@/components/tv/MediaCard";
import { Row } from "@/components/tv/Row";
import { readPairCode } from "@/lib/device";
import { fetchContinueWatching } from "@/lib/library";

const homeQuery = queryOptions({
  queryKey: ["home-feed"],
  queryFn: () => getHomeFeed(),
  staleTime: 1000 * 60 * 20,
});

const ytQuery = queryOptions({
  queryKey: ["yt-trending"],
  queryFn: () => getYouTubeTrending(),
  staleTime: 1000 * 60 * 30,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Curran TV — Home" },
      {
        name: "description",
        content: "Trending films, new releases, popular TV and YouTube on your Curran TV media centre.",
      },
      { property: "og:title", content: "Curran TV — Home" },
      {
        property: "og:description",
        content: "Trending films, new releases, popular TV and YouTube on your Curran TV media centre.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
});

function Home() {
  const { data: feed } = useSuspenseQuery(homeQuery);
  const { data: yt } = useQuery(ytQuery);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => setCode(readPairCode()), []);

  const { data: continueWatching } = useQuery({
    queryKey: ["continue", code],
    queryFn: () => fetchContinueWatching(code!),
    enabled: Boolean(code),
  });

  if (!feed.ok) return <SetupNotice reason={feed.reason} />;

  const hero = feed.trending.find((i) => i.backdrop) ?? feed.popularMovies[0];

  return (
    <div className="pb-16">
      {hero ? (
        <section className="relative h-[68vh] min-h-[420px] w-full overflow-hidden">
          <img
            src={hero.backdrop ?? hero.poster ?? ""}
            alt={hero.title}
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 side-fade" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 hero-fade" />

          <div className="absolute inset-x-0 bottom-0 max-w-3xl px-8 pb-12 lg:px-14">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
              Trending now
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] lg:text-6xl">{hero.title}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="size-4 fill-primary text-primary" />
              {hero.rating} <span>•</span> {hero.date.slice(0, 4)} <span>•</span>{" "}
              {hero.type === "tv" ? "Series" : "Film"}
            </p>
            <p className="mt-4 line-clamp-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {hero.overview}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={hero.type === "tv" ? "/show/$id" : "/movie/$id"}
                params={{ id: String(hero.id) }}
                className="tvf inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground"
              >
                <Play className="size-4 fill-current" /> Play
              </Link>
              <Link
                to={hero.type === "tv" ? "/show/$id" : "/movie/$id"}
                params={{ id: String(hero.id) }}
                className="tvf glass-panel inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
              >
                <Info className="size-4" /> More info
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <div className="-mt-4 relative z-10">
        {continueWatching && continueWatching.length > 0 ? (
          <Row title="Continue watching">
            {continueWatching.map((entry) => (
              <Link
                key={entry.item_key}
                to={
                  entry.media_type === "youtube"
                    ? "/youtube/$videoId"
                    : entry.media_type === "tv"
                      ? "/show/$id"
                      : "/movie/$id"
                }
                params={
                  entry.media_type === "youtube"
                    ? { videoId: entry.video_id! }
                    : ({ id: String(entry.tmdb_id) } as never)
                }
                className="tvf relative block w-72 shrink-0 overflow-hidden rounded-2xl bg-elevated"
              >
                <div className="aspect-video w-full">
                  {entry.backdrop || entry.poster ? (
                    <img
                      src={entry.backdrop ?? entry.poster!}
                      alt={entry.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="absolute inset-x-0 bottom-0 hero-fade p-3 pt-8">
                  <p className="line-clamp-1 text-sm font-semibold">{entry.title}</p>
                  {entry.subtitle ? (
                    <p className="text-xs text-muted-foreground">{entry.subtitle}</p>
                  ) : null}
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(
                          100,
                          entry.duration_seconds
                            ? (entry.position_seconds / entry.duration_seconds) * 100
                            : 0,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </Row>
        ) : null}

        <Row title="Trending this week">
          {feed.trending.map((item) => (
            <MediaCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </Row>
        <Row title="New releases">
          {feed.newReleases.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </Row>
        <Row title="Popular films">
          {feed.popularMovies.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </Row>
        <Row title="Popular TV">
          {feed.popularTv.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </Row>
        <Row title="Recommended for you">
          {feed.recommended.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </Row>
        <Row title="Coming soon">
          {feed.upcoming.map((item) => (
            <MediaCard key={item.id} item={item} wide />
          ))}
        </Row>

        {yt?.ok && yt.videos.length > 0 ? (
          <Row title="YouTube trending">
            {yt.videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </Row>
        ) : null}
      </div>
    </div>
  );
}

function SetupNotice({ reason }: { reason?: string }) {
  const missingKey = reason === "TMDB_API_KEY_MISSING";
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-8">
      <div className="glass-panel max-w-lg rounded-3xl p-10 text-center">
        <h1 className="text-2xl font-bold">
          {missingKey ? "Film library not connected yet" : "Couldn't reach the film library"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {missingKey
            ? "Add your free TMDB key in Settings and the home screen will fill with trending films, new releases and TV."
            : "The film database didn't respond. Check the network connection and try again."}
        </p>
        <Link
          to="/settings"
          className="tvf mt-7 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground"
        >
          Open settings
        </Link>
      </div>
    </div>
  );
}
