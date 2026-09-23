import { createFileRoute } from "@tanstack/react-router";
import { Catalog } from "@/components/tv/Catalog";

export const Route = createFileRoute("/shows")({
  head: () => ({
    meta: [
      { title: "TV Shows — Curran TV" },
      { name: "description", content: "Browse series by genre, trending and top rated on Curran TV." },
      { property: "og:title", content: "TV Shows — Curran TV" },
      {
        property: "og:description",
        content: "Browse series by genre, trending and top rated on Curran TV.",
      },
    ],
  }),
  component: () => <Catalog type="tv" heading="TV Shows" />,
});
