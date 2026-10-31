import { actionNotice } from "@/domain/forms";

export function ActionNotice({ message }: { message?: string }) {
  const text = actionNotice(message);
  if (!text) return null;
  return <p className="action-notice text-[var(--danger)]">{text}</p>;
}
