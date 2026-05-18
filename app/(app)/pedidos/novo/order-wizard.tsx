"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, addMonths } from "date-fns";
import { Loader2, Plus, Trash2, Receipt, Wallet, TrendingUp, Percent, Truck, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL, recurrenceLabel, toISODate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  comboCost,
  comboCalculatedPrice,
  recipeSizeCost,
  resolveUnitPrice,
} from "@/lib/pricing";
import { createOrder, type NewOrderInput } from "../actions";
import type {
  DeliveryType,
  MeasureType,
  MeasureUnit,
  PaymentMethod,
  PricingStrategy,
  Recurrence,
} from "@/types/database";

interface CustomerOption {
  id: string;
  name: string;
  addresses: Array<{ id: string; label: string | null; street: string; number: string | null; is_default: boolean }>;
}

interface IngredientLine {
  id: string;
  quantity: number;
  unit: string;
  ingredient_id: string;
  ingredients: { id: string; name: string; unit: string; price_per_unit: number };
}

interface SizeOption {
  id: string;
  size_label: string;
  fixed_price: number | null;
  recipe_id: string;
  recipes: { name: string };
  recipe_size_ingredients: IngredientLine[];
}

interface ComboOption {
  id: string;
  name: string;
  fixed_price: number | null;
  discount_pct: number | null;
  combo_items: Array<{
    id: string;
    quantity: number;
    recipe_size_id: string;
    recipe_sizes: SizeOption;
  }>;
}

export interface OrderWizardData {
  customers: CustomerOption[];
  sizes: SizeOption[];
  combos: ComboOption[];
  initialCustomerId: string | null;
}

// 1 receita = 1 dia. Default de unidades por recorrência:
const RECURRENCE_UNITS: Record<Recurrence, number> = {
  single: 1,
  weekly: 7,
  biweekly: 15,
  monthly: 28,
  custom: 0,
};

const RECURRENCE_DELIVERIES: Record<Recurrence, number> = {
  single: 1,
  weekly: 1,
  biweekly: 1,
  monthly: 1,
  custom: 1,
};

function sizeAsRecipe(s: SizeOption) {
  return {
    id: s.id,
    user_id: "",
    recipe_id: s.recipe_id,
    size_label: s.size_label,
    fixed_price: s.fixed_price != null ? Number(s.fixed_price) : null,
    notes: null,
    ingredients: s.recipe_size_ingredients.map((r) => ({
      id: r.id,
      user_id: "",
      recipe_size_id: s.id,
      ingredient_id: r.ingredient_id,
      quantity: Number(r.quantity),
      unit: r.unit as never,
      ingredient: {
        id: r.ingredients.id,
        user_id: "",
        name: r.ingredients.name,
        unit: r.ingredients.unit as never,
        price_per_unit: Number(r.ingredients.price_per_unit),
        stock_quantity: 0,
        notes: null,
        created_at: "",
      },
    })),
  };
}

function comboAsCombo(c: ComboOption) {
  return {
    id: c.id,
    user_id: "",
    name: c.name,
    description: null,
    fixed_price: c.fixed_price != null ? Number(c.fixed_price) : null,
    discount_pct: Number(c.discount_pct ?? 0),
    created_at: "",
    items: c.combo_items.map((it) => ({
      id: it.id,
      user_id: "",
      combo_id: c.id,
      recipe_size_id: it.recipe_size_id,
      quantity: Number(it.quantity),
      recipe_size: sizeAsRecipe(it.recipe_sizes),
    })),
  };
}

interface DraftItem {
  key: string;
  kind: "size" | "combo";
  refId: string;
  quantity: number;
  measure_type: MeasureType;
  measure_unit: MeasureUnit;
  unit_cost: number;
  unit_price: number;
  basePrice: number | null;
}

interface DraftDelivery {
  key: string;
  date: string;
  time: string;
  delivery_type: DeliveryType;
  itemQuantities: Record<string, number>;
}

interface DraftPayment {
  key: string;
  amount: string;
  method: PaymentMethod;
  due_date: string;
  status: "pending" | "paid";
}

