# 🐶 Panetita — Guia rápido

Bem-vinda ao seu sistema da Panelinha da Tita! Esse guia mostra **o que cada tela faz** e **como usar** em pouquinhos passos. ✨

---

## 🗺️ O mapa do sistema

| Ícone | Tela | Pra quê |
|---|---|---|
| 🏠 | **Início** | Dashboard — próximas entregas, pagamentos a receber, faturamento do mês |
| 📅 | **Calendário** | Ver entregas do mês visualmente |
| 🧾 | **Pedidos** | Criar e gerenciar pedidos dos clientes |
| 🚚 | **Entregas** | Lista de entregas (semana / 30 dias / todas) |
| 🐾 | **Clientes** | Cadastro dos donos + pets + endereços |
| 🍲 | **Receitas** | Suas panelinhas (Frango, Carne, Suíno…) e tamanhos |
| 🥣 | **Combos** | Combos de receitas com desconto |
| 🥩 | **Ingredientes** | Lista de insumos com preço de compra |
| 📦 | **Estoque** | Quanto você tem hoje + quanto vai precisar |
| 🛒 | **Lista de Compras** | O que comprar (descontando o que já tem) |
| 💰 | **Pagamentos** | Recebidos e a receber |
| 🧮 | **Precificação** | Calculadora de margem/preço |
| 📊 | **Relatórios** | Faturamento, lucro, top clientes |

> 💡 No tablet, dá pra **recolher o menu** clicando no ícone no topo esquerdo — fica mais espaço pra trabalhar.

---

## ⚡ Início rápido — primeira vez usando

Faça nesta ordem pra tudo funcionar:

```
1. 🥩 Ingredientes  →  Coloca o preço de cada um (R$ por kg/g)
2. 🍲 Receitas      →  Ajusta as quantidades (vem com 1g placeholder)
3. 📦 Estoque       →  Coloca o que você tem hoje em cada ingrediente
4. 🐾 Clientes      →  Cadastra os donos e seus pets
5. 🧾 Pedidos       →  Cria os pedidos!
```

Pronto. Daí o sistema calcula sozinho: custo, lucro, lista de compras, etc.

---

## 🥩 Ingredientes

**O que é**: lista de tudo que você compra — cordeiro, batata-doce, azeite…

**Como cadastrar**:
1. Clica em **"Novo ingrediente"**
2. Nome + unidade (kg / g / ml / un) + **preço de compra**
3. Salvar

> 💡 O preço aqui é **quanto VOCÊ paga** pra comprar (ex: cordeiro a R$ 35/kg).

---

## 🍲 Receitas

**O que é**: suas panelinhas — Frango, Carne, Suíno. Cada uma tem **vários tamanhos** (Miniatura I, Pequeno I…) e **ingredientes com quantidades**.

**A tabela mostra**:
| Coluna | O que é |
|---|---|
| Receita | Nome + descrição |
| Tamanhos | Badges (PP, P, M, G…) |
| Ingredientes | Quantos ingredientes únicos a receita tem |
| Custo | Faixa de custo (do menor pro maior tamanho) |
| Preço fixo | Faixa de preço cadastrado |
| Margem média | 🟢 ≥50%  🟡 30–50%  🔴 <30% |

**Como editar uma receita**:
1. Clica na linha (ou no menu ⋮ → Editar)
2. Vai pra tela do detalhe da receita
3. Cada tamanho aparece num card:
   - **Edita o tamanho**: clica no lápis → ajusta preço (semanal/mensal) ou usa margem desejada
   - **Adiciona ingrediente**: dropdown + quantidade + g/kg → clica `+`
   - **Remove**: clica na lixeira do ingrediente

> 🧮 **Tem campo "Margem desejada"**: digita "60" e o preço calcula sozinho. Ou digita o preço e vê a margem. Os dois andam juntos.

---

## 🥣 Combos

**O que é**: combinação de receitas com **desconto** em cima do preço total.

**Como criar**:
1. **Novo combo** → Nome + desconto (%) → Salvar
2. **Adicionar receita ao combo**: escolhe receita+tamanho + quantidade
3. O card mostra automaticamente:
   ```
   Soma das receitas:  R$ 50,00
   Desconto (10%):     −R$ 5,00
   ─────────────────
   Preço do combo:     R$ 45,00
   Custo / Lucro / Margem
   ```

---

## 🐾 Clientes

**Cadastro novo**: nome + WhatsApp + "conheceu por onde" + endereço (opcional).

**Dentro do cliente**:
- ✏️ Editar dados do cliente
- 🐾 Adicionar pets (nome, peso, raça)
- 📍 Adicionar endereços
- 🧾 Ver pedidos anteriores
- ➕ Criar **novo pedido** direto

---

## 🧾 Pedidos

### Lista de pedidos
Cada linha é **clicável** → vai pro detalhe.

| Coluna | O que mostra |
|---|---|
| Cliente | Nome |
| Data da entrega | Próxima entrega não-entregue |
| Entrega | 🏷️ Uber/99 ou Retirada |
| Plano | Único / Semanal / Quinzenal / Mensal |
| Status | Rascunho / Confirmado / Entregue / Cancelado |
| Total | R$ |
| Lucro | R$ (verde) |

### Criar um pedido (`Novo pedido`)

O wizard tem um **resumo no topo** que atualiza em tempo real:

```
┌──────────────────────────────────────────────────┐
│  RESUMO DO PEDIDO                       Mensal   │
│  Total R$ 525  Custo R$ 270  Lucro R$ 255 49%   │
│  Entregas: 2     Unidades: 28                    │
└──────────────────────────────────────────────────┘
```

