import { RouteItem } from "@/types/route-item";
import { BanknoteArrowUp, ChartPie, House, Info, LifeBuoy, ReceiptText, Settings } from "lucide-react";

export const MAIN_ROUTE_ITEMS: RouteItem[] = [
  {
    id: 1,
    name: "Dashboard",
    icon: House,
    path: "/",
  },
  {
    id: 2,
    name: "Incomes",
    icon: BanknoteArrowUp,
    path: "/dashboard/incomes",
  },
  {
    id: 3,
    name: "Expenses",
    icon: ReceiptText,
    path: "/dashboard/expenses",
  },
  {
    id: 4,
    name: "Budgets",
    icon: ChartPie,
    path: "/dashboard/budgets",
  },
];

export const MANAGEMENT_ROUTE_ITEMS: RouteItem[] = [
  {
    id: 1,
    name: "Help",
    icon: Info,
    path: "/help",
  },
  {
    id: 2,
    name: "Support",
    icon: LifeBuoy,
    path: "/help",
  },
  {
    id: 3,
    name: "Settings",
    icon: Settings,
    path: "/settings",
  },
];