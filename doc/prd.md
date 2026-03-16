# 📋 Documento de Requisitos do Produto (PRD) – Marolo App
**Versão: 2.0** (Nomenclatura PT-BR + Tech Stack Moderno)

---

## 1. Visão Geral (Overview)

**Marolo App** é uma plataforma web de **gestão completa de times amadores de futebol**. O sistema permite que gerenciadores de times (técnicos, capitães) organizem jogadores, controlem presença, registrem gols/assistências, gerenciem caixa/pagamentos e acompanhem estatísticas em tempo real.

**Diferencial:** Dashboard inteligente com analisa performances e gera insights sobre o time.

---

## 2. Metas do Projeto

### 2.1 Funcionalidades Essenciais
- ✅ **Gestão de Jogadores:** CRUD completo com histórico de participação
- ✅ **Controle de Presença:** Check-in manual pelo admin
- ✅ **Estatísticas:** Gols, assistências, cartões, avaliação de performance
- ✅ **Caixa Financeiro:** Entrada/saída, pagamentos, multas, inadimplência
- ✅ **Agendamento de Jogos:** Data, hora, adversário, local, formação esperada
- ✅ **Autenticação Segura:** 2 tipos de acesso com loguin e senha: Jogador e Presidente. Jogador permissao view, Presidente permissao admin geral.

### 2.2 Features Premium (Roadmap)
- 📊 **Dashboard com Gráficos:** Recharts + dados
- 📱 **App Mobile:** React Native (reutiliza lógica do frontend)
- 📸 **Foto de Ação:** Upload de fotos de perfil dos jogadores atuais
- 📄 **Relatórios em PDF:** Gerar boletins mensais

### 2.3 Performance e UX
- **Carregamento:** <2s em conexão 4G (Lighthouse 90+)
- **Responsividade:** Mobile-first, funcional em todos os tamanhos
- **Acessibilidade:** WCAG 2.1 AA (contraste, navegação por teclado)
- **Offline Mode:** PWA com sincronização quando voltar online

---

## 3. Stack Tecnológica

### Frontend
| Ferramenta | Versão | Uso |
|-----------|--------|-----|
| **React** | 18+ | Biblioteca principal |
| **Vite** | 5+ | Build ultra rápido |
| **TypeScript** | 5+ | Type-safe |
| **TailwindCSS** | 3+ | Estilização |
| **Shadcn/UI** | Latest | Componentes acessíveis |
| **Recharts** | Latest | Gráficos responsivos |
| **React Query (TanStack)** | Latest | Cache de dados |
| **Zod** | Latest | Validação de schemas |
| **React Hook Form** | Latest | Formulários otimizados |
| **Framer Motion** | Latest | Animações suaves |

### Backend / BaaS
| Serviço | Uso |
|--------|-----|
| **Supabase** | PostgreSQL + Auth + Realtime |
| **PostgreSQL** | Banco relacional (int8 PKs) |
| **Supabase Storage** | Imagens, vídeos, documentos |
| **Supabase Realtime** | Sync em tempo real (presença, chat) |

### DevOps / Deploy
| Serviço | Uso |
|--------|-----|
| **Vercel** | Frontend deploy (CI/CD automático) |
| **Railway/Render** | Serverless functions (opcional) |
| **GitHub Actions** | Testes automatizados |
| **Cloudflare** | CDN + DDoS protection |

---

## 4. Estrutura de Páginas e Fluxo

### 4.1 Autenticação (Rota: /auth)
```
├─ /auth/login → Magic Link ou Google OAuth
├─ /auth/callback → Valida token e redireciona
└─ /auth/2fa (Futura) → Verificação em 2 fatores
```

**Fluxo:**
1. Usuário preencher user e senha
2. Supabase autentica
3. Tabela `perfis` é criada automaticamente via trigger
4. Redirecionamento para `/dashboard`

---

### 4.2 Dashboard (Rota: /dashboard)
**Visão:** Resumo executivo do time

**Componentes:**
```
┌─────────────────────────────────┐
│  Header: Nome do Time + Avatar   │
├─────────────────────────────────┤
│ KPIs (Cards)                    │
│  ├─ 15 Jogadores                │
│  ├─ 5 Pagamentos Pendentes      │
│  ├─ R$ 2.340 em Caixa          │
│  └─ Próximo Jogo: 15/03 19:00  │
├─────────────────────────────────┤
│ Gráficos (Row 1)                │
│  ├─ Artilheiros (Top 5)        │
│  └─ Assists (Top 5)            │
├─────────────────────────────────┤
│ Tabela de Presença (Últimas 3)  │
│ Jogo | Data | Presentes | Total │
├─────────────────────────────────┤
│ Ações Rápidas (Botões)          │
│  ├─ + Novo Jogo                │
│  ├─ + Novo Jogador             │
│  └─ 📊 Ver Estatísticas        │
└─────────────────────────────────┘
```

