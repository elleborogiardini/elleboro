import { buildVcard } from "@/domain/card";
import { getPublicSite } from "@/lib/data";

export async function GET() {
  const site = await getPublicSite();
  if (!site) return new Response(null, { status: 404 });
  const body = buildVcard({
    name: site.ownerName,
    phone: site.phone,
    email: site.email,
    area: site.area,
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="elleboro.vcf"',
    },
  });
}
