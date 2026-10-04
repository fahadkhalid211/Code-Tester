import { AuditIssue, FileEntry } from '../types';
import { stripComments } from './utils';

export function scanPerformance(files: FileEntry[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  for (const file of files) {
    const rawLines = file.content.split('\n');
    const lines = stripComments(file.content, file.path.endsWith('.sql')).split('\n');
    const reported = { n1: false, limit: false, img: false };

    // 1. N+1 Database Queries inside loops or .map()
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for await inside .map() or for-loop calling db/supabase
      const isLoop = /for\s*\(.*of|\.map\s*\(\s*async/i.test(line);
      if (isLoop && !reported.n1) {
        const loopBlock = lines.slice(i, Math.min(lines.length, i + 8)).join('\n');
        if (/await\s+(db\.|prisma\.|supabase\.|sql|fetch)/i.test(loopBlock)) {
          reported.n1 = true;
          issues.push({
            id: `PERF-N1-${issues.length + 1}`,
            title: 'N+1 Database Query Bottleneck Inside Loop',
            category: 'performance',
            severity: 'high',
            filePath: file.path,
            lineNumber: i + 1,
            snippet: rawLines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 6)).join('\n'),
            explanation: 'An asynchronous database query or HTTP call is being executed sequentially inside an iteration loop. For a collection of N items, the application makes N separate database roundtrips instead of 1 batched query.',
            businessImpact: 'Severe latency spikes (e.g. 5–10 second page loads) and database connection pool exhaustion when customer data expands.',
            recommendation: 'Batch queries using SQL `IN ($1, $2, ...)` or Prisma `findMany({ where: { id: { in: ids } } })` before the loop.',
            ruleId: 'PERF-N-PLUS-ONE',
            suggestedFix: {
              codeBefore: `const userProfiles = await Promise.all(\n  users.map(async (u) => await db.profile.findUnique({ where: { userId: u.id } }))\n);`,
              codeAfter: `const userIds = users.map(u => u.id);\nconst profiles = await db.profile.findMany({\n  where: { userId: { in: userIds } }\n});`,
              explanation: 'Replace N individual queries with a single batch `IN` query.',
              diffSummary: 'Batch database queries to eliminate N+1'
            }
          });
        }
      }

      // 2. Unbounded Database Queries (Missing LIMIT / take)
      if (/(findMany\(\s*\{?|(query|execute|raw|sql)\s*\(?\s*[`"']\s*SELECT\s+.*\bFROM\s+[a-zA-Z0-9_.]+)/i.test(line)) {
        const queryBlock = lines.slice(i, Math.min(lines.length, i + 6)).join('\n');
        const hasLimit = /take:\s*[0-9]+|limit\s+[0-9]+|pageSize/i.test(queryBlock);

        if (!reported.limit && !hasLimit && !file.path.includes('.test.') && !file.path.includes('.spec.')) {
          reported.limit = true;
          issues.push({
            id: `PERF-LIMIT-${issues.length + 1}`,
            title: 'Unbounded Database Query Missing LIMIT / Pagination',
            category: 'performance',
            severity: 'medium',
            filePath: file.path,
            lineNumber: i + 1,
            snippet: rawLines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 4)).join('\n'),
            explanation: 'Database query fetches records without an explicit `limit` or pagination constraint (`take`). In staging with 10 records this seems fast; in production with 100,000 records it consumes all server memory and times out.',
            businessImpact: 'High memory usage, slow API responses, and database server denial of service under high table volume.',
            recommendation: 'Enforce pagination with explicit page size limits (e.g. `take: 50`).',
            ruleId: 'PERF-UNBOUNDED-QUERY',
            suggestedFix: {
              codeBefore: rawLines[i]?.trim() ?? line.trim(),
              codeAfter: `// Enforce pagination limit\nconst records = await db.item.findMany({\n  take: 50,\n  orderBy: { createdAt: 'desc' }\n});`,
              explanation: 'Add pagination limit and sort ordering to prevent runaway memory usage.',
              diffSummary: 'Add pagination limit'
            }
          });
        }
      }

      // 3. Unoptimized <img> in React/Next.js
      if (!reported.img && /<img\s/i.test(line) && (file.path.endsWith('.tsx') || file.path.endsWith('.jsx'))) {
        reported.img = true;
        issues.push({
          id: `PERF-IMG-${issues.length + 1}`,
          title: 'Unoptimized Standard HTML <img> Element',
          category: 'performance',
          severity: 'low',
          filePath: file.path,
          lineNumber: i + 1,
          snippet: rawLines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join('\n'),
          explanation: 'Using raw `<img />` tags prevents automatic image optimization, modern WebP/AVIF format conversion, responsive resizing, and Cumulative Layout Shift (CLS) prevention.',
          businessImpact: 'Poor Google Lighthouse scores, slower page load speeds, and higher mobile data consumption.',
          recommendation: 'Import and use `next/image` (`<Image src="..." width={...} height={...} alt="..." />`).',
          ruleId: 'NEXT-IMAGE-OPTIMIZATION',
          suggestedFix: {
            codeBefore: rawLines[i]?.trim() ?? line.trim(),
            codeAfter: `import Image from 'next/image';\n// Replace <img ... /> with <Image src={url} width={400} height={300} alt="Description" />`,
            explanation: 'Migrate raw <img> to next/image for automatic compression and layout protection.',
            diffSummary: 'Use next/image component'
          }
        });
      }
    }
  }

  return issues;
}
