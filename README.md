# ResumeOps

ResumeOps avalia o quão bem um perfil profissional se encaixa em uma vaga e gera, com IA, um currículo (ATS-friendly) adaptado para aquela vaga específica.

Fluxo principal: o usuário cola a descrição de uma vaga (ou usa a extensão de Chrome para capturar de LinkedIn/Gupy/Greenhouse/Lever/Ashby) → a IA avalia o fit contra o perfil cadastrado → se o fit for bom, gera um currículo customizado em PDF, pronto para envio.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Prisma** + **PostgreSQL** (Neon)
- **Clerk** — autenticação
- **Stripe** — cobrança/assinatura (plano PRO)
- **Anthropic Claude** — avaliação de vaga, geração de currículo e parsing de CV
- **next-intl** — i18n (en, pt-BR, es)
- **Browserless** — renderização de HTML em PDF
- Extensão de Chrome (Manifest V3 + Vite + React) em `chrome-extension/`

## Estrutura

```
app/
  (auth)/            páginas de login/cadastro (Clerk)
  (dashboard)/        dashboard, vagas, tracker, perfil, configurações
  api/                 rotas da API (jobs, profile, applications, billing, webhooks, extensão)
components/            componentes de UI por domínio (profile, jobs, tracker, billing, settings)
lib/
  ai/                  cliente Anthropic e prompts (avaliar vaga, gerar currículo, parsear CV)
  db/                  cliente Prisma
  pdf/                 geração e normalização (ATS) de PDF
  validation/          schemas zod para as rotas da API
  quota.ts             limites de uso por plano (FREE/PRO)
  stripe.ts            checkout e webhook
i18n/ messages/         configuração e dicionários de tradução
prisma/schema.prisma    modelo de dados
templates/              template HTML do currículo
chrome-extension/       extensão de Chrome (projeto independente, com seu próprio package.json)
```

## Como funciona

1. **Perfil** (`/profile`): o usuário cadastra experiências, skills, educação e preferências (remoto, faixa salarial, cargos-alvo), manualmente ou importando de um texto/PDF de currículo existente (`/api/profile/import`, `/api/profile/import-pdf`).
2. **Avaliação de vaga** (`/api/jobs`, `/api/jobs/[id]/evaluate`): o texto da vaga é comparado ao perfil pela IA, que retorna score de fit, gaps e sugestões — respeitando o limite mensal do plano (`lib/quota.ts`).
3. **Geração de currículo** (`/api/jobs/[id]/resume`): disponível no plano PRO, gera um currículo direcionado à vaga a partir do relatório de fit.
4. **PDF** (`/api/jobs/[id]/pdf`): normaliza o HTML para ATS e renderiza em PDF via Browserless.
5. **Tracker** (`/tracker`): kanban de status das candidaturas (Avaliado → Aplicado → Entrevista → Oferta/Rejeitado).
6. **Extensão de Chrome**: captura a descrição da vaga direto da página e chama `/api/extension/evaluate` autenticado via token do Clerk.

## Setup local

```bash
npm install
cp .env.example .env   # preencha as chaves abaixo
npx prisma migrate dev
npm run dev
```

### Variáveis de ambiente

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | autenticação (Clerk) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | fluxo de redirecionamento do Clerk |
| `DATABASE_URL`, `DIRECT_DATABASE_URL` | conexão com Postgres (Neon) |
| `ANTHROPIC_API_KEY` | chamadas à IA (avaliação, geração de currículo, parsing de CV) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` | cobrança e assinatura PRO |
| `BROWSERLESS_TOKEN` | renderização de PDF |
| `NEXT_PUBLIC_DOMAIN` | domínio público usado em URLs de checkout/redirect e liberado como origem de Server Actions |

### Scripts

```bash
npm run dev      # ambiente de desenvolvimento
npm run build    # build de produção (roda lint + typecheck)
npm run start    # serve o build de produção
npm run lint     # ESLint
```

### Extensão de Chrome

```bash
cd chrome-extension
npm install
npm run dev      # build com watch
```

Depois carregue a pasta `chrome-extension/dist` como extensão "unpacked" em `chrome://extensions`.

## Banco de dados

Modelo em `prisma/schema.prisma`: `User` → `Profile` (1:1), `Job` (N) → `ResumeVersion` (N) e `Application` (1:1 por vaga). Planos (`FREE`/`PRO`) controlam os limites de avaliações e geração de currículo (`lib/quota.ts`).
