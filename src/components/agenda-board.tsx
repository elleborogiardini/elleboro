"use client";

import { useState } from "react";
import { agendaClock, agendaDayKey, agendaDayLabel, agendaFocusDay, agendaMonth } from "@/domain/calendar";

export type AgendaEntry = {
  id: string;
  startsAt: string;
  title: string;
  place: string;
};

const back = {
  display: "block",
  width: "0.55rem",
  height: "0.55rem",
  borderTop: "2px solid currentColor",
  borderRight: "2px solid currentColor",
  transform: "rotate(-135deg)",
} as const;

const forward = { ...back, transform: "rotate(45deg)" } as const;

export function AgendaBoard({
  entries,
  now,
  month,
  day,
}: {
  entries: AgendaEntry[];
  now: string;
  month?: string;
  day?: string;
}) {
  const clock = new Date(now);
  const marks = entries.map((entry) => entry.startsAt);
  const opened = agendaMonth(marks, clock, month).key;
  const [monthKey, setMonthKey] = useState(opened);
  const [selected, setSelected] = useState(() => agendaFocusDay(opened, day, clock, marks));
  const board = agendaMonth(marks, clock, monthKey);
  const dayItems = entries.filter((entry) => agendaDayKey(entry.startsAt) === selected);

  function showMonth(next: string) {
    setMonthKey(next);
    setSelected(agendaFocusDay(next, undefined, clock, marks));
  }

  return (
    <section className="agenda-board owner-section" aria-label="Calendario del mese">
      <div className="agenda-month">
        <button type="button" aria-label="Mese precedente" onClick={() => showMonth(board.prev)}>
          <span aria-hidden="true" style={back} />
        </button>
        <p className="capitalize">{board.label}</p>
        <button type="button" aria-label="Mese successivo" onClick={() => showMonth(board.next)}>
          <span aria-hidden="true" style={forward} />
        </button>
      </div>
      <div className="agenda-weekdays" aria-hidden="true">
        {board.weekdays.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
      <div className="agenda-weeks">
        {board.weeks.map((week) => (
          <div className="agenda-week" key={week[0].key}>
            {week.map((cell) =>
              cell.inMonth ? (
                <button
                  key={cell.key}
                  type="button"
                  className={`agenda-day${cell.key === selected ? " is-selected" : ""}${cell.today ? " is-today" : ""}`}
                  aria-current={cell.key === selected ? "date" : undefined}
                  onClick={() => setSelected(cell.key)}
                >
                  {cell.day}
                  <span className={cell.count > 0 ? "agenda-mark" : "agenda-mark is-empty"} />
                  {cell.count > 0 ? (
                    <span className="sr-only">{cell.count === 1 ? "1 appuntamento" : `${cell.count} appuntamenti`}</span>
                  ) : null}
                </button>
              ) : (
                <span key={cell.key} className="agenda-day is-outside">
                  {cell.day}
                </span>
              ),
            )}
          </div>
        ))}
      </div>
      <h2 className="agenda-day-title capitalize">{agendaDayLabel(selected)}</h2>
      {dayItems.length === 0 ? (
        <p>Nessun appuntamento in questo giorno.</p>
      ) : (
        <ol className="agenda-times">
          {dayItems.map((item) => (
            <li key={item.id}>
              <time dateTime={item.startsAt}>{agendaClock(item.startsAt)}</time>
              <div>
                <strong>{item.title}</strong>
                <span>{item.place}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
