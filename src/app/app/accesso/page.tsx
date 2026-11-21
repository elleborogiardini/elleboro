import { notFound } from "next/navigation";
import { ActionNotice } from "@/components/action-notice";
import { fieldInvalid } from "@/domain/forms";
import { getRecoveryEmail, getRole } from "@/lib/data";
import { saveRecoveryEmailAction } from "@/server/actions";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string; salvato?: string }>;
}) {
  const { errore, salvato } = await searchParams;
  const role = await getRole();
  if (role !== "owner") notFound();
  const email = await getRecoveryEmail();
  return (
    <div className="mx-auto grid max-w-md gap-8">
      <section className="owner-section">
      <p>Qui arriva il link se dimentichi la password. Il tecnico non la vede.</p>
      </section>
      <section className="owner-section is-grove">
      <form action={saveRecoveryEmailAction} className={`grid gap-4 ${fieldInvalid(errore)}`.trim()}>
        <label className="field">
          <span>Mail personale</span>
          <input name="email" type="email" autoComplete="email" defaultValue={email ?? ""} />
        </label>
        <ActionNotice message={errore} />
        {salvato ? <p>Mail salvata.</p> : null}
        <button className="btn" type="submit">
          Salva
        </button>
      </form>
      </section>
    </div>
  );
}
