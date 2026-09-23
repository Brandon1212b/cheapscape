import { createFileRoute } from "@tanstack/react-router";
import { allTrackedItemNames } from "@/lib/tracked-item-names";

export const Route = createFileRoute("/api/warm")({
  server: {
    handlers: {
      GET: async () => {
        const { getSnapshot, getTrends, getItemRequirementsMap } = await import("@/lib/osrs.server");
        const names = allTrackedItemNames();
        const started = Date.now();
        const rows = await getSnapshot(names);
        const trends = await getTrends(names, "6m");
        await getItemRequirementsMap(names);
        return Response.json({
          ok: true,
          items: rows.length,
          trends: Object.keys(trends).length,
          ms: Date.now() - started,
        });
      },
    },
  },
});
