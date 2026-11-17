import Link from "next/link";
import { NewPasswordForm } from "@/app/login/nuova/form";

export const metadata = {
  title: "Nuova password",
};

export default function NewPasswordPage() {
  return (
    <main className="mx-auto grid min-h-[100dvh] max-w-md content-center px-5">
      <Link href="/login">Elleboro</Link>
      <h1 className="mt-8 text-4xl">Nuova password</h1>
      <NewPasswordForm />
    </main>
  );
}
