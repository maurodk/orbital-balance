# Orbital Balance — Prompt Mestre de Desenvolvimento

> Use este prompt como instrução inicial completa ao agente de desenvolvimento (Cursor, Copilot Agent, Claude, etc.)

---

## PROMPT

Você é um engenheiro full-stack sênior especializado em produtos financeiros modernos. Sua missão é construir do zero o **Orbital Balance**, um WebApp de organização financeira pessoal — sem integração com bancos, totalmente baseado em registros manuais, com foco em controle inteligente, insights e educação financeira.

---

### 1. IDENTIDADE VISUAL (SEGUIR À RISCA)

O produto já tem uma identidade visual definida. Toda a interface deve respeitá-la integralmente:

**Nome:** Orbital Balance  
**Slogan principal:** "Controle Hoje, Liberdade Amanhã."  
**Slogan secundário:** "Planeje. Acompanhe. Evolua."

**Paleta de cores (obrigatória):**
| Token | Hex | Uso |
|---|---|---|
| `--color-bg-deep` | `#0B1320` | Background principal, sidebar |
| `--color-bg-surface` | `#1C2A3A` | Cards, modais, painéis |
| `--color-gold` | `#D4AF7A` | Destaque primário, CTAs, ícones de ação, bordas ativas |
| `--color-muted` | `#A7B0B8` | Textos secundários, labels, placeholders |
| `--color-off-white` | `#F3F2EF` | Textos principais, títulos |

**Tipografia:** Montserrat (Google Fonts) — pesos 400, 500, 600, 700. Títulos em SemiBold (600).

**Iconografia:** Lucide Icons, estilo linha fina, combinando com dourado (`#D4AF7A`) nos destaques. Os ícones da marca de referência são: gráfico de pizza, lista com marcadores, gráfico de barras e calendário.

**Logotipo:** Símbolo circular com órbita (anel externo + esfera pequena dourada). Usar SVG inline quando necessário.

**Valores da marca refletidos na UI:** Visão · Disciplina · Equilíbrio · Liberdade — a interface deve transmitir sofisticação, clareza e confiança.

---

### 2. STACK TECNOLÓGICA

```
Framework:      Next.js 14+ (App Router)
Linguagem:      TypeScript (strict mode)
Estilização:    Tailwind CSS + variáveis CSS customizadas
Componentes:    shadcn/ui (tema dark customizado)
Animações:      Framer Motion + Aceternity UI
Ícones:         Lucide Icons
Gráficos:       Recharts
Estado global:  Zustand
Data fetching:  React Query (TanStack Query v5)
Persistência/Banco:   Supabase
```

Configure o Tailwind para usar as cores da paleta como tokens nativos (`orbital-deep`, `orbital-surface`, `orbital-gold`, `orbital-muted`, `orbital-white`).

---

### 3. ARQUITETURA DO PROJETO

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar + Header persistentes
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── transactions/       # Histórico completo
│   │   ├── calendar/           # Calendário financeiro
│   │   ├── categories/         # Gerenciar categorias
│   │   ├── reports/            # Relatórios mensais
│   │   └── settings/           # Configurações
├── components/
│   ├── ui/                     # shadcn/ui base
│   ├── layout/                 # Sidebar, Header, MobileNav
│   ├── transactions/           # TransactionForm, TransactionCard, TransactionList
│   ├── charts/                 # BalanceChart, CategoryPieChart, MonthlyBarChart
│   ├── calendar/               # FinancialCalendar, DayDetail
│   ├── reports/                # MonthlyReport, ReportCard
│   └── shared/                 # Logo, Badge, EmptyState, LoadingSpinner
├── store/
│   ├── useTransactionStore.ts
│   ├── useCategoryStore.ts
│   ├── useReportStore.ts
│   └── useSettingsStore.ts
├── hooks/
│   ├── useTransactions.ts
│   ├── useBalance.ts
│   ├── useCategories.ts
│   └── useCalendarEvents.ts
├── types/
│   └── index.ts                # Todos os tipos TypeScript
├── lib/
│   ├── utils.ts
│   ├── formatters.ts           # formatCurrency, formatDate
│   └── calculations.ts        # Funções de cálculo financeiro
└── constants/
    └── categories.ts           # Categorias padrão com cores
