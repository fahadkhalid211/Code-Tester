import { AuditIssue, FileEntry } from '../types';

export function scanSastSecurity(files: FileEntry[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  for (const file of files) {
    const content = file.content;
    const lines = content.split('\n');
    const isClientComponent = content.includes('"use client"') || content.includes("'use client'");
    const isServerAction = content.includes('"use server"') || content.includes("'use server'");
    const isSqlFile = file.path.endsWith('.sql');

    // 1. Next.js Server Actions without Auth Check
    if (isServerAction) {
      const hasAuthCheck = /auth\(\)|getSession\(\)|currentUser\(\)|getServerSession\(\)|verifySession\(\)|supabase\.auth\.getUser\(\)/i.test(content);
      const hasMutatingKeyword = /delete|update|insert|create|remove|drop|truncate|payment|stripe/i.test(content);

      if (!hasAuthCheck && hasMutatingKeyword) {
        // Find line with "use server" or mutating function
        let targetLine = 1;
        for (let i = 0; i < lines.length; i++) {
          if (/export\s+async\s+function/i.test(lines[i])) {
            targetLine = i + 1;
            break;
          }
        }

        issues.push({
          id: `SAST-ACT-${issues.length + 1}`,
          title: 'Unauthenticated Next.js Server Action with State Mutation',
          category: 'security',
          severity: 'critical',
          filePath: file.path,
          lineNumber: targetLine,
          snippet: lines.slice(Math.max(0, targetLine - 2), Math.min(lines.length, targetLine + 4)).join('\n'),
          explanation: 'This Next.js Server Action performs database mutations or deletions but lacks any session, user authentication, or role verification check. Server actions compile into public HTTP POST endpoints that any unauthenticated actor can invoke with arbitrary payloads.',
          businessImpact: 'Total unauthorized database mutation. Anyone can invoke this endpoint with `curl` or browser console to delete or corrupt customer records.',
          recommendation: 'Verify the active user session inside every Server Action before performing operations. Throw an error or return an unauthorized response if no valid session exists.',
          ruleId: 'NEXT-AUTH-001',
          suggestedFix: {
            codeBefore: lines[targetLine - 1]?.trim() || 'export async function mutateData(id: string) {',
            codeAfter: `export async function mutateData(id: string) {\n  const session = await auth();\n  if (!session?.user) throw new Error("Unauthorized: Login required");\n  // Check resource ownership before mutating`,
            explanation: 'Enforce authentication verification at the top of the Server Action.',
            diffSummary: 'Add session verification check'
          }
        });
      }
    }

    // 2. Supabase Client with service_role in Client Component or NEXT_PUBLIC
    if (isClientComponent || file.path.includes('/components/') || file.path.includes('/app/')) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/NEXT_PUBLIC_.*SERVICE_ROLE/i.test(line) || (/createClient\s*\(/i.test(line) && /service_role/i.test(line))) {
          issues.push({
            id: `SAST-SUPA-${issues.length + 1}`,
            title: 'Supabase Service Role Key Used in Client Context',
            category: 'security',
            severity: 'critical',
            filePath: file.path,
            lineNumber: i + 1,
            snippet: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join('\n'),
            explanation: 'Supabase `service_role` key is being referenced in client-side code or prefixed with `NEXT_PUBLIC_`. This key is baked into the browser bundle and accessible to anyone via DevTools.',
            businessImpact: 'Every visitor to your site can view this key and run unrestricted queries against your Supabase instance, bypassing all RLS policies.',
            recommendation: 'Use the `anon` key on the client side (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) paired with Row Level Security. Keep `service_role` strictly inside server-only code (Route Handlers / Server Components).',
            ruleId: 'SUPABASE-LEAK-001',
            suggestedFix: {
              codeBefore: line.trim(),
              codeAfter: `const supabase = createClient(\n  process.env.NEXT_PUBLIC_SUPABASE_URL!,\n  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!\n);`,
              explanation: 'Switch from service_role to public anon key on the client.',
              diffSummary: 'Use NEXT_PUBLIC_SUPABASE_ANON_KEY'
            }
          });
        }
      }
    }

    // 3. Missing Supabase Row Level Security (RLS) in SQL migrations or schema
    if (isSqlFile || content.includes('CREATE TABLE')) {
      const tableMatches = content.matchAll(/CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_."]+)/gi);
      for (const match of tableMatches) {
        const tableName = match[2].replace(/"/g, '');
        const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+.*${tableName}.*ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
        if (!rlsRegex.test(content)) {
          issues.push({
            id: `SAST-RLS-${issues.length + 1}`,
            title: `Missing Row Level Security (RLS) on Table: "${tableName}"`,
            category: 'security',
            severity: 'critical',
            filePath: file.path,
            explanation: `The table "${tableName}" is created without enabling Row Level Security (RLS). In Supabase and PostgreSQL, tables without RLS are publicly queryable and writable via the Supabase REST API if anon key is exposed.`,
            businessImpact: 'Unrestricted public data leak or mass table modification by unauthenticated users.',
            recommendation: `Add 'ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;' and define explicit SELECT, INSERT, UPDATE, and DELETE policies.`,
            ruleId: 'POSTGRES-RLS-001',
            suggestedFix: {
              codeBefore: `-- Table created without RLS:\nCREATE TABLE ${tableName} (...)`,
              codeAfter: `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY "Users can only read own data" ON ${tableName}\n  FOR SELECT USING (auth.uid() = user_id);\n\nCREATE POLICY "Users can only modify own data" ON ${tableName}\n  FOR ALL USING (auth.uid() = user_id);`,
              explanation: 'Enable RLS and define owner-restricted policies.',
              diffSummary: `Enable RLS on ${tableName}`
            }
          });
        }
      }
    }

    // 4. Insecure Direct Object Reference (IDOR) in API / Server functions
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check for raw SQL query interpolation
      if (/(db\.|prisma\.|supabase\.)?query\s*\(.*`SELECT.*WHERE.*=\s*\${/i.test(line) || /WHERE\s+id\s*=\s*['"]?\s*\+\s*[a-zA-Z0-9_.]+/i.test(line)) {
        issues.push({
          id: `SAST-SQLI-${issues.length + 1}`,
          title: 'SQL Injection via Direct String Concatenation',
          category: 'security',
          severity: 'critical',
          filePath: file.path,
          lineNumber: i + 1,
          snippet: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join('\n'),
          explanation: 'Raw user input is being directly interpolated into a SQL query string rather than using parameterized queries or an ORM.',
          businessImpact: 'Attackers can execute arbitrary SQL statements, bypass authentication, extract complete database contents, or drop tables.',
          recommendation: 'Use parameterized queries ($1, $2) or an ORM like Prisma / Drizzle / Kysely with parameter bindings.',
          ruleId: 'SQLI-001',
          suggestedFix: {
            codeBefore: line.trim(),
            codeAfter: `const result = await db.query('SELECT * FROM items WHERE id = $1 AND user_id = $2', [itemId, session.user.id]);`,
            explanation: 'Convert query to parameterized format with user ownership validation.',
            diffSummary: 'Use parameterized query with user scope'
          }
        });
      }

      // Check for IDOR: finding or mutating record purely by URL id without owner check
      if (/where:\s*\{\s*id\s*(:\s*params\.id)?\s*\}\s*\}\s*\)/i.test(line) && /delete|update/i.test(content)) {
        issues.push({
          id: `SAST-IDOR-${issues.length + 1}`,
          title: 'Potential Insecure Direct Object Reference (IDOR)',
          category: 'security',
          severity: 'high',
          filePath: file.path,
          lineNumber: i + 1,
          snippet: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join('\n'),
          explanation: 'Record is selected or updated purely using the request ID without checking if the current authenticated user actually owns the record.',
          businessImpact: 'Any authenticated user can change the ID in the URL to modify or delete another user\'s resources.',
          recommendation: 'Always filter mutations by both resource ID and tenant/owner ID (e.g. `where: { id: params.id, userId: session.user.id }`).',
          ruleId: 'IDOR-001',
          suggestedFix: {
            codeBefore: line.trim(),
            codeAfter: `where: { id: params.id, userId: session.user.id }`,
            explanation: 'Scope mutation by both resource ID and session user ID.',
            diffSummary: 'Add tenant/user ID scope to mutation'
          }
        });
      }

      // 5. Insecure CORS Configuration
      const hasBadCors = /cors\(.*origin:\s*['"]\*['"].*credentials:\s*true/i.test(line) || /Access-Control-Allow-Origin['"],\s*['"]\*['"]/i.test(line);
      if (hasBadCors) {
        issues.push({
          id: `SAST-CORS-${issues.length + 1}`,
          title: 'Insecure Wildcard CORS with Credentials',
          category: 'security',
          severity: 'high',
          filePath: file.path,
          lineNumber: i + 1,
          snippet: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join('\n'),
          explanation: 'CORS header `Access-Control-Allow-Origin: *` allows any third-party malicious website to execute cross-origin requests against this API.',
          businessImpact: 'Cross-Site Request Forgery (CSRF) and credential theft from malicious browser origins.',
          recommendation: 'Explicitly allowlist verified domain origins (e.g. ["https://app.yourdomain.com"]) rather than using wildcard *.',
          ruleId: 'CORS-001',
          suggestedFix: {
            codeBefore: line.trim(),
            codeAfter: `const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL || 'https://app.yourdomain.com'];\n// Only allow trusted origins in CORS headers`,
            explanation: 'Replace wildcard with strict domain allowlist.',
            diffSummary: 'Restrict CORS origins to trusted domains'
          }
        });
      }

      // 6. XSS via dangerouslySetInnerHTML
      if (/dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html:\s*(params|query|data|input|req\.)/i.test(line)) {
        issues.push({
          id: `SAST-XSS-${issues.length + 1}`,
          title: 'Cross-Site Scripting (XSS) via Unsanitized dangerouslySetInnerHTML',
          category: 'security',
          severity: 'high',
          filePath: file.path,
          lineNumber: i + 1,
          snippet: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join('\n'),
          explanation: 'Dynamic user-provided data is directly rendered into the DOM using `dangerouslySetInnerHTML` without HTML sanitization.',
          businessImpact: 'Session hijacking, malicious redirects, and credential theft via injected client-side JavaScript.',
          recommendation: 'Sanitize HTML inputs using `DOMPurify.sanitize()` or render as safe React children.',
          ruleId: 'XSS-001',
          suggestedFix: {
            codeBefore: line.trim(),
            codeAfter: `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }}`,
            explanation: 'Sanitize dynamic HTML content with DOMPurify.',
            diffSummary: 'Sanitize dynamic HTML with DOMPurify'
          }
        });
      }
    }
  }

  return issues;
}
