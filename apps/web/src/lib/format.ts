export function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}