```

---

### 4. TIPOS TYPESCRIPT (CORE)

```typescript
type TransactionType = 'expense' | 'income';
type PaymentMethod = 'card' | 'cash' | 'pix' | 'transfer';
type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
type NecessityTag = 'necessary' | 'unnecessary' | 'pending';

interface Category {
  id: string;
  name: string;
  color: string;         // hex
  icon: string;          // lucide icon name
  type: TransactionType | 'both';
  isDefault: boolean;
}

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  date: string;          // ISO 8601
  recurrence: RecurrenceType;
  recurrenceEndDate?: string;
  tags?: string[];
  necessityTag: NecessityTag;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface MonthlyReport {
  id: string;
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactions: string[];   // IDs
  necessaryExpenses: number;
  unnecessaryExpenses: number;
  isFinalized: boolean;
  insights: string[];
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  isScheduled: boolean;      // programado vs efetivado
  transactionId?: string;
}

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  paymentMethod: PaymentMethod;
  recurrence: RecurrenceType;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  lastGenerated?: string;
}
```

---

### 5. FUNCIONALIDADES — DETALHAMENTO

#### 5.1 Dashboard Principal
- **Saldo atual** em destaque (card grande com animação de entrada via Framer Motion)
- **Cards de resumo:** Total de entradas do mês · Total de saídas do mês · Saldo do mês
- **Gráfico de barras mensal** (Recharts): colunas lado a lado de receitas vs despesas dos últimos 6 meses — cores dourado para receita, azul-aço para despesa
- **Gráfico de pizza por categoria** (Recharts): gastos do mês atual separados por categoria com as cores customizadas de cada categoria
- **Últimas 5 transações** com botão "Ver todas"
- **Alerta de relatório pendente** quando o mês anterior não foi finalizado (banner dourado destacado)
- **Dicas financeiras rotativas** (componente de insight com animação de slide)

#### 5.2 Registro de Transação (Modal ou Drawer)
Acionado por dois botões flutuantes fixos no canto inferior direito:
- Botão primário `+` (dourado) → abre seletor: "Adicionar Receita" ou "Registrar Gasto"

**Formulário de Gasto:**
- Valor (input numérico com máscara monetária R$)
- Descrição
- Categoria (seletor visual com cor + ícone da categoria)
- Data (date picker, default: hoje)
- Forma de pagamento: Cartão · Dinheiro · Pix · Transferência (botões toggle com ícone)
- Recorrência: Nenhuma · Diária · Semanal · Mensal · Anual
- Tag de necessidade: Necessário · Desnecessário (pode ser marcado depois no relatório)
- Observações (opcional)

**Formulário de Receita:**
- Valor, Descrição, Categoria, Data
- Forma de recebimento
- Recorrência (ex.: salário mensal — define valor + dia do mês)
- Observações

#### 5.3 Gerenciamento de Categorias
- Lista de categorias com cor, ícone e nome
- Criar categoria: nome + cor (color picker) + ícone (seletor de lucide icons)
- Editar e excluir categorias customizadas
- Categorias padrão pré-criadas (não deletáveis):
  - Alimentação 🟠 · Transporte 🔵 · Saúde 🟢 · Moradia 🟣 · Lazer 🟡 · Educação 🔵 · Vestuário 🩷 · Investimentos 💛 · Salário 💚 · Outros ⚪

#### 5.4 Calendário Financeiro
- Visualização mensal (grid de dias)
- Cada dia exibe indicadores visuais: ponto verde (receita) e/ou ponto vermelho (gasto)
- Ao clicar no dia: painel lateral com lista das transações do dia
- **Modo planejamento:** permite adicionar transações agendadas para dias futuros (exibidas com opacidade reduzida e ícone de "programado")
- Navegação por mês com animação de slide
- Destaque visual para hoje

#### 5.5 Relatório Mensal (Obrigatório)
- Ao encerrar o mês, um **modal bloqueante** (não pode fechar sem preencher) solicita a finalização
- O usuário revisa todas as transações do mês e marca cada gasto como **NECESSÁRIO** ou **DESNECESSÁRIO**
- Após marcar todos, o sistema exibe um **resumo analítico:**
  - % de gastos necessários vs desnecessários
  - Top 3 categorias de maior gasto
  - Comparativo com o mês anterior
  - Insight automático gerado pelo sistema (ex.: "Você gastou 34% a mais em Lazer este mês")
  - Dica personalizada baseada nos padrões
- O relatório fica salvo e pode ser consultado no histórico

#### 5.6 Histórico de Transações
- Lista paginada com filtros: período · tipo · categoria · forma de pagamento · tag de necessidade
- Busca por descrição
- Ações por item: editar · excluir · duplicar
- Exportar como CSV (futuro)

#### 5.7 Configurações
- Nome do usuário e moeda (R$ padrão)
- Tema: Dark (padrão) · Light (futuro)
- Dados: exportar JSON · limpar dados
- Notificações (futuro): lembrete para registrar gastos diários

---

### 6. DESIGN SYSTEM — COMPONENTES

#### Sidebar (Desktop)
- Background `#0B1320`, largura 240px
- Logo Orbital Balance no topo (SVG + texto)
- Itens de nav com ícone Lucide + label
- Item ativo: borda esquerda dourada + texto dourado + background `#1C2A3A`
- Hover: transição suave de opacidade
- Rodapé: avatar/nome do usuário + botão de logout

