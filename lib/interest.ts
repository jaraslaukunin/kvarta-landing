/** Событие «нажали кнопку с конкретным интересом» — форма ловит его и выбирает нужный пункт. */
export const INTEREST_EVENT = "kvarta:interest";

export type Interest = "subscription" | "order" | "question";

export function isInterest(value: unknown): value is Interest {
  return value === "subscription" || value === "order" || value === "question";
}
