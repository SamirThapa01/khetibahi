// ─────────────────────────────────────────────
//  KhetiBahi – Constants
//  One place to manage labels, colours, and
//  options so they're easy to update later.
// ─────────────────────────────────────────────

import { ExpenseCategory, CropType } from "@/app/types";

/** Category metadata: label, emoji, tailwind colour classes */
export const CATEGORIES: {
  value: ExpenseCategory;
  label: string;
  emoji: string;
  bg: string;
  text: string;
  chart: string;        // hex for recharts
}[] = [
  { value: "Pesticide",     label: "Pesticide",     emoji: "🧪", bg: "bg-red-100",    text: "text-red-700",    chart: "#ef4444" },
  { value: "Fertilizer",    label: "Fertilizer",    emoji: "🌿", bg: "bg-green-100",  text: "text-green-700",  chart: "#22c55e" },
  { value: "Seeds",         label: "Seeds",         emoji: "🌱", bg: "bg-lime-100",   text: "text-lime-700",   chart: "#84cc16" },
  { value: "Labor",         label: "Labor",         emoji: "👷", bg: "bg-amber-100",  text: "text-amber-700",  chart: "#f59e0b" },
  { value: "Transport",     label: "Transport",     emoji: "🚛", bg: "bg-blue-100",   text: "text-blue-700",   chart: "#3b82f6" },
  { value: "Irrigation",    label: "Irrigation",    emoji: "💧", bg: "bg-cyan-100",   text: "text-cyan-700",   chart: "#06b6d4" },
  { value: "Equipment",     label: "Equipment",     emoji: "⚙️", bg: "bg-purple-100", text: "text-purple-700", chart: "#a855f7" },
  { value: "Miscellaneous", label: "Miscellaneous", emoji: "📦", bg: "bg-gray-100",   text: "text-gray-700",   chart: "#6b7280" },
];

export const CROPS: { value: CropType | "All Crops"; label: string; emoji: string }[] = [
  { value: "All Crops",  label: "All Crops",  emoji: "🌾" },
  { value: "Tomato",     label: "Tomato",     emoji: "🍅" },
  { value: "Potato",     label: "Potato",     emoji: "🥔" },
  { value: "Cauliflower",label: "Cauliflower",emoji: "🥦" },
  { value: "Onion",      label: "Onion",      emoji: "🧅" },
  { value: "Cabbage",    label: "Cabbage",    emoji: "🥬" },
  { value: "Spinach",    label: "Spinach",    emoji: "🌿" },
  { value: "Coriander",   label: "Coriander",   emoji: "🌱" },
  { value: "French Bean", label: "French Bean", emoji: "🫛" },
  { value: "Khursani",    label: "Khursani",    emoji: "🌶️" },
  { value: "Kakro",       label: "Kakro",       emoji: "🥒" },
  { value: "Farshi",      label: "Farshi",      emoji: "🎃" },
  { value: "Other",      label: "Other",      emoji: "🌱" },
];
