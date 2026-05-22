import Link from "next/link";
import Image from "next/image";
import { MessageCircle, PawPrint, Plus, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { NavButton } from "@/components/ui/nav-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPhone } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select(
      "id, name, phone, source, pets(id, name, weight_kg, restrictions, photo_url)"
    )
    .order("name");

  const customers = data ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Clientes"
        description={`${customers.length} ${customers.length === 1 ? "tutor cadastrado" : "tutores cadastrados"}`}
        actions={
          <NavButton href="/clientes/novo" loaderLabel="Abrindo novo cliente...">
            <Plus className="h-4 w-4" /> Novo cliente
          </NavButton>
        }
      />

      {customers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <PawPrint className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p className="font-medium">Nenhum cliente cadastrado.</p>
            <p className="mt-1 text-sm">Clica em "Novo cliente" pra começar 🐾</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cany = c as any;
            const pets = (cany.pets ?? []) as Array<{
              id: string;
              name: string;
              weight_kg: number | null;
              restrictions: string | null;
              photo_url: string | null;
            }>;
            const hasRestriction = pets.some((p) => p.restrictions);
            // Se o tutor só tem 1 pet com foto, usa essa foto como avatar.
            const tutorAvatar = pets.length === 1 && pets[0].photo_url ? pets[0] : null;
            return (
              <Link key={c.id} href={`/clientes/${c.id}`} className="block">
                <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="space-y-3 p-4">
                    {/* Tutor */}
                    <div className="flex items-start gap-3">
                      {tutorAvatar ? (
                        <Image
                          src={tutorAvatar.photo_url!}
                          alt={tutorAvatar.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Tutor
                        </div>
                        <div className="truncate font-semibold">{c.name}</div>
                        {c.phone && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            <MessageCircle className="h-3 w-3" />
                            {formatPhone(c.phone)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pets */}
                    <div>
                      <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {pets.length === 0
                          ? "Sem pets"
                          : pets.length === 1
                          ? "Pet"
                          : `${pets.length} pets`}
                      </div>
                      {pets.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          Nenhum pet cadastrado
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {pets.map((p) => (
                            <Badge
                              key={p.id}
                              variant={p.restrictions ? "warning" : "secondary"}
                              className="gap-1"
                            >
                              🐾 {p.name}
                              {p.weight_kg ? ` · ${p.weight_kg}kg` : ""}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Source + alerta de restrição */}
                    {(cany.source || hasRestriction) && (
                      <div className="space-y-1 border-t pt-2 text-[11px]">
                        {cany.source && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span>🔎</span>
                            <span>Conheceu por: {cany.source}</span>
                          </div>
                        )}
                        {hasRestriction && (
                          <div className="flex items-center gap-1 font-medium text-amber-700">
                            <span>⚠️</span>
                            <span>Tem pet com restrição alimentar</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
