import { PrismaClient } from "../src/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const DB_PATH = path.join(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: DB_PATH });
const db = new PrismaClient({ adapter } as never);

// ── Category tree ─────────────────────────────────────────────────────────────
// Each entry: [slug, displayName, parentSlug | null]
const CATEGORIES: [string, string, string | null][] = [
  // Root categories
  ["protein",        "Protein",               null],
  ["dairy",          "Dairy",                 null],
  ["produce",        "Produce",               null],
  ["starch",         "Starch",                null],
  ["seasoning",      "Seasoning",             null],
  ["fat",            "Fat & Oil",             null],
  ["liquid",         "Liquid",                null],
  ["pantry",         "Pantry",                null],

  // Protein
  ["protein-beef",       "Protein / Beef",        "protein"],
  ["protein-pork",       "Protein / Pork",         "protein"],
  ["protein-poultry",    "Protein / Poultry",      "protein"],
  ["protein-lamb",       "Protein / Lamb & Game",  "protein"],
  ["protein-fish",       "Protein / Fish",         "protein"],
  ["protein-seafood",    "Protein / Seafood",      "protein"],
  ["protein-egg",        "Protein / Egg",          "protein"],
  ["protein-charcuterie","Protein / Charcuterie",  "protein"],

  // Dairy
  ["dairy-milk-cream",   "Dairy / Milk & Cream",   "dairy"],
  ["dairy-butter",       "Dairy / Butter",          "dairy"],
  ["dairy-cheese",       "Dairy / Cheese",          "dairy"],
  ["dairy-yogurt",       "Dairy / Yogurt & Cultured","dairy"],

  // Produce
  ["produce-allium",     "Produce / Allium",        "produce"],
  ["produce-root",       "Produce / Root Vegetable","produce"],
  ["produce-leafy",      "Produce / Leafy Green",   "produce"],
  ["produce-brassica",   "Produce / Brassica",      "produce"],
  ["produce-nightshade", "Produce / Nightshade",    "produce"],
  ["produce-mushroom",   "Produce / Mushroom",      "produce"],
  ["produce-fruit",      "Produce / Fruit",         "produce"],
  ["produce-citrus",     "Produce / Citrus",        "produce"],

  // Starch
  ["starch-flour",       "Starch / Flour & Grain",  "starch"],
  ["starch-pasta",       "Starch / Pasta & Noodle", "starch"],
  ["starch-rice",        "Starch / Rice",            "starch"],
  ["starch-bread",       "Starch / Bread",           "starch"],
  ["starch-potato",      "Starch / Potato",          "starch"],

  // Seasoning
  ["seasoning-salt",     "Seasoning / Salt",         "seasoning"],
  ["seasoning-herb-fresh","Seasoning / Herb (fresh)","seasoning"],
  ["seasoning-herb-dried","Seasoning / Herb (dried)","seasoning"],
  ["seasoning-spice",    "Seasoning / Spice",        "seasoning"],
  // seasoning-sugar removed — sugars live under pantry-sugar and baking-sugar
  ["seasoning-acid",     "Seasoning / Acid",         "seasoning"],

  // Fat & Oil
  ["fat-animal",         "Fat / Animal Fat",         "fat"],
  ["fat-oil",            "Fat / Plant Oil",          "fat"],

  // Liquid
  ["liquid-stock",       "Liquid / Stock & Broth",   "liquid"],
  ["liquid-wine",        "Liquid / Wine & Alcohol",  "liquid"],
  ["liquid-sauce",       "Liquid / Sauce & Condiment","liquid"],
  ["liquid-water",       "Liquid / Water",           "liquid"],

  // Pantry
  ["pantry-canned",      "Pantry / Canned & Preserved","pantry"],
  ["pantry-nut-seed",    "Pantry / Nut & Seed",      "pantry"],
  ["pantry-dried-fruit", "Pantry / Dried Fruit",     "pantry"],
  ["pantry-gelatin",     "Pantry / Gelatin & Setting","pantry"],
  ["pantry-sugar",       "Pantry / Sugar & Sweetener","pantry"],
  ["pantry-chocolate",   "Pantry / Chocolate & Cocoa","pantry"],

  // Baking
  ["baking",             "Baking",                    null],
  ["baking-leavening",   "Baking / Leavening",        "baking"],
  ["baking-flour",       "Baking / Flour & Starch",   "baking"],
  ["baking-flavouring",  "Baking / Flavouring",       "baking"],
  ["baking-sugar",       "Baking / Sugar",            "baking"],
];