**Dados Renderizados:**
- KPIs dinâmicos do Supabase (queries em tempo real)
- Gráficos via Recharts
- Tabela virtual (react-window) para performance

---

### 4.3 Jogadores (Rota: /players)
**Visão:** CRUD + Gerenciamento completo

**Sub-rotas:**
```
/players              → Listagem com filtro, busca e paginação
/players/[id]        → Perfil detalhado (histórico, stats)
/players/[id]/edit   → Edição inline ou modal
/players/import      → Importar via CSV
```

**Componentes:**
- Tabela com DataTable pattern (sort, filter, search)
- Modal de criação/edição
- Componente de upload de foto
- Histórico de presença/gols por jogador
- Exportar para CSV/PDF

**Features:**
- ✨ Busca por nome em tempo real
- 🏆 Ordenar por gols, assists, presença
- 📸 Avatar opcional com crop automático
- 🏷️ Tags customizáveis (Capitão, Reserva, Lesionado)
- 📊 Mini gráfico de performance inline

---

### 4.4 Jogos (Rota: /games)
**Visão:** Agendamento e gerenciamento de partidas

**Sub-rotas:**
```
/games              → Calendario + Lista
/games/[id]         → Detalhes do jogo (formação, presença, stats)
/games/[id]/edit    → Edição de jogo
/games/new          → Criar novo jogo
```

**Componentes:**
```
┌──────────────────────────────────┐
│ Calendario (Mini) | Lista        │
├──────────────────────────────────┤
│ Jogo Selecionado                │
│  ├─ Data/Hora/Local             │
│  ├─ Adversário                  │
│  ├─ Formação (4-3-3, etc)       │
│  ├─ Resultado (Pós-jogo)        │
│  └─ Notas/Observações           │
├──────────────────────────────────┤
│ Presença do Jogo                │
│  ├─ Jogador | Presença | Gols   │
│  └─ (Check-in individual)       │
├──────────────────────────────────┤
│ Ações                           │
│  ├─ Registrar Presença          │
│  ├─ Editar Formação             │
│  ├─ Finalizar Jogo              │
│  └─ Gerar Relatório             │
└──────────────────────────────────┘
```

**Features:**
- 📅 Calendario visual
- 🎯 Seleção de formação (dropdown predefinida)
- ✅ Check-in por jogador (modal simples)
- 📊 Pré-visualização de presença
- 🔗 Copiar link para compartilhar jogo com elenco

---

### 4.5 Presença & Gols (Rota: /attendance)
**Visão:** Registro detalhado de performance

**Sub-rotas:**
```
/attendance              → Filtrar por jogo
/attendance/[gameId]    → Detalhes do jogo + formulário
/attendance/report      → Relatório agregado
```

**Componentes:**
```
Seletor de Jogo
    ↓
Tabela de Presença:
  Jogador | Presente? | Gols | Assists | Cartões | Notas
    ↓
Edição Inline (clica na célula para editar)
    ↓
Salva automaticamente (Optimistic Update)
```

**Features:**
- ⚽ Contador de gols por jogador
- 🎯 Contador de assistências
- 🟨 Cartões (amarelo/vermelho)
- 📝 Notas de performance
- 🔄 Edição inline com autosave
- 📊 Resumo estatístico do jogo

---

### 4.6 Caixa Financeiro (Rota: /cash)
**Visão:** Controle de entradas/saídas

**Sub-rotas:**
```
/cash           → Dashboard financeiro
/cash/history   → Histórico completo
/cash/report    → Relatório mensal
```

**Componentes:**
```
┌──────────────────────────────┐
│ Saldo Atual: R$ 2.340,50     │
├──────────────────────────────┤
│ Entradas | Saídas | Resultado│
│   15     |   10   |    +5    │
├──────────────────────────────┤
│ Gráfico: Fluxo (últimos 30d) │
├──────────────────────────────┤
│ Movimentações Recentes       │
│ Data | Tipo | Descrição | Vlr │
└──────────────────────────────┘
```

