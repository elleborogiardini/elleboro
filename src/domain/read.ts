const LOAD_ERROR = "Non sono riuscito a caricare questa schermata.";

export function rowsOrFail<T>(error: unknown, data: T[] | null): T[] {
  if (error) throw new Error(LOAD_ERROR);
  return data ?? [];
}

export function rowOrFail<T>(error: unknown, data: T | null): T | null {
  if (error) throw new Error(LOAD_ERROR);
  return data;
}