export function OrderWizard({ data }: { data: OrderWizardData }) {
  const { toast } = useToast();
  const [customerId, setCustomerId] = useState(data.initialCustomerId ?? "");
  const [addressId, setAddressId] = useState("");
  const [strategy, setStrategy] = useState<PricingStrategy>("fixed_editable");
  const [marginPct, setMarginPct] = useState("50");
  const [recurrence, setRecurrence] = useState<Recurrence>("single");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [deliveries, setDeliveries] = useState<DraftDelivery[]>([
    { key: cryptoId(), date: toISODate(new Date()), time: "", delivery_type: "uber_99", itemQuantities: {} },
  ]);
  const [payments, setPayments] = useState<DraftPayment[]>([
    { key: cryptoId(), amount: "", method: "pix", due_date: "", status: "pending" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const customer = data.customers.find((c) => c.id === customerId) ?? null;
  const customerAddresses = customer?.addresses ?? [];

  // Auto-pick default address when switching customer
  useMemo(() => {
    if (customer && !addressId) {
      const def = customer.addresses.find((a) => a.is_default) ?? customer.addresses[0];
      if (def) setAddressId(def.id);
    }
  }, [customerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalcula preços dos itens quando a estratégia ou margem muda
  useEffect(() => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        unit_price: resolveUnitPrice({
          strategy,
          basePrice: it.basePrice,
          unitCost: it.unit_cost,
          marginPct: parseFloat(marginPct) || 0,
        }),
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy, marginPct]);

  const totalPrice = items.reduce((a, i) => a + i.unit_price * i.quantity, 0);
  const totalCost = items.reduce((a, i) => a + i.unit_cost * i.quantity, 0);
  const profit = totalPrice - totalCost;

  function addItem(kind: "size" | "combo", refId: string) {
    if (!refId) return;
    let unitCost = 0;
    let basePrice: number | null = null;
    if (kind === "size") {
      const s = data.sizes.find((x) => x.id === refId);
      if (!s) return;
      unitCost = recipeSizeCost(sizeAsRecipe(s));
      basePrice = s.fixed_price != null ? Number(s.fixed_price) : null;
    } else {
      const c = data.combos.find((x) => x.id === refId);
      if (!c) return;
      const comboObj = comboAsCombo(c);
      unitCost = comboCost(comboObj);
      // Sempre usa o preço calculado (subtotal das receitas com desconto aplicado)
      basePrice = comboCalculatedPrice(comboObj);
    }
    const unitPrice = resolveUnitPrice({
      strategy,
      basePrice,
      unitCost,
      marginPct: parseFloat(marginPct) || 0,
    });
    // Tanto receitas quanto combos seguem a fórmula da recorrência
    // (1 panelinha por dia). 1 se for custom/single sem unidades definidas.
    const defaultQty = Math.max(RECURRENCE_UNITS[recurrence] || 1, 1);
    setItems((prev) => [
      ...prev,
      {
        key: cryptoId(),
        kind,
        refId,
        quantity: defaultQty,
        measure_type: "portion",
        measure_unit: "un",
        unit_cost: unitCost,
        unit_price: unitPrice,
        basePrice,
      },
    ]);
  }

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        const merged = { ...it, ...patch };
        // recompute price if strategy depends on it
        if ("unit_cost" in patch || "basePrice" in patch) {
          merged.unit_price = resolveUnitPrice({
            strategy,
            basePrice: merged.basePrice,
            unitCost: merged.unit_cost,
            marginPct: parseFloat(marginPct) || 0,
          });
        }
        return merged;
      })
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function setRecurrenceSmart(r: Recurrence) {
    setRecurrence(r);
    const base = deliveries[0] ? new Date(deliveries[0].date) : new Date();

    // Atualiza as quantidades de todos os itens (receitas e combos) conforme a nova recorrência.
    const unitsPerOrder = RECURRENCE_UNITS[r];
    if (unitsPerOrder > 0) {
      setItems((prev) => prev.map((it) => ({ ...it, quantity: unitsPerOrder })));
    }

    // Usa o tipo de entrega da entrega já existente (se houver) como default
    const defaultDeliveryType: DeliveryType =
      deliveries[0]?.delivery_type ?? "uber_99";

    // Atualiza o calendário sugerido de entregas.
    if (r === "single") {
      setDeliveries([
        deliveries[0] ?? {
          key: cryptoId(),
          date: toISODate(base),
          time: "",
          delivery_type: defaultDeliveryType,
          itemQuantities: {},
        },
      ]);
    } else if (r === "weekly") {
      setDeliveries([
        {
          key: cryptoId(),
          date: toISODate(base),
          time: "",
          delivery_type: defaultDeliveryType,
          itemQuantities: {},
        },
      ]);
    } else if (r === "biweekly") {
      setDeliveries(
        Array.from({ length: 2 }).map((_, i) => ({
          key: cryptoId(),
          date: toISODate(addDays(base, i * 15)),
          time: "",
          delivery_type: defaultDeliveryType,
          itemQuantities: {},
        }))
      );
    } else if (r === "monthly") {
      setDeliveries([
        {
          key: cryptoId(),
          date: toISODate(addMonths(base, 0)),
          time: "",
          delivery_type: defaultDeliveryType,
          itemQuantities: {},
        },
      ]);
    }
  }

  function addDelivery() {
    const last = deliveries[deliveries.length - 1];
    const baseDate = last ? new Date(last.date) : new Date();
    const defaultType: DeliveryType = last?.delivery_type ?? "uber_99";
    setDeliveries((prev) => [
      ...prev,
      {
        key: cryptoId(),
        date: toISODate(addDays(baseDate, 7)),
        time: "",
        delivery_type: defaultType,
        itemQuantities: {},
      },
    ]);
  }

  function removeDelivery(key: string) {
    setDeliveries((prev) => prev.filter((d) => d.key !== key));
  }

  function distributeEvenly() {
    setDeliveries((prev) =>
      prev.map((d) => {
        const next = { ...d, itemQuantities: { ...d.itemQuantities } };
        items.forEach((it) => {
          next.itemQuantities[it.key] = it.quantity / prev.length;
        });
        return next;
      })
    );
  }

  function addPayment() {
    setPayments((prev) => [
      ...prev,
      { key: cryptoId(), amount: "", method: "pix", due_date: "", status: "pending" },
    ]);
  }

  function removePayment(key: string) {
    setPayments((prev) => prev.filter((p) => p.key !== key));
  }

  async function handleSubmit() {
    if (!customerId) {
      toast({ title: "Selecione um cliente", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Adicione pelo menos um item", variant: "destructive" });
      return;
    }
    if (deliveries.length === 0) {
      toast({ title: "Adicione pelo menos uma entrega", variant: "destructive" });
      return;
    }

    const itemIndexByKey = new Map<string, number>();
    items.forEach((it, idx) => itemIndexByKey.set(it.key, idx));

    const payload: NewOrderInput = {
      customer_id: customerId,
      address_id: addressId || null,
      recurrence,
      pricing_strategy: strategy,
      margin_pct: strategy === "margin" ? parseFloat(marginPct) || 0 : null,
      notes: notes || null,
      items: items.map((i) => ({
        recipe_size_id: i.kind === "size" ? i.refId : null,
        combo_id: i.kind === "combo" ? i.refId : null,
        quantity: i.quantity,
        measure_type: i.measure_type,
        measure_unit: i.measure_unit,
        unit_price: i.unit_price,
        unit_cost: i.unit_cost,
      })),
      deliveries: deliveries.map((d) => ({
        scheduled_date: d.date,
        scheduled_time: d.time || null,
        delivery_type: d.delivery_type,
        items: items.map((it) => ({
          item_index: itemIndexByKey.get(it.key)!,
          // Auto-distribui igualmente se a usuária não setou manualmente
          quantity:
            d.itemQuantities[it.key] != null && d.itemQuantities[it.key] > 0
              ? d.itemQuantities[it.key]
              : it.quantity / deliveries.length,
        })),
      })),
      payments: payments
        .filter((p) => parseFloat(p.amount.replace(",", ".")) > 0)
        .map((p) => ({
          amount: parseFloat(p.amount.replace(",", ".")),
          method: p.method,
          due_date: p.due_date || null,
          paid_at: p.status === "paid" ? new Date().toISOString() : null,
          status: p.status,
        })),
    };

    setSubmitting(true);
    try {
      await createOrder(payload);
    } catch (e) {
      toast({
        title: "Erro ao salvar pedido",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
      setSubmitting(false);
    }
  }

  const totalUnits = items.reduce((a, i) => a + i.quantity, 0);
  const marginPctValue = totalPrice > 0 ? (profit / totalPrice) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* RESUMO DO PEDIDO — visível durante toda a montagem */}
      <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 pb-3 pt-2 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <Card className="border-primary/30">
          <CardContent className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Resumo do pedido
              </span>
              <span className="text-xs text-muted-foreground">
                {recurrenceLabel(recurrence)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <SummaryStat icon={<Receipt className="h-4 w-4" />} label="Total" value={formatBRL(totalPrice)} highlight />
              <SummaryStat icon={<Wallet className="h-4 w-4" />} label="Custo" value={formatBRL(totalCost)} />
              <SummaryStat
                icon={<TrendingUp className="h-4 w-4" />}
                label="Lucro"
                value={formatBRL(profit)}
                tone="success"
              />
              <SummaryStat
                icon={<Percent className="h-4 w-4" />}
                label="Margem"
                value={`${marginPctValue.toFixed(1)}%`}
              />
              <SummaryStat icon={<Truck className="h-4 w-4" />} label="Entregas" value={String(deliveries.length)} />
              <SummaryStat icon={<Package className="h-4 w-4" />} label="Unidades" value={String(totalUnits)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Cliente</Label>
            <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setAddressId(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {data.customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Endereço</Label>
            <Select value={addressId} onValueChange={setAddressId} disabled={!customer}>
              <SelectTrigger>
                <SelectValue placeholder={customer ? "Selecione" : "Selecione um cliente"} />
              </SelectTrigger>
              <SelectContent>
                {customerAddresses.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {(a.label ?? "Endereço") + " · " + a.street + (a.number ? `, ${a.number}` : "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Itens do pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Tipo de assinatura
            </Label>
            <Select
              value={recurrence}
              onValueChange={(v) => setRecurrenceSmart(v as Recurrence)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Único (avulso)</SelectItem>
                <SelectItem value="weekly">Semanal — 7 unidades por receita</SelectItem>
                <SelectItem value="biweekly">Quinzenal — 15 unidades por receita</SelectItem>
                <SelectItem value="monthly">Mensal — 28 unidades por receita</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {RECURRENCE_UNITS[recurrence] > 0 && recurrence !== "single" && (
              <p className="mt-2 text-xs text-muted-foreground">
                💡 Cada item (receita ou combo) adicionado já vai entrar com{" "}
                <strong>{RECURRENCE_UNITS[recurrence]} unidades</strong> (1 panelinha por
                dia × {RECURRENCE_UNITS[recurrence]} dias).
              </p>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <AddPicker
              label="Receita"
              placeholder="Adicionar receita"
              options={data.sizes.map((s) => ({
                value: s.id,
                label: `${s.recipes.name} · ${s.size_label}` + (s.fixed_price != null ? ` (${formatBRL(Number(s.fixed_price))})` : ""),
              }))}
              onPick={(v) => addItem("size", v)}
            />
            <AddPicker
              label="Combo"
              placeholder="Adicionar combo"
              options={data.combos.map((c) => {
                const price = comboCalculatedPrice(comboAsCombo(c));
                const disc = Number(c.discount_pct ?? 0);
                const suffix =
                  price > 0
                    ? ` (${formatBRL(price)}${disc > 0 ? ` · −${disc.toFixed(0)}%` : ""})`
                    : "";
                return { value: c.id, label: c.name + suffix };
              })}
              onPick={(v) => addItem("combo", v)}
            />
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Adicione receitas e/ou combos ao pedido.</p>
          ) : (
            <div className="space-y-2">
              {items.map((it) => {
                const label =
                  it.kind === "size"
                    ? (() => {
                        const s = data.sizes.find((x) => x.id === it.refId);
                        return s ? `${s.recipes.name} · ${s.size_label}` : "—";
                      })()
                    : data.combos.find((x) => x.id === it.refId)?.name ?? "—";
                return (
                  <div key={it.key} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{label}</div>
                        <Badge variant="outline" className="mt-1">
                          {it.kind === "size" ? "Receita" : "Combo"}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(it.key)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-4">
                      <div>
                        <Label className="text-xs">Quantidade</Label>
                        <Input
                          inputMode="decimal"
                          value={it.quantity}
                          onChange={(e) =>
                            updateItem(it.key, {
                              quantity: parseFloat(e.target.value.replace(",", ".")) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Medida</Label>
                        <Select
                          value={it.measure_type}
                          onValueChange={(v) =>
                            updateItem(it.key, {
                              measure_type: v as MeasureType,
                              measure_unit: v === "weight" ? "g" : "un",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portion">Porção (un)</SelectItem>
                            <SelectItem value="weight">Peso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {it.measure_type === "weight" && (
                        <div>
                          <Label className="text-xs">Unidade</Label>
                          <Select
                            value={it.measure_unit}
                            onValueChange={(v) => updateItem(it.key, { measure_unit: v as MeasureUnit })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs">Preço unitário</Label>
                        <Input
                          inputMode="decimal"
                          value={it.unit_price}
                          disabled={strategy === "fixed"}
                          onChange={(e) =>
                            updateItem(it.key, {
                              unit_price: parseFloat(e.target.value.replace(",", ".")) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Custo unitário: {formatBRL(it.unit_cost)} · Total linha:{" "}
                      <span className="font-medium text-foreground">
                        {formatBRL(it.unit_price * it.quantity)}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-semibold">{formatBRL(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Custo estimado</span>
                  <span>{formatBRL(totalCost)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Lucro</span>
                  <span className="font-semibold">{formatBRL(profit)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Entregas</CardTitle>
          <Button size="sm" variant="outline" onClick={distributeEvenly} disabled={items.length === 0}>
            Dividir igualmente
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {deliveries.length === 1
              ? "🚚 Uma única entrega cobrindo todas as unidades do pedido."
              : `🚚 As ${deliveries.length} entregas dividirão as unidades igualmente — você pode ajustar abaixo se quiser.`}
          </div>

          <div className="space-y-3">
            {deliveries.map((d, idx) => {
              const itemsCount = items.length;
              return (
                <div
                  key={d.key}
                  className="overflow-hidden rounded-lg border bg-card shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium">Entrega {idx + 1}</span>
                    </div>
                    {deliveries.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeDelivery(d.key)}
                        title="Remover entrega"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                      <div>
                        <Label className="text-xs">Data da entrega</Label>
                        <Input
                          type="date"
                          value={d.date}
                          onChange={(e) =>
                            setDeliveries((prev) =>
                              prev.map((x) =>
                                x.key === d.key ? { ...x, date: e.target.value } : x
                              )
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Horário</Label>
                        <Input
                          type="time"
                          value={d.time}
                          onChange={(e) =>
                            setDeliveries((prev) =>
                              prev.map((x) =>
                                x.key === d.key ? { ...x, time: e.target.value } : x
                              )
                            )
                          }
                          placeholder="--:--"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Tipo de entrega</Label>
                      <Select
                        value={d.delivery_type}
                        onValueChange={(v) =>
                          setDeliveries((prev) =>
                            prev.map((x) =>
                              x.key === d.key
                                ? { ...x, delivery_type: v as DeliveryType }
                                : x
                            )
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uber_99">
                            Uber/99 — cliente paga
                          </SelectItem>
                          <SelectItem value="pickup">Retirada na loja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {itemsCount > 0 && (
                      <div className="space-y-2 rounded-md border bg-background p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Unidades nesta entrega
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            (vazio = dividir igualmente)
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {items.map((it) => {
                            const label =
                              it.kind === "size"
                                ? (() => {
                                    const s = data.sizes.find((x) => x.id === it.refId);
                                    return s ? `${s.recipes.name} · ${s.size_label}` : "—";
                                  })()
                                : data.combos.find((x) => x.id === it.refId)?.name ?? "—";
                            const autoQty = it.quantity / deliveries.length;
                            const currentValue = d.itemQuantities[it.key];
                            return (
                              <div
                                key={it.key}
                                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40"
                              >
                                <span className="text-sm">{label}</span>
                                <div className="flex items-center gap-2">
                                  <Input
                                    inputMode="decimal"
                                    className="h-8 w-20 text-right tabular-nums"
                                    placeholder={autoQty.toFixed(autoQty % 1 === 0 ? 0 : 1)}
                                    value={currentValue ?? ""}
                                    onChange={(e) =>
                                      setDeliveries((prev) =>
                                        prev.map((x) =>
                                          x.key === d.key
                                            ? {
                                                ...x,
                                                itemQuantities: {
                                                  ...x.itemQuantities,
                                                  [it.key]:
                                                    parseFloat(
                                                      e.target.value.replace(",", ".")
                                                    ) || 0,
                                                },
                                              }
                                            : x
                                        )
                                      )
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">un</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant="outline" size="sm" onClick={addDelivery} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Adicionar entrega
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Pagamentos</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPayments([
                {
                  key: cryptoId(),
                  amount: String(totalPrice.toFixed(2)),
                  method: "pix",
                  due_date: "",
                  status: "pending",
                },
              ]);
            }}
            disabled={items.length === 0}
          >
            Preencher com total
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total a cobrar do cliente
              </span>
              <span className="text-2xl font-bold tabular-nums text-primary">
                {formatBRL(totalPrice)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Lucro previsto</span>
              <span className="font-semibold text-emerald-700">{formatBRL(profit)}</span>
            </div>
            {(() => {
              const paid = payments
                .filter((p) => p.status === "paid")
                .reduce((a, p) => a + (parseFloat(p.amount.replace(",", ".")) || 0), 0);
              const pending = payments
                .filter((p) => p.status !== "paid")
                .reduce((a, p) => a + (parseFloat(p.amount.replace(",", ".")) || 0), 0);
              const registered = paid + pending;
              const diff = totalPrice - registered;
              if (totalPrice > 0 && Math.abs(diff) > 0.01) {
                return (
                  <div className="mt-1 text-xs text-amber-700">
                    ⚠️ Pagamentos registrados ({formatBRL(registered)}) {diff > 0 ? "menores" : "maiores"} que o total — diferença de {formatBRL(Math.abs(diff))}.
                  </div>
                );
              }
              return null;
            })()}
          </div>
          {payments.map((p, idx) => (
            <div key={p.key} className="rounded-md border p-3">
              <div className="flex items-start justify-between">
                <div className="font-medium">Pagamento {idx + 1}</div>
                <Button variant="ghost" size="icon" onClick={() => removePayment(p.key)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <div>
                  <Label className="text-xs">Valor</Label>
                  <Input
                    inputMode="decimal"
                    value={p.amount}
                    onChange={(e) =>
                      setPayments((prev) =>
                        prev.map((x) => (x.key === p.key ? { ...x, amount: e.target.value } : x))
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Método</Label>
                  <Select
                    value={p.method}
                    onValueChange={(v) =>
                      setPayments((prev) =>
                        prev.map((x) =>
                          x.key === p.key ? { ...x, method: v as PaymentMethod } : x
                        )
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Vencimento</Label>
                  <Input
                    type="date"
                    value={p.due_date}
                    onChange={(e) =>
                      setPayments((prev) =>
                        prev.map((x) => (x.key === p.key ? { ...x, due_date: e.target.value } : x))
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={p.status}
                    onValueChange={(v) =>
                      setPayments((prev) =>
                        prev.map((x) =>
                          x.key === p.key ? { ...x, status: v as "pending" | "paid" } : x
                        )
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addPayment}>
            <Plus className="h-4 w-4" /> Adicionar parcela
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Label>Observações do pedido</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Salvando..." : "Criar pedido"}
        </Button>
      </div>
    </div>
  );
}

function AddPicker({
  label,
  placeholder,
  options,
  onPick,
}: {
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onPick: (v: string) => void;
}) {
  // Estado interno só para resetar o Select depois de adicionar.
  const [resetKey, setResetKey] = useState(0);
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        key={resetKey}
        value=""
        onValueChange={(v) => {
          if (v && v !== "__empty") {
            onPick(v);
            // Força remount do Select para limpar a seleção
            setResetKey((k) => k + 1);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <SelectItem value="__empty" disabled>
              Nenhum disponível
            </SelectItem>
          ) : (
            options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

function cryptoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function SummaryStat({
  icon,
  label,
  value,
  tone,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "success" | "default";
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border bg-card px-2 py-1.5",
        highlight && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-sm font-bold tabular-nums sm:text-base",
          tone === "success" && "text-emerald-700",
          highlight && "text-primary"
        )}
      >
        {value}
      </div>
    </div>
  );
}
