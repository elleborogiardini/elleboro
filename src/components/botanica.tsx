type Plant = "ramo" | "mazzo" | "bordura" | "fiore";

export function Botanica({ plant, className = "" }: { plant: Plant; className?: string }) {
  return (
    <span
      className={`botanica botanica-${plant}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
      data-botanica
    />
  );
}

export function Filo() {
  return (
    <div className="filo" aria-hidden="true">
      <span className="filo-line" />
      <Botanica plant="fiore" className="filo-fiore" />
      <span className="filo-line" />
    </div>
  );
}
