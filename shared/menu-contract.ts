export const allergenDefinitions = [
  { code: 1, label: "Cereali contenenti glutine" },
  { code: 2, label: "Crostacei e prodotti a base di crostacei" },
  { code: 3, label: "Uova e prodotti a base di uova" },
  { code: 4, label: "Pesce e prodotti a base di pesce" },
  { code: 5, label: "Arachidi e prodotti a base di arachidi" },
  { code: 6, label: "Soia e prodotti a base di soia" },
  { code: 7, label: "Latte e prodotti a base di latte (incluso lattosio)" },
  { code: 8, label: "Frutta a guscio" },
  { code: 9, label: "Sedano e prodotti a base di sedano" },
  { code: 10, label: "Senape e prodotti a base di senape" },
  { code: 11, label: "Semi di sesamo e prodotti a base di semi di sesamo" },
  { code: 12, label: "Anidride solforosa e solfiti" },
  { code: 13, label: "Lupini e prodotti a base di lupini" },
  { code: 14, label: "Molluschi e prodotti a base di molluschi" },
] as const;

export type AllergenCode = (typeof allergenDefinitions)[number]["code"];

export const allergenCodes: readonly AllergenCode[] = allergenDefinitions.map(
  ({ code }) => code,
);

export function isAllergenCode(value: unknown): value is AllergenCode {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 14;
}

export function areUniqueAllergenCodes(
  values: unknown,
): values is readonly AllergenCode[] {
  if (!Array.isArray(values) || !values.every(isAllergenCode)) return false;
  return new Set(values).size === values.length;
}

export function isMenuPrice(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(?:da )?€ [1-9]\d*(?:,\d{2})?(?: l'etto)?$/.test(value)
  );
}
