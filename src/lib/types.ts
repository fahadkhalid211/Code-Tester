export type IssueCategory = 'security' | 'reliability' | 'architecture' | 'performance' | 'dependencies';
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface CodeFix {
  codeBefore: string;
  codeAfter: string;
  explanation: string;
  diffSummary?: string;
}

export interface AuditIssue {
  id: string;
  title: string;
  category: IssueCategory;
  severity: IssueSeverity;
  filePath: string;
  lineNumber?: number;
  snippet?: string;
  explanation: string;
  businessImpact: string;
  recommendation: string;
  suggestedFix?: CodeFix;
  ruleId: string;
  cve?: string;
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issuesCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface AuditMetrics {
  totalFilesScanned: number;
  linesOfCode: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  secretsDetected: number;
  vulnerableDependencies: number;
  scanDurationMs: number;
}

export interface AuditResult {
  id: string;
  projectName: string;
  timestamp: string;
  overallScore: number;
  letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  passedGate: boolean;
  clientHandoffStatus: 'READY FOR PRODUCTION' | 'CONDITIONAL PASS (REVIEWS REQUIRED)' | 'BLOCKED: CRITICAL SECURITY FLAWS';
  executiveSummary: string;
  categoryScores: {
    security: CategoryScore;
    reliability: CategoryScore;
    architecture: CategoryScore;
    performance: CategoryScore;
    dependencies: CategoryScore;
  };
  metrics: AuditMetrics;
  stackDetected: string[];
  issues: AuditIssue[];
}

export interface FileEntry {
  path: string;
  content: string;
}