// ── Ingredients ───────────────────────────────────────────────────────────────
// [nameNormalized, displayName, categorySlug, aliases[]]
const INGREDIENTS: [string, string, string, string[]][] = [
  // Protein / Beef
  ["beef tenderloin",   "Beef Tenderloin",   "protein-beef",    ["beef fillet", "filet mignon"]],
  ["ground beef",       "Ground Beef",       "protein-beef",    ["mince", "beef mince", "minced beef"]],
  ["beef short rib",    "Beef Short Rib",    "protein-beef",    ["short ribs"]],
  ["beef brisket",      "Beef Brisket",      "protein-beef",    ["brisket"]],
  ["ribeye steak",      "Ribeye Steak",      "protein-beef",    ["rib eye", "entrecôte"]],
  ["oxtail",            "Oxtail",            "protein-beef",    ["ox tail"]],
  ["beef chuck",        "Beef Chuck",        "protein-beef",    ["chuck roast", "braising beef"]],

  // Protein / Pork
  ["pork belly",        "Pork Belly",        "protein-pork",    ["pork side"]],
  ["pork shoulder",     "Pork Shoulder",     "protein-pork",    ["pork butt", "boston butt"]],
  ["pork tenderloin",   "Pork Tenderloin",   "protein-pork",    ["pork fillet"]],
  ["pork chop",         "Pork Chop",         "protein-pork",    ["pork chops", "pork cutlet"]],
  ["pork loin",         "Pork Loin",         "protein-pork",    ["loin of pork"]],
  ["spare rib",         "Spare Rib",         "protein-pork",    ["spare ribs", "pork ribs"]],
  ["pancetta",          "Pancetta",          "protein-pork",    []],

  // Protein / Poultry
  ["chicken breast",    "Chicken Breast",    "protein-poultry", ["chicken breasts"]],
  ["chicken thigh",     "Chicken Thigh",     "protein-poultry", ["chicken thighs"]],
  ["chicken wing",      "Chicken Wing",      "protein-poultry", ["chicken wings", "wings"]],
  ["whole chicken",     "Whole Chicken",     "protein-poultry", ["roasting chicken"]],
  ["duck breast",       "Duck Breast",       "protein-poultry", ["duck breasts", "magret"]],
  ["duck leg",          "Duck Leg",          "protein-poultry", ["duck legs", "duck confit leg"]],

  // Protein / Lamb
  ["lamb rack",         "Lamb Rack",         "protein-lamb",    ["rack of lamb", "carré d'agneau"]],
  ["lamb shoulder",     "Lamb Shoulder",     "protein-lamb",    []],
  ["lamb shank",        "Lamb Shank",        "protein-lamb",    ["lamb shanks"]],

  // Protein / Fish
  ["salmon fillet",     "Salmon Fillet",     "protein-fish",    ["salmon", "salmon fillets"]],
  ["cod fillet",        "Cod Fillet",        "protein-fish",    ["cod", "cod fillets", "bacalhau"]],
  ["sea bass",          "Sea Bass",          "protein-fish",    ["loup de mer", "branzino"]],
  ["halibut",           "Halibut",           "protein-fish",    []],
  ["tuna",              "Tuna",              "protein-fish",    ["bluefin tuna", "yellowfin tuna"]],
  ["anchovy",           "Anchovy",           "protein-fish",    ["anchovies", "anchovy fillet"]],
  ["sardine",           "Sardine",           "protein-fish",    ["sardines"]],

  // Protein / Seafood
  ["prawn",             "Prawn",             "protein-seafood", ["prawns", "shrimp", "langoustine"]],
  ["scallop",           "Scallop",           "protein-seafood", ["scallops", "saint-jacques"]],
  ["mussel",            "Mussel",            "protein-seafood", ["mussels"]],
  ["clam",              "Clam",              "protein-seafood", ["clams"]],
  ["squid",             "Squid",             "protein-seafood", ["calamari"]],
  ["lobster",           "Lobster",           "protein-seafood", []],
  ["crab",              "Crab",              "protein-seafood", ["crab meat"]],

  // Protein / Egg
  ["egg",               "Egg",               "protein-egg",     ["eggs", "whole egg", "whole eggs"]],
  ["egg yolk",          "Egg Yolk",          "protein-egg",     ["egg yolks", "yolk", "yolks"]],
  ["egg white",         "Egg White",         "protein-egg",     ["egg whites", "white", "whites"]],

  // Protein / Charcuterie
  ["bacon",             "Bacon",             "protein-charcuterie", ["streaky bacon", "rashers"]],
  ["lardons",           "Lardons",           "protein-charcuterie", ["lardon", "bacon lardons"]],
  ["prosciutto",        "Prosciutto",        "protein-charcuterie", ["parma ham", "serrano ham", "jambon cru"]],
  ["salami",            "Salami",            "protein-charcuterie", []],
  ["chorizo",           "Chorizo",           "protein-charcuterie", []],

  // Dairy
  ["double cream",      "Double Cream",      "dairy-milk-cream",["heavy cream", "heavy whipping cream", "whipping cream", "crème fraîche épaisse"]],
  ["single cream",      "Single Cream",      "dairy-milk-cream",["light cream", "pouring cream"]],
  ["crème fraîche",     "Crème Fraîche",     "dairy-milk-cream",["creme fraiche"]],
  ["whole milk",        "Whole Milk",        "dairy-milk-cream",["full-fat milk", "milk"]],
  ["butter",            "Butter",            "dairy-butter",    ["unsalted butter", "salted butter"]],
  ["clarified butter",  "Clarified Butter",  "dairy-butter",    ["ghee", "drawn butter"]],
  ["parmesan",          "Parmesan",          "dairy-cheese",    ["parmigiano reggiano", "grana padano"]],
  ["gruyère",           "Gruyère",           "dairy-cheese",    ["gruyere", "emmental", "comté"]],
  ["mozzarella",        "Mozzarella",        "dairy-cheese",    ["fior di latte", "buffalo mozzarella"]],

  // Produce / Allium
  ["onion",             "Onion",             "produce-allium",  ["onions", "brown onion", "yellow onion", "white onion"]],
  ["red onion",         "Red Onion",         "produce-allium",  ["red onions"]],
  ["shallot",           "Shallot",           "produce-allium",  ["shallots", "échalote"]],
  ["garlic",            "Garlic",            "produce-allium",  ["garlic clove", "garlic cloves"]],
  ["leek",              "Leek",              "produce-allium",  ["leeks"]],
  ["spring onion",      "Spring Onion",      "produce-allium",  ["scallion", "scallions", "green onion", "green onions"]],
  ["chive",             "Chive",             "produce-allium",  ["chives"]],

  // Produce / Root
  ["carrot",            "Carrot",            "produce-root",    ["carrots"]],
  ["celery root",       "Celery Root",       "produce-root",    ["celeriac", "celery root"]],
  ["parsnip",           "Parsnip",           "produce-root",    ["parsnips"]],
  ["turnip",            "Turnip",            "produce-root",    ["turnips", "swede", "rutabaga"]],
  ["beetroot",          "Beetroot",          "produce-root",    ["beet", "beets", "red beet"]],

  // Produce / Leafy
  ["spinach",           "Spinach",           "produce-leafy",   []],
  ["chard",             "Chard",             "produce-leafy",   ["swiss chard", "rainbow chard"]],
  ["kale",              "Kale",              "produce-leafy",   []],
  ["rocket",            "Rocket",            "produce-leafy",   ["arugula"]],

  // Produce / Nightshade
  ["tomato",            "Tomato",            "produce-nightshade",["tomatoes", "roma tomato"]],
  ["cherry tomato",     "Cherry Tomato",     "produce-nightshade",["cherry tomatoes"]],
  ["red pepper",        "Red Pepper",        "produce-nightshade",["red bell pepper", "poivron rouge"]],

  // Produce / Mushroom
  ["button mushroom",   "Button Mushroom",   "produce-mushroom",["white mushroom", "champignon"]],
  ["porcini",           "Porcini",           "produce-mushroom",["cep", "cèpe"]],
  ["chanterelle",       "Chanterelle",       "produce-mushroom",["pfifferling", "girolles"]],

  // Starch
  ["plain flour",       "Plain Flour",       "starch-flour",    ["all-purpose flour", "flour"]],
  ["bread flour",       "Bread Flour",       "starch-flour",    ["strong flour", "strong bread flour"]],
  ["potato",            "Potato",            "starch-potato",   ["potatoes"]],
  ["arborio rice",      "Arborio Rice",      "starch-rice",     ["risotto rice", "carnaroli"]],
  ["spaghetti",         "Spaghetti",         "starch-pasta",    []],
  ["tagliatelle",       "Tagliatelle",       "starch-pasta",    ["pasta"]],

  // Seasoning / Salt
  ["fleur de sel",      "Fleur de Sel",      "seasoning-salt",  ["finishing salt", "flaky sea salt", "maldon salt"]],
  ["fine sea salt",     "Fine Sea Salt",     "seasoning-salt",  ["sea salt", "salt", "kosher salt", "table salt"]],
  ["black pepper",      "Black Pepper",      "seasoning-spice", ["freshly cracked pepper", "cracked black pepper", "ground black pepper", "pepper"]],
  ["white pepper",      "White Pepper",      "seasoning-spice", []],

  // Seasoning / Herbs
  ["thyme",             "Thyme",             "seasoning-herb-fresh",["fresh thyme", "thyme sprigs"]],
  ["rosemary",          "Rosemary",          "seasoning-herb-fresh",["fresh rosemary"]],
  ["bay leaf",          "Bay Leaf",          "seasoning-herb-fresh",["bay leaves", "bay", "laurel"]],
  ["parsley",           "Parsley",           "seasoning-herb-fresh",["flat-leaf parsley", "curly parsley", "italian parsley"]],
  ["tarragon",          "Tarragon",          "seasoning-herb-fresh",["french tarragon", "estragon"]],
  ["basil",             "Basil",             "seasoning-herb-fresh",["fresh basil", "genovese basil"]],
  ["sage",              "Sage",              "seasoning-herb-fresh",["fresh sage"]],
  ["chervil",           "Chervil",           "seasoning-herb-fresh",["cerfeuil"]],

  // Seasoning / Spice
  ["nutmeg",            "Nutmeg",            "seasoning-spice", ["freshly grated nutmeg"]],
  ["paprika",           "Paprika",           "seasoning-spice", ["sweet paprika", "smoked paprika"]],
  ["cumin",             "Cumin",             "seasoning-spice", ["ground cumin", "cumin seeds"]],
  ["coriander seed",    "Coriander Seed",    "seasoning-spice", ["coriander seeds", "ground coriander"]],
  ["star anise",        "Star Anise",        "seasoning-spice", []],
  ["juniper berry",     "Juniper Berry",     "seasoning-spice", ["juniper berries"]],
  ["saffron",           "Saffron",           "seasoning-spice", []],

  // Pantry / Sugar & Sweetener
  ["caster sugar",      "Caster Sugar",      "pantry-sugar",    ["superfine sugar", "fine sugar"]],
  ["brown sugar",       "Brown Sugar",       "pantry-sugar",    ["demerara", "muscovado", "soft brown sugar"]],
  ["icing sugar",       "Icing Sugar",       "pantry-sugar",    ["powdered sugar", "confectioners sugar", "confectioners' sugar"]],
  ["granulated sugar",  "Granulated Sugar",  "pantry-sugar",    ["white sugar", "sugar"]],
  ["honey",             "Honey",             "pantry-sugar",    []],
  ["maple syrup",       "Maple Syrup",       "pantry-sugar",    []],
  ["golden syrup",      "Golden Syrup",      "pantry-sugar",    ["light corn syrup"]],

  // Pantry / Chocolate & Cocoa
  ["dark chocolate",    "Dark Chocolate",    "pantry-chocolate",["bittersweet chocolate", "70% chocolate", "cooking chocolate"]],
  ["milk chocolate",    "Milk Chocolate",    "pantry-chocolate",[]],
  ["cocoa powder",      "Cocoa Powder",      "pantry-chocolate",["unsweetened cocoa", "dutch-process cocoa", "cacao powder"]],
  ["white chocolate",   "White Chocolate",   "pantry-chocolate",[]],

  // Baking / Leavening
  ["baking powder",     "Baking Powder",     "baking-leavening",[]],
  ["baking soda",       "Baking Soda",       "baking-leavening",["bicarbonate of soda", "bicarb", "bicarb soda"]],
  ["cream of tartar",   "Cream of Tartar",   "baking-leavening",["potassium bitartrate", "tartaric acid"]],
  ["instant yeast",     "Instant Yeast",     "baking-leavening",["fast-action yeast", "quick yeast", "bread machine yeast"]],
  ["active dry yeast",  "Active Dry Yeast",  "baking-leavening",["dried yeast"]],
  ["fresh yeast",       "Fresh Yeast",       "baking-leavening",["compressed yeast", "cake yeast"]],

  // Baking / Flour & Starch
  ["cake flour",        "Cake Flour",        "baking-flour",    ["soft flour"]],
  ["whole wheat flour", "Whole Wheat Flour", "baking-flour",    ["wholemeal flour", "whole meal flour"]],
  ["rye flour",         "Rye Flour",         "baking-flour",    []],
  ["cornstarch",        "Cornstarch",        "baking-flour",    ["cornflour", "corn starch"]],
  ["almond flour",      "Almond Flour",      "baking-flour",    ["ground almonds", "almond meal"]],
  ["semolina",          "Semolina",          "baking-flour",    ["fine semolina", "coarse semolina"]],

  // Baking / Flavouring
  ["vanilla extract",   "Vanilla Extract",   "baking-flavouring",["vanilla", "pure vanilla extract"]],
  ["vanilla pod",       "Vanilla Pod",       "baking-flavouring",["vanilla bean", "vanilla beans", "vanilla pods"]],
  ["lemon zest",        "Lemon Zest",        "baking-flavouring",["zest of lemon"]],
  ["orange zest",       "Orange Zest",       "baking-flavouring",["zest of orange"]],
  ["almond extract",    "Almond Extract",    "baking-flavouring",[]],
  ["cinnamon",          "Cinnamon",          "baking-flavouring",["ground cinnamon", "cinnamon stick", "cassia"]],
  ["cardamom",          "Cardamom",          "baking-flavouring",["ground cardamom", "cardamom pod", "green cardamom"]],

  // Baking / Sugar
  ["demerara sugar",    "Demerara Sugar",    "baking-sugar",    ["raw sugar", "turbinado sugar"]],
  ["cane sugar",        "Cane Sugar",        "baking-sugar",    ["raw cane sugar"]],

  // Seasoning / Acid
  ["lemon juice",       "Lemon Juice",       "seasoning-acid",  ["juice of lemon"]],
  ["red wine vinegar",  "Red Wine Vinegar",  "seasoning-acid",  []],
  ["sherry vinegar",    "Sherry Vinegar",    "seasoning-acid",  []],
  ["dijon mustard",     "Dijon Mustard",     "seasoning-acid",  ["mustard"]],

  // Fat
  ["olive oil",         "Olive Oil",         "fat-oil",         ["extra virgin olive oil", "evoo"]],
  ["vegetable oil",     "Vegetable Oil",     "fat-oil",         ["neutral oil", "sunflower oil", "canola oil"]],
  ["duck fat",          "Duck Fat",          "fat-animal",      ["rendered duck fat"]],
  ["lard",              "Lard",              "fat-animal",      ["rendered pork fat", "saindoux"]],

  // Liquid / Stock
  ["brown stock",       "Brown Stock",       "liquid-stock",    ["fond brun", "veal stock", "beef stock", "fond de veau"]],
  ["white stock",       "White Stock",       "liquid-stock",    ["chicken stock", "fond blanc", "fond de volaille"]],
  ["fish stock",        "Fish Stock",        "liquid-stock",    ["fumet de poisson", "fumet", "court-bouillon"]],
  ["vegetable stock",   "Vegetable Stock",   "liquid-stock",    ["veg stock", "vegetable broth"]],

  // Liquid / Wine
  ["dry white wine",    "Dry White Wine",    "liquid-wine",     ["white wine"]],
  ["dry red wine",      "Dry Red Wine",      "liquid-wine",     ["red wine", "vin rouge"]],
  ["cognac",            "Cognac",            "liquid-wine",     ["brandy", "armagnac"]],
  ["port",              "Port",              "liquid-wine",     ["port wine", "ruby port", "tawny port"]],

  // Liquid / Sauce
  ["worcestershire sauce","Worcestershire Sauce","liquid-sauce", ["worcestershire", "lea & perrins"]],
  ["soy sauce",         "Soy Sauce",         "liquid-sauce",    ["dark soy", "light soy", "tamari"]],
  ["tomato paste",      "Tomato Paste",      "liquid-sauce",    ["tomato puree", "double concentrate"]],

  // Pantry
  ["gelatin leaf",      "Gelatin Leaf",      "pantry-gelatin",  ["gelatine leaf", "gelatin sheet", "gelatine sheets"]],
  ["pearl onion",       "Pearl Onion",       "produce-allium",  ["pickling onion", "baby onion"]],
  ["capers",            "Capers",            "pantry-canned",   ["caper", "nonpareil capers"]],
  ["pitted olive",      "Pitted Olive",      "pantry-canned",   ["olives", "kalamata olive", "black olive", "green olive"]],
  ["walnut",            "Walnut",            "pantry-nut-seed", ["walnuts"]],
  ["almond",            "Almond",            "pantry-nut-seed", ["almonds", "blanched almond"]],
  ["pine nut",          "Pine Nut",          "pantry-nut-seed", ["pine nuts", "pignoli"]],
];

