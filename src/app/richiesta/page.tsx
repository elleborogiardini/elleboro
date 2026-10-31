import Link from "next/link";
import { InquiryForm } from "@/components/inquiry-form";
import { Rise } from "@/components/rise";

export const metadata = {
  title: "Richiedi un sopralluogo",
};

export default function RequestPage() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-xl px-5 py-10">
      <Link href="/">Elleboro Giardini</Link>
      <Rise>
        <h1 className="mt-8 text-5xl leading-none">Richiedi un sopralluogo</h1>
      </Rise>
      <Rise delay={0.08}>
        <p className="mt-4 max-w-[40ch]">
          Raccontami il luogo. Ti rispondo io, Hasith Conthrath.
        </p>
      </Rise>
      <div className="mt-10">
        <InquiryForm />
      </div>
    </main>
  );
}
