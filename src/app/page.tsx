'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ProjectSelector } from '@/components/ProjectSelector';
import { ScoreGauge } from '@/components/ScoreGauge';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { IssuesList } from '@/components/IssuesList';
import { ClientCertificateModal } from '@/components/ClientCertificateModal';
import { AuditResult, FileEntry } from '@/lib/types';
import { DEMO_PROJECTS } from '@/lib/demoProjects';
import { runFullAudit } from '@/lib/auditEngine';

export default function Home() {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  // Initialize with Demo 1 (Vibe-Coded SaaS) so the user immediately sees live findings
  useEffect(() => {
    const initialDemo = DEMO_PROJECTS[0];
    const res = runFullAudit(initialDemo.name, initialDemo.files);
    setAuditResult(res);
  }, []);

  const handleRunAudit = async (payload: { demoId?: string; projectName?: string; files?: FileEntry[] }) => {
    setIsLoading(true);
    setLoadingStep('Ingesting repository files...');

    try {
      setTimeout(() => setLoadingStep('Scanning for leaked credentials & high-entropy tokens...'), 300);
      setTimeout(() => setLoadingStep('Analyzing Next.js Server Actions & Supabase RLS policies...'), 700);
      setTimeout(() => setLoadingStep('Auditing dependency lockfiles against known CVE databases...'), 1100);
      setTimeout(() => setLoadingStep('Calculating production readiness score & generating verified fixes...'), 1500);

      const response = await fetch('/api/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Audit API returned error status');
      }

      const data: AuditResult = await response.json();
      setTimeout(() => {
        setAuditResult(data);
        setIsLoading(false);
      }, 1800);
    } catch (err) {
      console.error(err);
      // Fallback local run if fetch fails in dev
      if (payload.demoId) {
        const demo = DEMO_PROJECTS.find(d => d.id === payload.demoId);
        if (demo) {
          const res = runFullAudit(demo.name, demo.files);
          setAuditResult(res);
        }
      }
      setIsLoading(false);
    }
  };

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

        {/* Loading Overlay */}
        {isLoading && (
          <div className="p-8 rounded-2xl bg-zinc-900/90 border border-indigo-500/40 shadow-2xl flex flex-col items-center justify-center space-y-4 text-center animate-pulse">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <div>
              <p className="text-sm font-semibold text-white tracking-wide">{loadingStep}</p>
              <p className="text-xs text-zinc-400 mt-1 font-mono">Simulating isolated container execution</p>
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