**Features:**
- 💰 Entrada: Mensalidade, taxa, venda
- 📤 Saída: Aluguel, material, combustível
- 🏦 Saldo em tempo real
- 📊 Gráfico de fluxo (Recharts)
- 🔍 Filtro por período/tipo
- 📄 Exportar relatório PDF
- 🔔 Alerta se saldo negativo

---

### 4.7 Pagamentos (Rota: /payments)
**Visão:** Controle de mensalidades e dívidas

**Sub-rotas:**
```
/payments              → Listagem com filtros
/payments/[playerId]   → Histórico do jogador
/payments/report       → Relatório de inadimplência
```

**Tabela:**
```
Jogador | Status | Mês | Vencimento | Ações
```

**Status:** ✅ Pago | ⏳ Vencendo | ⚠️ Vencido

**Features:**
- 🔴 Marcador visual (cor por status)
- 📧 Notificar jogador (futura integração WhatsApp)
- 🧮 Calcular juros automaticamente (configurable)
- 📊 Relatório de inadimplência
- 💾 Marcar como pago
- 📄 Gerar comprovante/recibo

---

### 4.8 Estatísticas (Rota: /stats)
**Visão:** Análise profunda de dados

**Sub-rotas:**
```
/stats               → Overview geral
/stats/players       → Rankings por métrica
/stats/games         → Análise por jogo
/stats/trends        → Tendências (últimos 30/60/90 dias)
```

**Métricas Principais:**
- ⚽ **Gols:** Total, média por jogo, sequência
- 🎯 **Assistências:** Total, média, top assister
- 📊 **Presença:** %, tendência (aumentando/diminuindo?)
- 🏆 **Avaliação:** Score agregado (futuro: baseado em IA)
- 🔴 **Cartões:** Total por jogador
- 🎮 **Performance:** Gols+Assists, índice de eficiência

**Componentes:**
- Tabelas rankéadas
- Gráficos (linha, barra, pizza)
- Filtros por período
- Exportar dados
- Comparação jogador vs time

---

### 4.9 Configurações (Rota: /settings)
**Visão:** Personalizações do time

**Sub-rotas:**
```
/settings/profile      → Nome, logo, descrição do time
/settings/members      → Papéis e permissões
/settings/billing      → Plano, pagamento (futura)
/settings/integrations → Webhooks, API keys
/settings/appearance   → Tema, cores customizadas
```

**Features:**
- 🎨 Customização de cores (Glassmorphism override)
- 👥 Controle de papéis (Admin, Técnico, Jogador)
- 🔑 API key para integrações
- 🗑️ Deletar conta e dados
- 📋 Exportar dados completo (GDPR)

---

## 5. Modelo de Dados (Schema PostgreSQL)

### Nomenclatura
- **PK:** `int8` (BigInt, auto-increment via `generated by default as identity`)
- **FK:** `int8` para relações internas, `uuid` para auth.users
- **Padrão:** Minúsculas, snake_case, PT-BR

---

### 5.1 Tabela: `perfis`
**Descrição:** Dados do time

