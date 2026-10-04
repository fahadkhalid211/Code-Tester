import { AuditIssue, FileEntry } from '../types';
import { compareVersions, parseMinVersion } from './utils';

interface KnownVulnerability {
  name: string;
  minVulnerableVersion?: string;
  maxVulnerableVersion: string;
  cve: string;
  severity: 'critical' | 'high' | 'medium';
  title: string;
  explanation: string;
  businessImpact: string;
  recommendation: string;
  fixedVersion: string;
}

const KNOWN_VULNERABILITIES: KnownVulnerability[] = [
  {
    name: 'jsonwebtoken',
    maxVulnerableVersion: '8.5.1',
    cve: 'CVE-2022-23529',
    severity: 'critical',
    title: 'Arbitrary Code Execution in jsonwebtoken verify',
    explanation: 'jsonwebtoken versions <= 8.5.1 allow arbitrary code execution when untrusted keys are passed to the `verify` method.',
    businessImpact: 'Remote code execution (RCE) on backend authentication servers.',
    recommendation: 'Upgrade to jsonwebtoken ^9.0.0 or migrate to modern jose library.',
    fixedVersion: '^9.0.2'
  },
  {
    name: 'axios',
    minVulnerableVersion: '1.3.2',
    maxVulnerableVersion: '1.7.3',
    cve: 'CVE-2024-39338',
    severity: 'high',
    title: 'Server-Side Request Forgery (SSRF) in Axios',
    explanation: 'Axios versions prior to 1.7.4 are vulnerable to SSRF via protocol-relative URLs.',
    businessImpact: 'Attacker can coerce the server into sending requests to internal cloud metadata endpoints or private subnet services.',
    recommendation: 'Upgrade axios to version ^1.7.4 or later.',
    fixedVersion: '^1.7.7'
  },
  {
    name: 'lodash',
    maxVulnerableVersion: '4.17.20',
    cve: 'CVE-2020-8203',
    severity: 'high',
    title: 'Prototype Pollution in lodash.set and lodash.merge',
    explanation: 'Lodash versions prior to 4.17.21 are susceptible to prototype pollution via zipObjectDeep and merge.',
    businessImpact: 'Denial of service, property injection, and potential remote execution.',
    recommendation: 'Upgrade lodash to ^4.17.21 or replace with native ES2022 methods.',
    fixedVersion: '^4.17.21'
  },
  {
    name: 'express-fileupload',
    maxVulnerableVersion: '1.4.0',
    cve: 'CVE-2022-27260',
    severity: 'critical',
    title: 'Prototype Pollution via Upload Fields',
    explanation: 'express-fileupload versions <= 1.4.0 allow attackers to pollute the Object prototype via form-data fields.',
    businessImpact: 'Application crash or arbitrary code execution during multipart file uploads.',
    recommendation: 'Upgrade to express-fileupload ^1.4.1.',
    fixedVersion: '^1.4.1'
  },
  {
    name: 'next',
    maxVulnerableVersion: '14.1.0',
    cve: 'CVE-2024-34351',
    severity: 'high',
    title: 'Server-Side Request Forgery (SSRF) in Next.js Server Actions',
    explanation: 'Next.js versions prior to 14.1.1 are vulnerable to SSRF through the host header in Server Action redirects.',
    businessImpact: 'Internal network port scanning and cloud metadata exfiltration.',
    recommendation: 'Upgrade Next.js to ^14.2.15 or ^15.0.0+.',
    fixedVersion: '^15.0.0'
  }
];

export function scanDependencies(files: FileEntry[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const pkgFile = files.find(f => f.path.endsWith('package.json') && !f.path.includes('node_modules'));
  if (!pkgFile) return issues;

  try {
    const pkgJson = JSON.parse(pkgFile.content);
    const allDeps = {
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.devDependencies || {})
    };

    for (const [depName, versionSpec] of Object.entries(allDeps)) {
      const versionStr = String(versionSpec);

      // Check wildcards / dangerous version pinning
      if (versionStr === '*' || versionStr === 'latest') {
        issues.push({
          id: `DEP-WILD-${depName}`,
          title: `Unpinned Dependency Wildcard: "${depName}": "${versionStr}"`,
          category: 'dependencies',
          severity: 'medium',
          filePath: pkgFile.path,
          explanation: `The package "${depName}" is configured with a wildcard or 'latest' version. Every time you build or deploy, an unverified version will be pulled, exposing the project to supply chain takeovers and unexpected breaking changes.`,
          businessImpact: 'Build instability and vulnerability to malicious package updates released upstream.',
          recommendation: 'Pin dependencies to an exact or caret version (e.g. ^1.2.3) and commit package-lock.json.',
          ruleId: 'DEP-PIN-001',
          suggestedFix: {
            codeBefore: `"${depName}": "${versionStr}"`,
            codeAfter: `"${depName}": "^1.0.0"`,
            explanation: 'Pin to a specific stable semantic version.',
            diffSummary: `Pin ${depName} version`
          }
        });
      }

      // Check known vulnerability list
      const matchedVuln = KNOWN_VULNERABILITIES.find(v => v.name === depName);
      if (matchedVuln) {
        // Compare the lowest version the range allows against the last vulnerable release.
        const minVersion = parseMinVersion(versionStr);
        const maxVuln = parseMinVersion(matchedVuln.maxVulnerableVersion);
        const minVuln = parseMinVersion(matchedVuln.minVulnerableVersion ?? '0.0.0');
        if (minVersion && maxVuln && minVuln && compareVersions(minVersion, maxVuln) <= 0 && compareVersions(minVersion, minVuln) >= 0) {
          issues.push({
            id: `DEP-VULN-${depName}-${matchedVuln.cve}`,
            title: `${matchedVuln.title} (${depName})`,
            category: 'dependencies',
            severity: matchedVuln.severity,
            filePath: pkgFile.path,
            explanation: matchedVuln.explanation,
            businessImpact: matchedVuln.businessImpact,
            recommendation: matchedVuln.recommendation,
            cve: matchedVuln.cve,
            ruleId: matchedVuln.cve,
            suggestedFix: {
              codeBefore: `"${depName}": "${versionStr}"`,
              codeAfter: `"${depName}": "${matchedVuln.fixedVersion}"`,
              explanation: `Upgrade ${depName} to ${matchedVuln.fixedVersion} to resolve ${matchedVuln.cve}.`,
              diffSummary: `Upgrade ${depName} to safe version`
            }
          });
        }
      }
    }
  } catch {
    issues.push({
      id: 'DEP-PARSE-ERROR',
      title: 'package.json could not be parsed',
      category: 'dependencies',
      severity: 'low',
      filePath: pkgFile.path,
      explanation: 'The dependency scan was skipped because package.json is not valid JSON.',
      businessImpact: 'Dependency risk is unknown.',
      recommendation: 'Fix the JSON syntax and re-run the audit.',
      ruleId: 'DEP-PARSE-001'
    });
  }

  return issues;
}
