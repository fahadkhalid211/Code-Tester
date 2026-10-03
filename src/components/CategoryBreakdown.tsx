import React from 'react';
import { AuditResult } from '@/lib/types';
import { Shield, Cpu, Activity, Zap, PackageCheck } from 'lucide-react';

interface CategoryBreakdownProps {
  result: AuditResult;
}

export function CategoryBreakdown({ result }: CategoryBreakdownProps) {
  const { categoryScores } = result;

  const categories = [
    {
      key: 'security',
      title: 'Security & Auth',
      weight: '35% weight',
      icon: Shield,
      data: categoryScores.security,
      description: 'Leaked keys, Next.js Server Actions, Supabase RLS, SQLi, CORS'
    },
    {
      key: 'reliability',
      title: 'Reliability & Resilience',
      weight: '20% weight',
      icon: Activity,
      data: categoryScores.reliability,
      description: 'Error boundaries, unhandled async promises, memory leaks'
    },
    {
      key: 'architecture',
      title: 'Architecture & Tech Debt',
      weight: '15% weight',
      icon: Cpu,
      data: categoryScores.architecture,
      description: 'Monolithic AI components, code bloat, separation of concerns'
    },
    {
      key: 'performance',
      title: 'Performance & DB Queries',
      weight: '15% weight',
      icon: Zap,
      data: categoryScores.performance,
      description: 'N+1 loops, unpaginated queries, unoptimized assets'
    },
    {
      key: 'dependencies',
      title: 'Dependencies & Supply Chain',
      weight: '15% weight',
      icon: PackageCheck,
      data: categoryScores.dependencies,
      description: 'Known CVE vulnerabilities, wildcards, abandoned packages'
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500';
    if (score >= 70) return 'text-blue-400 bg-blue-500';
    if (score >= 50) return 'text-yellow-400 bg-yellow-500';
    return 'text-rose-400 bg-rose-500';
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Five-Pillar Quality Breakdown</h3>
        <span className="text-xs text-zinc-400">SOC2 & OWASP 2026 Aligned</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const score = cat.data.score;
          const issuesTotal =
            cat.data.issuesCount.critical +
            cat.data.issuesCount.high +
            cat.data.issuesCount.medium +
            cat.data.issuesCount.low;

          return (
            <div
              key={cat.key}
              className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-zinc-900 text-zinc-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{cat.weight}</span>
                </div>

                <h4 className="text-xs font-semibold text-white truncate">{cat.title}</h4>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{cat.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-lg font-bold text-white">{score}</span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {issuesTotal === 0 ? 'Clean' : `${issuesTotal} finding${issuesTotal > 1 ? 's' : ''}`}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreColor(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>Crit: {cat.data.issuesCount.critical}</span>
                  <span>High: {cat.data.issuesCount.high}</span>
                  <span>Med: {cat.data.issuesCount.medium}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
