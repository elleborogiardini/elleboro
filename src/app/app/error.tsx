"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid gap-3">
      <p>Non sono riuscito a caricare questa schermata.</p>
      <button className="btn" type="button" onClick={() => reset()}>
        Riprova
      </button>
    </div>
  );
}
