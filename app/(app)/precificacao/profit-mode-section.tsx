"use client";

import { useState, useTransition } from "react";
import { Check, Info, Percent, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { priceFromCostPct } from "@/lib/pricing";
import type { ProfitCalcMode } from "@/types/database";
import { setProfitCalcMode } from "./actions";

const EXAMPLE_COST = 10;
const EXAMPLE_PCT = 50;

export function ProfitModeSection({ initialMode }: { initialMode: ProfitCalcMode }) {
  const { toast } = useToast();
  const [mode, setMode] = useState<ProfitCalcMode>(initialMode);
  const [isPending, startTransition] = useTransition();

  function change(next: ProfitCalcMode) {
    if (next === mode || isPending) return;
    const prev = mode;
    setMode(next);
    startTransition(async () => {
      try {
        await setProfitCalcMode(next);
        toast({
          title: "Modo de cálculo atualizado",
          description:
            next === "markup"
              ? "Agora a % é aplicada sobre o custo (markup)."
              : "Agora a % é aplicada sobre o preço final (margem).",
        });
      } catch (e) {
        setMode(prev);
        toast({
          title: "Não consegui salvar",
          description: e instanceof Error ? e.message : String(e),
          variant: "destructive",
        });
      }
    });
  }

  const exampleMarkup = priceFromCostPct(EXAMPLE_COST, EXAMPLE_PCT, "markup");
  const exampleMargin = priceFromCostPct(EXAMPLE_COST, EXAMPLE_PCT, "margin");

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Info className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Como você quer calcular o lucro?</h3>
            <p className="text-sm text-muted-foreground">
              Escolha entre <strong>markup</strong> (porcentagem sobre o custo) ou{" "}
              <strong>margem</strong> (porcentagem sobre o preço final). Isso muda
              os campos de "% desejada" em receitas e pedidos.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ModeCard
            title="Markup"
            subtitle="% sobre o custo"
            formula="preço = custo × (1 + %)"
            explanation="Pense em quanto você soma em cima do custo. É mais intuitivo no dia a dia: “custou R$ 10, quero ganhar 50% em cima → cobrar R$ 15”."
            exampleResult={exampleMarkup}
            icon={<TrendingUp className="h-4 w-4" />}
            selected={mode === "markup"}
            disabled={isPending}
            onSelect={() => change("markup")}
          />
          <ModeCard
            title="Margem"
            subtitle="% sobre o preço de venda"
            formula="preço = custo ÷ (1 − %)"
            explanation="Padrão contábil. Mede quanto do faturamento é lucro: “metade do que eu cobro é lucro → preço dobra o custo”."
            exampleResult={exampleMargin}
            icon={<Percent className="h-4 w-4" />}
            selected={mode === "margin"}
            disabled={isPending}
            onSelect={() => change("margin")}
          />
        </div>

        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          <div className="mb-2 font-medium text-foreground">
            Exemplo com custo {formatBRL(EXAMPLE_COST)} e {EXAMPLE_PCT}%
          </div>
          <div className="grid gap-1 sm:grid-cols-2">
            <ExampleRow
              label="Markup 50%"
              price={exampleMarkup}
              profit={exampleMarkup - EXAMPLE_COST}
              active={mode === "markup"}
            />
            <ExampleRow
              label="Margem 50%"
              price={exampleMargin}
              profit={exampleMargin - EXAMPLE_COST}
              active={mode === "margin"}
            />
          </div>
          <p className="mt-3 text-muted-foreground">
            Equivalência: <strong>50% de markup ≈ 33% de margem</strong>. Para
            chegar no mesmo preço da margem 50%, seria preciso 100% de markup.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ModeCard({
  title,
  subtitle,
  formula,
  explanation,
  exampleResult,
  icon,
  selected,
  disabled,
  onSelect,
}: {
  title: string;
  subtitle: string;
  formula: string;
  explanation: string;
  exampleResult: number;
  icon: React.ReactNode;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-muted/30",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-md p-1.5",
              selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            )}
          >
            {icon}
          </span>
          <div>
            <div className="font-semibold leading-tight">{title}</div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          </div>
        </div>
        {selected && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>
      <code className="rounded bg-muted px-2 py-1 font-mono text-xs">{formula}</code>
      <p className="text-xs text-muted-foreground">{explanation}</p>
      <div className="mt-1 flex items-baseline justify-between border-t pt-2">
        <span className="text-xs text-muted-foreground">Custo R$ 10 + 50%</span>
        <span className="text-base font-bold tabular-nums">{formatBRL(exampleResult)}</span>
      </div>
    </button>
  );
}

function ExampleRow({
  label,
  price,
  profit,
  active,
}: {
  label: string;
  price: number;
  profit: number;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between rounded px-2 py-1",
        active && "bg-primary/10"
      )}
    >
      <span className={cn("text-muted-foreground", active && "font-medium text-foreground")}>
        {label}
      </span>
      <span className="tabular-nums">
        {formatBRL(price)}{" "}
        <span className="text-muted-foreground">(lucro {formatBRL(profit)})</span>
      </span>
    </div>
  );
}
