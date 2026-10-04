'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { ProjectSelector } from '@/components/ProjectSelector';
import { ScoreGauge } from '@/components/ScoreGauge';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { IssuesList } from '@/components/IssuesList';
import { ClientCertificateModal } from '@/components/ClientCertificateModal';
import { AuditResult, FileEntry } from '@/lib/types';
import { DEMO_PROJECTS } from '@/lib/demoProjects';

export default function Home() {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true until the initial demo audit finishes
  const [error, setError] = useState<string | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  // Only the most recent request may update state (prevents stale responses overwriting newer ones).
  const requestIdRef = useRef(0);

  const handleRunAudit = useCallback(
    async (payload: { demoId?: string; projectName?: string; files?: FileEntry[] }) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/audit/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || `Audit failed (HTTP ${response.status})`);
        }
        if (requestId === requestIdRef.current) setAuditResult(data as AuditResult);
      } catch (err) {
        console.error(err);
        if (requestId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : 'Audit failed. Please try again.');
        }
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    []
  );

  // Load the first demo on mount so the dashboard is never empty.
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    (async () => {
      try {
        const res = await fetch('/api/audit/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demoId: DEMO_PROJECTS[0].id })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || `Audit failed (HTTP ${res.status})`);
        if (requestId === requestIdRef.current) setAuditResult(data as AuditResult);
      } catch (err) {
        console.error(err);
        if (requestId === requestIdRef.current) setError('Could not load the demo audit. Run an audit manually.');
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Header
        onOpenCertificate={() => setIsCertificateOpen(true)}
        hasAuditResult={!!auditResult}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Project Selector / Ingestion */}
        <section>
          <ProjectSelector onRunAudit={handleRunAudit} isLoading={isLoading} />
        </section>

        {error && (
          <div role="alert" className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200">
            {error}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div role="status" aria-live="polite" className="p-8 rounded-2xl bg-zinc-900/90 border border-indigo-500/40 shadow-2xl flex flex-col items-center justify-center space-y-4 text-center animate-pulse">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <div>
              <p className="text-sm font-semibold text-white tracking-wide">Running secret, SAST, dependency, architecture and performance scanners...</p>
            </div>
          </div>
        )}

        {/* Audit Results Dashboard */}
        {!isLoading && auditResult && (
          <div className="space-y-8 transition-all duration-300">
            {/* Score & Executive Summary */}
            <section>
              <ScoreGauge result={auditResult} />
            </section>

            {/* Category Breakdown (5 Pillars) */}
            <section>
              <CategoryBreakdown result={auditResult} />
            </section>

            {/* Findings & Verified Fixes */}
            <section>
              <IssuesList issues={auditResult.issues} />
            </section>
          </div>
        )}
      </main>

      {/* Certificate Modal */}
      {isCertificateOpen && auditResult && (
        <ClientCertificateModal
          result={auditResult}
          onClose={() => setIsCertificateOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VIBEGATE — The Production Quality & Security Gate for Modern Web Apps</span>
          <span>Zero-Config • Deterministic SAST • OWASP 2026</span>
        </div>
      </footer>
    </div>
  );
}