#### Header (Mobile)
- Hamburger menu + logo centralizado + botão de ação rápida

#### Cards
- Background `#1C2A3A`, border-radius `12px`, sem borda padrão
- Cards de destaque: borda sutil `1px solid rgba(212, 175, 122, 0.2)`
- Hover: `box-shadow: 0 4px 24px rgba(212, 175, 122, 0.08)`
- Animação de entrada: `fadeInUp` via Framer Motion (staggered)

#### Botões
- Primary: background `#D4AF7A`, texto `#0B1320`, hover escurece 10%
- Secondary: borda `#D4AF7A`, texto `#D4AF7A`, background transparente
- Ghost: texto `#A7B0B8`, sem borda
- Todos com `border-radius: 8px` e transição `150ms ease`

#### Inputs
- Background `#0B1320`, borda `#1C2A3A`
- Focus: borda `#D4AF7A` com glow sutil `rgba(212,175,122,0.3)`
- Placeholder: `#A7B0B8`

#### Badges de Categoria
- Pill colorido com a cor da categoria em 20% de opacidade no background e 100% no texto/borda

#### Badges de Forma de Pagamento
```
Cartão → ícone CreditCard · cor azul-aço
Dinheiro → ícone Banknote · cor verde
Pix → ícone Zap · cor teal
Transferência → ícone ArrowLeftRight · cor roxo
```

---

### 7. ANIMAÇÕES (FRAMER MOTION + ACETERNITY UI)

- **Page transitions:** `AnimatePresence` com fade + slide de 20px
- **Cards no Dashboard:** stagger de 0.1s, `fadeInUp` (y: 20 → 0, opacity: 0 → 1)
- **Modal/Drawer de transação:** slide-in da direita (desktop) ou bottom (mobile)
- **Saldo principal:** contador animado (spring) ao mudar de valor
- **Gráficos:** animação de entrada do Recharts habilitada
- **Botão flutuante:** rotação de 45° no `+` ao abrir o seletor
- **Aceternity UI:** usar `BackgroundBeams` ou `SpotlightCard` na tela de login; `AnimatedNumber` no saldo

---

### 8. RESPONSIVIDADE

- **Mobile first:** todo layout projetado para 375px+
- **Sidebar** colapsa em drawer no mobile
- **Dashboard cards** em grid 1 col (mobile) → 2 col (tablet) → 4 col (desktop)
- **Formulários** em full-width no mobile, drawer lateral no desktop
- **Calendário** adapta célula para telas pequenas
- **Gráficos** reduzem para scroll horizontal no mobile

---

