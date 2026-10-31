import Link from "next/link";
import { emptyInquiries, inquirySummary } from "@/domain/inquiry";
import { listInquiries } from "@/lib/records";

export default async function InquiriesPage() {
  const inquiries = await listInquiries();
  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      {inquiries.length === 0 ? (
        <p>{emptyInquiries()}</p>
      ) : (
        <ul className="grid gap-3">
          {inquiries.map((item) => (
            <li key={item.id}>
              <Link href={`/app/richieste/${item.id}`} className="grid py-2">
                <strong>{item.name}</strong>
                <span className="text-[var(--muted)]">
                  {inquirySummary({
                    area: item.area,
                    placeKind: item.place_kind,
                    status: item.status,
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
