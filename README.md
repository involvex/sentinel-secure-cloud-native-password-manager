# Sentinel Vault

[![[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/involvex/sentinel-secure-cloud-native-password-manager)]](https://deploy.workers.cloudflare.com)

A production-ready full-stack application template built on Cloudflare Workers, featuring a React frontend with shadcn/ui, Hono backend, and Durable Objects for scalable entity storage. Demonstrates real-time chat boards, user management, and indexed listings with seamless edge deployment.

## ✨ Features

- **Full-Stack Architecture**: React + TypeScript frontend with TanStack Query for data fetching, Hono-powered API routes on Cloudflare Workers.
- **Durable Objects Storage**: Entity-based persistence (Users, ChatBoards) with automatic indexing, pagination, and seed data.
- **Modern UI**: shadcn/ui components, Tailwind CSS, dark mode, responsive design with animations.
- **Type-Safe**: End-to-end TypeScript with shared types, Workers types generation.
- **Development Workflow**: Vite for fast HMR, Bun for package management, automatic error reporting.
- **Production-Ready**: CORS, logging, health checks, client error reporting, SPA routing.
- **Scalable**: Global Durable Object for KV-like storage across entities, concurrent-safe mutations.

## 🛠️ Technology Stack

- **Backend**: Cloudflare Workers, Hono, Durable Objects
- **Frontend**: React 18, TypeScript, Vite, React Router, TanStack Query
- **UI/UX**: shadcn/ui, Tailwind CSS, Lucide icons, Framer Motion, Sonner toasts
- **Data**: Zod validation (extensible), Immer for state
- **Dev Tools**: Bun, ESLint, Wrangler, Cloudflare Vite plugin

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) (recommended package manager)
- [Cloudflare CLI (Wrangler)](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare account (free tier sufficient)

### Installation
```bash
bun install
```

### Development
```bash
# Generate Worker types (one-time)
bun run cf-typegen

# Start dev server (frontend + worker proxy)
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) (or `$PORT`).

### Build for Production
```bash
bun run build
```

## 📚 Usage

### API Endpoints
All routes under `/api/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | GET | List users (paginated) |
| `/api/users` | POST | Create user `{ name: string }` |
| `/api/chats` | GET | List chats |
| `/api/chats` | POST | Create chat `{ title: string }` |
| `/api/chats/:chatId/messages` | GET | List messages |
| `/api/chats/:chatId/messages` | POST | Send message `{ userId: string, text: string }` |
| `/api/health` | GET | Health check |

**Frontend Data Fetching**: Uses `api()` utility with TanStack Query hooks (extensible in `src/lib/api-client.ts`).

### Custom Routes
Extend `worker/user-routes.ts` and add new entities in `worker/entities.ts` (follow `UserEntity`, `ChatBoardEntity` patterns).

### UI Customization
- Edit `src/pages/HomePage.tsx` for main content.
- Use `AppLayout` for sidebar layouts.
- shadcn/ui components available in `src/components/ui/`.

## ☁️ Deployment

Deploy to Cloudflare Workers in one command:

```bash
bun run deploy
```

Or manually:
```bash
bun run build
npx wrangler deploy
```

**Instant Deploy**:
[[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/involvex/sentinel-secure-cloud-native-password-manager)]

**Custom Domain**: Update `wrangler.jsonc` and run `wrangler deploy --name your-app`.

**Environment Variables**: Set via Wrangler secrets (`wrangler secret put KEY`).

## 🤝 Contributing

1. Fork and clone.
2. Install: `bun install`.
3. Develop: `bun run dev`.
4. PR to `main`.

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.