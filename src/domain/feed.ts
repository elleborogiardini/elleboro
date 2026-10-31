export const appointmentFeedSelect =
  "id, title, starts_at, ends_at, status, include_address, clients(full_name, address), places(label)";

export const agendaListSelect =
  "id, title, starts_at, ends_at, status, include_address, client_id, place_id, intervention_id, clients(full_name), places(label)";
