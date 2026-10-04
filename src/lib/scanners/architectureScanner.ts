import { AuditIssue, FileEntry } from '../types';
import { stripComments } from './utils';

export function scanArchitectureAndReliability(files: FileEntry[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Check for Next.js App Router Error Boundaries
  const hasAppDir = files.some(f => f.path.includes('/app/') || f.path.startsWith('app/'));
  if (hasAppDir) {
    const hasGlobalErrorBoundary = files.some(f => /(^|\/)app\/(global-)?error\.(tsx|jsx|ts|js)$/.test(f.path));
    if (!hasGlobalErrorBoundary) {
      issues.push({
        id: 'ARCH-ERR-001',
        title: 'Missing Next.js Root Error Boundary (error.tsx)',
        category: 'reliability',
        severity: 'high',
        filePath: 'src/app/error.tsx',
        explanation: 'The Next.js App Router does not contain an `error.tsx` or `global-error.tsx` file. Any unhandled exception during server rendering or client hydration will crash the entire page into a blank white screen.',
        businessImpact: 'Severe user drop-off and lost conversions whenever a network glitch or data exception occurs in production.',
        recommendation: 'Create a client-side `error.tsx` boundary in the root app directory with reset capability and error tracking.',
        ruleId: 'NEXT-ERROR-BOUNDARY',
        suggestedFix: {
          codeBefore: '// No error.tsx found in app directory',
          codeAfter: `'use client';\n\nexport default function ErrorBoundary({\n  error,\n  reset,\n}: {\n  error: Error & { digest?: string };\n  reset: () => void;\n}) {\n  return (\n    <div className="flex min-h-screen flex-col items-center justify-center p-4">\n      <h2 className="text-xl font-bold">Something went wrong</h2>\n      <button onClick={() => reset()} className="mt-4 rounded bg-blue-600 px-4 py-2 text-white">\n        Try again\n      </button>\n    </div>\n  );\n}`,
          explanation: 'Add standard Next.js client error boundary component.',
          diffSummary: 'Add src/app/error.tsx boundary'
        }
      });
    }
  }

  for (const file of files) {
    const content = stripComments(file.content);
    const lines = content.split('\n');

    // 1. Monolithic Component Bloat (Classic Vibe-Coded / AI Anti-Pattern)
    if ((file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) && lines.length > 450) {
      issues.push({
        id: `ARCH-MONO-${issues.length + 1}`,
        title: `Monolithic Component Bloat (${lines.length} Lines): "${file.path}"`,
        category: 'architecture',
        severity: lines.length > 800 ? 'high' : 'medium',
        filePath: file.path,
        explanation: `This component contains ${lines.length} lines of code. AI coding tools frequently generate monolithic single-file components containing UI layout, state management, complex form validation, and raw API calls in one massive block.`,
        businessImpact: 'Extremely high technical debt, frequent merge conflicts, and regression bugs whenever AI is asked to update one small part of the page.',
        recommendation: 'Decompose this file into isolated sub-components (e.g. Header, FormSections, TableView, and custom hooks for data fetching).',
        ruleId: 'CODE-COMPLEXITY-MONOLITH',
        suggestedFix: {
          codeBefore: `// ${file.path} contains ${lines.length} lines of monolithic logic`,
          codeAfter: `// Refactor into modular architecture:\n// 1. components/dashboard/DashboardHeader.tsx\n// 2. components/dashboard/MetricCards.tsx\n// 3. hooks/useDashboardData.ts`,
          explanation: 'Extract sub-components and business logic into dedicated modules.',
          diffSummary: 'Decompose monolithic component'
        }
      });
    }

    // 2. Unhandled Async Exceptions in API Route Handlers
    if (file.path.includes('/api/') || file.path.includes('/routes/')) {
      const hasAsyncHandler = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\b/.test(content);
      const hasTryCatch = /try\s*\{/i.test(content);

      if (hasAsyncHandler && !hasTryCatch) {
        issues.push({
          id: `REL-TRYCATCH-${issues.length + 1}`,
          title: `Unhandled Async Exception in Route Handler: "${file.path}"`,
          category: 'reliability',
          severity: 'high',
          filePath: file.path,
          explanation: 'API Route handler executes asynchronous operations (e.g. database queries, external fetches) without a `try/catch` block. If an external service is slow or returns an error, the handler throws an unhandled promise rejection and returns an unformatted 500 error.',
          businessImpact: 'Uninformative 500 errors returned to users, API timeouts, and inability to gracefully log error details to monitoring tools.',
          recommendation: 'Wrap async operations in a try/catch block and return structured error responses (e.g., status 400 or 500 with JSON message).',
          ruleId: 'RELIABILITY-TRY-CATCH',
          suggestedFix: {
            codeBefore: `export async function POST(req: Request) {\n  const data = await req.json();\n  const result = await db.insert(data);\n  return Response.json(result);\n}`,
            codeAfter: `export async function POST(req: Request) {\n  try {\n    const data = await req.json();\n    const result = await db.insert(data);\n    return Response.json(result);\n  } catch (error: any) {\n    console.error("API error:", error);\n    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });\n  }\n}`,
            explanation: 'Wrap route logic in try/catch block with structured error JSON.',
            diffSummary: 'Add error handling to Route Handler'
          }
        });
      }
    }

    // 3. Missing Cleanup in useEffect (Memory Leak Risk)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/useEffect\s*\(\s*\(\)\s*=>\s*\{/i.test(line)) {
        const effectBlock = lines.slice(i, Math.min(lines.length, i + 15)).join('\n');
        const hasListener = /addEventListener|setInterval|subscribe/i.test(effectBlock);
        const hasCleanup = /return\s*\(\)\s*=>/i.test(effectBlock);

        if (hasListener && !hasCleanup) {
          issues.push({
            id: `REL-LEAK-${issues.length + 1}`,
            title: `Potential Memory Leak: Uncleaned Event Listener/Interval in useEffect`,
            category: 'reliability',
            severity: 'medium',
            filePath: file.path,
            lineNumber: i + 1,
            snippet: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 6)).join('\n'),
            explanation: 'A `useEffect` hook registers an event listener, interval, or subscription but does not return a cleanup function. When the component unmounts and remounts, duplicate listeners pile up in browser memory.',
            businessImpact: 'Browser tab memory ballooning, slow client performance, and duplicate event triggers.',
            recommendation: 'Return an unsubscribe or `removeEventListener` function from the `useEffect` hook.',
            ruleId: 'REACT-CLEANUP-LEAK',
            suggestedFix: {
              codeBefore: `useEffect(() => {\n  window.addEventListener('resize', handleResize);\n}, []);`,
              codeAfter: `useEffect(() => {\n  window.addEventListener('resize', handleResize);\n  return () => window.removeEventListener('resize', handleResize);\n}, []);`,
              explanation: 'Add cleanup callback returning removeEventListener.',
              diffSummary: 'Add cleanup to useEffect'
            }
          });
          break;
        }
      }
    }
  }

  return issues;
}
