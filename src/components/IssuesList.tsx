import React, { useState } from 'react';
import { AuditIssue, IssueSeverity } from '@/lib/types';
import { ShieldAlert, AlertTriangle, Info, Check, Copy, ChevronDown, ChevronRight, FileCode, CheckCircle2 } from 'lucide-react';

interface IssuesListProps {
  issues: AuditIssue[];
}

export function IssuesList({ issues }: IssuesListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIssueIds, setExpandedIssueIds] = useState<Record<string, boolean>>({
    [issues[0]?.id || '']: true
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIssueIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => setCopiedId(null));
  };

  const filteredIssues = issues.filter(issue => {
    if (selectedCategory !== 'all' && issue.category !== selectedCategory) return false;
    if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.filePath.toLowerCase().includes(q) ||
        issue.ruleId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (severity: IssueSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3" />
            <span className="uppercase">Critical Block</span>
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span className="uppercase">High</span>
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center space-x-1">
            <Info className="w-3 h-3" />
            <span className="uppercase">Medium</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center space-x-1">
            <span className="uppercase">Low</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Audit Findings & Automated Verified Fixes</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Every issue includes business consequence analysis and verified side-by-side patch diffs.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search rules, files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 w-44"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="security">Security</option>
            <option value="reliability">Reliability</option>
            <option value="architecture">Architecture</option>
            <option value="performance">Performance</option>
            <option value="dependencies">Dependencies</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>
        </div>
      </div>

      {filteredIssues.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
          <p className="font-semibold text-zinc-300">Zero issues match the selected filters</p>
          <p className="text-zinc-500 mt-1">This repository or module meets all verification standards.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue) => {
            const isExpanded = !!expandedIssueIds[issue.id];
            return (
              <div
                key={issue.id}
                className="border border-zinc-800 rounded-xl bg-zinc-950/40 overflow-hidden transition-all hover:border-zinc-700/80"
              >
                {/* Issue Header Bar */}
                <div
                  onClick={() => toggleExpand(issue.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none bg-zinc-950/70 hover:bg-zinc-900/50"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <button aria-expanded={isExpanded} aria-label={isExpanded ? 'Collapse issue' : 'Expand issue'} className="text-zinc-500 hover:text-zinc-300">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {getSeverityBadge(issue.severity)}
                    <h4 className="text-xs font-semibold text-zinc-100 truncate">{issue.title}</h4>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-zinc-500 shrink-0 font-mono">
                    <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] text-zinc-400">
                      <FileCode className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{issue.filePath}{issue.lineNumber ? `:${issue.lineNumber}` : ''}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {issue.ruleId}
                    </span>
                  </div>
                </div>

                {/* Expanded Details & Diff Fix */}
                {isExpanded && (
                  <div className="p-5 border-t border-zinc-800/80 space-y-4 bg-zinc-950/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800/70">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                          Technical Explanation
                        </h5>
                        <p className="text-xs text-zinc-300 leading-relaxed">{issue.explanation}</p>
                      </div>

                      <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-900/30">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-1">
                          Business & Client Impact
                        </h5>
                        <p className="text-xs text-zinc-300 leading-relaxed">{issue.businessImpact}</p>
                      </div>
                    </div>

                    {/* Problematic Code Snippet */}
                    {issue.snippet && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1 font-mono">
                          <span>Offending Code ({issue.filePath})</span>
                        </div>
                        <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-rose-300 overflow-x-auto leading-relaxed">
                          {issue.snippet}
                        </pre>
                      </div>
                    )}

                    {/* Suggested Patch / Fix */}
                    {issue.suggestedFix && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Recommended Remediation (Ready to Apply)</span>
                          </span>
                          <button
                            onClick={() => copyToClipboard(issue.suggestedFix!.codeAfter, issue.id)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition-colors"
                          >
                            {copiedId === issue.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Fix</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 font-mono text-xs">
                          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-300 overflow-x-auto">
                            <div className="text-[10px] uppercase font-bold text-rose-500 mb-1">Current Implementation</div>
                            <pre className="whitespace-pre-wrap">{issue.suggestedFix.codeBefore}</pre>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 overflow-x-auto">
                            <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">Verified Fix</div>
                            <pre className="whitespace-pre-wrap">{issue.suggestedFix.codeAfter}</pre>
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-400 mt-2 italic">
                          Rationale: {issue.suggestedFix.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
