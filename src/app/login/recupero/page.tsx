import Link from "next/link";
import { ActionNotice } from "@/components/action-notice";
import { fieldInvalid } from "@/domain/forms";
import { requestRecoveryAction } from "@/server/actions";

export const metadata = {
  title: "Recupero password",
};

export default async function RecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string; inviato?: string }>;
}) {
  const { errore, inviato } = await searchParams;
  return (
    <main className="mx-auto grid min-h-[100dvh] max-w-md content-center px-5">
      <Link href="/login">Elleboro</Link>
      <h1 className="mt-8 text-4xl">Password dimenticata</h1>
      <p className="mt-3">
        Scrivi la mail personale del proprietario. Se è quella salvata, il link arriva lì.
      </p>
      {inviato ? (
        <p className="mt-6">Se la mail è quella del proprietario, il link è in arrivo.</p>
      ) : (
        <form action={requestRecoveryAction} className={`mt-8 grid gap-4 ${fieldInvalid(errore)}`.trim()}>
          <label className="field">
            <span>Mail personale</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <ActionNotice message={errore} />
          <button className="btn" type="submit">
            Invia il link
          </button>
        </form>
      )}
    </main>
  );
}
