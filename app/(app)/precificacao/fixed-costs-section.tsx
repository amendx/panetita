"use client";

import { useState } from "react";
import { Building2, Loader2, Save, Zap, Megaphone, Receipt, PiggyBank, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL } from "@/lib/format";
import { saveBusinessSettings } from "./actions";
import type { BusinessSettings } from "@/types/database";

export function FixedCostsSection({ initial }: { initial: BusinessSettings }) {
  const { toast } = useToast();
  const [rent, setRent] = useState(initial.monthly_rent);
  const [energy, setEnergy] = useState(initial.monthly_energy);
  const [marketing, setMarketing] = useState(initial.monthly_marketing);
  const [mei, setMei] = useState(initial.monthly_mei);
  const [reserve, setReserve] = useState(String(initial.reserve_pct));
  const [units, setUnits] = useState(String(initial.estimated_units_per_month));
  const [saving, setSaving] = useState(false);

  const totalMonthly = rent + energy + marketing + mei;
  const unitsNum = Math.max(0, parseInt(units, 10) || 0);
  const reservePct = parseFloat(reserve.replace(",", ".")) || 0;
  const fixedPerUnit = unitsNum > 0 ? totalMonthly / unitsNum : 0;

  async function handleSave() {
    setSaving(true);
    try {
      await saveBusinessSettings({
        monthly_rent: rent,
        monthly_energy: energy,
        monthly_marketing: marketing,
        monthly_mei: mei,
        reserve_pct: reservePct,
        estimated_units_per_month: unitsNum,
      });
      toast({ title: "Custos do negócio salvos" });
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-primary" /> Custos do negócio
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Quanto custa pra "ter" o negócio rodando todo mês. Esses valores são diluídos no
          preço de cada panelinha pra garantir que cada venda contribua com o overhead.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* GASTOS FIXOS MENSAIS */}
        <div className="grid gap-3 sm:grid-cols-2">
          <CostField
            icon={<Building2 className="h-4 w-4" />}
            label="Aluguel"
            value={rent}
            onChange={setRent}
          />
          <CostField
            icon={<Zap className="h-4 w-4" />}
            label="Energia"
            value={energy}
            onChange={setEnergy}
          />
          <CostField
            icon={<Megaphone className="h-4 w-4" />}
            label="Marketing (Instagram)"
            value={marketing}
            onChange={setMarketing}
          />
          <CostField
            icon={<Receipt className="h-4 w-4" />}
            label="MEI"
            value={mei}
            onChange={setMei}
          />
        </div>

        {/* TOTAL MENSAL */}
        <div className="rounded-md border bg-primary/5 px-3 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total fixo mensal</span>
            <span className="text-lg font-bold tabular-nums text-primary">
              {formatBRL(totalMonthly)}
            </span>
          </div>
        </div>

        {/* PRODUÇÃO ESTIMADA + RESERVA */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              Panelinhas vendidas por mês (estimativa)
            </Label>
            <Input
              inputMode="numeric"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="Ex: 200"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Usado para diluir o custo fixo em cada panelinha.
            </p>
          </div>
          <div>
            <Label className="flex items-center gap-1.5">
              <PiggyBank className="h-4 w-4" />
              Reserva para equipamentos (% do lucro)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                inputMode="decimal"
                value={reserve}
                onChange={(e) => setReserve(e.target.value)}
                placeholder="3"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Fundo automático pra manutenção/reposição.
            </p>
          </div>
        </div>

        {/* RESUMO DE DILUIÇÃO */}
        {totalMonthly > 0 && (
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Custo fixo por panelinha
              </div>
              <div className="mt-0.5 text-xl font-bold tabular-nums">
                {unitsNum > 0 ? formatBRL(fixedPerUnit) : "—"}
              </div>
              {unitsNum > 0 && (
                <div className="text-[11px] text-muted-foreground">
                  {formatBRL(totalMonthly)} ÷ {unitsNum} unidades
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              💡 Para cobrir o overhead, cada panelinha precisa contribuir com pelo menos{" "}
              <strong>{unitsNum > 0 ? formatBRL(fixedPerUnit) : "?"}</strong> além do custo
              dos ingredientes.
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Salvando..." : "Salvar custos"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CostField({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      <CurrencyInput value={value} onChange={onChange} />
    </div>
  );
}
