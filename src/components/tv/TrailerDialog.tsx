import { youtubeEmbedUrl } from "@/lib/providers";

export function TrailerDialog({
  open,
  onOpenChange,
  videoId,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string | null;
  title: string;
}) {
  if (!open || !videoId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-5xl overflow-hidden rounded-3xl bg-black shadow-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <iframe
          title={`${title} trailer`}
          src={youtubeEmbedUrl(videoId)}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full"
        />
      </div>
      <button
        onClick={() => onOpenChange(false)}
        className="tvf fixed right-8 top-8 rounded-full glass-panel px-5 py-2.5 text-sm font-semibold"
      >
        Close
      </button>
    </div>
  );
}
