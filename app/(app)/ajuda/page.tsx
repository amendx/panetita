import Link from "next/link";
import {
  BarChart3,
  Calculator,
  CalendarDays,
  ChefHat,
  Heart,
  Home,
  Layers,
  MessageCircle,
  Package,
  PackageOpen,
  PawPrint,
  Receipt,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Truck,
  Wallet,
  Wand2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AjudaPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="📖 Como usar"
        description="Guia visual de tudo que o Panetita faz. Clique nos atalhos pra abrir cada tela."
      />

      {/* NOVIDADES */}
      <Card className="border-emerald-300 bg-emerald-50/60">
        <CardContent className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-emerald-900">Novidades recentes</h2>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-base">📉📈</span>
              <span>
                <strong>% de perda ou ganho no preparo</strong> — cadastre o ajuste de peso
                de cada ingrediente entre cru e pronto. Use valores positivos para perda
                (frango cozido) ou negativos para ganho (arroz cozido). Custo da receita e
                lista de compras se ajustam automaticamente.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Calculator className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>
                <strong>Custos fixos do negócio na precificação</strong> — em{" "}
                <Link href="/precificacao" className="text-primary underline">
                  Precificação
                </Link>
                , cadastre Aluguel, Energia, Marketing, MEI + sua produção mensal estimada.
                O sistema dilui tudo por panelinha e sugere um preço que cobre todo o overhead
                (não só os ingredientes), separando ainda 3% do lucro como reserva.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>
                <strong>Adicionar/editar pagamentos depois</strong> — no detalhe do pedido,
                clica em "Adicionar pagamento" pra registrar parcelas que ficaram de fora,
                ou edita/exclui qualquer pagamento existente. O resumo mostra "já recebido"
                e "falta cobrar" em tempo real.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-base">⚠️</span>
              <span>
                <strong>Restrições alimentares do pet</strong> — adicione na ficha do pet
                (ex: alergia a frango, sem grãos). Aparece como aviso visível ao criar pedido
                e no detalhe.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>
                <strong>Pet no pedido</strong> — agora cada pedido pode ser vinculado a um pet específico
                do tutor. O nome do pet aparece em <Link href="/pedidos" className="text-primary underline">Pedidos</Link>,
                <Link href="/entregas" className="text-primary underline"> Entregas</Link> e
                <Link href="/calendario" className="text-primary underline"> Calendário</Link>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>
                <strong>Botão "Avisar tutor"</strong> no detalhe do pedido — abre o WhatsApp com mensagem
                pronta listando os itens, data da entrega, modo (Uber/Retirada) e total. ✨
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>
                <strong>WhatsApp clicável</strong> na ficha do tutor — toca no número e já abre o app.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Heart className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>
                <strong>Calculadora nutricional</strong> nova — diz quanto seu pet (de qualquer peso)
                precisa de comida por dia, semana ou mês.{" "}
                <Link href="/nutricao" className="text-primary underline">Abrir →</Link>
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* HERO — Início rápido */}
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Começando do zero — siga essa ordem</h2>
          </div>
          <ol className="space-y-2 text-sm">
            <Step n={1} label="Ingredientes" href="/ingredientes" desc="Coloca o preço de cada um (R$ por kg/g)" />
            <Step n={2} label="Receitas" href="/receitas" desc="Ajusta as quantidades dos ingredientes em cada tamanho" />
            <Step n={3} label="Estoque" href="/estoque" desc="Coloca o que você tem hoje em cada ingrediente" />
            <Step n={4} label="Clientes" href="/clientes" desc="Cadastra os donos e seus pets" />
            <Step n={5} label="Pedidos" href="/pedidos" desc="Cria os pedidos!" />
          </ol>
        </CardContent>
      </Card>

      {/* GRID DE TELAS */}
      <section>
        <SectionTitle>🗺️ As 13 telas do sistema</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <ScreenCard
            href="/"
            icon={<Home className="h-5 w-5" />}
            title="Início"
            desc="Próximas entregas, pagamentos a receber, faturamento e lucro do mês."
          />
          <ScreenCard
            href="/calendario"
            icon={<CalendarDays className="h-5 w-5" />}
            title="Calendário"
            desc="Vista mensal das entregas. Cores indicam o status (laranja, verde, cinza)."
          />
          <ScreenCard
            href="/pedidos"
            icon={<Receipt className="h-5 w-5" />}
            title="Pedidos"
            desc="Criar, ver e gerenciar pedidos. Clique numa linha pra abrir o detalhe."
          />
          <ScreenCard
            href="/entregas"
            icon={<Truck className="h-5 w-5" />}
            title="Entregas"
            desc="Lista das entregas — esta semana, próximos 30 dias ou todas."
          />
          <ScreenCard
            href="/clientes"
            icon={<PawPrint className="h-5 w-5" />}
            title="Clientes"
            desc="Donos, pets e endereços. Cadastro completo."
          />
          <ScreenCard
            href="/receitas"
            icon={<ChefHat className="h-5 w-5" />}
            title="Receitas"
            desc="Suas panelinhas (Frango, Carne, Suíno...) com seus tamanhos e ingredientes."
          />
          <ScreenCard
            href="/combos"
            icon={<Layers className="h-5 w-5" />}
            title="Combos"
            desc="Combine receitas com um desconto percentual."
          />
          <ScreenCard
            href="/ingredientes"
            icon={<Package className="h-5 w-5" />}
            title="Ingredientes"
            desc="Lista de insumos com preço de compra (R$ por kg/g/ml)."
          />
          <ScreenCard
            href="/estoque"
            icon={<PackageOpen className="h-5 w-5" />}
            title="Estoque"
            desc="O que você tem hoje + previsão de demanda em 7, 14 e 30 dias."
          />
          <ScreenCard
            href="/compras"
            icon={<ShoppingCart className="h-5 w-5" />}
            title="Lista de Compras"
            desc="O que comprar (descontando o estoque atual). Atualiza sozinha."
          />
          <ScreenCard
            href="/pagamentos"
            icon={<Wallet className="h-5 w-5" />}
            title="Pagamentos"
            desc="Recebidos e a receber. Marca como pago num clique."
          />
          <ScreenCard
            href="/precificacao"
            icon={<Calculator className="h-5 w-5" />}
            title="Precificação"
            desc="Calculadora pra simular margem e preço antes de cadastrar."
          />
          <ScreenCard
            href="/nutricao"
            icon={<Heart className="h-5 w-5" />}
            title="Nutrição"
            desc="Calcula a quantidade ideal de comida por peso do animal e perfil de atividade."
          />
          <ScreenCard
            href="/relatorios"
            icon={<BarChart3 className="h-5 w-5" />}
            title="Relatórios"
            desc="Faturamento estimado vs. recebido, lucro real e top clientes."
          />
        </div>
      </section>

      {/* PREÇOS E CUSTOS — A SEÇÃO IMPORTANTE */}
      <section>
        <SectionTitle>💰 Como funciona Preços e Custos</SectionTitle>
        <Card>
          <CardContent className="p-6 space-y-5 text-sm">
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <span className="text-base">①</span> O custo nasce dos{" "}
                <Link href="/ingredientes" className="text-primary underline underline-offset-2">
                  ingredientes
                </Link>
              </h3>
              <p className="text-muted-foreground">
                Cada ingrediente tem seu <strong>preço de compra</strong> (ex: cordeiro R$ 35/kg, batata-doce R$ 8/kg).
              </p>
              <FormulaBox>
                Preço do ingrediente × Quantidade na receita = Custo daquele ingrediente
              </FormulaBox>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <span className="text-base">②</span> O custo da receita-tamanho é a soma
              </h3>
              <p className="text-muted-foreground">
                Em{" "}
                <Link href="/receitas" className="text-primary underline underline-offset-2">
                  Receitas
                </Link>
                {" "}cada tamanho (Mini I, P, M…) lista vários ingredientes com quantidades.
              </p>
              <FormulaBox>
                Custo do tamanho = soma dos custos de todos os ingredientes da composição
              </FormulaBox>
              <p className="mt-2 text-xs text-muted-foreground">
                Exemplo: Cordeiro M = 200g cordeiro (R$ 7) + 150g batata (R$ 1,20) + 50g cenoura (R$ 0,30) = <strong>R$ 8,50</strong>
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <span className="text-base">③</span> O preço de venda — duas formas
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border bg-card p-3">
                  <Badge variant="secondary" className="mb-2">A · Preço fixo</Badge>
                  <p className="text-xs text-muted-foreground">
                    Você define R$ direto (ex: R$ 25/un). O sistema mostra a margem que isso gera.
                  </p>
                </div>
                <div className="rounded-md border bg-card p-3">
                  <Badge variant="secondary" className="mb-2">B · Margem desejada</Badge>
                  <p className="text-xs text-muted-foreground">
                    Define a margem (ex: 60%) e o sistema calcula o preço sozinho.
                  </p>
                </div>
              </div>
              <FormulaBox>
                Preço = Custo ÷ (1 − margem%/100)
              </FormulaBox>
              <p className="mt-2 text-xs text-muted-foreground">
                Os dois campos andam juntos: digite um e o outro recalcula automaticamente.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <span className="text-base">④</span> Preço semanal × Preço mensal
              </h3>
              <p className="text-muted-foreground">
                Cada tamanho tem <strong>dois preços por unidade</strong>: um pro plano semanal e outro pro mensal (com desconto).
                Ao escolher "Mensal" no pedido, o sistema usa automaticamente o preço mensal.
              </p>
              <FormulaBox>
                Total semanal = Preço semanal × 7 unidades<br />
                Total mensal = Preço mensal × 28 unidades
              </FormulaBox>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <span className="text-base">⑤</span> Combos com desconto
              </h3>
              <p className="text-muted-foreground">
                Em{" "}
                <Link href="/combos" className="text-primary underline underline-offset-2">
                  Combos
                </Link>
                {" "}você agrupa receitas e aplica um desconto % no total.
              </p>
              <FormulaBox>
                Preço do combo = (soma das receitas) × (1 − desconto%/100)
              </FormulaBox>
              <p className="mt-2 text-xs text-muted-foreground">
                Ex: Cordeiro M (R$ 25) + Frango M (R$ 25) = R$ 50, com 10% desconto = <strong>R$ 45</strong>
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <span className="text-base">⑥</span> Lucro do pedido
              </h3>
              <FormulaBox tone="success">
                Lucro = Total cobrado − Custo de fabricação<br />
                Margem = Lucro ÷ Total cobrado
              </FormulaBox>
              <p className="mt-2 text-xs text-muted-foreground">
                Ao criar o pedido em{" "}
                <Link href="/pedidos/novo" className="text-primary underline underline-offset-2">
                  Novo Pedido
                </Link>{" "}
                você vê o card "Resumo" no topo com tudo em tempo real.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* QUANTIDADES POR ASSINATURA */}
      <section>
        <SectionTitle>📦 Quantidades por tipo de assinatura</SectionTitle>
        <Card>
          <CardContent className="p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              A regra é simples: <strong>1 panelinha por dia</strong>. O total muda conforme o plano:
            </p>
            <div className="grid gap-3 sm:grid-cols-4">
              <PlanoCard nome="Semanal" dias={7} cor="bg-blue-50 border-blue-200 text-blue-900" />
              <PlanoCard nome="Quinzenal" dias={14} cor="bg-purple-50 border-purple-200 text-purple-900" />
              <PlanoCard nome="Mensal" dias={28} cor="bg-emerald-50 border-emerald-200 text-emerald-900" />
              <PlanoCard nome="Único" dias={1} cor="bg-amber-50 border-amber-200 text-amber-900" extra="(avulso)" />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              💡 No wizard de pedido, quando você troca o plano, as quantidades de todas as receitas/combos
              se ajustam automaticamente.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ESTOQUE & COMPRAS */}
      <section>
        <SectionTitle>📦 Estoque e Lista de Compras — como conversam</SectionTitle>
        <Card>
          <CardContent className="p-6 space-y-4 text-sm">
            <p className="text-muted-foreground">
              O <Link href="/estoque" className="text-primary underline">Estoque</Link> e a{" "}
              <Link href="/compras" className="text-primary underline">Lista de Compras</Link> trabalham juntos:
            </p>
            <FormulaBox>
              <strong>O que comprar</strong> = max(necessário − estoque atual, 0)
            </FormulaBox>
            <p className="text-muted-foreground">
              O sistema soma os ingredientes de <strong>todas as entregas agendadas no período</strong>{" "}
              (próximos 7, 14 ou 30 dias) e subtrai o que você já tem no estoque. O que sobrar é o que precisa comprar.
            </p>
            <div className="grid gap-2 text-xs sm:grid-cols-4">
              <StatusInfo color="bg-emerald-500" label="🟢 Em ordem" desc="Estoque cobre os próximos 30 dias" />
              <StatusInfo color="bg-amber-500" label="🟡 Repor logo" desc="Vai faltar em 14–30 dias" />
              <StatusInfo color="bg-red-500" label="🔴 Urgente" desc="Vai faltar em 7 dias" />
              <StatusInfo color="bg-gray-400" label="⚪ Sem estoque" desc="Zerado" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* RELATORIOS — Estimado vs Recebido */}
      <section>
        <SectionTitle>📊 Relatórios — estimado × recebido</SectionTitle>
        <Card>
          <CardContent className="p-6 space-y-3 text-sm">
            <p className="text-muted-foreground">
              No <Link href="/relatorios" className="text-primary underline">Relatórios</Link> tem 6 números no topo:
            </p>
            <div className="space-y-2">
              <ReportMetric label="Faturamento estimado" desc="Soma do valor de todos os pedidos do período (independe de pagamento)" />
              <ReportMetric label="Faturamento recebido" desc="Só pagamentos marcados como pagos" tone="success" />
              <ReportMetric label="Pendente a receber" desc="Diferença entre os dois acima" tone="warning" />
              <ReportMetric label="Custo total" desc="Soma dos custos de produção" />
              <ReportMetric label="Lucro estimado" desc="Faturamento estimado − Custo total" />
              <ReportMetric label="Lucro realizado" desc="Lucro apenas de pedidos totalmente pagos" tone="success" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* PERDA / GANHO DE INGREDIENTES */}
      <section>
        <SectionTitle>📉📈 Perda ou ganho no preparo</SectionTitle>
        <Card>
          <CardContent className="p-6 space-y-3 text-sm">
            <p className="text-muted-foreground">
              Cada ingrediente em{" "}
              <Link href="/ingredientes" className="text-primary underline">Ingredientes</Link>{" "}
              tem um campo <strong>"% de perda / ganho"</strong>. Use quando o peso do
              ingrediente <strong>muda</strong> entre o cru e o pronto.
            </p>
            <FormulaBox>
              Quantidade a comprar = quantidade da receita × (1 + ajuste%/100)<br />
              Custo real = preço × Quantidade a comprar
            </FormulaBox>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-amber-300 bg-amber-50/60 p-3 text-xs space-y-1">
                <div className="font-bold text-amber-900">📉 Perda (positivo)</div>
                <div>Frango a R$ 10/kg, <strong>perda 30%</strong></div>
                <div>Receita usa 100g (no prato)</div>
                <div className="mt-1">
                  ➜ Comprar 130g, custo <strong>R$ 1,30</strong>
                </div>
              </div>
              <div className="rounded-md border border-emerald-300 bg-emerald-50/60 p-3 text-xs space-y-1">
                <div className="font-bold text-emerald-900">📈 Ganho (negativo)</div>
                <div>Arroz a R$ 8/kg, <strong>ganho 50% (digite −50)</strong></div>
                <div>Receita usa 1kg cozido</div>
                <div className="mt-1">
                  ➜ Comprar 500g cru, custo <strong>R$ 4,00</strong>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 No card de ingredientes da receita aparece "📉 +30% perda" ou "📈 −50% ganho"
              ao lado do nome.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* PRECIFICACAO COMPLETA */}
      <section>
        <SectionTitle>🏢 Precificação que cobre o negócio inteiro</SectionTitle>
        <Card>
          <CardContent className="p-6 space-y-3 text-sm">
            <p className="text-muted-foreground">
              Em <Link href="/precificacao" className="text-primary underline">Precificação</Link>{" "}
              você cadastra seus custos fixos mensais. O sistema dilui isso em cada panelinha
              para que <strong>cada venda contribua com o overhead</strong>, não só pague os ingredientes.
            </p>

            <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
              <div className="font-medium uppercase text-muted-foreground">
                Custos mensais cadastrados
              </div>
              <div className="flex justify-between">
                <span>🏢 Aluguel</span><span className="tabular-nums">R$ 1.500</span>
              </div>
              <div className="flex justify-between">
                <span>⚡ Energia</span><span className="tabular-nums">R$ 200</span>
              </div>
              <div className="flex justify-between">
                <span>📣 Marketing Instagram</span><span className="tabular-nums">R$ 100</span>
              </div>
              <div className="flex justify-between">
                <span>🧾 MEI</span><span className="tabular-nums">R$ 70</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span>Total fixo mensal</span><span className="tabular-nums">R$ 1.870</span>
              </div>
            </div>

            <FormulaBox>
              Custo fixo por panelinha = Total fixo mensal ÷ panelinhas/mês estimadas<br />
              Custo total = Ingredientes + Custo fixo por panelinha<br />
              Preço = Custo total × markup (ou ÷ (1 − margem))<br />
              Reserva (3%) = Lucro bruto × 0,03<br />
              <strong>Lucro líquido = Preço − Custo total − Reserva</strong>
            </FormulaBox>

            <p className="text-xs text-muted-foreground">
              💡 No simulador, ligue/desligue o toggle <em>"Incluir custos fixos"</em> pra comparar
              o preço considerando apenas ingredientes vs. tudo incluído. O preço fixo cadastrado
              de cada tamanho também aparece com a sobra real depois de descontar o custo total.
            </p>
            <p className="text-xs text-muted-foreground">
              🛟 <strong>Fundo de reserva</strong>: 3% do lucro fica separado pra manutenção/reposição
              de equipamentos. Configurável.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* PAGAMENTOS POS-PEDIDO */}
      <section>
        <SectionTitle>💰 Gerenciar pagamentos depois</SectionTitle>
        <Card>
          <CardContent className="p-6 space-y-3 text-sm">
            <p className="text-muted-foreground">
              Você não precisa lembrar de todos os pagamentos na hora de criar o pedido.
              No detalhe do pedido (clique em qualquer pedido em{" "}
              <Link href="/pedidos" className="text-primary underline">Pedidos</Link>),
              o painel de Pagamentos mostra:
            </p>
            <div className="rounded-md border bg-muted/40 p-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="font-medium uppercase text-muted-foreground">Total do pedido</div>
                  <div className="font-bold">R$ 525,00</div>
                </div>
                <div>
                  <div className="font-medium uppercase text-emerald-700">Já recebido</div>
                  <div className="font-bold text-emerald-700">R$ 200,00</div>
                </div>
                <div>
                  <div className="font-medium uppercase text-amber-700">Falta cobrar</div>
                  <div className="font-bold text-amber-700">R$ 325,00</div>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground">Você pode:</p>
            <ul className="space-y-1.5 text-sm">
              <Tip><strong>"+ Adicionar pagamento"</strong> — abre form com o valor restante já preenchido (basta escolher método e salvar).</Tip>
              <Tip><strong>Editar ✏️</strong> qualquer linha — muda valor, método, vencimento, status ou nota.</Tip>
              <Tip><strong>Excluir 🗑️</strong> um pagamento errado.</Tip>
              <Tip><strong>Marcar pago ✓</strong> num clique (ou voltar pra pendente).</Tip>
            </ul>
            <p className="text-xs text-muted-foreground">
              💡 Se a soma dos pagamentos não bater com o total do pedido, o sistema
              mostra aviso em cinza ou amarelo logo abaixo.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* RESTRIÇÕES ALIMENTARES */}
      <section>
        <SectionTitle>⚠️ Restrições alimentares do pet</SectionTitle>
        <Card className="border-amber-300">
          <CardContent className="p-6 text-sm space-y-3">
            <p className="text-muted-foreground">
              Em <Link href="/clientes" className="text-primary underline">Clientes</Link>, ao
              editar/cadastrar um pet, preencha o campo{" "}
              <strong>"Restrições alimentares"</strong> com avisos importantes (ex.: alergias,
              dieta especial, sem grãos).
            </p>
            <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <div className="font-bold text-amber-900">
                    Atenção: restrição alimentar de Apolo
                  </div>
                  <p className="text-amber-900">Alergia a frango. Não usar frango ou caldo.</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Esse aviso aparece automaticamente:
              <br />— Ao selecionar o pet no <strong>wizard de novo pedido</strong>;
              <br />— No <strong>detalhe do pedido</strong> (logo abaixo dos totais).
            </p>
            <p className="text-xs text-muted-foreground">
              Na lista de clientes, tutores com pets que têm restrição mostram o aviso
              "⚠️ Tem pet com restrição alimentar" no card.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* AVISAR TUTOR */}
      <section>
        <SectionTitle>💬 Avisar tutor pelo WhatsApp</SectionTitle>
        <Card>
          <CardContent className="p-6 text-sm space-y-3">
            <p className="text-muted-foreground">
              No detalhe de qualquer pedido, o botão verde{" "}
              <Badge variant="success">💬 Avisar tutor</Badge> abre o WhatsApp do tutor com uma
              mensagem pronta com:
            </p>
            <div className="rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed whitespace-pre-line">
{`Oi Maria! 🐶
A panelinha do(a) Apolo está pronta!

*Pedido:*
• 15× Cordeiro · Médio I
• 15× Frango · Pequeno II

📅 *Entrega:* 22/10/2025 às 14:00
🚚 *Modo:* Uber/99 (cliente paga)
📍 Endereço: Rua das Flores, 123

💰 *Total:* R$ 525,00

Qualquer dúvida me chama por aqui! 🐾`}
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ O tutor precisa ter o número de WhatsApp cadastrado na ficha.
              Vá em <Link href="/clientes" className="text-primary underline">Clientes</Link> e
              preencha o campo se ainda não tiver.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* CALCULADORA NUTRICIONAL */}
      <section>
        <SectionTitle>❤️ Calculadora Nutricional</SectionTitle>
        <Card>
          <CardContent className="p-6 text-sm space-y-3">
            <p className="text-muted-foreground">
              Em <Link href="/nutricao" className="text-primary underline">Nutrição</Link> você
              calcula quanto de comida um pet precisa por dia, semana, quinzena ou mês —
              especialmente útil para animais grandes que não cabem nos tamanhos padrão.
            </p>
            <FormulaBox>
              Comida/dia = Peso (kg) × Percentual do perfil × 1000
            </FormulaBox>
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-md border bg-card p-2">
                <div className="font-medium">Filhote / muito ativo</div>
                <div className="text-muted-foreground">4–6% do peso</div>
              </div>
              <div className="rounded-md border bg-card p-2">
                <div className="font-medium">Adulto ativo</div>
                <div className="text-muted-foreground">3–4% do peso</div>
              </div>
              <div className="rounded-md border bg-card p-2">
                <div className="font-medium">Adulto padrão</div>
                <div className="text-muted-foreground">2.5–3% do peso</div>
              </div>
              <div className="rounded-md border bg-card p-2">
                <div className="font-medium">Sênior / sedentário</div>
                <div className="text-muted-foreground">2–2.5% do peso</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Selecione uma receita pra ver quantas unidades de cada tamanho seu pet vai precisar.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* DICAS RÁPIDAS */}
      <section>
        <SectionTitle>✨ Dicas que economizam tempo</SectionTitle>
        <Card>
          <CardContent className="p-6">
            <ul className="space-y-2 text-sm">
              <Tip><strong>Linhas clicáveis</strong>: clica em qualquer pedido ou receita pra abrir o detalhe.</Tip>
              <Tip><strong>Preços R$</strong>: digite só números — o sistema formata sozinho (123 vira R$ 1,23).</Tip>
              <Tip><strong>Margem ↔ Preço</strong>: na receita, digitar um campo recalcula o outro.</Tip>
              <Tip><strong>Estoque +/−</strong>: usa os botões pra ajustar 1 unidade rapidinho.</Tip>
              <Tip><strong>"Preencher com total"</strong> no pagamento cria 1 parcela com o valor cheio.</Tip>
              <Tip><strong>Adicionar ao Google Calendar</strong>: cada entrega tem o botão direto, sem login.</Tip>
              <Tip><strong>Recolher menu</strong>: ícone no topo esquerdo libera tela inteira (ótimo no tablet).</Tip>
              <Tip><strong>Botão desabilitado?</strong> Lê a mensagem cinza embaixo — ela diz o que falta.</Tip>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* FEEDBACK VISUAL */}
      <section>
        <SectionTitle>👀 Sinais visuais que o sistema dá</SectionTitle>
        <Card>
          <CardContent className="p-6">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-2xl">🐶</span>
                <span>
                  <strong>Cachorrinho pulando</strong> em tela cheia = carregando, dá um segundinho.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Badge variant="success">Sucesso</Badge>
                <span><strong>Toast verde</strong> no canto inferior = salvou ✓</span>
              </li>
              <li className="flex items-start gap-3">
                <Badge variant="destructive">Erro</Badge>
                <span><strong>Toast vermelho</strong> = deu erro. Leia a mensagem.</span>
              </li>
              <li className="flex items-start gap-3">
                <Badge variant="warning">⚠️</Badge>
                <span><strong>Aviso amarelo</strong> = atenção. Geralmente algo não bate (ex: pagamentos &lt; total).</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-5 w-5 text-emerald-700" />
                <span><strong>Verde</strong> = dinheiro entrando, lucro, status OK.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <p className="py-8 text-center text-xs text-muted-foreground">
        🐾 Dúvida em alguma tela específica? Chama a Amanda no time! 🐾
      </p>
    </div>
  );
}