async function main() {
  console.log("Seeding ingredient categories...");

  // Build category ID map as we insert
  const categoryIdMap = new Map<string, string>();

  // Insert in two passes: roots first, then children
  for (const [slug, name, parentSlug] of CATEGORIES) {
    if (parentSlug !== null) continue;
    const cat = await db.ingredientCategory.upsert({
      where: { slug },
      update: { name },
      create: { name, slug, parentId: null },
    });
    categoryIdMap.set(slug, cat.id);
  }

  for (const [slug, name, parentSlug] of CATEGORIES) {
    if (parentSlug === null) continue;
    const parentId = categoryIdMap.get(parentSlug);
    if (!parentId) throw new Error(`Parent slug not found: ${parentSlug}`);
    const cat = await db.ingredientCategory.upsert({
      where: { slug },
      update: { name, parentId },
      create: { name, slug, parentId },
    });
    categoryIdMap.set(slug, cat.id);
  }

  console.log(`  ${categoryIdMap.size} categories seeded.`);

  console.log("Seeding ingredients...");
  let count = 0;

  for (const [nameNormalized, displayName, categorySlug, aliases] of INGREDIENTS) {
    const categoryId = categoryIdMap.get(categorySlug);
    if (!categoryId) {
      console.warn(`  Missing category ${categorySlug} for ${nameNormalized} — skipping`);
      continue;
    }
    await db.ingredient.upsert({
      where: { nameNormalized },
      update: { displayName, categoryId, aliases: JSON.stringify(aliases) },
      create: {
        nameNormalized,
        displayName,
        categoryId,
        aliases: JSON.stringify(aliases),
        addedBy: null,
      },
    });
    count++;
  }

  console.log(`  ${count} ingredients seeded.`);
  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
