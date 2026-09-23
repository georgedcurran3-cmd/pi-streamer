import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { youtubeEmbedUrl } from "@/lib/providers";
import { setTvStatus } from "@/lib/tv-status";

export const Route = createFileRoute("/youtube/$videoId")({
  head: () => ({
    meta: [
      { title: "YouTube — Now Playing" },
      { name: "description", content: "YouTube playback on your Curran TV media centre." },
      { property: "og:title", content: "YouTube — Now Playing" },
      { property: "og:description", content: "YouTube playback on your Curran TV media centre." },
    ],
  }),
  component: YouTubePlayer,
});

function YouTubePlayer() {
  const { videoId } = Route.useParams();
  const [chromeVisible, setChromeVisible] = useState(true);

  useEffect(() => {
    setTvStatus({
      nowPlaying: {
        title: "YouTube",
        subtitle: videoId,
        artwork: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        playing: true,
        position: 0,
        duration: 0,
      },
    });
    return () => setTvStatus({ nowPlaying: null });
  }, [videoId]);

  useEffect(() => {
    let timer = window.setTimeout(() => setChromeVisible(false), 3500);
    const wake = () => {
      setChromeVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setChromeVisible(false), 3500);
    };
    window.addEventListener("mousemove", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-black">
      <iframe
        key={videoId}
        title="YouTube"
        src={youtubeEmbedUrl(videoId)}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="h-screen w-full border-0"
      />
      <button
        onClick={() => window.history.back()}
        className={`tvf absolute left-6 top-6 inline-flex items-center gap-2 rounded-full glass-panel px-5 py-2.5 text-sm font-semibold transition-opacity ${
          chromeVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <ArrowLeft className="size-4" /> Back
      </button>
    </div>
  );
}
