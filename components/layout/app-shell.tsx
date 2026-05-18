"use client";

import { useEffect, useState } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "panetita-sidebar-open";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Desktop: sidebar visível por padrão (lembrado em localStorage).
  // Mobile: drawer escondido por padrão; mesmo estado controla os dois.
  const [open, setOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved !== null) {
      setOpen(saved === "1");
    } else if (typeof window !== "undefined") {
      // Em telas pequenas, começa fechado
      setOpen(window.matchMedia("(min-width: 768px)").matches);
    }
    setHydrated(true);
  }, []);

  function toggle() {
    setOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Drawer mobile (overlay) */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          hydrated && open ? "" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            hydrated && open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-64 flex-col border-r bg-card transition-transform duration-200",
            hydrated && open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar onNavigate={() => setOpen(false)} />
          <form action="/auth/sign-out" method="post" className="mt-auto border-t p-3">
            <Button type="submit" variant="ghost" className="w-full justify-start gap-3">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </aside>
      </div>

      {/* Sidebar fixa desktop/tablet */}
      <aside
        className={cn(
          "hidden shrink-0 overflow-hidden border-r bg-card transition-[width] duration-200 md:flex md:flex-col",
          hydrated && open ? "md:w-64" : "md:w-0 md:border-r-0"
        )}
      >
        <div className="flex w-64 flex-1 flex-col">
          <Sidebar />
          <form action="/auth/sign-out" method="post" className="mt-auto border-t p-3">
            <Button type="submit" variant="ghost" className="w-full justify-start gap-3">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            title={open ? "Recolher menu" : "Expandir menu"}
          >
            {hydrated && open ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
          <span className="font-semibold">Panetita</span>
          <form action="/auth/sign-out" method="post" className="ml-auto md:hidden">
            <Button type="submit" variant="ghost" size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
