import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Film, Play, Star } from "lucide-react";
import { getSeason, getTitle } from "@/lib/tmdb.functions";
import { MediaCard } from "@/components/tv/MediaCard";
import { Row } from "@/components/tv/Row";
import { readPairCode } from "@/lib/device";
import { fetchMyList, toggleMyList } from "@/lib/library";
import { TrailerDialog } from "@/components/tv/TrailerDialog";

export const Route = createFileRoute("/show/$id")({
  head: () => ({
    meta: [
      { title: "Series — Curran TV" },
      { name: "description", content: "Seasons, episodes, cast and trailers for TV series on Curran TV." },
      { property: "og:title", content: "Series — Curran TV" },
      {
        property: "og:description",
        content: "Seasons, episodes, cast and trailers for TV series on Curran TV.",
      },
    ],
  }),
  component: ShowPage,
});

function ShowPage() {
  const { id } = Route.useParams();
  const [code, setCode] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [season, setSeason] = useState(1);
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => setCode(readPairCode()), []);

  const { data, isPending } = useQuery({
    queryKey: ["title", "tv", id],
    queryFn: () => getTitle({ data: { type: "tv", id: Number(id) } }),
  });

  const { data: seasonData } = useQuery({
    queryKey: ["season", id, season],
    queryFn: () => getSeason({ data: { id: Number(id), season } }),
    enabled: Boolean(data?.ok),
  });

  useEffect(() => {
    if (!code) return;
    void fetchMyList(code).then((items) => setSaved(items.some((i) => i.item_key === `tv-${id}`)));
  }, [code, id]);

  if (isPending) return <p className="px-8 pt-32 text-sm text-muted-foreground lg:px-14">Loading…</p>;
  if (!data?.ok)
    return (
      <p className="px-8 pt-32 text-sm text-muted-foreground lg:px-14">
        Couldn't load this series. Check the film library connection in Settings.
      </p>
    );

  const onToggle = async () => {
    if (!code) return;
    const now = await toggleMyList(code, {
      item_key: `tv-${id}`,
      media_type: "tv",
      tmdb_id: Number(id),
      video_id: null,
      title: data.title,
      poster: data.poster,
      backdrop: data.backdrop,
    });
    setSaved(now);
  };

  return (
    <div className="pb-20">
      <section className="relative min-h-[66vh] w-full overflow-hidden">
        {data.backdrop ? (
          <img src={data.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 side-fade" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 hero-fade" />

        <div className="relative max-w-3xl px-8 pb-12 pt-44 lg:px-14">
          <h1 className="text-4xl font-extrabold leading-[1.05] lg:text-6xl">{data.title}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{data.year}</span>
            <span>•</span>
            <span>{data.seasons.length} seasons</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Star className="size-3.5 fill-primary text-primary" /> {data.rating}
            </span>
            {data.genres.length ? (
              <>
                <span>•</span>
                <span>{data.genres.join(", ")}</span>
              </>
            ) : null}
          </p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {data.overview}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/watch/$type/$id"
              params={{ type: "tv", id }}
              search={{ s: season, e: 1 }}
              className="tvf inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground"
            >
              <Play className="size-4 fill-current" /> Watch S{season} E1
            </Link>
            <button
              onClick={onToggle}
              className="tvf glass-panel inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
            >
              {saved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
              {saved ? "In My List" : "My List"}
            </button>
            {data.trailerKey ? (
              <button
                onClick={() => setTrailerOpen(true)}
                className="tvf glass-panel inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
              >
                <Film className="size-4" /> Trailer
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="px-8 lg:px-14">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-4">
          {data.seasons.map((s) => (
            <button
              key={s.number}
              onClick={() => setSeason(s.number)}
              className={`tvf shrink-0 rounded-full px-5 py-2 text-sm font-semibold ${
                season === s.number
                  ? "bg-primary text-primary-foreground"
                  : "glass-panel text-muted-foreground"
              }`}
            >
              Season {s.number}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          {(seasonData?.episodes ?? []).map((episode) => (
            <Link
              key={episode.number}
              to="/watch/$type/$id"
              params={{ type: "tv", id }}
              search={{ s: season, e: episode.number }}
              className="tvf glass-panel flex gap-4 rounded-2xl p-3"
            >
              <div className="aspect-video w-40 shrink-0 overflow-hidden rounded-xl bg-elevated">
                {episode.still ? (
                  <img src={episode.still} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 py-1">
                <p className="text-sm font-semibold">
                  {episode.number}. {episode.name}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {episode.overview || "No description available."}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {episode.air} {episode.runtime ? `• ${episode.runtime}m` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {data.cast.length ? (
        <div className="mt-12">
          <Row title="Cast">
            {data.cast.map((person) => (
              <div key={person.id} className="w-32 shrink-0 text-center">
                <div className="aspect-square w-32 overflow-hidden rounded-2xl bg-elevated">
                  {person.photo ? (
                    <img src={person.photo} alt={person.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-1 text-xs font-semibold">{person.name}</p>
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{person.character}</p>
              </div>
            ))}
          </Row>
        </div>
      ) : null}

      {data.similar.length ? (
        <Row title="Similar series">
          {data.similar.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </Row>
      ) : null}

      <TrailerDialog
        open={trailerOpen}
        onOpenChange={setTrailerOpen}
        videoId={data.trailerKey}
        title={data.title}
      />
    </div>
  );
}
