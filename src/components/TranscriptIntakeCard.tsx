import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Loader2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { SAMPLE_MEETING_TRANSCRIPT } from '../data/seedProjects';
import {
  loadStoredAuditSummary,
  loadStoredOpenRouterKey,
  saveStoredAuditSummary,
  saveStoredOpenRouterKey,
} from '../services/storageService';
import { extractProjectsFromTranscript } from '../services/transcriptService';
import type { AuditSummary, Project, SafeUser } from '../types/crm';

interface TranscriptIntakeCardProps {
  user: SafeUser;
  onProjectsSaved: (newProjects: Project[]) => void;
}

export const TranscriptIntakeCard: React.FC<TranscriptIntakeCardProps> = ({
  user,
  onProjectsSaved,
}) => {
  const [apiKey, setApiKey] = useState<string>(() => loadStoredOpenRouterKey());
  const [showKey, setShowKey] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  // Red validation warning banner is strictly hidden by default
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(() =>
    loadStoredAuditSummary()
  );
  const [reportExpanded, setReportExpanded] = useState(true);

  const hasEnvFallbackKey = Boolean((import.meta.env.VITE_OPENROUTER_API_KEY ?? '').trim());

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    saveStoredOpenRouterKey(value);
  };

  const handleInsertSample = () => {
    setTranscript(SAMPLE_MEETING_TRANSCRIPT);
    setValidationErrors([]);
    setSuccessMessage(null);
  };

  const handleClearReport = () => {
    setAuditSummary(null);
    saveStoredAuditSummary(null);
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setSuccessMessage(null);
    setIsExtracting(true);

    try {
      const result = await extractProjectsFromTranscript({
        user,
        transcript,
        apiKeyInput: apiKey,
      });

      if (result.errors.length > 0 || result.projects.length === 0) {
        // Save nothing and display the red validation alert listing unresolved fields
        setValidationErrors(
          result.errors.length > 0
            ? result.errors
            : ['Extraction returned no valid projects. Nothing was saved.']
        );
        return;
      }

      onProjectsSaved(result.projects);
      if (result.auditSummary) {
        saveStoredAuditSummary(result.auditSummary);
        setAuditSummary(result.auditSummary);
        setReportExpanded(true);
      }
      const taskCount = result.projects.reduce((acc, p) => acc + p.tasks.length, 0);
      setSuccessMessage(
        `Extracted and saved ${result.projects.length} project${
          result.projects.length === 1 ? '' : 's'
        } (${taskCount} task${taskCount === 1 ? '' : 's'}).`
      );
      setTranscript('');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_1px_2px_-1px_rgba(15,23,42,0.02)]">
      {/* Header with OpenRouter API Key input at top of transcript card */}
      <div className="px-6 py-4 border-b border-[#f1f5f9] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0f172a]">
            Create from Transcript
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Paste client alignment notes to extract agreed projects, owners, deadlines, and scoped tasks.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="openrouter-api-key" className="sr-only">
            OpenRouter API Key
          </label>
          <div className="relative flex items-center">
            <KeyRound className="w-3.5 h-3.5 text-[#64748b] absolute left-2.5 pointer-events-none" />
            <input
              id="openrouter-api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={
                hasEnvFallbackKey
                  ? 'OpenRouter key (using env fallback)'
                  : 'OpenRouter API Key (sk-or-v1-...)'
              }
              className="w-64 sm:w-72 h-9 pl-8 pr-8 bg-[#f8fafc] border border-slate-200 rounded-lg text-xs font-mono text-[#0f172a] placeholder:font-sans placeholder:text-[#94a3b8] focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
              className="absolute right-2 p-1 text-[#64748b] hover:text-[#0f172a] cursor-pointer transition-all duration-150 active:scale-95"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleExtract} className="p-6 space-y-4">
        {/* Red validation warning banner: hidden by default, shown ONLY on extraction/validation failure */}
        {validationErrors.length > 0 && (
          <div
            role="alert"
            className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-[#b91c1c]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#b91c1c]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#991b1b]">
                    Validation failed — no projects were saved
                  </h3>
                  <ul className="mt-1.5 space-y-1 text-xs text-[#b91c1c] list-disc list-inside">
                    {validationErrors.map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidationErrors([])}
                aria-label="Dismiss validation error"
                className="p-1 rounded-full hover:bg-[#fee2e2] text-[#b91c1c] cursor-pointer shrink-0 transition-all duration-150 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-full border border-emerald-200 bg-emerald-50/95 px-4 py-2.5 text-xs font-medium text-emerald-800 shadow-sm flex items-center justify-between gap-3 animate-toast-in"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss confirmation"
              className="p-1 rounded-full hover:bg-emerald-100 cursor-pointer transition-all duration-150 active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Collapsible AI Extraction & Guardrail Report card persisted in localStorage */}
        {auditSummary && (
          <div className="rounded-lg border border-slate-200/80 bg-[#f8fafc] overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between gap-3 bg-white border-b border-[#f1f5f9]">
              <button
                type="button"
                onClick={() => setReportExpanded((prev) => !prev)}
                className="flex items-center gap-2 text-left cursor-pointer min-w-0 transition-opacity hover:opacity-85"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-semibold text-[#0f172a] truncate">
                  AI Extraction &amp; Guardrail Report
                </span>
                <span className="text-[11px] text-[#64748b] font-mono tabular-nums shrink-0">
                  ({auditSummary.revisionsApplied.length} revisions ·{' '}
                  {auditSummary.excludedFeatures.length} excluded ·{' '}
                  {auditSummary.ignoredExternalPeople.length} external ignored)
                </span>
                {reportExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#64748b] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#64748b] shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={handleClearReport}
                aria-label="Clear guardrail report"
                className="p-1 rounded text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] cursor-pointer shrink-0 transition-all duration-150 active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {reportExpanded && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#4338ca] mb-1.5">
                    Revisions Applied
                  </h4>
                  {auditSummary.revisionsApplied.length === 0 ? (
                    <p className="text-[#64748b]">No mid-meeting revisions reported.</p>
                  ) : (
                    <ul className="space-y-1 text-[#334155] list-disc list-inside">
                      {auditSummary.revisionsApplied.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#475569] mb-1.5">
                    Excluded Features
                  </h4>
                  {auditSummary.excludedFeatures.length === 0 ? (
                    <p className="text-[#64748b]">No rejected features detected.</p>
                  ) : (
                    <ul className="space-y-1 text-[#334155] list-disc list-inside">
                      {auditSummary.excludedFeatures.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#475569] mb-1.5">
                    Ignored External People
                  </h4>
                  {auditSummary.ignoredExternalPeople.length === 0 ? (
                    <p className="text-[#64748b]">No external non-employees detected.</p>
                  ) : (
                    <ul className="space-y-1 text-[#334155] list-disc list-inside">
                      {auditSummary.ignoredExternalPeople.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label
              htmlFor="meeting-transcript"
              className="text-xs font-semibold uppercase tracking-[0.04em] text-[#475569]"
            >
              Meeting Transcript
            </label>
            <button
              type="button"
              onClick={handleInsertSample}
              disabled={isExtracting}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-violet-600 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Load Sample Transcript</span>
            </button>
          </div>

          <textarea
            id="meeting-transcript"
            rows={6}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={isExtracting}
            placeholder="Paste meeting notes here. Mid-meeting revisions are applied automatically; rejected features (payment, inventory, maps, live tracking, email sending) and external non-employees are excluded."
            className="w-full p-3.5 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] leading-relaxed placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all disabled:bg-[#f8fafc]"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <p className="text-xs text-[#64748b]">
            Validates manager roles, developer IDs, positive hours, and 2026 deadlines before saving.
          </p>
          <button
            type="submit"
            disabled={isExtracting}
            className="h-10 px-5 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 text-white text-sm font-medium shadow-md shadow-indigo-500/25 transition-all duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            {isExtracting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isExtracting ? 'Extracting Projects...' : 'Create from Transcript'}</span>
          </button>
        </div>
      </form>
    </section>
  );
};