```sql
CREATE TABLE perfis (
  id int8 PRIMARY KEY generated by default as identity,
  usuario_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_time text NOT NULL,
  slug text NOT NULL UNIQUE,
  descricao text,
  logo_url text,
  configuracao_tema jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Exemplo `configuracao_tema`:**
```json
{
  "cor_primaria": "#8b5cf6",
  "cor_secundaria": "#ec4899",
  "fundo_personalizado": "#0f172a"
}
```

---

### 5.2 Tabela: `jogadores`
**Descrição:** Elenco do time

```sql
CREATE TABLE jogadores (
  id int8 PRIMARY KEY generated by default as identity,
  perfil_id int8 NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  nome text NOT NULL,
  posicao text,
  numero_camisa int2,
  avatar_url text,
  data_nascimento date,
  telefone text,
  email text,
  tags jsonb,
  ativo bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(perfil_id, email)
);
```

**Exemplo `tags`:**
```json
["Capitão", "Defensor"]
```

---

### 5.3 Tabela: `jogos`
**Descrição:** Partidas agendadas/realizadas

```sql
CREATE TABLE jogos (
  id int8 PRIMARY KEY generated by default as identity,
  perfil_id int8 NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  data_hora timestamptz NOT NULL,
  adversario text NOT NULL,
  local text,
  resultado jsonb,
  formacao text,
  notas text,
  status text DEFAULT 'agendado', -- agendado, realizado, cancelado
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Exemplo `resultado`:**
```json
{
  "gols_nossos": 3,
  "gols_adversario": 1,
  "vencido": true
}
```

---

### 5.4 Tabela: `presencas`
**Descrição:** Registro de presença + stats por jogo

```sql
CREATE TABLE presencas (
  id int8 PRIMARY KEY generated by default as identity,
  jogo_id int8 NOT NULL REFERENCES jogos(id) ON DELETE CASCADE,
  jogador_id int8 NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
  presente bool DEFAULT true,
  gols int2 DEFAULT 0,
  assistencias int2 DEFAULT 0,
  cartoes jsonb, -- {"amarelo": 1, "vermelho": 0}
  notas text,
  avaliacao int2, -- 1-10 (futuro: IA)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(jogo_id, jogador_id)
);
```

**Exemplo `cartoes`:**
```json
{
  "amarelo": 1,
  "vermelho": 0
}
```

---

### 5.5 Tabela: `caixa`
**Descrição:** Movimentações financeiras

```sql
CREATE TABLE caixa (
  id int8 PRIMARY KEY generated by default as identity,
  perfil_id int8 NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- entrada, saida
  categoria text, -- mensalidade, taxa, aluguel, etc
  descricao text NOT NULL,
  valor numeric(10, 2) NOT NULL,
  data_movimento date NOT NULL,
  metodo_pagamento text, -- dinheiro, pix, transferencia
  comprovante_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

### 5.6 Tabela: `pagamentos`
**Descrição:** Mensalidades dos jogadores

```sql
CREATE TABLE pagamentos (
  id int8 PRIMARY KEY generated by default as identity,
  perfil_id int8 NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  jogador_id int8 NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
  mes int2 NOT NULL, -- 1-12
  ano int2 NOT NULL,
  valor numeric(10, 2) NOT NULL DEFAULT 100.00,
  status text DEFAULT 'pendente', -- pendente, pago, vencido
  data_vencimento date,
  data_pagamento date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(perfil_id, jogador_id, mes, ano)
);
```

---

### 5.7 Tabela: `membros` (Opcional - Para permissões)
**Descrição:** Usuários com acesso ao time (futura escalabilidade)

```sql
CREATE TABLE membros (
  id int8 PRIMARY KEY generated by default as identity,
  perfil_id int8 NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  papel text DEFAULT 'jogador', -- admin, tecnico, capitao, jogador
  created_at timestamptz DEFAULT now(),
  UNIQUE(perfil_id, usuario_id)
);
```

---

## 6. Segurança (RLS - Row Level Security)

### Política: `perfis` (Pública para leitura, privada para escrita)
```sql
-- Ler (SELECT): Qualquer um
CREATE POLICY read_all ON perfis
  FOR SELECT USING (true);

-- Criar (INSERT): Apenas o usuário
CREATE POLICY create_own ON perfis
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Editar (UPDATE): Apenas o dono
CREATE POLICY update_own ON perfis
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Deletar (DELETE): Apenas o dono
CREATE POLICY delete_own ON perfis
  FOR DELETE USING (auth.uid() = usuario_id);
```

### Política: `jogadores`, `jogos`, `presencas`, `caixa`, `pagamentos`
```sql
-- Ler (SELECT): Qualquer um
CREATE POLICY read_all ON jogadores
  FOR SELECT USING (true);

-- Modificar (INSERT/UPDATE/DELETE): Apenas admin do time
CREATE POLICY modify_own ON jogadores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = jogadores.perfil_id
      AND perfis.usuario_id = auth.uid()
    )
  );

CREATE POLICY update_own ON jogadores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = jogadores.perfil_id
      AND perfis.usuario_id = auth.uid()
    )
  );

CREATE POLICY delete_own ON jogadores
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = jogadores.perfil_id
      AND perfis.usuario_id = auth.uid()
    )
  );
```

**Repetir padrão para:** `jogos`, `presencas`, `caixa`, `pagamentos`

---

## 7. UI/UX Guidelines (Dark/Neon Professional)

### Paleta de Cores
```css
/* Escuro Base */
--bg-primary: #0f172a;    /* slate-950 */
--bg-secondary: #1e293b;  /* slate-800 */
--bg-tertiary: #334155;   /* slate-700 */

