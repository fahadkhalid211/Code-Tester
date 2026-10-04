import React from 'react';
import { AuditResult } from '@/lib/types';
import { ShieldAlert, ShieldCheck, AlertCircle, KeyRound, Bug, FileCode, CheckCircle2 } from 'lucide-react';

interface ScoreGaugeProps {
  result: AuditResult;
}

export function ScoreGauge({ result }: ScoreGaugeProps) {
  const { overallScore, letterGrade, passedGate, clientHandoffStatus, executiveSummary, metrics, stackDetected } = result;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20 shadow-emerald-500/20';
      case 'B':
        return 'text-blue-400 border-blue-500/40 bg-blue-950/20 shadow-blue-500/20';
      case 'C':
        return 'text-yellow-400 border-yellow-500/40 bg-yellow-950/20 shadow-yellow-500/20';
      case 'D':
        return 'text-orange-400 border-orange-500/40 bg-orange-950/20 shadow-orange-500/20';
      default:
        return 'text-rose-400 border-rose-500/40 bg-rose-950/20 shadow-rose-500/20';
    }
  };

  const getStatusBadge = () => {
    if (passedGate) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{clientHandoffStatus}</span>
        </span>
      );
    }
    if (clientHandoffStatus.includes('CONDITIONAL')) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{clientHandoffStatus}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>{clientHandoffStatus}</span>
      </span>
    );
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Score & Grade Display */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
          <div
            className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-xl mb-3 ${getGradeColor(
              letterGrade
            )}`}
          >
            <span className="text-4xl font-extrabold tracking-tight">{letterGrade}</span>
            <span className="text-[11px] font-mono opacity-80">{overallScore}/100</span>
          </div>

          <div className="text-center">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Production Readiness Score</h3>
            <div className="mt-2">{getStatusBadge()}</div>
          </div>
        </div>

        {/* Executive Summary & Stack */}
        <div className="lg:col-span-8 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Executive Verification Report</span>
                <span className="text-xs font-mono text-zinc-500">[{result.projectName}]</span>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {stackDetected.map(st => (
                  <span key={st} className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-medium">
                    {st}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
              {executiveSummary}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/60 flex items-center space-x-3">
              <div className="p-2 rounded-md bg-rose-500/10 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Critical Issues</p>
                <p className="text-sm font-bold text-rose-400">{metrics.criticalCount}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/60 flex items-center space-x-3">
              <div className="p-2 rounded-md bg-amber-500/10 text-amber-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Leaked Secrets</p>
                <p className="text-sm font-bold text-amber-400">{metrics.secretsDetected}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/60 flex items-center space-x-3">
              <div className="p-2 rounded-md bg-orange-500/10 text-orange-400">
                <Bug className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">High / Medium</p>
                <p className="text-sm font-bold text-zinc-200">{metrics.highCount + metrics.mediumCount}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/60 flex items-center space-x-3">
              <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-400">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Lines Scanned</p>
                <p className="text-sm font-bold text-zinc-200">{metrics.linesOfCode.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
