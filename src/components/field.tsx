export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  multiline = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const id = name;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {multiline ? (
        <textarea id={id} name={name} defaultValue={defaultValue ?? ""} required={required} />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          required={required}
        />
      )}
    </label>
  );
}
