import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCatalog } from "@/lib/tmdb.functions";
import { MediaCard } from "@/components/tv/MediaCard";
import { Row } from "@/components/tv/Row";

export function Catalog({ type, heading }: { type: "movie" | "tv"; heading: string }) {
  const [genre, setGenre] = useState<number | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["catalog", type, genre],
    queryFn: () => getCatalog({ data: { type, genre } }),
    staleTime: 1000 * 60 * 15,
  });

  return (
    <div className="pb-16 pt-28">
      <div className="px-8 lg:px-14">
        <h1 className="text-4xl font-extrabold lg:text-5xl">{heading}</h1>
        <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setGenre(null)}
            className={`tvf shrink-0 rounded-full px-5 py-2 text-sm font-semibold ${
              genre === null ? "bg-primary text-primary-foreground" : "glass-panel text-muted-foreground"
            }`}
          >
            All
          </button>
          {(data?.genres ?? []).map((g) => (
            <button
              key={g.id}
              onClick={() => setGenre(g.id)}
              className={`tvf shrink-0 rounded-full px-5 py-2 text-sm font-semibold ${
                genre === g.id
                  ? "bg-primary text-primary-foreground"
                  : "glass-panel text-muted-foreground"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {isPending ? (
          <p className="px-8 text-sm text-muted-foreground lg:px-14">Loading…</p>
        ) : !data?.ok ? (
          <p className="px-8 text-sm text-muted-foreground lg:px-14">
            The film library isn't connected yet. Add your TMDB key in Settings.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 px-8 sm:grid-cols-4 lg:grid-cols-6 lg:px-14 xl:grid-cols-8">
              {data.items.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>

            <div className="mt-12">
              <Row title={`Trending ${type === "tv" ? "series" : "films"}`}>
                {data.trending.map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
              </Row>
              <Row title="Top rated">
                {data.topRated.map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
              </Row>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
