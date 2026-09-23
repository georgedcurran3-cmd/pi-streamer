import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { MediaItem } from "@/lib/tmdb.functions";

export function MediaCard({ item, wide = false }: { item: MediaItem; wide?: boolean }) {
  const image = wide ? (item.backdrop ?? item.poster) : (item.poster ?? item.backdrop);
  const to = item.type === "tv" ? "/show/$id" : "/movie/$id";

  return (
    <Link
      to={to}
      params={{ id: String(item.id) }}
      className={`tvf group relative block shrink-0 overflow-hidden rounded-2xl bg-elevated ${
        wide ? "w-72 aspect-video" : "w-40 aspect-[2/3] sm:w-44"
      }`}
    >
      {image ? (
        <img
          src={image}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-muted-foreground">
          {item.title}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 hero-fade p-3 pt-10 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        <p className="line-clamp-2 text-sm font-semibold leading-tight">{item.title}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Star className="size-3 fill-primary text-primary" />
          {item.rating || "—"}
          <span>•</span>
          {item.date.slice(0, 4) || "—"}
        </p>
      </div>
    </Link>
  );
}

export function VideoCard({
  video,
}: {
  video: { id: string; title: string; channel: string; thumb: string };
}) {
  return (
    <Link
      to="/youtube/$videoId"
      params={{ videoId: video.id }}
      className="tvf group block w-72 shrink-0 overflow-hidden rounded-2xl bg-elevated text-left"
    >
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={video.thumb}
          alt={video.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-tight">{video.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{video.channel}</p>
      </div>
    </Link>
  );
}
