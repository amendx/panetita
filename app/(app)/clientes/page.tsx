import Link from "next/link";
import { Plus, PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, name, phone, pets(id, name)")
    .order("name");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Clientes"
        actions={
          <Button asChild>
            <Link href="/clientes/novo">
              <Plus className="h-4 w-4" /> Novo cliente
            </Link>
          </Button>
        }
      />

      {(data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <PawPrint className="mx-auto mb-3 h-10 w-10 opacity-50" />
            Nenhum cliente cadastrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="font-semibold">{c.name}</div>
                  {c.phone && <p className="mt-0.5 text-sm text-muted-foreground">{c.phone}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(c.pets ?? []).map((p) => (
                      <Badge key={p.id} variant="secondary">
                        🐾 {p.name}
                      </Badge>
                    ))}
                    {(c.pets ?? []).length === 0 && (
                      <span className="text-xs text-muted-foreground">Sem pets</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
