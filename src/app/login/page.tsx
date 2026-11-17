import Link from "next/link";
import { ActionNotice } from "@/components/action-notice";
import { fieldInvalid } from "@/domain/forms";
import { signInAction } from "@/server/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>;
}) {
  const { errore } = await searchParams;
  return (
    <main className="mx-auto grid min-h-[100dvh] max-w-md content-center px-5">
      <h1 className="text-4xl">Elleboro</h1>
      <p className="mt-2 text-[var(--muted)]">Accesso per chi cura i giardini.</p>
      <form action={signInAction} className={`mt-8 grid gap-4 ${fieldInvalid(errore)}`.trim()}>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <ActionNotice message={errore} />
        <button className="btn" type="submit">
          Entra
        </button>
        <Link href="/login/recupero">Password dimenticata</Link>
      </form>
    </main>
  );
}
