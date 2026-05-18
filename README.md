# Panetita — Panelinha da Tita

Sistema de gestão para a "Panelinha da Tita", empresa de comida natural para cães.

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **TailwindCSS** + shadcn/ui (componentes próprios)
- **Supabase** (Postgres + Auth, RLS por user)
- **react-big-calendar** para visualização de entregas
- **react-hook-form** + **zod** (validação)
- Deploy: **Vercel**

## Setup

### 1. Criar projeto no Supabase

1. Acesse https://supabase.com e crie um novo projeto.
2. No SQL Editor, cole e execute o conteúdo de `supabase/migrations/0001_init.sql`. Isso cria todas as tabelas e políticas de RLS.
3. Em **Authentication → Users**, crie sua conta (email/senha).
4. Em **Project Settings → API**, copie:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` preenchendo:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000 e faça login com a conta criada no Supabase.

### 4. Deploy no Vercel

1. Faça push do repositório no GitHub.
2. Em vercel.com, importe o repo.
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

## Estrutura

```
app/
  (auth)/login        # tela de login
  (app)/              # rotas autenticadas (sidebar)
    page.tsx          # dashboard
    ingredientes/     # CRUD de insumos
    receitas/         # receitas + tamanhos + composição
    combos/           # combos de receitas
    clientes/         # clientes + pets + endereços
    pedidos/          # lista + wizard de novo pedido + detalhe
    entregas/         # tabela filtrável de entregas
    calendario/       # react-big-calendar
    pagamentos/       # controle de pendências
    compras/          # lista de compras agregada por período
    precificacao/     # calculadora de custo/margem/preço
    relatorios/       # lucro, faturamento, top clientes
lib/
  supabase/           # clients (browser, server, middleware)
  pricing.ts          # cálculo de custo, preço, margem
  ics.ts              # geração de .ics + Google Calendar URL
  shopping-list.ts    # agregação de ingredientes
  format.ts           # currency, datas, labels pt-BR
supabase/migrations/  # SQL versionado
```

## Próximos passos sugeridos

- Notificações push de lembrete de entrega
- Anexar fotos de pets e receitas
- Histórico de mudança de preço dos ingredientes
- Sincronização bidirecional com Google Calendar (OAuth)
- Exportar relatórios em PDF
