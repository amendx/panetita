"use client";

import { useState } from "react";
import { Building2, Loader2, Save, Zap, Megaphone, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [saving, setSaving] = useState(false);

  const totalMonthly = rent + energy + marketing + mei;

  async function handleSave() {
    setSaving(true);
    try {
      await saveBusinessSettings({
        monthly_rent: rent,
        monthly_energy: energy,
        monthly_marketing: marketing,
        monthly_mei: mei,
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
          <Building2 className="h-5 w-5 text-primary" /> Custo mensal do negócio
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Quanto custa pra "ter" o negócio rodando todo mês. É esse total que você precisa
          cobrir com o lucro das vendas — ele não entra no preço de cada panelinha.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* GASTOS FIXOS MENSAIS */}
        <div className="grid gap-3 sm:grid-cols-2 bn">
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
        <div className="rounded-md border bg-primary/5 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Custo mensal a cobrir com as vendas
            </span>
            <span className="text-xl font-bold tabular-nums text-primary">
              {formatBRL(totalMonthly)}
            </span>
          </div>
        </div>

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
      <Label className="flex items-center gap-1.5 mb-1">
        {icon}
        {label}
      </Label>
      <CurrencyInput value={value} onChange={onChange} />
    </div>
  );
}
