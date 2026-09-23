import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { readPairCode } from "@/lib/device";
import { fetchContinueWatching, fetchMyList } from "@/lib/library";

export const Route = createFileRoute("/my-list")({
  head: () => ({
    meta: [
      { title: "My List — Curran TV" },
      { name: "description", content: "Your saved films, series and videos, plus what you were watching." },
      { property: "og:title", content: "My List — Curran TV" },
      {
        property: "og:description",
        content: "Your saved films, series and videos, plus what you were watching.",
      },
    ],
  }),
  component: MyList,
});

function MyList() {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => setCode(readPairCode()), []);

  const { data: saved } = useQuery({
    queryKey: ["my-list", code],
    queryFn: () => fetchMyList(code!),
    enabled: Boolean(code),
  });

  const { data: history } = useQuery({
    queryKey: ["continue", code],
    queryFn: () => fetchContinueWatching(code!),
    enabled: Boolean(code),
  });

  return (
    <div className="pb-16 pt-28">
      <div className="px-8 lg:px-14">
        <h1 className="text-4xl font-extrabold lg:text-5xl">My List</h1>
      </div>

      <Section title="Saved">
        {saved && saved.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {saved.map((item) => (
              <Link
                key={item.item_key}
                to={
                  item.media_type === "youtube"
                    ? "/youtube/$videoId"
                    : item.media_type === "tv"
                      ? "/show/$id"
                      : "/movie/$id"
                }
                params={
                  item.media_type === "youtube"
                    ? { videoId: item.video_id! }
                    : ({ id: String(item.tmdb_id) } as never)
                }
                className="tvf block overflow-hidden rounded-2xl bg-elevated"
              >
                <div className="aspect-[2/3] w-full">
                  {item.poster ? (
                    <img src={item.poster} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center p-3 text-center text-xs text-muted-foreground">
                      {item.title}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty text="Nothing saved yet. Press + My List on any film or series." />
        )}
      </Section>

      <Section title="Watch history">
        {history && history.length > 0 ? (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl glass-panel">
            {history.map((entry) => (
              <li key={entry.item_key} className="flex items-center gap-4 p-4">
                {entry.poster || entry.backdrop ? (
                  <img
                    src={entry.poster ?? entry.backdrop!}
                    alt=""
                    loading="lazy"
                    className="h-16 w-11 rounded-lg object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entry.title}</p>
                  {entry.subtitle ? (
                    <p className="truncate text-xs text-muted-foreground">{entry.subtitle}</p>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.updated_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="Your watch history will appear here." />
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 px-8 lg:px-14">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="glass-panel flex items-center gap-3 rounded-2xl p-6 text-sm text-muted-foreground">
      <Bookmark className="size-4" /> {text}
    </div>
  );
}
