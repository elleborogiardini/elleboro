import { buildIcs } from "@/domain/calendar";
import { appointmentFeedSelect } from "@/domain/feed";
import { createAdmin } from "@/lib/supabase/admin";
import { feedTokenMatches } from "@/lib/feed-token";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!feedTokenMatches(token)) {
    return new Response("Not found", { status: 404 });
  }
  const admin = createAdmin();
  if (!admin) return new Response("Not found", { status: 404 });
  const { data } = await admin
    .from("appointments")
    .select(
      appointmentFeedSelect,
    );
  const revisedAt = new Date().toISOString();
  const revision = Math.floor(Date.now() / 1000);
  const ics = buildIcs(
    (data ?? []).map((row) => {
      const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
      const place = Array.isArray(row.places) ? row.places[0] : row.places;
      return {
        id: row.id,
        title: row.title,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        clientName: client?.full_name ?? "",
        placeLabel: place?.label ?? "",
        address: client?.address ?? null,
        includeAddress: row.include_address,
        revisedAt,
        sequence: revision,
        cancelled: row.status === "annullato",
      };
    }),
  );
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}