/* Neon Accent */
--accent-primary: #8b5cf6;    /* violet-500 */
--accent-secondary: #ec4899;  /* pink-500 */
--success: #10b981;           /* green-500 */
--warning: #f59e0b;           /* amber-500 */
--danger: #ef4444;            /* red-500 */

/* Texto */
--text-primary: #f1f5f9;      /* slate-100 */
--text-secondary: #cbd5e1;    /* slate-300 */
--text-muted: #94a3b8;        /* slate-400 */
```

### Componentes Base

#### Card/Bloco
```jsx
<div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 hover:border-violet-500/50 transition-colors">
  {content}
</div>
```

#### Botão Primário
```jsx
<button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-xl transition-all">
  Ação
</button>
```

#### Input
```jsx
<input 
  className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
  placeholder="Digite..."
/>
```

#### Tabela
```jsx
<table className="w-full">
  <thead className="border-b border-slate-700">
    <tr className="text-slate-400 text-sm">
      <th className="text-left py-3">{header}</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-800">
    {rows}
  </tbody>
</table>
```

### Padrões de Interação

1. **Hover:** Brilho na borda (border-violet-500/50)
2. **Ativo:** Fundo mais claro (bg-slate-800/50)
3. **Disabled:** Opacidade 50% (opacity-50)
4. **Loading:** Skeleton ou spinner
5. **Error:** Badge vermelha com ícone de alerta

---

## 8. Fluxos de Negócio (User Stories)

### US-001: Criar time e primeiro time de jogadores
```gherkin
Scenario: Novo usuário completa onboarding
  Given Usuário logado pela primeira vez
  When Clica "Criar novo time"
  Then Preenche nome, descrição e logo
  And Sistema cria entry em `perfis` automaticamente
  And Redirecionado para upload de elenco (CSV ou manual)
  And 10 primeiros jogadores criados
  Then Dashboard carrega com KPIs vazios
```

### US-002: Agendar jogo e registrar presença
```gherkin
Scenario: Técnico agenda jogo e registra stats
  Given Dashboard aberto
  When Clica "+ Novo Jogo"
  Then Modal solicita: data, hora, adversário, local
  And Salva em `jogos` com status 'agendado'
  And Quando dia do jogo chega, técnico acessa `/games/[id]`
  Then Formulário para marcar presença por jogador
  And Registra gols, assists, cartões
  And Salva em `presencas` com timestamp
  Then Dashboard atualiza automaticamente (gráficos, ranks)
```

### US-003: Controlar caixa e pagamentos
```gherkin
Scenario: Tesoureiro registra entrada/saída e cobra mensalidade
  Given Usuário em /cash
  When Clica "+ Nova Movimentação"
  Then Preenche: tipo, categoria, valor, data, método
  And Salva em `caixa`
  And Saldo atualiza em tempo real
  
  Given Usuário em /payments
  When Mês novo começa, sistema cria 15 linhas `pagamentos` (um por jogador)
  Then Status inicial: 'pendente'
  And Técnico clica jogador e marca como 'pago'
  And Dashboard mostra gráfico de inadimplência
  And Relatório PDF pode ser gerado
```

### US-004: Analisar performance (IA futura)
```gherkin
Scenario: Técnico visualiza stats e insights
  Given Usuário em /stats
  When Abre tabela de artilheiros
  Then Ranking: nome, total_gols, media_por_jogo, tendencia
  And Tendencia = ↗ (aumentando) ou ↘ (diminuindo)
  
  When Clica em jogador
  Then Gráfico de evolução dos últimos 30 dias
  And Comparação com média do time
  And (Futura IA): "Desempenho em alta. Continue escalando."
```

---

## 9. Instruções Técnicas para Desenvolvedor

### 9.1 Arquitetura de Componentes
```
src/
├── components/
│   ├── common/          (Reutilizáveis)
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   └── Button.tsx
│   ├── dashboard/       (Dashboard specific)
│   │   ├── KPICard.tsx
│   │   ├── ChartTopScorers.tsx
│   │   └── RecentGames.tsx
│   ├── players/
│   │   ├── PlayerTable.tsx
│   │   ├── PlayerForm.tsx
│   │   └── PlayerCard.tsx
│   └── ... (por feature)
├── pages/
│   ├── Dashboard.tsx
│   ├── Players.tsx
│   ├── Games.tsx
│   └── ...
├── hooks/              (Custom hooks)
│   ├── useAuth.ts
│   ├── usePlayer.ts
│   └── useQuery.ts
├── services/           (API calls)
│   ├── playerService.ts
│   ├── gameService.ts
│   └── statsService.ts
├── lib/                (Utilities)
│   ├── supabase.ts
│   ├── validation.ts
│   └── formatters.ts
└── types/
    └── index.ts        (Interfaces)
