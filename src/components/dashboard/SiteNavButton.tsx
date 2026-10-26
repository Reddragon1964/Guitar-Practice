import React, { useState, useEffect, useRef } from "react";
import {
  ExternalLink,
  Globe,
  Copy,
  Check,
  Settings,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";

const DEFAULT_SHARED_URL =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "https://ais-dev-fxcyutlqlajxqsx44znlxy-630697288820.us-west2.run.app";

const STORAGE_KEY = "guitar_tracker_custom_site_url";

export function getAppCurrentUrl(): string {
  if (typeof window !== "undefined" && window.location) {
    const origin = window.location.origin;
    if (origin && origin.startsWith("http") && !origin.includes("about:") && !origin.includes("data:")) {
      return origin;
    }
    const href = window.location.href;
    if (href && href.startsWith("http") && !href.startsWith("about:") && !href.startsWith("data:")) {
      return href;
    }
  }
  return DEFAULT_SHARED_URL;
}

interface SiteNavButtonProps {
  className?: string;
  variant?: "header" | "toolbar";
}

export const SiteNavButton: React.FC<SiteNavButtonProps> = ({
  className = "",
  variant = "header",
}) => {
  const [customUrl, setCustomUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputUrl, setInputUrl] = useState(customUrl);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentAppUrl = getAppCurrentUrl();
  const activeUrl = customUrl.trim() || currentAppUrl;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
  };

  const handleSaveCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    let formatted = inputUrl.trim();
    if (formatted && !/^https?:\/\//i.test(formatted)) {
      formatted = "https://" + formatted;
    }
    setCustomUrl(formatted);
    try {
      if (formatted) {
        localStorage.setItem(STORAGE_KEY, formatted);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
    setShowConfigModal(false);
    setIsOpen(false);
  };

  const handleResetUrl = () => {
    setCustomUrl("");
    setInputUrl("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setShowConfigModal(false);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={menuRef}>
      <div className="inline-flex items-center h-9 rounded-lg shadow-sm border border-indigo-700/80 bg-indigo-900/40 p-0.5 gap-0.5">
        {/* Main action link button that directly opens the site */}
        <a
          href={activeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md font-medium text-xs text-indigo-100 hover:text-white bg-indigo-600/70 hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400"
          title={`Open site in new tab: ${activeUrl}`}
          id="open-site-top-button"
        >
          <ExternalLink className="w-3.5 h-3.5 text-indigo-200" />
          <span className="font-semibold whitespace-nowrap">Open Site</span>
        </a>

        {/* Dropdown toggle for options like copy URL, presets, custom URL */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center px-1.5 h-7 text-indigo-300 hover:text-white hover:bg-indigo-800/60 rounded-md transition-colors focus:outline-none"
          title="Site options (Copy link, change destination URL)"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-slate-900/95 backdrop-blur-md border border-indigo-700 shadow-2xl p-1.5 z-50 text-xs">
          <div className="px-2.5 py-1.5 border-b border-indigo-800/80 mb-1">
            <p className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Site Destination
            </p>
            <p className="text-[11px] text-indigo-300/80 truncate mt-0.5" title={activeUrl}>
              {activeUrl}
            </p>
          </div>

          <div className="space-y-0.5">
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-indigo-600/50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-300" />
              <span>Open in New Tab</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-indigo-600/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-indigo-300" />
                )}
                <span>{copied ? "Copied to Clipboard!" : "Copy Site Link"}</span>
              </div>
            </button>

            {customUrl && (
              <button
                type="button"
                onClick={handleResetUrl}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 transition-colors text-left"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to App Site URL</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowConfigModal(true);
                setInputUrl(customUrl || currentAppUrl);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-600/50 transition-colors text-left"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span>{customUrl ? "Change Destination URL" : "Set Custom Site URL"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Custom Site URL Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-indigo-700 shadow-2xl rounded-2xl p-6 max-w-md w-full relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              Set Site Destination URL
            </h3>
            <p className="text-xs text-indigo-300/80 mb-4 leading-relaxed">
              By default, this button takes you to this Guitar Practice Tracker web app in a
              full browser tab. You can also specify any custom sight/site URL (such as your tabs
              site or course portal).
            </p>

            <form onSubmit={handleSaveCustomUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-800 border border-indigo-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Quick Presets
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInputUrl(currentAppUrl)}
                    className="px-2.5 py-1 text-xs rounded-md bg-indigo-950/70 border border-indigo-800 text-indigo-300 hover:text-white hover:bg-indigo-900"
                  >
                    Current App
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputUrl(DEFAULT_SHARED_URL)}
                    className="px-2.5 py-1 text-xs rounded-md bg-indigo-950/70 border border-indigo-800 text-indigo-300 hover:text-white hover:bg-indigo-900"
                  >
                    Shared App URL
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Save URL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