**Passos:**

1. **Cliente** → seleciona da lista (endereço já preenche o padrão)
2. **Plano e itens**:
   - Escolhe **Tipo de assinatura** (Semanal/Quinzenal/Mensal…)
   - Adiciona **receita** ou **combo** no dropdown → entra direto
   - Quantidade já vem correta (7/15/28 conforme o plano)
3. **Entregas**:
   - Cada entrega tem **Data + Hora + Tipo** (Uber/99 ou Retirada)
   - Pode adicionar várias entregas — o sistema divide as unidades igualmente
4. **Pagamentos**:
   - Caixa destacada mostra o **Total a cobrar do cliente**
   - Botão "Preencher com total" cria 1 pagamento com o valor cheio
   - Pode parcelar criando mais linhas
5. **Criar pedido** → loader 🐶 → pronto!

> ⚠️ Se faltar algo (cliente, item, entrega), o botão fica **desabilitado** e mostra o que falta logo abaixo.

### Detalhe do pedido

- 3 cards no topo: **Total / Custo / Lucro**
- Tabela de **Itens** (combos mostram a composição)
- Tabela de **Entregas** com lápis pra editar data/hora/tipo + botão "Marcar entregue" + "Adicionar ao Google Calendar"
- Tabela de **Pagamentos** com botão "Marcar pago"

---

## 🚚 Entregas

Lista de entregas com filtro: **Esta semana / Próximos 30 dias / Todas**.

Cada linha tem: data, cliente, tipo (Uber/Retirada), plano, status, ações.

> ✅ Use o "**Marcar entregue**" no dia, ou abra o pedido pra editar a data.

---

## 📅 Calendário

Visualização **mensal** das entregas — cores indicam o status:

- 🟧 Laranja = Agendada
- 🟢 Verde = Entregue
- ⚪ Cinza = Cancelada

**Clica numa entrega** → vai pro pedido. Pode mudar pra **Semana / Dia / Agenda** nos botões no topo direito.

---

## 📦 Estoque

A tela mais visual do sistema.

**Topo**: 4 pílulas coloridas com contagem:
- 🟢 Em ordem
- 🟡 Repor logo
- 🔴 Urgente
- ⚪ Sem estoque

**Cards de cada ingrediente** mostram:
- **Estoque atual** em fonte grande
- Botões `−` `+` (tira/põe 1 unidade) e **Definir** (valor exato)
- Demanda em **7 / 14 / 30 dias** com aviso "faltam X" em vermelho se não tiver

**Filtro rápido**: "Todos" ou "Precisa repor (N)" pra ver só o que tá em alerta.

---

## 🛒 Lista de Compras

Calcula automaticamente **o que comprar** com base em:
- 📅 Entregas dos próximos dias
- 📦 O que já tem em estoque

**Topo destacado**:
```
Custo total se não tivesse estoque:  R$ 320,00
A comprar agora (descontando estoque): R$ 185,00
```

Tabela: Ingrediente | Precisa | Estoque | **Comprar** (vermelho) | Custo

> 💡 Filtros: Esta semana / 7 dias / 14 dias / 30 dias.

---

## 💰 Pagamentos

Lista todos os pagamentos. Filtros: **Pendentes / Pagos / Todos**.

Topo mostra o **total pendente** em R$.

Ações na linha:
- **Marcar pago** ✅
- Voltar pra pendente (RotateCcw)

---

## 🧮 Precificação

Calculadora de margem. Útil pra **simular preço** antes de cadastrar:

1. Escolhe receita + tamanho
2. Define margem desejada (%)
3. Vê o preço sugerido + lucro
4. Compara com o preço fixo já cadastrado

---

## 📊 Relatórios

Filtros: Mês atual / 30 dias / 90 dias.

**6 cards no topo**:
| Card | O que mostra |
|---|---|
| Faturamento estimado | Soma dos pedidos do período |
| **Faturamento recebido** (verde) | Só pagamentos quitados — `% do estimado` |
| Pendente a receber | Diferença |
| Custo total | R$ |
| Lucro estimado | R$ + margem média |
| Lucro realizado | Só pedidos totalmente pagos |

Tabela **Top clientes** + **lista de pedidos do período** com "Recebido" (verde se quitado, amarelo se parcial).

---

## ✨ Coisinhas pra facilitar a vida

| Atalho | O que faz |
|---|---|
| Click em **qualquer pedido** na lista | Abre o detalhe |
| Click em **qualquer receita** | Abre pra editar |
| Card de Estoque "filtro" | Mostra só o que precisa repor |
| Botão "Preencher com total" no pagamento | Cria 1 pagamento com o valor cheio do pedido |
| Margem ↔ Preço na receita | Os dois se ajustam juntos automaticamente |
| `+` e `−` no estoque | Ajuste rápido de 1 unidade |
| Recolher menu no topo esquerdo | Tela cheia pra tabela/calendário |

---

## 🆘 Coisas a lembrar

- 💵 **Preços em R$**: digita só números, o sistema formata sozinho (123 = R$ 1,23)
- ⏳ Quando aparecer o **🐶 pulando**: tá carregando, espera um segundinho
- ✅ **Toasts verdes** no canto: salvou ✓
- ❌ **Toasts vermelhos**: deu erro — leia a mensagem
- 📝 Botão **desabilitado** = falta preencher algo. Vê a mensagem cinza embaixo.

---

Tem dúvida em alguma tela específica? É só chamar! 🐾
