import { AuditIssue, FileEntry } from '../types';

interface SecretRule {
  id: string;
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high';
  category: 'security';
  explanation: string;
  businessImpact: string;
  recommendation: string;
  fixGenerator: (snippet: string, line: string) => { before: string; after: string; explanation: string };
}

const SECRET_RULES: SecretRule[] = [
  {
    id: 'SEC-001',
    name: 'Leaked Supabase Service Role Key',
    pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+|SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?[a-zA-Z0-9._-]+['"]?/i,
    severity: 'critical',
    category: 'security',
    explanation: 'A Supabase Service Role key was detected in code. This key completely bypasses all Row-Level Security (RLS) policies and grants full superuser read/write access to your entire database.',
    businessImpact: 'Catastrophic data breach. Any user or attacker can read, alter, or delete customer tables, authentication records, and private data.',
    recommendation: 'Revoke this key immediately in the Supabase Dashboard. Store service keys exclusively in server-only environment variables (e.g. `process.env.SUPABASE_SERVICE_ROLE_KEY`) and never expose them to client bundles or browser code.',
    fixGenerator: (snippet, line) => ({
      before: line.trim(),
      after: '// Stored securely in server-side environment variables\nconst supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;\nif (!supabaseServiceKey) throw new Error("Missing server secret");',
      explanation: 'Replace hardcoded or client-exposed service key with server-only environment variable.'
    })
  },
  {
    id: 'SEC-002',
    name: 'Exposed Stripe Secret Key',
    pattern: /sk_(live|test)_[0-9a-zA-Z]{24,}/,
    severity: 'critical',
    category: 'security',
    explanation: 'A live or test Stripe secret key was detected in source code. Secret keys can initiate charges, process refunds, and access sensitive customer banking details.',
    businessImpact: 'Unauthorized financial transactions, unauthorized customer refunds, and immediate compliance suspension by Stripe.',
    recommendation: 'Rotate the compromised Stripe key in the Stripe Dashboard. Never commit secret keys to git. Use server environment variables.',
    fixGenerator: (snippet, line) => ({
      before: line.trim(),
      after: 'const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });',
      explanation: 'Load Stripe secret key from server environment variable rather than hardcoding.'
    })
  },
  {
    id: 'SEC-003',
    name: 'Hardcoded OpenAI / Anthropic / AI API Key',
    pattern: /sk-(proj-)?[a-zA-Z0-9_-]{32,}|sk-ant-[a-zA-Z0-9_-]{32,}/,
    severity: 'critical',
    category: 'security',
    explanation: 'An AI vendor API key (OpenAI, Anthropic) was found hardcoded in the codebase.',
    businessImpact: 'Attakers can scrape this key from client bundles or GitHub commits, incurring thousands of dollars in unauthorized inference billing within hours.',
    recommendation: 'Rotate the API key immediately. Route all AI model calls through a secure backend API endpoint or server action where keys remain secret.',
    fixGenerator: (snippet, line) => ({
      before: line.trim(),
      after: 'const apiKey = process.env.AI_PROVIDER_API_KEY;',
      explanation: 'Move AI provider secret to server-only runtime environment.'
    })
  },
  {
    id: 'SEC-004',
    name: 'AWS Access Key ID Leaked',
    pattern: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/,
    severity: 'critical',
    category: 'security',
    explanation: 'An AWS IAM Access Key ID was detected in plaintext.',
    businessImpact: 'Potential total cloud infrastructure compromise (S3 buckets, EC2 compute, RDS databases, IAM privilege escalation).',
    recommendation: 'Revoke and delete the IAM key in AWS IAM Console. Use AWS IAM Roles, OIDC, or secure secret vaults instead of static credentials.',
    fixGenerator: (snippet, line) => ({
      before: line.trim(),
      after: '// Use AWS IAM roles or environment variables configured in hosting provider\nconst accessKeyId = process.env.AWS_ACCESS_KEY_ID;',
      explanation: 'Remove static AWS key; read from secure platform runtime.'
    })
  },
  {
    id: 'SEC-005',
    name: 'GitHub Personal Access Token Leaked',
    pattern: /ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/,
    severity: 'critical',
    category: 'security',
    explanation: 'A GitHub Personal Access Token was discovered in code.',
    businessImpact: 'Unrestricted read/write access to private company repositories, organization settings, and source code exfiltration.',
    recommendation: 'Revoke this token in GitHub Developer Settings immediately. Check git history to ensure it is purged.',
    fixGenerator: (snippet, line) => ({
      before: line.trim(),
      after: 'const githubToken = process.env.GITHUB_TOKEN;',
      explanation: 'Reference GitHub token from server environment variable.'
    })
  },
  {
    id: 'SEC-006',
    name: 'Plaintext Database Connection String with Credentials',
    pattern: /postgres(ql)?:\/\/[a-zA-Z0-9_.-]+:[a-zA-Z0-9_!#$%&*+-]+@[a-zA-Z0-9_.-]+:[0-9]+\/[a-zA-Z0-9_.-]+/i,
    severity: 'critical',
    category: 'security',
    explanation: 'Database connection URI contains embedded database username and password in plaintext.',
    businessImpact: 'Direct remote database connection and complete compromise of relational data stores.',
    recommendation: 'Place the connection string in `.env.local` or environment config, ensuring `.env*` is added to `.gitignore`.',
    fixGenerator: (snippet, line) => ({
      before: line.trim(),
      after: 'const dbUrl = process.env.DATABASE_URL;\nif (!dbUrl) throw new Error("DATABASE_URL is not set");',
      explanation: 'Use DATABASE_URL from server environment variables.'
    })
  },
  {
    id: 'SEC-007',
    name: 'Insecure Hardcoded JWT Secret / Fallback',
    pattern: /jwt\.sign\(.*,\s*['"](secret|supersecret|mysecret|changeme|123456|test)['"]\s*\)|JWT_SECRET\s*=\s*['"](secret|test|dev|123456)['"]/i,
    severity: 'high',
    category: 'security',
    explanation: 'Trivial or hardcoded JWT signing secret detected. Attackers can forge arbitrary authentication tokens and impersonate any user or admin.',
    businessImpact: 'Complete authentication bypass and privilege escalation.',
    recommendation: 'Generate a high-entropy random key (at least 256 bits) using `openssl rand -base64 32` and store it in environment variables.',
    fixGenerator: (snippet, line) => ({
      before: line.trim(),
      after: 'const jwtSecret = process.env.JWT_SECRET;\nif (!jwtSecret || jwtSecret.length < 32) {\n  throw new Error("JWT_SECRET must be at least 32 characters");\n}',
      explanation: 'Enforce high-entropy JWT secret from environment configuration.'
    })
  }
];

export function scanSecrets(files: FileEntry[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  for (const file of files) {
    // Skip lockfiles and media
    if (file.path.includes('package-lock.json') || file.path.includes('.min.js') || file.path.endsWith('.svg')) {
      continue;
    }

    const lines = file.content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];

      for (const rule of SECRET_RULES) {
        if (rule.pattern.test(line)) {
          const startLine = Math.max(0, lineIdx - 1);
          const endLine = Math.min(lines.length - 1, lineIdx + 1);
          const snippet = lines.slice(startLine, endLine + 1).join('\n');
          const fix = rule.fixGenerator(snippet, line);

          issues.push({
            id: `${rule.id}-${issues.length + 1}`,
            title: rule.name,
            category: 'security',
            severity: rule.severity,
            filePath: file.path,
            lineNumber: lineIdx + 1,
            snippet,
            explanation: rule.explanation,
            businessImpact: rule.businessImpact,
            recommendation: rule.recommendation,
            ruleId: rule.id,
            suggestedFix: {
              codeBefore: fix.before,
              codeAfter: fix.after,
              explanation: fix.explanation,
              diffSummary: `Line ${lineIdx + 1}: Secure secret storage`
            }
          });
        }
      }
    }
  }

  return issues;
}
