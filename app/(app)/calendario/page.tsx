import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { DeliveryCalendar } from "./delivery-calendar";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const supabase = await createClient();
  const { data: deliveries } = await supabase
    .from("deliveries")
    .select(
      `id, scheduled_date, scheduled_time, status,
       orders(id, customers(name)),
       delivery_items(quantity, order_items(measure_unit, recipe_sizes(size_label, recipes(name)), combos(name)))`
    )
    .order("scheduled_date");

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const events = (deliveries ?? []).map((d: any) => {
    const customerName = d.orders?.customers?.name ?? "Cliente";
    const itemsText = (d.delivery_items ?? [])
      .map((di: any) => {
        const oi = di.order_items;
        const label = oi?.recipe_sizes
          ? `${oi.recipe_sizes.recipes.name} ${oi.recipe_sizes.size_label}`
          : oi?.combos?.name ?? "—";
        return `${di.quantity}× ${label}`;
      })
      .join(", ");

    return {
      id: d.id as string,
      orderId: d.orders?.id as string,
      title: `${customerName}${itemsText ? ` — ${itemsText}` : ""}`,
      date: d.scheduled_date as string,
      time: d.scheduled_time as string | null,
      status: d.status as string,
    };
  });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Calendário de entregas" description="Visão mensal das suas entregas" />
      <DeliveryCalendar events={events} />
    </div>
  );
}
