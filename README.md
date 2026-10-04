# VIBEGATE — Production Quality & Security Gate for AI & Modern Web Apps

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**VIBEGATE** is an automated, zero-config production readiness and security auditing gate designed specifically for web applications developed rapidly with AI coding tools (Cursor, Claude Code, Lovable, Bolt, v0) and development agencies delivering client projects.

---

## ⚡ The Problem: Silent Production Landmines in AI-Generated Code

AI coding assistants have made software generation 10x faster, but speed does not guarantee production readiness:
- Over **40% of AI-scaffolded full-stack apps** contain critical security vulnerabilities (OWASP Top 10).
- Common failure modes include **exposed Supabase service role keys** that bypass Row-Level Security, **unauthenticated Next.js Server Actions** that mutate or delete database records, **hardcoded payment secrets**, and **N+1 database query bottlenecks**.
- Traditional DevSecOps platforms (SonarQube, Snyk, Checkmarx) are heavy, expensive, and require complex CI/CD configuration.

VIBEGATE solves this with **Zero-Config Pre-Flight Verification**: an opinionated audit engine that analyzes codebases, detects architectural flaws, calculates a weighted **Production Readiness Score (0–100, A+ to F)**, provides verified side-by-side patch diffs, and generates formal **Client Handoff Assurance Certificates**.

---

## 🚀 Key Capabilities & Scanning Modules

### 1. Leaked Secrets & High-Entropy Credentials (`secretScanner.ts`)
- **Supabase Service Role Keys:** Catches JWT patterns and variable exposures that bypass Row-Level Security.
- **Payment Keys:** Detects Stripe live and test secrets (`sk_live_...`, `sk_test_...`).
- **AI Provider Credentials:** Scans for OpenAI (`sk-proj-...`) and Anthropic (`sk-ant-...`) keys.
- **Cloud & SCM Keys:** Identifies AWS IAM access keys (`AKIA...`), GitHub PATs (`ghp_...`), and embedded database connection URIs.

### 2. Modern Web & Framework SAST (`sastSecurityScanner.ts`)
- **Unauthenticated Next.js Server Actions:** Detects `"use server"` functions that perform mutating operations (`delete`, `update`, `insert`) without verifying the active user session.
- **Client-Side `service_role` Exposure:** Flags Supabase client initialization in client components (`"use client"`) or prefixed with `NEXT_PUBLIC_`.
- **Missing Supabase Row-Level Security (RLS):** Flags PostgreSQL schemas created without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- **Insecure Direct Object Reference (IDOR):** Catches mutations filtered solely by URL parameters without tenant ownership checks (`userId: session.user.id`).
- **SQL Injection:** Detects raw string interpolation inside query executions.
- **Permissive CORS with Credentials:** Flags `Access-Control-Allow-Origin: *` configured alongside credential allowances.

### 3. Dependency Supply Chain (SCA) (`dependencyScanner.ts`)
- Scans `package.json` against known high/critical CVEs (e.g. `jsonwebtoken <= 8.5.1` RCE, `axios < 1.7.4` SSRF, `lodash < 4.17.21` Prototype Pollution, `next < 14.1.1` SSRF).
- Flags unpinned dependency wildcards (`"*"`, `"latest"`) that expose projects to supply-chain attacks.

### 4. Architecture, Reliability & Performance (`architectureScanner.ts` & `performanceScanner.ts`)
- **Monolithic Component Bloat:** Flags single-file components exceeding 450+ lines where AI tools dump UI, state, validation, and API calls.
- **Missing Error Boundaries:** Detects absence of Next.js App Router root `error.tsx` handling.
- **Unhandled Async API Handlers:** Flags route handlers operating without structured `try/catch` error formatting.
- **N+1 Database Query Bottlenecks:** Catches sequential database queries inside `.map()` or `for (... of ...)` loops.
- **Unbounded Queries:** Warns about queries fetching records without explicit `limit` or `take` pagination.

---

## 📊 Live Benchmark Repositories Included

The platform includes 3 built-in demo codebases for immediate evaluation:
1. **Vibe-Coded Next.js + Supabase SaaS (Grade F / 38 pts):** 🚨 *BLOCKED: CRITICAL SECURITY FLAWS* — Contains leaked service role keys, unauthenticated Server Actions, and disabled database RLS.
2. **Agency Client E-Commerce Portal (Grade C / 68 pts):** ⚠️ *CONDITIONAL PASS* — Contains unhandled async API routes, missing error boundaries, and unpaginated database queries.
3. **Production-Hardened Architecture (Grade A+ / 100 pts):** ✅ *READY FOR PRODUCTION* — Gold-standard implementation with session-gated actions, isolated RLS policies, and batched queries.

---

## 📜 Client Delivery & Production Handoff Certificate

VIBEGATE includes a formal, printable / PDF-exportable **Production Quality & Security Assurance Certificate**:
- Project Name, Audit ID, Timestamp, and Auditor Signature Seal.
- Verification checklist covering Credentials, OWASP Security Gates, and Dependency Vulnerabilities.
- Formal sign-off signature block for agency delivery and client escrow acceptance.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/fahadkhalid211/Code-Tester.git
cd Code-Tester

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

---

## 🏗️ Project Architecture

```
src/
├── app/
│   ├── api/audit/run/route.ts      # Multi-scanner audit execution endpoint
│   ├── page.tsx                    # Full-stack interactive dashboard & visual audit runner
│   ├── layout.tsx & globals.css    # Tailwind dark-mode glassmorphism design system
│   └── error.tsx                   # Hardened App Router error boundary
├── components/
│   ├── Header.tsx                  # Top navigation, verified badges & certificate trigger
│   ├── ProjectSelector.tsx         # 1-Click Curated Demos & Custom Code / File Ingestion
│   ├── ScoreGauge.tsx              # Letter Grade (A+ to F), 0-100 score & Executive Report
│   ├── CategoryBreakdown.tsx       # 5-Pillar Score meters (Security, Reliability, Arch, etc.)
│   ├── IssuesList.tsx              # Filtering, code snippets & side-by-side verified diff fixes
│   └── ClientCertificateModal.tsx  # Printable/PDF formal client handoff sign-off certificate
└── lib/
    ├── types.ts                    # Strict TypeScript schemas for issues, metrics & results
    ├── demoProjects.ts             # 3 Real-world benchmark repos
    ├── auditEngine.ts              # Mathematical score weighting & gate decision engine
    └── scanners/
        ├── secretScanner.ts        # Leaked credentials & API keys
        ├── sastSecurityScanner.ts  # Next.js Server Action auth, Supabase RLS, IDOR & SQLi
        ├── dependencyScanner.ts    # Known CVEs & wildcard vulnerabilities
        ├── architectureScanner.ts  # Monoliths, missing boundaries & memory leaks
        └── performanceScanner.ts   # N+1 query loops & unpaginated queries
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
