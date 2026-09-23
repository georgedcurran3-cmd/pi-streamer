import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Film, Play, Star } from "lucide-react";
import { getTitle } from "@/lib/tmdb.functions";
import { MediaCard } from "@/components/tv/MediaCard";
import { Row } from "@/components/tv/Row";
import { readPairCode } from "@/lib/device";
import { fetchMyList, toggleMyList } from "@/lib/library";
import { TrailerDialog } from "@/components/tv/TrailerDialog";

export const Route = createFileRoute("/movie/$id")({
  head: () => ({
    meta: [
      { title: "Film — Curran TV" },
      { name: "description", content: "Cast, trailer, rating and similar films on Curran TV." },
      { property: "og:title", content: "Film — Curran TV" },
      { property: "og:description", content: "Cast, trailer, rating and similar films on Curran TV." },
    ],
  }),
  component: MoviePage,
});

function MoviePage() {
  const { id } = Route.useParams();
  const [code, setCode] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => setCode(readPairCode()), []);

  const { data, isPending } = useQuery({
    queryKey: ["title", "movie", id],
    queryFn: () => getTitle({ data: { type: "movie", id: Number(id) } }),
  });

  useEffect(() => {
    if (!code) return;
    void fetchMyList(code).then((items) =>
      setSaved(items.some((i) => i.item_key === `movie-${id}`)),
    );
  }, [code, id]);

  if (isPending) return <p className="px-8 pt-32 text-sm text-muted-foreground lg:px-14">Loading…</p>;
  if (!data?.ok)
    return (
      <p className="px-8 pt-32 text-sm text-muted-foreground lg:px-14">
        Couldn't load this title. Check the film library connection in Settings.
      </p>
    );

  const onToggle = async () => {
    if (!code) return;
    const now = await toggleMyList(code, {
      item_key: `movie-${id}`,
      media_type: "movie",
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
      <section className="relative min-h-[70vh] w-full overflow-hidden">
        {data.backdrop ? (
          <img src={data.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 side-fade" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 hero-fade" />

        <div className="relative flex flex-col gap-8 px-8 pb-12 pt-40 lg:flex-row lg:px-14">
          {data.poster ? (
            <img
              src={data.poster}
              alt={data.title}
              className="hidden w-52 shrink-0 self-end rounded-2xl shadow-panel lg:block"
            />
          ) : null}

          <div className="max-w-3xl self-end">
            <h1 className="text-4xl font-extrabold leading-[1.05] lg:text-6xl">{data.title}</h1>
            {data.tagline ? (
              <p className="mt-2 text-base italic text-primary">{data.tagline}</p>
            ) : null}
            <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{data.year}</span>
              {data.runtime ? (
                <>
                  <span>•</span>
                  <span>{data.runtime}</span>
                </>
              ) : null}
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
            {data.director ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Directed by <span className="text-foreground">{data.director}</span>
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/watch/$type/$id"
                params={{ type: "movie", id }}
                className="tvf inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground"
              >
                <Play className="size-4 fill-current" /> Watch
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
        </div>
      </section>

      {data.cast.length ? (
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
      ) : null}

      {data.similar.length ? (
        <Row title="Similar films">
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
