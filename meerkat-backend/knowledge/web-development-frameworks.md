# Web Development Frameworks

Web development encompasses building websites and web applications using frontend, backend, and full-stack technologies. Modern frameworks and tools enable rapid development of performant, scalable applications.

## Frontend Frameworks

### React
- Component-based UI library by Meta (most widely used)
- JSX: write HTML-like syntax in JavaScript
- Virtual DOM for efficient rendering
- Hooks: useState, useEffect, useContext, useMemo, useCallback
- React 19: Server Components, Actions, use() hook
- Ecosystem: React Router, Redux/Zustand, React Query/TanStack Query
- Create React App (legacy), Vite (modern) for project setup

### Next.js
- Full-stack React framework by Vercel
- Server-side rendering (SSR) and static site generation (SSG)
- App Router: file-based routing with layouts and nested routes
- Server Components by default, Client Components when needed
- API routes for backend functionality
- Image optimization, font optimization, SEO metadata API
- Edge runtime for globally distributed compute

### Vue.js
- Progressive framework, incrementally adoptable
- Composition API (modern) and Options API (classic)
- Single-file components (.vue files)
- Reactive data binding with refs and computed properties
- Nuxt.js: full-stack Vue framework (like Next.js for React)
- Smaller learning curve than React for beginners

### Svelte / SvelteKit
- Compiles to vanilla JavaScript (no virtual DOM)
- Less boilerplate than React or Vue
- Reactive by default (no useState equivalent needed)
- SvelteKit: full-stack framework with SSR, routing, adapters
- Growing adoption for performance-critical applications

### Angular
- Full-featured framework by Google
- TypeScript-first, opinionated structure
- RxJS for reactive programming
- Dependency injection, modules, decorators
- Best for large enterprise applications
- Steeper learning curve but comprehensive tooling

## Backend Frameworks

### Hono
- Ultra-fast web framework for edge and serverless
- Works on Bun, Deno, Node.js, Cloudflare Workers, AWS Lambda
- Middleware-based (similar to Express but faster)
- TypeScript-first with strong type inference
- Small bundle size, ideal for edge deployment
- Used by Meerkat Town backend for AI agent API

### Express.js
- Most popular Node.js web framework
- Minimalist, unopinionated, middleware-based
- Huge ecosystem of middleware packages
- REST API building with routing and error handling
- Mature and well-documented

### FastAPI (Python)
- Modern Python web framework, very fast (async)
- Automatic API documentation (OpenAPI/Swagger)
- Type hints for request validation with Pydantic
- Async support for concurrent operations
- Great for ML model serving and data APIs

### NestJS
- Enterprise Node.js framework inspired by Angular
- TypeScript-first with decorators and modules
- Built-in dependency injection
- GraphQL support, WebSocket support, microservices
- Structured architecture for large applications

### Django / Flask (Python)
- Django: full-featured ("batteries included"), ORM, admin panel, auth
- Flask: lightweight, flexible, extensible
- Django REST Framework for API building
- Large community and extensive documentation

## Full-Stack Architecture

### SSR (Server-Side Rendering)
- HTML generated on the server for each request
- Better SEO: search engines get fully rendered pages
- Faster first paint (user sees content sooner)
- Higher server load per request
- Frameworks: Next.js, Nuxt.js, SvelteKit

### SSG (Static Site Generation)
- HTML generated at build time, served as static files
- Fastest possible response time (CDN-cached)
- Great for content sites, documentation, blogs
- Rebuild required for content updates
- Tools: Astro, Next.js (static export), Gatsby

### SPA (Single Page Application)
- Client-side rendering, JavaScript handles routing
- Smooth transitions between pages (no full reload)
- Can work offline with service workers
- Slower initial load, worse SEO without SSR
- Tools: Vite + React/Vue, Create React App

### ISR (Incremental Static Regeneration)
- Static pages that revalidate and rebuild on demand
- Combine SSG speed with fresh content
- Next.js specific feature (revalidate prop)
- Best for content that updates periodically

## State Management

### Local State
- React: useState, useReducer
- Vue: ref(), reactive()
- Component-level state for UI concerns

### Global State
- **Zustand**: lightweight, minimal boilerplate (recommended for React)
- **Redux Toolkit**: structured, middleware support, dev tools
- **Jotai / Recoil**: atomic state management
- **Pinia**: Vue's official state management
- **Context API**: React built-in, best for infrequent updates