```

### 9.2 Padrões de Desenvolvimento

#### Query com React Query
```typescript
// hooks/usePlayers.ts
export function usePlayers(perfilId: number) {
  return useQuery({
    queryKey: ['players', perfilId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jogadores')
        .select('*')
        .eq('perfil_id', perfilId)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });
}
```

#### Mutation com Optimistic Update
```typescript
// hooks/useCreatePlayer.ts
export function useCreatePlayer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dados: Jogador) => {
      const { data, error } = await supabase
        .from('jogadores')
        .insert([dados])
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}
```

#### Validação com Zod
```typescript
// lib/validation.ts
export const playerSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  posicao: z.string(),
  numero_camisa: z.number().min(1).max(99),
  email: z.string().email().optional(),
});

type Player = z.infer<typeof playerSchema>;
```

### 9.3 Performance

#### Code Splitting
```typescript
// pages/Dashboard.tsx
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ChartTopScorers = dynamic(() => import('@/components/dashboard/ChartTopScorers'), {
  loading: () => <Skeleton className="w-full h-64" />,
});
```

#### Memoization
```typescript
export const PlayerTable = React.memo(({ players }: Props) => {
  return <table>{/* ... */}</table>;
});
```

#### Virtual Scrolling (Listas grandes)
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={jogadores.length}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>{jogadores[index].nome}</div>
  )}
</FixedSizeList>
```

### 9.4 Boas Práticas

✅ **Sempre validar dados JSONB antes de renderizar**
```typescript
const conteudo = JSON.parse(bloco.conteudo);
if (!conteudo.gols) conteudo.gols = 0; // Default
```

✅ **Usar `clsx` para classes condicionais**
```typescript
const cardClass = clsx(
  'rounded-lg p-4',
  {
    'bg-green-500': status === 'pago',
    'bg-red-500': status === 'vencido',
  }
);
```

✅ **Implementar Error Boundary**
```typescript
<ErrorBoundary fallback={<ErrorPage />}>
  <Dashboard />
</ErrorBoundary>
```

✅ **Usar Optimistic Updates para melhor UX**
```typescript
const mutation = useMutation({
  mutationFn: updateJogador,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['jogador', id] });
    const previous = queryClient.getQueryData(['jogador', id]);
    queryClient.setQueryData(['jogador', id], newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['jogador', id], context?.previous);
  },
});
```

---

## 10. Roadmap (Próximas Versões)

### v2.1 (2024-04)
- [ ] Sistema de permissões (roles: admin, técnico, jogador)
- [ ] Notificações por Email (Resend)
- [ ] Gráficos avançados (Recharts)
- [ ] Exportar relatório PDF (jsPDF)

### v2.2 (2024-05)
- [ ] Chat em tempo real (Supabase Realtime)
- [ ] App Mobile (React Native)
- [ ] Upload de fotos de jogo
- [ ] Integração com WhatsApp (Twilio)

### v2.3 (2024-06)
- [ ] IA Advisor (Claude API)
- [ ] Sugestão de formações
- [ ] Análise de performance com IA
- [ ] Badges e achievements (gamificação)

### v3.0 (2024-Q3)
- [ ] Modo competição (campeonatos)
- [ ] Marketplace de times (encontrar amigos)
- [ ] Sistema de pagamento integrado (Stripe)
- [ ] 2FA e segurança avançada

---

## 11. Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| Lighthouse Score | 90+ |
| Load Time (First Contentful Paint) | < 2s |
| Mobile Responsiveness | 100% |
| Uptime | 99.9% |
| User Retention (30 dias) | 70%+ |
| Bugs Críticos/mês | < 2 |
| Test Coverage | 80%+ |

---

## 12. Conclusão

Marolo App é uma plataforma robusta para gestão de times de futebol amador, combinando **facilidade de uso** com **poder de análise**. O roadmap garante evolução contínua, com foco em **IA, mobile e integração social** nos próximos trimestres.

**Stack escolhida** é **escalável**, **performática** e **maintível**, preparando o projeto para crescimento futuro.

---

**Versão:** 2.0  
**Data:** 2024-03-15  
**Autor:** Tech Team  
**Status:** ✅ Aprovado para Desenvolvimento