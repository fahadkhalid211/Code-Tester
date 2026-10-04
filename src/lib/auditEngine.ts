import { AuditIssue, AuditResult, CategoryScore, FileEntry } from './types';
import { scanSecrets } from './scanners/secretScanner';
import { scanSastSecurity } from './scanners/sastSecurityScanner';
import { scanDependencies } from './scanners/dependencyScanner';
import { scanArchitectureAndReliability } from './scanners/architectureScanner';
import { scanPerformance } from './scanners/performanceScanner';

export function runFullAudit(projectName: string, rawFiles: FileEntry[]): AuditResult {
  const startTime = Date.now();
  // Defensive: ignore malformed entries instead of crashing every scanner.
  const files = rawFiles.filter(
    (f): f is FileEntry => !!f && typeof f.path === 'string' && typeof f.content === 'string'
  );

  // 1. Detect Stack
  const stack = detectTechStack(files);

  // 2. Count Lines and Files
  let totalLines = 0;
  for (const f of files) {
    totalLines += f.content.split('\n').length;
  }

  // 3. Execute all scanning modules
  const secretIssues = scanSecrets(files);
  const sastIssues = scanSastSecurity(files);
  const depIssues = scanDependencies(files);
  const archIssues = scanArchitectureAndReliability(files);
  const perfIssues = scanPerformance(files);

  const allIssues: AuditIssue[] = [
    ...secretIssues,
    ...sastIssues,
    ...depIssues,
    ...archIssues,
    ...perfIssues
  ];

  // 4. Calculate Category Scores
  const securityIssues = allIssues.filter(i => i.category === 'security');
  const reliabilityIssues = allIssues.filter(i => i.category === 'reliability');
  const architectureIssues = allIssues.filter(i => i.category === 'architecture');
  const performanceIssues = allIssues.filter(i => i.category === 'performance');
  const dependencyIssues = allIssues.filter(i => i.category === 'dependencies');

  const securityScore = calculateCategoryScore(securityIssues);
  const reliabilityScore = calculateCategoryScore(reliabilityIssues);
  const architectureScore = calculateCategoryScore(architectureIssues);
  const performanceScore = calculateCategoryScore(performanceIssues);
  const dependencyScore = calculateCategoryScore(dependencyIssues);

  // 5. Overall Weighted Score (Security 35%, Reliability 20%, Architecture 15%, Performance 15%, Dependencies 15%)
  const rawWeightedScore = Math.round(
    securityScore.score * 0.35 +
    reliabilityScore.score * 0.20 +
    architectureScore.score * 0.15 +
    performanceScore.score * 0.15 +
    dependencyScore.score * 0.15
  );

  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const highCount = allIssues.filter(i => i.severity === 'high').length;
  const mediumCount = allIssues.filter(i => i.severity === 'medium').length;
  const lowCount = allIssues.filter(i => i.severity === 'low').length;

  // Strict hardening: any critical issue caps the score at max(25, 60 - 10 * criticalCount).
  let overallScore = rawWeightedScore;
  if (criticalCount > 0) {
    overallScore = Math.min(overallScore, Math.max(25, 60 - criticalCount * 10));
  } else if (highCount > 2) {
    overallScore = Math.min(overallScore, 75);
  }

  // 6. Grade Calculation
  let letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (overallScore >= 95 && criticalCount === 0 && highCount === 0) letterGrade = 'A+';
  else if (overallScore >= 85 && criticalCount === 0 && highCount === 0) letterGrade = 'A';
  else if (overallScore >= 75 && criticalCount === 0) letterGrade = 'B';
  else if (overallScore >= 65 && criticalCount === 0) letterGrade = 'C';
  else if (overallScore >= 50) letterGrade = 'D';
  else letterGrade = 'F';

  // 7. Gate Decision & Status
  // A gate that scanned nothing must not certify anything.
  const scannable = files.filter(f => /\.(tsx?|jsx?|mjs|cjs|sql)$|(^|\/)package\.json$/.test(f.path));
  const hasCoverage = scannable.length > 0;
  const passedGate = hasCoverage && overallScore >= 80 && criticalCount === 0 && highCount === 0;

  let clientHandoffStatus: AuditResult['clientHandoffStatus'] = 'BLOCKED: CRITICAL SECURITY FLAWS';
  if (!hasCoverage) {
    clientHandoffStatus = 'CONDITIONAL PASS (REVIEWS REQUIRED)';
  } else if (passedGate) {
    clientHandoffStatus = 'READY FOR PRODUCTION';
  } else if (criticalCount === 0 && highCount <= 2) {
    clientHandoffStatus = 'CONDITIONAL PASS (REVIEWS REQUIRED)';
  } else if (criticalCount === 0) {
    clientHandoffStatus = 'BLOCKED: HIGH-SEVERITY ISSUES';
  } else {
    clientHandoffStatus = 'BLOCKED: CRITICAL SECURITY FLAWS';
  }

  // 8. Executive Summary
  const executiveSummary = !hasCoverage
    ? `No scannable source files (.ts/.tsx/.js/.jsx/.sql/package.json) were provided for "${projectName}", so no verdict can be given.`
    : generateExecutiveSummary(
    projectName,
    overallScore,
    letterGrade,
    passedGate,
    criticalCount,
    highCount,
    allIssues
  );

  const duration = Date.now() - startTime;

  return {
    id: `AUDIT-${Date.now()}`,
    projectName,
    timestamp: new Date().toISOString(),
    overallScore,
    letterGrade,
    passedGate,
    clientHandoffStatus,
    executiveSummary,
    categoryScores: {
      security: securityScore,
      reliability: reliabilityScore,
      architecture: architectureScore,
      performance: performanceScore,
      dependencies: dependencyScore
    },
    metrics: {
      totalFilesScanned: files.length,
      linesOfCode: totalLines,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      secretsDetected: secretIssues.length,
      vulnerableDependencies: depIssues.length,
      scanDurationMs: duration
    },
    stackDetected: stack,
    issues: allIssues
  };
}

