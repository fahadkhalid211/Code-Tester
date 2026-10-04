/** Replace comments with spaces, preserving newlines so line numbers stay valid. */
export function stripComments(src: string, isSql = false): string {
  const blank = (m: string) => m.replace(/[^\n]/g, ' ');
  let out = src.replace(/\/\*[\s\S]*?\*\//g, blank);
  out = isSql
    ? out.replace(/--[^\n]*/g, blank)
    : out.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, p1) => p1 + blank(m.slice(p1.length)));
  return out;
}

/** Parse "^1.2.3", "~1.2", ">=1.0.0 <2", "1.x" into the lowest concrete version it names. */
export function parseMinVersion(spec: string): [number, number, number] | null {
  const m = spec.match(/(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?/i);
  if (!m) return null;
  const n = (v?: string) => (v && /^\d+$/.test(v) ? parseInt(v, 10) : 0);
  return [n(m[1]), n(m[2]), n(m[3])];
}

export function compareVersions(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return 0;
}

export function maskSecret(text: string, pattern: RegExp): string {
  const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
  return text.replace(new RegExp(pattern.source, flags), (m) =>
    m.length <= 10 ? '***' : `${m.slice(0, 4)}…[REDACTED ${m.length} chars]`
  );
}

export const PLACEHOLDER_RE = /(your[-_ ]?|example|placeholder|changeme|xxx+|<[^>]+>|\.\.\.|process\.env|import\.meta\.env)/i;
