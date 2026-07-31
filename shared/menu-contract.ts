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

export const menuCategoryKeys = {
  "menu-hawaii": {
    antipasti: "hawaii-antipasti",
    primi: "hawaii-primi",
    secondiGriglia: "hawaii-secondi-griglia",
    contorni: "hawaii-contorni",
    pizzaCena: "hawaii-pizza-cena",
    dessert: "hawaii-dessert",
    cantina: "hawaii-cantina",
  },
  "menu-muulab": {
    perCominciare: "muulab-per-cominciare",
    crudiCarne: "muulab-crudi-carne",
    secondiBrace: "muulab-secondi-brace",
    tagliBrace: "muulab-tagli-brace",
    contorni: "muulab-contorni",
    dolci: "muulab-dolci",
    cocktailAperitivo: "muulab-cocktail-aperitivo",
    cantinaCoravin: "muulab-cantina-coravin",
  },
} as const;

export type MenuDocumentId = keyof typeof menuCategoryKeys;

export function isAllergenCode(value: unknown): value is AllergenCode {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 14;
}

export function areUniqueAllergenCodes(
  values: unknown,
): values is readonly AllergenCode[] {
  if (!Array.isArray(values)) return false;

  const seen = new Set<AllergenCode>();
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(values, index)) return false;

    const value = values[index];
    if (!isAllergenCode(value) || seen.has(value)) return false;
    seen.add(value);
  }

  return true;
}

const menuPricePatterns = [
  /^€ [1-9]\d*(?:,\d{2})?$/,
  /^da € [1-9]\d*(?:,\d{2})?$/,
  /^€ [1-9]\d*(?:,\d{2})? l'etto$/,
] as const;

export function isMenuPrice(value: unknown): value is string {
  return (
    typeof value === "string" &&
    menuPricePatterns.some((pattern) => pattern.test(value))
  );
}