### Server State
- **TanStack Query (React Query)**: data fetching, caching, synchronization
- **SWR**: stale-while-revalidate by Vercel
- **Apollo Client**: GraphQL client with cache
- Separating server state from UI state simplifies architecture

## API Design

### REST
- Resource-based URLs: `/api/agents/:id`
- HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove)
- Status codes: 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Server Error)
- Stateless: each request contains all needed information
- Pagination, filtering, sorting via query parameters

### GraphQL
- Single endpoint, client specifies exactly what data it needs
- Schema defines types, queries, mutations, subscriptions
- Avoids over-fetching and under-fetching
- Tools: Apollo Server/Client, Urql, Hasura
- Better for complex data relationships

### WebSocket
- Full-duplex communication between client and server
- Real-time updates: chat, notifications, live data
- Libraries: Socket.io, ws, Hono WebSocket
- Consider SSE (Server-Sent Events) for one-way real-time

### tRPC
- End-to-end type-safe APIs without code generation
- TypeScript types shared between frontend and backend
- No API schema to maintain separately
- Works with Next.js, Express, Hono

## Databases

### SQL (Relational)
- **PostgreSQL**: most capable open-source database
- **MySQL**: widely used, good for read-heavy workloads
- **SQLite**: file-based, great for prototyping and embedded
- ORMs: Prisma, Drizzle, Sequelize, TypeORM
- Best for structured data with relationships

### NoSQL
- **MongoDB**: document database (JSON-like documents)
- **Redis**: in-memory key-value store (caching, sessions)
- **DynamoDB**: AWS managed NoSQL (high scalability)
- **Firestore**: Google's managed document database
- Best for flexible schemas and high scalability

### Vector Databases
- Store and search high-dimensional vectors (embeddings)
- **Pinecone**: managed vector database, used by Meerkat Town for RAG
- **Weaviate**: open-source, hybrid search
- **Chroma**: lightweight, Python-native
- **Qdrant**: high-performance, Rust-based
- Essential for AI/RAG applications

## Deployment

### Hosting Platforms
- **Vercel**: best for Next.js, serverless functions, edge network
- **Railway**: simple deployment for any framework, databases included
- **Netlify**: static sites, serverless functions, forms
- **Fly.io**: deploy Docker containers globally
- **Render**: full-stack platform with managed databases
- **AWS / GCP / Azure**: full cloud infrastructure (more complex)

### Containerization
- **Docker**: package applications with dependencies into containers
- **Docker Compose**: multi-container applications
- **Kubernetes**: container orchestration at scale
- Consistent environments from development to production
- Dockerfile: define build steps and runtime

### CI/CD
- **GitHub Actions**: CI/CD integrated with GitHub
- **Vercel / Netlify**: auto-deploy on git push
- **GitLab CI**: built-in CI/CD pipelines
- Automated testing, building, and deployment
- Preview deployments for pull requests

## Web3 Development

### wagmi + viem
- **wagmi**: React hooks for Ethereum (connect wallet, read/write contracts)
- **viem**: TypeScript library for Ethereum interaction (replaces ethers.js)
- Hooks: useAccount, useConnect, useReadContract, useWriteContract
- Type-safe contract interactions with ABI inference
- Used by Meerkat Town frontend

### OnchainKit
- Coinbase's React components for building on Base
- Wallet connection, identity, transaction components
- Pre-built UI for common onchain patterns
- Integrates with wagmi and viem

### Smart Contract Integration
- ABI (Application Binary Interface) defines contract interface
- Read functions: free, no transaction needed
- Write functions: require wallet signature and gas
- Events: subscribe to on-chain events for real-time updates
- Multicall: batch multiple read calls into one request

## Testing

### Frontend Testing
- **Vitest**: Vite-native test runner (fast, compatible with Jest API)
- **Testing Library**: test UI components by user behavior
- **Playwright / Cypress**: end-to-end browser testing
- **Storybook**: component development and visual testing
- Test pyramid: many unit tests, fewer integration, fewest E2E

### Backend Testing
- **Jest / Vitest**: unit and integration tests
- **Supertest**: HTTP endpoint testing
- **Mock Service Worker (MSW)**: mock API calls
- Test database: use separate database for tests
- Load testing: k6, Artillery for performance testing

### Web3 Testing
- **Foundry (forge test)**: Solidity unit and fuzz testing
- **Hardhat**: JavaScript-based smart contract testing
- **Tenderly**: transaction simulation and debugging
- Fork testing: test against live blockchain state
- Testnet deployment before mainnet
