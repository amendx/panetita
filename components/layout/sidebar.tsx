"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChefHat,
  Heart,
  HelpCircle,
  Home,
  Package,
  PackageOpen,
  PawPrint,
  Receipt,
  ShoppingCart,
  Truck,
  Wallet,
  Calculator,
  BarChart3,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Início", icon: Home },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/pedidos", label: "Pedidos", icon: Receipt },
  { href: "/entregas", label: "Entregas", icon: Truck },
  { href: "/clientes", label: "Clientes", icon: PawPrint },
  { href: "/receitas", label: "Receitas", icon: ChefHat },
  { href: "/combos", label: "Combos", icon: Layers },
  { href: "/ingredientes", label: "Ingredientes", icon: Package },
  { href: "/estoque", label: "Estoque", icon: PackageOpen },
  { href: "/compras", label: "Lista de Compras", icon: ShoppingCart },
  { href: "/pagamentos", label: "Pagamentos", icon: Wallet },
  { href: "/precificacao", label: "Precificação", icon: Calculator },
  { href: "/nutricao", label: "Nutrição", icon: Heart },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/ajuda", label: "Como usar", icon: HelpCircle },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <Link href="/" className="mb-3 flex items-center gap-2 px-2 py-1.5" onClick={onNavigate}>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xl text-primary-foreground">
          🐶
        </span>
        <div className="leading-tight">
          <div className="font-semibold">Panetita</div>
          <div className="text-xs text-muted-foreground">Panelinha da Tita</div>
        </div>
      </Link>

      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
