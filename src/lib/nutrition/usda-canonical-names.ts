// USDA identity names for matching and sort order; displayed labels use the viewer translator.
export const USDA_CANONICAL_NAMES: Readonly<Record<number,string>> = {
  "1051": "Water",
  "1057": "Caffeine",
  "1087": "Calcium",
  "1089": "Iron",
  "1090": "Magnesium",
  "1091": "Phosphorus",
  "1092": "Potassium",
  "1095": "Zinc",
  "1098": "Copper",
  "1101": "Manganese",
  "1103": "Selenium",
  "1104": "Vitamin A (IU)",
  "1105": "Retinol",
  "1106": "Vitamin A",
  "1109": "Vitamin E",
  "1110": "Vitamin D (IU)",
  "1114": "Vitamin D",
  "1162": "Vitamin C",
  "1165": "Thiamin (B1)",
  "1166": "Riboflavin (B2)",
  "1167": "Niacin (B3)",
  "1175": "Vitamin B6",
  "1177": "Folate",
  "1178": "Vitamin B12",
  "1180": "Choline",
  "1185": "Vitamin K",
  "1186": "Folic acid",
  "1190": "Folate (DFE)",
  "1253": "Cholesterol",
  "1258": "Saturated fat",
  "1292": "Monounsaturated fat",
  "1293": "Polyunsaturated fat"
};

// Canonical macro aliases also identify old USDA rows without an id.
export const USDA_MACRO_NAMES = ["Calories", "Protein", "Carbs", "Fat", "Fibre", "Sugar", "Sodium"] as const;
