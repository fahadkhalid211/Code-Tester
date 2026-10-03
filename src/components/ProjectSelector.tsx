import React, { useState } from 'react';
import { DEMO_PROJECTS, DemoProject } from '@/lib/demoProjects';
import { Play, Code2, AlertTriangle, ShieldCheck, CheckCircle2, Upload, FileCode } from 'lucide-react';
import { FileEntry } from '@/lib/types';

interface ProjectSelectorProps {
  onRunAudit: (payload: { demoId?: string; projectName?: string; files?: FileEntry[] }) => void;
  isLoading: boolean;
}

export function ProjectSelector({ onRunAudit, isLoading }: ProjectSelectorProps) {
  const [selectedDemoId, setSelectedDemoId] = useState<string>(DEMO_PROJECTS[0].id);
  const [activeTab, setActiveTab] = useState<'demos' | 'custom'>('demos');

  // Custom code state
  const [customProjectName, setCustomProjectName] = useState('My Custom App');
  const [customFilePath, setCustomFilePath] = useState('src/app/actions/mutate.ts');
  const [customFileContent, setCustomFileContent] = useState(`'use server';
import { db } from '@/lib/db';

// Test your own code snippet:
export async function deleteRecord(id: string) {
  // Try adding auth check or raw SQL to see how VIBEGATE reacts!
  await db.query(\`DELETE FROM accounts WHERE id = '\${id}'\`);
  return { success: true };
}
`);

  const handleRun = () => {
    if (activeTab === 'demos') {
      onRunAudit({ demoId: selectedDemoId });
    } else {
      onRunAudit({
        projectName: customProjectName,
        files: [
          {
            path: customFilePath,
            content: customFileContent
          }
        ]
      });
    }
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Select Target Application to Audit</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Test against realistic AI vibe-coded flaws, client e-commerce repositories, or paste custom source files.
          </p>
        </div>

        <div className="flex rounded-lg bg-zinc-950 p-1 border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('demos')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'demos'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Curated Repositories
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'custom'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Custom Code / Paste
          </button>
        </div>
      </div>

      {activeTab === 'demos' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMO_PROJECTS.map((demo) => {
            const isSelected = selectedDemoId === demo.id;
            return (
              <div
                key={demo.id}
                onClick={() => setSelectedDemoId(demo.id)}
                className={`relative p-5 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-950/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${demo.badgeColor}`}>
                    {demo.badge}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">{demo.files.length} files</span>
                </div>

                <h3 className="font-semibold text-sm text-white mb-1.5">{demo.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-4">{demo.description}</p>

                <div className="text-[11px] text-zinc-500 border-t border-zinc-800/80 pt-2 flex items-center justify-between">
                  <span className="truncate max-w-[170px]">{demo.files[0]?.path}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Project Name</label>
              <input
                type="text"
                value={customProjectName}
                onChange={(e) => setCustomProjectName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Client Deliverable V1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Simulated File Path</label>
              <input
                type="text"
                value={customFilePath}
                onChange={(e) => setCustomFilePath(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                placeholder="src/app/actions/checkout.ts"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
              <span>Source Code to Audit</span>
              <span className="text-zinc-500">TypeScript / React / SQL / JSON</span>
            </label>
            <textarea
              rows={8}
              value={customFileContent}
              onChange={(e) => setCustomFileContent(e.target.value)}
              className="w-full font-mono text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center space-x-2 text-xs text-zinc-400">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span>Scans for OWASP Top 10, Leaked Keys, Next.js Server Actions, Supabase RLS, and N+1 Queries</span>
        </div>

        <button
          onClick={handleRun}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Sandbox...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Full Pre-Flight Audit</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