/* ---------- COMPONENTES INTERNOS ---------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-lg font-bold tracking-tight">{children}</h2>;
}

function Step({
  n,
  label,
  href,
  desc,
}: {
  n: number;
  label: string;
  href: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-md border bg-card/50 p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {n}
      </span>
      <div className="flex-1">
        <Link href={href} className="font-semibold text-primary underline-offset-2 hover:underline">
          {label}
        </Link>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </li>
  );
}

function ScreenCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              {icon}
            </span>
            <h3 className="font-semibold">{title}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function FormulaBox({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "success";
}) {
  return (
    <div
      className={`mt-3 rounded-md border px-3 py-2 font-mono text-xs leading-relaxed ${
        tone === "success"
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-primary/30 bg-primary/5 text-foreground"
      }`}
    >
      {children}
    </div>
  );
}

function PlanoCard({
  nome,
  dias,
  cor,
  extra,
}: {
  nome: string;
  dias: number;
  cor: string;
  extra?: string;
}) {
  return (
    <div className={`rounded-md border p-3 text-center ${cor}`}>
      <div className="text-xs font-medium uppercase tracking-wide">{nome}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{dias}</div>
      <div className="text-[10px] opacity-80">unidades {extra ?? ""}</div>
    </div>
  );
}

function StatusInfo({
  color,
  label,
  desc,
}: {
  color: string;
  label: string;
  desc: string;
}) {
  return (
    <div className="rounded-md border bg-card p-2">
      <div className="flex items-center gap-1.5 font-medium">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        {label}
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>
    </div>
  );
}

function ReportMetric({
  label,
  desc,
  tone,
}: {
  label: string;
  desc: string;
  tone?: "success" | "warning";
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-card p-3">
      <Badge
        variant={tone === "success" ? "success" : tone === "warning" ? "warning" : "secondary"}
        className="mt-0.5 shrink-0"
      >
        {label}
      </Badge>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  );
}
