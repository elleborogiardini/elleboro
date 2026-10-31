import { notFound } from "next/navigation";
import { ActionNotice } from "@/components/action-notice";
import { inquiryFacts, inquiryStatusChoices } from "@/domain/inquiry";
import { getInquiry } from "@/lib/records";
import { setInquiryStatusAction } from "@/server/actions";

export default async function InquiryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ errore?: string }>;
}) {
  const { id } = await params;
  const { errore } = await searchParams;
  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();
  const choices = inquiryStatusChoices(inquiry.status);
  return (
    <article className="mx-auto grid max-w-3xl gap-4">
      <ActionNotice message={errore} />
      <h2 className="text-3xl">{inquiry.name}</h2>
      <p>{inquiry.contact}</p>
      <p>
        {inquiryFacts({
          placeKind: inquiry.place_kind,
          need: inquiry.need,
          area: inquiry.area,
        })}
      </p>
      <p className="text-lg">{inquiry.message}</p>
      <form action={setInquiryStatusAction} className="choice">
        <input type="hidden" name="id" value={inquiry.id} />
        <input type="hidden" name="return_to" value={`/app/richieste/${inquiry.id}`} />
        {choices.map((choice) => (
          <button
            key={choice.value}
            name="status"
            value={choice.value}
            type="submit"
            aria-pressed={choice.pressed}
          >
            {choice.label}
          </button>
        ))}
      </form>
    </article>
  );
}
