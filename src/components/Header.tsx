import React from 'react';
import { ShieldCheck, Sparkles, Terminal, Award } from 'lucide-react';

interface HeaderProps {
  onOpenCertificate?: () => void;
  hasAuditResult?: boolean;
}

export function Header({ onOpenCertificate, hasAuditResult }: HeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">VIBEGATE</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Pre-Flight QA Gate
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Zero-Config Production Readiness & Security Auditor for AI-Generated & Agency Web Apps
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Next.js / Supabase / OWASP Hardened</span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deterministic SAST + MicroVM Ready</span>
          </div>

          {hasAuditResult && onOpenCertificate && (
            <button
              onClick={onOpenCertificate}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Client Handoff Certificate</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
