export type ExpenseCategory =
  | "FOOD_BEVERAGE"
  | "TRAVEL"
  | "ACCOMMODATION"
  | "OFFICE_SUPPLIES"
  | "UTILITIES"
  | "MARKETING"
  | "PROFESSIONAL_SERVICES"
  | "EQUIPMENT"
  | "RENT"
  | "SALARY"
  | "TAX"
  | "INSURANCE"
  | "MAINTENANCE"
  | "ENTERTAINMENT"
  | "OTHER";

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FOOD_BEVERAGE: "Food & Beverage",
  TRAVEL: "Travel",
  ACCOMMODATION: "Accommodation",
  OFFICE_SUPPLIES: "Office Supplies",
  UTILITIES: "Utilities",
  MARKETING: "Marketing",
  PROFESSIONAL_SERVICES: "Professional Services",
  EQUIPMENT: "Equipment",
  RENT: "Rent",
  SALARY: "Salary",
  TAX: "Tax & Fees",
  INSURANCE: "Insurance",
  MAINTENANCE: "Maintenance",
  ENTERTAINMENT: "Entertainment",
  OTHER: "Other",
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  FOOD_BEVERAGE: "bg-orange-100 text-orange-700",
  TRAVEL: "bg-blue-100 text-blue-700",
  ACCOMMODATION: "bg-purple-100 text-purple-700",
  OFFICE_SUPPLIES: "bg-slate-100 text-slate-700",
  UTILITIES: "bg-yellow-100 text-yellow-700",
  MARKETING: "bg-pink-100 text-pink-700",
  PROFESSIONAL_SERVICES: "bg-teal-100 text-teal-700",
  EQUIPMENT: "bg-cyan-100 text-cyan-700",
  RENT: "bg-red-100 text-red-700",
  SALARY: "bg-green-100 text-green-700",
  TAX: "bg-zinc-100 text-zinc-600",
  INSURANCE: "bg-indigo-100 text-indigo-700",
  MAINTENANCE: "bg-amber-100 text-amber-700",
  ENTERTAINMENT: "bg-rose-100 text-rose-700",
  OTHER: "bg-gray-100 text-gray-600",
};

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  FOOD_BEVERAGE: "🍽️",
  TRAVEL: "✈️",
  ACCOMMODATION: "🏨",
  OFFICE_SUPPLIES: "📦",
  UTILITIES: "⚡",
  MARKETING: "📢",
  PROFESSIONAL_SERVICES: "💼",
  EQUIPMENT: "🖥️",
  RENT: "🏢",
  SALARY: "💵",
  TAX: "🏛️",
  INSURANCE: "🛡️",
  MAINTENANCE: "🔧",
  ENTERTAINMENT: "🎭",
  OTHER: "📋",
};

export function autoCategory(vendorName: string): ExpenseCategory {
  const n = vendorName.toLowerCase();
  if (/restaurant|cafe|food|swiggy|zomato|mcdonalds|kfc|pizza|biryani|dhaba|dominos|barbeque|starbucks/.test(n)) return "FOOD_BEVERAGE";
  if (/airline|indigo|spicejet|vistara|airindia|flight|train|bus|ola|uber|irctc|redbus|rapido|metro/.test(n)) return "TRAVEL";
  if (/hotel|oyo|makemytrip|airbnb|lodge|resort|inn|stays/.test(n)) return "ACCOMMODATION";
  if (/stationery|office depot|paper|pen|printer|xerox|staples|amazon|flipkart/.test(n)) return "OFFICE_SUPPLIES";
  if (/electricity|bescom|tata power|water|internet|bsnl|airtel|jio|vodafone|vi|gas|igl|mahanagar/.test(n)) return "UTILITIES";
  if (/marketing|ads|google ads|facebook|meta|print|banner|design|canvas|hoarding/.test(n)) return "MARKETING";
  if (/ca |chartered|legal|lawyer|consultant|advisory|audit|legalwiz|cleartax/.test(n)) return "PROFESSIONAL_SERVICES";
  if (/laptop|computer|mobile|reliance digital|croma|vijay sales|lenovo|dell|apple|hp|samsung/.test(n)) return "EQUIPMENT";
  if (/rent|lease|property|landlord/.test(n)) return "RENT";
  if (/salary|payroll|wages/.test(n)) return "SALARY";
  if (/gst|income tax|tds|mca|challan|tax payment/.test(n)) return "TAX";
  if (/insurance|lic|bajaj allianz|hdfc ergo|term|health policy/.test(n)) return "INSURANCE";
  if (/repair|maintenance|service center|plumber|electrician|pest/.test(n)) return "MAINTENANCE";
  if (/multiplex|pvr|inox|bookmyshow|concert|event|netflix|prime/.test(n)) return "ENTERTAINMENT";
  return "OTHER";
}

export function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}