### 9. ESTADO GLOBAL (ZUSTAND)

```typescript
// useTransactionStore
{
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getByMonth: (month: number, year: number) => Transaction[];
  getBalance: () => number;
}

// useCategoryStore
{
  categories: Category[];
  addCategory: (c: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}

// useReportStore
{
  reports: MonthlyReport[];
  getPendingReport: () => { month: number; year: number } | null;
  finalizeReport: (month: number, year: number, tags: Record<string, NecessityTag>) => void;
}
```

Persistir todos os stores no `localStorage` usando o middleware `persist` do Zustand.

---

### 10. TELAS — ORDEM DE IMPLEMENTAÇÃO

Implemente nesta ordem para garantir base funcional antes de polish:

1. **Setup inicial** — configuração do Next.js, Tailwind (tokens de cor), shadcn/ui tema dark, fontes Montserrat
2. **Layout base** — Sidebar + Header + estrutura de rotas
3. **Tipos e Stores** — todos os tipos TS + stores Zustand com persistência
4. **Dashboard** — cards de saldo + últimas transações (mock data)
5. **Formulário de transação** — modal completo funcional (gasto + receita)
6. **Categorias** — listagem e CRUD
7. **Gráficos** — integração Recharts no dashboard
8. **Histórico** — lista com filtros e busca
9. **Calendário** — visualização mensal com transações
10. **Relatório mensal** — modal bloqueante + análise
11. **Polish** — animações Framer Motion, Aceternity UI, responsividade completa
12. **Dicas financeiras** — sistema de insights baseado nos dados do usuário

---

### 11. DICAS FINANCEIRAS INTELIGENTES

O sistema deve gerar insights automáticos baseados nos dados locais do usuário. Exemplos de regras:

- Se gastos desnecessários > 30% do total → "Você classificou X% dos seus gastos como desnecessários este mês. Revise seus hábitos em [categoria top]."
- Se sem receita recorrente cadastrada → "Configure sua receita recorrente para ter projeções mais precisas."
- Se gasto de uma categoria aumentou >20% em relação ao mês anterior → "Seus gastos com [categoria] cresceram X% esse mês."
- Se saldo negativo → alerta vermelho em destaque no dashboard
- Se usuário não registra há 3+ dias → lembrete no banner

---

### 12. PREPARAÇÃO PARA ESCALA (FUTURO)

Escreva o código preparado para estas evoluções sem implementá-las agora:

- **Autenticação:** estrutura de rotas `(auth)` já prevista, estado de usuário no Zustand preparado para JWT/session
- **Backend:** os stores devem ter uma camada de abstração (hooks `useTransactions` etc.) que hoje chama o store local, mas amanhã pode chamar uma API via React Query
- **Multi-conta:** `Transaction` e `Category` devem ter `userId` no tipo mesmo que não usado no MVP
- **Plano Premium:** comentários `// [PREMIUM]` nas funcionalidades que seriam pagas (exportação avançada, IA, relatórios ilimitados, sincronização multi-device)
- **PWA:** configurar `next-pwa` básico para installability

---

### 13. QUALIDADE DE CÓDIGO

- Todos os componentes com TypeScript strict, sem `any`
- Funções utilitárias puras e testáveis em `lib/`
- Nomes em inglês no código, labels/textos em português (pt-BR)
- Moeda formatada sempre como `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Datas com `date-fns` (locale pt-BR)
- Nenhum `console.log` no código final
- Componentes com responsabilidade única, máximo ~150 linhas

---

### 14. ENTREGÁVEIS ESPERADOS

Ao final, o projeto deve conter:

- [ ] WebApp funcional com todas as 12 telas implementadas
- [ ] Dados persistidos em localStorage (sem perda ao recarregar)
- [ ] Layout 100% responsivo mobile/tablet/desktop
- [ ] Identidade visual Orbital Balance aplicada fielmente
- [ ] Todas as animações implementadas
- [ ] Zero erros de TypeScript em `strict` mode
- [ ] README com instruções de setup

---

*Orbital Balance — "Planeje. Acompanhe. Evolua."*
