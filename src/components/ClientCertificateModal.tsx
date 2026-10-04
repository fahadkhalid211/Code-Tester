import React from 'react';
import { AuditResult } from '@/lib/types';
import { Award, CheckCircle2, X, Printer, ShieldAlert } from 'lucide-react';

interface ClientCertificateModalProps {
  result: AuditResult;
  onClose: () => void;
}

export function ClientCertificateModal({ result, onClose }: ClientCertificateModalProps) {
  const { projectName, timestamp, overallScore, letterGrade, passedGate, id, metrics, clientHandoffStatus } = result;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-700 rounded-3xl p-8 shadow-2xl my-8">
        {/* Close & Print Controls */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Client Delivery & Production Handoff Certificate
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Printable) */}
        <div id="certificate-print-area" className="mt-8 border-4 border-double border-amber-500/30 rounded-2xl p-8 bg-zinc-900/40 relative">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 mb-2">
              <Award className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white tracking-wide">
              CERTIFICATE OF PRODUCTION READINESS
            </h2>
            <p className="text-xs uppercase tracking-widest text-amber-400 font-mono">
              Formal Quality Assurance & Security Verification Seal
            </p>
          </div>

          <div className="my-6 text-center text-xs text-zinc-300 leading-relaxed max-w-lg mx-auto">
            This document certifies that the software repository for{' '}
            <span className="text-white font-bold underline">{projectName}</span> has been analysed by the
            VIBEGATE automated static ruleset (secret detection, pattern-based security checks, dependency
            checks). This is not a penetration test or a substitute for manual security review.
          </div>

          {/* Audit Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 my-6 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
            <div>
              <p className="text-[10px] uppercase text-zinc-500 font-mono">Readiness Grade</p>
              <p className={`text-2xl font-black mt-0.5 ${passedGate ? 'text-emerald-400' : 'text-rose-400'}`}>
                {letterGrade} ({overallScore}/100)
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-zinc-500 font-mono">Handoff Status</p>
              <p className={`text-xs font-bold mt-1.5 ${passedGate ? 'text-emerald-400' : 'text-rose-400'}`}>
                {passedGate ? 'APPROVED' : clientHandoffStatus.startsWith('CONDITIONAL') ? 'CONDITIONAL' : 'BLOCKED'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-zinc-500 font-mono">Audit Identification</p>
              <p className="text-xs font-mono text-zinc-300 mt-1.5">{id}</p>
            </div>
          </div>

          {/* Verification Checklist */}
          <div className="space-y-2 my-6 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-zinc-300">1. High-Entropy Credentials & Secret Leak Scan</span>
              {metrics.secretsDetected === 0 ? (
                <span className="text-emerald-400 flex items-center space-x-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Passed (0 Leaks)</span>
                </span>
              ) : (
                <span className="text-rose-400 flex items-center space-x-1 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Failed ({metrics.secretsDetected} Leaks)</span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-zinc-300">2. Supabase RLS & Next.js Server Action Auth Gates</span>
              {metrics.criticalCount === 0 && metrics.highCount === 0 ? (
                <span className="text-emerald-400 flex items-center space-x-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>No findings (automated checks)</span>
                </span>
              ) : (
                <span className="text-rose-400 flex items-center space-x-1 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Findings Present</span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-zinc-300">3. Dependency Supply Chain (Known CVE Audit)</span>
              {metrics.vulnerableDependencies === 0 ? (
                <span className="text-emerald-400 flex items-center space-x-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Clean (0 CVEs)</span>
                </span>
              ) : (
                <span className="text-yellow-400 flex items-center space-x-1 font-semibold">
                  <span>{metrics.vulnerableDependencies} Flagged</span>
                </span>
              )}
            </div>
          </div>

          {/* Signature & Sign-Off Escrow Block */}
          <div className="mt-8 pt-6 border-t border-zinc-800 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-zinc-600 pb-1 font-serif italic text-zinc-300">
                VIBEGATE Engine QA Signature
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase font-mono">Automated Auditor Verification</p>
            </div>
            <div>
              <div className="border-b border-zinc-600 pb-1 text-zinc-400">
                [Client Sign-Off Signature]
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase font-mono">Authorized Stakeholder Acceptance</p>
            </div>
          </div>

          <div className="mt-6 text-center text-[10px] text-zinc-500 font-mono">
            Generated {new Date(timestamp).toUTCString()}
          </div>
        </div>
      </div>
    </div>
  );
}
