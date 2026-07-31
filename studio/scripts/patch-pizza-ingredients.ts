import { getCliClient } from "sanity/cli";

type MenuDish = {
  _key: string;
  name: string;
  note?: string;
};

type MenuCategory = {
  _key: string;
  dishes?: MenuDish[];
};

type MenuDocument = {
  _id: string;
  categories?: MenuCategory[];
};

const ingredientsByPizzaName = new Map<string, string>([
  ["Margherita", "Polpa di San Marzano, mozzarella fior di latte, basilico e olio EVO."],
  ["Bufala", "Polpa di San Marzano, mozzarella fior di latte, bufala campana, basilico e olio EVO."],
  ["Diversamente diavola", "Polpa di San Marzano, mozzarella fior di latte, ventricina Vastese, ventricina spalmabile Teramana, filamenti di peperoncino piccante, basilico e olio EVO."],
  ["Marinara", "Pomodoro, olio all'aglio, origano, basilico e pomodori confit."],
  ["Capricciosa", "Polpa di San Marzano, mozzarella fior di latte, prosciutto cotto alta qualità, carciofi, funghi champignon freschi e olive nere."],
  ["Nell'orto", "Crema di zucchine, melanzane grigliate, zucchine grigliate, basilico e olio EVO."],
  ["Patate e salsiccia", "Mozzarella fior di latte, salsiccia, patate di Avezzano al forno con la buccia, rosmarino e olio EVO."],
  ["5 formaggi", "Mozzarella fior di latte, gorgonzola piccante, provola di Agerola, crumble di parmigiano, crema di parmigiano e olio EVO."],
  ["Saluti da Parma", "Base focaccia, prosciutto crudo di Parma, pomodoro Pachino IGP, rucola, parmigiano e olio EVO."],
  ["Caprese", "Base focaccia, mozzarella fior di latte, pomodoro cuore di bue, basilico, olio EVO e origano."],
  ["Ombre nere", "Base focaccia, carpaccio di Angus, pesto di pistacchio, stracciata e pepe rosa."],
  ["Highlands", "Base focaccia, salmone affumicato, crema di formaggio infusa al gin, valeriana, pomodorini confit e olio EVO."],
  ["Nerano", "Crema di zucchine, chips di zucchine, crema di parmigiano, mozzarella fior di latte, provola di Agerola e olio alla menta."],
  ["Americana (per bambini)", "Mozzarella fior di latte, wurstel di puro suino e patatine fritte."],
]);

async function main() {
  const client = getCliClient({ apiVersion: "2026-07-31" });
  const menu = await client.getDocument<MenuDocument>("menu-hawaii");

  if (!menu) {
    throw new Error("Il documento menu-hawaii non esiste.");
  }

  const pizzaCategory = menu.categories?.find(
    ({ _key }) => _key === "hawaii-pizza-cena",
  );

  if (!pizzaCategory?.dishes) {
    throw new Error("La categoria hawaii-pizza-cena non esiste.");
  }

  const normalizedDishes = new Map(
    pizzaCategory.dishes.map((dish) => [dish.name.trim().toLocaleLowerCase("it"), dish]),
  );
  const setOperations: Record<string, string> = {};

  for (const [name, ingredients] of ingredientsByPizzaName) {
    const dish = normalizedDishes.get(name.toLocaleLowerCase("it"));

    if (!dish) {
      throw new Error(`Pizza non trovata: ${name}. Nessuna modifica applicata.`);
    }

    setOperations[
      `categories[_key=="hawaii-pizza-cena"].dishes[_key=="${dish._key}"].note`
    ] = ingredients;
  }

  await client.patch(menu._id).set(setOperations).commit({ autoGenerateArrayKeys: false });

  console.log(`Aggiornati gli ingredienti di ${ingredientsByPizzaName.size} pizze.`);
}

void main();