function calculateCategoryScore(issues: AuditIssue[]): CategoryScore {
  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  const medium = issues.filter(i => i.severity === 'medium').length;
  const low = issues.filter(i => i.severity === 'low').length;

  const deduction = critical * 35 + high * 18 + medium * 8 + low * 3;
  const score = Math.max(0, 100 - deduction);

  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';

  return {
    score,
    maxScore: 100,
    grade,
    issuesCount: { critical, high, medium, low }
  };
}

function detectTechStack(files: FileEntry[]): string[] {
  const stack = new Set<string>();

  for (const f of files) {
    if (f.path.includes('next.config') || f.path.includes('/app/') || f.path.includes('/pages/')) {
      stack.add('Next.js');
    }
    if (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')) {
      stack.add('React');
    }
    if (f.path.endsWith('.ts') || f.path.endsWith('.tsx')) {
      stack.add('TypeScript');
    }
    if (f.content.includes('supabase') || f.content.includes('@supabase/supabase-js')) {
      stack.add('Supabase');
    }
    if (f.content.includes('stripe') || f.content.includes('@stripe/stripe-js')) {
      stack.add('Stripe');
    }
    if (f.content.includes('tailwind') || f.path.includes('tailwind.config')) {
      stack.add('Tailwind CSS');
    }
    if (f.content.includes('prisma') || f.path.includes('schema.prisma')) {
      stack.add('Prisma ORM');
    }
    if (f.path.endsWith('.sql')) {
      stack.add('PostgreSQL');
    }
  }

  if (stack.size === 0) stack.add('JavaScript / Node.js');
  return Array.from(stack);
}

function generateExecutiveSummary(
  projectName: string,
  score: number,
  grade: string,
  passed: boolean,
  criticalCount: number,
  highCount: number,
  issues: AuditIssue[]
): string {
  const caveat = ' Automated pattern-based checks only: complete a manual review (auth flows, business logic, infrastructure) before go-live.';
  if (passed) {
    return `Project "${projectName}" passed the automated gate with a rating of ${grade} (${score}/100). No critical or high-severity findings were produced by the built-in rule set.${caveat}`;
  }

  if (criticalCount > 0) {
    const topIssues = issues.filter(i => i.severity === 'critical').slice(0, 3).map(i => `• ${i.title}`).join('\n');
    return `CRITICAL DEPLOYMENT ALERT: Project "${projectName}" received a failing rating of ${grade} (${score}/100). The audit uncovered ${criticalCount} critical vulnerability blockades that must be remediated prior to exposing this application to public traffic or handing it over to clients. \n\nImmediate Action Required:\n${topIssues}\n\nDeploying in this state risks exposing sensitive customer data.`;
  }

  if (highCount > 2) {
    return `BLOCKED: Project "${projectName}" received ${grade} (${score}/100). No critical findings, but ${highCount} high-severity issues exceed the allowed limit of 2. Resolve them and re-run the audit.`;
  }

  return `CONDITIONAL REVIEW: Project "${projectName}" received a provisional rating of ${grade} (${score}/100). No critical findings, but ${highCount} high-severity issue(s) remain. Review the recommended fixes before client delivery.${caveat}`;
}
