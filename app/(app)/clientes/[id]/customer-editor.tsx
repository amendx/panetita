"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2, MapPin, PawPrint, Receipt, Loader2, MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavButton } from "@/components/ui/nav-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL, formatDate, formatPhone, recurrenceLabel, statusLabel } from "@/lib/format";
import {
  deleteAddress,
  deleteCustomer,
  deletePet,
  saveAddress,
  savePet,
  updateCustomer,
} from "../actions";
import type { Address, Customer, Pet } from "@/types/database";

interface OrderSummary {
  id: string;
  recurrence: string;
  status: string;
  total_price: number;
  created_at: string;
}

export function CustomerEditor({
  customer,
  pets,
  addresses,
  orders,
}: {
  customer: Customer;
  pets: Pet[];
  addresses: Address[];
  orders: OrderSummary[];
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [name, setName] = useState(customer.name);
  const [whatsapp, setWhatsapp] = useState(customer.phone ?? "");
  const [source, setSource] = useState(customer.source ?? "");
  const [notes, setNotes] = useState(customer.notes ?? "");

  const [petOpen, setPetOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const [addrOpen, setAddrOpen] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);

  async function handleSave() {
    setSavingCustomer(true);
    try {
      await updateCustomer(customer.id, {
        name,
        whatsapp: whatsapp || null,
        source: source || null,
        notes: notes || null,
      });
      toast({ title: "Cliente atualizado" });
      setEditing(false);
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setSavingCustomer(false);
    }
  }

  async function handleDeleteCustomer() {
    if (!confirm("Excluir este cliente? Todos os pets, endereços e pedidos serão removidos.")) return;
    try {
      await deleteCustomer(customer.id);
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <CardTitle className="text-base">Dados do cliente</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDeleteCustomer}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    inputMode="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Conheceu por onde</Label>
                  <Input value={source} onChange={(e) => setSource(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={savingCustomer}>
                  {savingCustomer && <Loader2 className="h-4 w-4 animate-spin" />}
                  {savingCustomer ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {customer.phone && (
                <a
                  href={whatsappUrl(customer.phone) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
                >
                  <MessageCircle className="h-4 w-4" />
                  {formatPhone(customer.phone)}
                  <span className="text-xs text-emerald-700/70">· abrir WhatsApp</span>
                </a>
              )}
              {customer.source && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Conheceu por: </span>
                  <span className="font-medium">{customer.source}</span>
                </div>
              )}
              {customer.notes && (
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {customer.notes}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <PawPrint className="h-5 w-5" /> Pets
          </h2>
          <Button
            size="sm"
            onClick={() => {
              setEditingPet(null);
              setPetOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Pet
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {pets.length === 0 && (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">Nenhum pet.</CardContent>
            </Card>
          )}
          {pets.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl">
                    🐾
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold">{p.name}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {p.breed ?? "Sem raça"}
                      {p.weight_kg != null && ` · ${p.weight_kg} kg`}
                    </div>
                    {p.restrictions && (
                      <div className="mt-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                        ⚠️ <strong>Restrição:</strong> {p.restrictions}
                      </div>
                    )}
                    {p.notes && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingPet(p);
                      setPetOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      if (!confirm(`Excluir pet ${p.name}?`)) return;
                      try {
                        await deletePet({ id: p.id, customer_id: customer.id });
                        toast({ title: "Pet excluído" });
                      } catch (e) {
                        toast({
                          title: "Erro ao excluir pet",
                          description: e instanceof Error ? e.message : String(e),
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5" /> Endereços
          </h2>
          <Button
            size="sm"
            onClick={() => {
              setEditingAddr(null);
              setAddrOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Endereço
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.length === 0 && (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">Nenhum endereço.</CardContent>
            </Card>
          )}
          {addresses.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="text-sm">
                  <div className="flex items-center gap-2 font-semibold">
                    {a.label ?? "Endereço"}
                    {a.is_default && <Badge variant="secondary">Padrão</Badge>}
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {a.street}
                    {a.number && `, ${a.number}`}
                    {a.complement && ` — ${a.complement}`}
                    {a.neighborhood && (
                      <>
                        <br />
                        {a.neighborhood}
                      </>
                    )}
                    {a.city && ` · ${a.city}/${a.state ?? ""}`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingAddr(a);
                      setAddrOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      if (!confirm("Excluir endereço?")) return;
                      try {
                        await deleteAddress({ id: a.id, customer_id: customer.id });
                        toast({ title: "Endereço excluído" });
                      } catch (e) {
                        toast({
                          title: "Erro ao excluir endereço",
                          description: e instanceof Error ? e.message : String(e),
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Receipt className="h-5 w-5" /> Pedidos recentes
          </h2>
          <NavButton
            href={`/pedidos/novo?cliente=${customer.id}`}
            size="sm"
            loaderLabel="Abrindo novo pedido..."
          >
            <Plus className="h-4 w-4" /> Novo pedido
          </NavButton>
        </div>
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Nenhum pedido ainda.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/pedidos/${o.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50"
                    >
                      <div>
                        <div className="font-medium">{recurrenceLabel(o.recurrence)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(o.created_at)} · {statusLabel(o.status)}
                        </div>
                      </div>
                      <div className="font-semibold tabular-nums">
                        {formatBRL(Number(o.total_price))}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <PetDialog
        open={petOpen}
        onOpenChange={setPetOpen}
        pet={editingPet}
        customerId={customer.id}
      />
      <AddressDialog
        open={addrOpen}
        onOpenChange={setAddrOpen}
        address={editingAddr}
        customerId={customer.id}
      />
    </div>
  );
}

function PetDialog({
  open,
  onOpenChange,
  pet,
  customerId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pet: Pet | null;
  customerId: string;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(pet?.name ?? "");
  const [weight, setWeight] = useState(pet?.weight_kg != null ? String(pet.weight_kg) : "");
  const [breed, setBreed] = useState(pet?.breed ?? "");
  const [restrictions, setRestrictions] = useState(pet?.restrictions ?? "");
  const [notes, setNotes] = useState(pet?.notes ?? "");
  const [saving, setSaving] = useState(false);

  // sync when opening
  if (open && pet && name !== pet.name && name === "") {
    setName(pet.name);
    setWeight(pet.weight_kg != null ? String(pet.weight_kg) : "");
    setBreed(pet.breed ?? "");
    setRestrictions(pet.restrictions ?? "");
    setNotes(pet.notes ?? "");
  }

  async function handle() {
    if (!name.trim()) {
      toast({ title: "Informe o nome do pet", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await savePet({
        id: pet?.id,
        customer_id: customerId,
        name,
        weight_kg: weight ? parseFloat(weight.replace(",", ".")) : null,
        breed: breed || null,
        restrictions: restrictions || null,
        notes: notes || null,
      });
      toast({ title: pet ? "Pet atualizado" : "Pet criado" });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Erro ao salvar pet",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setName("");
          setWeight("");
          setBreed("");
          setRestrictions("");
          setNotes("");
        } else if (pet) {
          setName(pet.name);
          setWeight(pet.weight_kg != null ? String(pet.weight_kg) : "");
          setBreed(pet.breed ?? "");
          setRestrictions(pet.restrictions ?? "");
          setNotes(pet.notes ?? "");
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{pet ? "Editar pet" : "Novo pet"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Peso (kg)</Label>
              <Input
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <Label>Raça</Label>
              <Input value={breed} onChange={(e) => setBreed(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-1.5">
              ⚠️ Restrições alimentares
            </Label>
            <Textarea
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              placeholder="Ex: alergia a frango, sem cebola, dieta sem grãos..."
              rows={2}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Aparece como aviso na hora de fazer o pedido.
            </p>
          </div>
          <div>
            <Label>Observações gerais</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handle} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddressDialog({
  open,
  onOpenChange,
  address,
  customerId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  address: Address | null;
  customerId: string;
}) {
  const { toast } = useToast();
  const [state, setState] = useState({
    label: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    uf: "",
    zip: "",
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);

  if (open && address && state.street === "" && address.street !== "") {
    setState({
      label: address.label ?? "",
      street: address.street,
      number: address.number ?? "",
      complement: address.complement ?? "",
      neighborhood: address.neighborhood ?? "",
      city: address.city ?? "",
      uf: address.state ?? "",
      zip: address.zip ?? "",
      isDefault: address.is_default,
    });
  }

  async function handle() {
    if (!state.street.trim()) {
      toast({ title: "Informe a rua", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await saveAddress({
        id: address?.id,
        customer_id: customerId,
        label: state.label || null,
        street: state.street,
        number: state.number || null,
        complement: state.complement || null,
        neighborhood: state.neighborhood || null,
        city: state.city || null,
        state: state.uf || null,
        zip: state.zip || null,
        is_default: state.isDefault,
      });
      toast({ title: address ? "Endereço atualizado" : "Endereço criado" });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Erro ao salvar endereço",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setState({
      label: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      uf: "",
      zip: "",
      isDefault: false,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
        else if (address) {
          setState({
            label: address.label ?? "",
            street: address.street,
            number: address.number ?? "",
            complement: address.complement ?? "",
            neighborhood: address.neighborhood ?? "",
            city: address.city ?? "",
            uf: address.state ?? "",
            zip: address.zip ?? "",
            isDefault: address.is_default,
          });
        } else {
          reset();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? "Editar endereço" : "Novo endereço"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Rótulo (Casa, Trabalho...)</Label>
            <Input value={state.label} onChange={(e) => setState({ ...state, label: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label>Rua</Label>
              <Input
                value={state.street}
                onChange={(e) => setState({ ...state, street: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Número</Label>
              <Input
                value={state.number}
                onChange={(e) => setState({ ...state, number: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Complemento</Label>
            <Input
              value={state.complement}
              onChange={(e) => setState({ ...state, complement: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Bairro</Label>
              <Input
                value={state.neighborhood}
                onChange={(e) => setState({ ...state, neighborhood: e.target.value })}
              />
            </div>
            <div>
              <Label>CEP</Label>
              <Input
                value={state.zip}
                onChange={(e) => setState({ ...state, zip: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Cidade</Label>
              <Input
                value={state.city}
                onChange={(e) => setState({ ...state, city: e.target.value })}
              />
            </div>
            <div>
              <Label>UF</Label>
              <Input
                value={state.uf}
                onChange={(e) => setState({ ...state, uf: e.target.value })}
                maxLength={2}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.isDefault}
              onChange={(e) => setState({ ...state, isDefault: e.target.checked })}
            />
            Endereço padrão
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handle} disabled={saving || !state.street.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
