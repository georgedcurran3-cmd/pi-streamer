import { createFileRoute } from "@tanstack/react-router";
import { Catalog } from "@/components/tv/Catalog";

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "Films — Curran TV" },
      { name: "description", content: "Browse films by genre, trending and top rated on Curran TV." },
      { property: "og:title", content: "Films — Curran TV" },
      {
        property: "og:description",
        content: "Browse films by genre, trending and top rated on Curran TV.",
      },
    ],
  }),
  component: () => <Catalog type="movie" heading="Films" />,
});
