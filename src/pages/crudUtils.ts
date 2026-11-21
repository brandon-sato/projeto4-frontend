import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    axios.isAxiosError<{ message?: unknown }>(error)
    && typeof error.response?.data?.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
}

export function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export function toDateTimeInput(value: string | Date | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string | Date): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatCurrency(value: string | number): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : String(value);
}
