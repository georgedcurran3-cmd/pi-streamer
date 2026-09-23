import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, MonitorPlay } from "lucide-react";
import { PEACOCK_URL } from "@/lib/providers";

export const Route = createFileRoute("/peacock")({
  head: () => ({
    meta: [
      { title: "Peacock — Curran TV" },
      { name: "description", content: "Open Peacock and sign in with your own account from Curran TV." },
      { property: "og:title", content: "Peacock — Curran TV" },
      {
        property: "og:description",
        content: "Open Peacock and sign in with your own account from Curran TV.",
      },
    ],
  }),
  component: Peacock,
});

function Peacock() {
  return (
    <div className="flex min-h-screen items-center justify-center px-8 pt-24">
      <div className="glass-panel max-w-xl rounded-3xl p-12 text-center">
        <MonitorPlay className="mx-auto size-12 text-primary" />
        <h1 className="mt-6 text-3xl font-extrabold">Peacock</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Peacock runs in its own player and needs your own subscription. Opening it here signs you in
          with your Peacock account and keeps your viewing history on their service.
        </p>
        <a
          href={PEACOCK_URL}
          target="_blank"
          rel="noreferrer"
          className="tvf mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground"
        >
          Open Peacock <ExternalLink className="size-4" />
        </a>
      </div>
    </div>
  );
}
