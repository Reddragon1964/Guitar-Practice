import React, { useState, useMemo } from "react";
import {
  HelpCircle,
  Search,
  BookOpen,
  Music,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  Download,
  Mic,
  Calendar,
  Flame,
  X,
  ChevronRight,
  ArrowLeft,
  Printer,
  Sliders,
  ExternalLink,
  Target,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

interface HelpTopic {
  id: string;
  category: "getting-started" | "recording" | "metrics" | "trends" | "ai" | "backup" | "faq";
  title: string;
  summary: string;
  tags: string[];
  content: React.ReactNode;
}

interface HelpModalProps {
  onBack: () => void;
  onNavigate?: (view: "dashboard" | "add-practice" | "trends" | "duration-trends" | "chatbot" | "live-voice" | "manage-songs" | "add-goal") => void;
}

const CATEGORIES = [
  { id: "all", label: "All Topics", icon: BookOpen },
  { id: "getting-started", label: "Getting Started", icon: Sparkles },
  { id: "recording", label: "Recording Sessions", icon: Music },
  { id: "metrics", label: "Metrics & Accuracy", icon: CheckCircle2 },
  { id: "trends", label: "Trends & Charts", icon: TrendingUp },
  { id: "ai", label: "AI Coach & Live Voice", icon: Mic },
  { id: "backup", label: "CSV Export & Backup", icon: Download },
  { id: "faq", label: "FAQs & Tips", icon: HelpCircle },
];

export const HelpModal: React.FC<HelpModalProps> = ({ onBack, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>("quick-start");

  const helpTopics: HelpTopic[] = useMemo(
    () => [
      {
        id: "quick-start",
        category: "getting-started",
        title: "Quick Start Guide: How to Track Your Guitar Progress",
        summary: "Learn the core workflow: log practice sessions, track accuracy, set weekly goals, and view improvements over time.",
        tags: ["getting started", "overview", "intro", "basics", "quickstart"],
        content: (
          <div className="space-y-4 text-sm text-indigo-100 leading-relaxed">
            <p>
              Welcome to the <strong>Guitar Practice Tracker</strong>! This app is designed to help guitarists of all skill levels build consistency, measure note accuracy, track practice speed, and achieve concrete musical milestones.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-indigo-800/80 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-indigo-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
                  Record Sessions
                </div>
                <p className="text-xs text-indigo-300/80">
                  Log your song or exercise, duration, difficulty level, notes hit vs total notes, and tempo speed.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-indigo-800/80 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-emerald-300">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                  Analyze Trends
                </div>
                <p className="text-xs text-indigo-300/80">
                  Watch your weekly accuracy improve over time and see total cumulative practice hours on interactive charts.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-indigo-800/80 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-purple-300">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">3</span>
                  Get AI Coaching
                </div>
                <p className="text-xs text-indigo-300/80">
                  Chat with specialized Gemini guitar mentors or practice hands-free using real-time Live Voice.
                </p>
              </div>
            </div>
            {onNavigate && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" onClick={() => onNavigate("add-practice")} className="gap-1.5">
                  <Music className="w-4 h-4" /> Record First Session
                </Button>
                <Button size="sm" variant="outline" onClick={() => onNavigate("trends")} className="gap-1.5 border-indigo-700">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> View Practice Trends
                </Button>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "recording-sessions",
        category: "recording",
        title: "Recording a Practice Session (All Fields Explained)",
        summary: "Understand how to record session duration, song title, difficulty level, accuracy, and practice speed.",
        tags: ["record", "session", "modal", "duration", "timer", "stopwatch", "song", "accuracy", "speed"],
        content: (
          <div className="space-y-4 text-sm text-indigo-100 leading-relaxed">
            <p>
              Clicking <strong>Record Session</strong> opens the session dialog to the top of the form with these key parameters:
            </p>
            <ul className="space-y-2.5 list-disc list-inside text-indigo-200">
              <li>
                <strong className="text-white">Song / Exercise Title:</strong> Pick an existing song from your song library or enter a new song title directly. New songs are automatically added to your library.
              </li>
              <li>
                <strong className="text-white">Date:</strong> Defaults to today's date, or select any previous date to back-log practice sessions.
              </li>
              <li>
                <strong className="text-white">Duration (m:ss):</strong> Enter in minutes:seconds format (e.g. <code>3:00</code> or <code>1:01</code>). You can also use quick presets (<code>0:30</code>, <code>1:00</code>, <code>3:00</code>, <code>5:00</code>), <code>±15s</code> / <code>+1m</code> steppers, or the built-in <strong>Live Stopwatch Timer</strong> (Start / Pause / Reset).
              </li>
              <li>
                <strong className="text-white">Difficulty Level (1-12):</strong> Rates the technical complexity of the piece or exercise on a 1 to 12 scale.
              </li>
              <li>
                <strong className="text-white">Total Notes:</strong> Total number of notes in the piece or practice passage.
              </li>
              <li>
                <strong className="text-white">Correct Notes:</strong> Number of notes hit accurately. The form instantly calculates your live <strong>Accuracy Score (%)</strong>.
              </li>
              <li>
                <strong className="text-white">Practice Speed (%):</strong> Percentage of full performance tempo (e.g. <code>75%</code>, <code>90%</code>, <code>100%</code>, or up to <code>200%</code> for speed-building).
              </li>
              <li>
                <strong className="text-white">Partial Song Practice:</strong> Check this option if you only practiced a section (intro, solo, bridge) rather than a complete playthrough.
              </li>
              <li>
                <strong className="text-white">Short version:</strong> Check this option if you practiced an abbreviated, short, or radio edit version of the song.
              </li>
              <li>
                <strong className="text-white">Test Session & Score:</strong> Enable this if you performed a formal scoring or rhythm game test, allowing point-based test scores.
              </li>
              <li>
                <strong className="text-white">Session Notes:</strong> Note down specific guitar techniques, fretboard challenges, fingerings, or metronome settings.
              </li>
              <li>
                <strong className="text-emerald-300">Practice with Live Coach (gemini-3.8-live):</strong> Directly inside the session dialog, tap <strong>"Start Live Coach"</strong> to talk hands-free with your AI coach while practicing, running the stopwatch timer, and logging your session.
              </li>
            </ul>
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/50 text-xs text-emerald-200">
              💡 <strong>Quick Entry:</strong> You can also use the collapsible <strong>Quick Entry</strong> form directly above the sessions table on the dashboard for rapid logging without opening the full dialog!
            </div>
          </div>
        ),
      },
      {
        id: "accuracy-scoring",
        category: "metrics",
        title: "Accuracy Score & Color Thresholds Explained",
        summary: "How accuracy is calculated from correct notes / total notes and visual badges across the app.",
        tags: ["accuracy", "formula", "score", "percentage", "color", "correct notes", "total notes"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <p>
              Your Accuracy Score represents the proportion of cleanly executed notes in a session:
            </p>
            <div className="p-3.5 rounded-xl bg-indigo-950/80 border border-indigo-700/80 font-mono text-center text-sm text-emerald-300">
              Accuracy (%) = (Correct Notes / Total Notes) × 100
            </div>
            <p>
              The application uses color-coded badges throughout the table, charts, and summaries:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 90% – 100%
                </div>
                <div className="text-xs text-emerald-200/80 mt-1">Excellent mastery; ready to increase tempo speed.</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 70% – 89%
                </div>
                <div className="text-xs text-amber-200/80 mt-1">Good progress; isolate tricky transitions with slow metronome work.</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40">
                <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Under 70%
                </div>
                <div className="text-xs text-rose-200/80 mt-1">Challenging passage; slow down tempo by 15-20% to build muscle memory.</div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "practice-trends",
        category: "trends",
        title: "Practice Trends: Weekly Accuracy & Total Practice Hours",
        summary: "Understand the dual-axis Recharts line graph, timeframes (4W to All), and hours mode toggle.",
        tags: ["trends", "practice trends", "recharts", "weekly", "hours", "line graph", "chart", "cumulative"],
        content: (
          <div className="space-y-4 text-sm text-indigo-100 leading-relaxed">
            <p>
              The <strong>Practice Trends</strong> section at the top of your dashboard features an interactive Recharts dual-axis line graph:
            </p>
            <ul className="space-y-2 list-disc list-inside text-indigo-200">
              <li>
                <strong className="text-emerald-400">Left Axis (Green Line):</strong> Displays your average <strong>Weekly Accuracy (%)</strong> over time, with week-over-week (WoW) improvement indicators.
              </li>
              <li>
                <strong className="text-sky-400">Right Axis (Blue Line):</strong> Displays your <strong>Practice Hours</strong> over time.
              </li>
              <li>
                <strong className="text-white">Hours Mode Toggle:</strong> Switch between <strong>Weekly Hrs</strong> (hours logged in each specific week) and <strong>Total Hrs</strong> (cumulative practice hours accumulated across your journey).
              </li>
              <li>
                <strong className="text-white">Timeframe Selector:</strong> Filter across <code>4W</code>, <code>8W</code>, <code>12W</code>, <code>24W</code>, or <code>All</code> weeks.
              </li>
              <li>
                <strong className="text-white">Song Filter:</strong> Narrow the graph to a single song or view your overall guitar repertoire.
              </li>
            </ul>
            <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-700/60 text-xs text-indigo-300">
              Hover over any point along the line to inspect week date ranges, session count, accuracy gain/loss, and exact hour/minute breakdowns.
            </div>
          </div>
        ),
      },
      {
        id: "weekly-goals-streaks",
        category: "metrics",
        title: "Daily Streaks & Weekly Practice Time Targets",
        summary: "How practice streaks are tracked and how to set custom weekly minute goals for overall practice or specific songs.",
        tags: ["streak", "goals", "weekly targets", "minutes", "targets", "milestones"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <p>
              Consistency is key to mastering guitar. The tracker provides two motivational mechanics:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <Flame className="w-5 h-5 fill-amber-400" />
                  Daily Practice Streak
                </div>
                <p className="text-xs text-indigo-200/90 leading-relaxed">
                  Automatically calculates consecutive days practiced. The flame icon in the top header and streak card highlights active streaks and indicates whether you have logged practice today.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-indigo-200">
                  <Target className="w-5 h-5 text-indigo-400" />
                  Weekly Practice Targets
                </div>
                <p className="text-xs text-indigo-200/90 leading-relaxed">
                  Set target practice minutes per week (overall or per song). Progress bars show time logged, remaining minutes, and required daily pace to reach your goal by Sunday.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "gemini-chatbot",
        category: "ai",
        title: "Gemini Guitar Chatbot (Multi-Turn Coaching & Roles)",
        summary: "How to use specialized chatbot roles, system instructions, and models (gemini-3.1-pro-preview, gemini-3.5-flash, gemini-3.1-flash-lite).",
        tags: ["gemini", "chatbot", "ai", "coach", "pro", "flash", "flash-lite", "roles", "prompts"],
        content: (
          <div className="space-y-4 text-sm text-indigo-100 leading-relaxed">
            <p>
              The multi-turn <strong>Gemini Guitar Chatbot</strong> acts as your personal AI instructor, automatically enriched with your current active songs, recent accuracy scores, and milestones:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/80">
                <div className="font-semibold text-white text-xs">🎸 Guitar Practice Coach</div>
                <p className="text-xs text-indigo-300 mt-1">Holistic analysis of your session stats, bottlenecks, and next steps.</p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/80">
                <div className="font-semibold text-white text-xs">⚡ Technique & Speed Specialist</div>
                <p className="text-xs text-indigo-300 mt-1">Tactical speed ladders, alternate picking, and tension relief drills.</p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/80">
                <div className="font-semibold text-white text-xs">🧭 Music Theory & Fretboard Mentor</div>
                <p className="text-xs text-indigo-300 mt-1">Deep harmonic analysis, CAGED shapes, modes, and scales across the neck.</p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/80">
                <div className="font-semibold text-white text-xs">📅 Practice Routine Architect</div>
                <p className="text-xs text-indigo-300 mt-1">Structured daily and weekly time-boxed schedules tailored to your goals.</p>
              </div>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Model Selection Guide</div>
              <ul className="text-xs space-y-1 list-disc list-inside text-indigo-200">
                <li><strong className="text-white font-mono">gemini-3.1-pro-preview:</strong> Best for complex tasks, deep theory analysis, and detailed custom practice plans.</li>
                <li><strong className="text-white font-mono">gemini-3.5-flash:</strong> Fast and intelligent for general coaching, Q&A, and song advice.</li>
                <li><strong className="text-white font-mono">gemini-3.1-flash-lite:</strong> Ultra-fast response times for quick tempo checks and rapid-fire tips.</li>
              </ul>
            </div>
            {onNavigate && (
              <Button size="sm" onClick={() => onNavigate("chatbot")} className="gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Open Gemini Chat
              </Button>
            )}
          </div>
        ),
      },
      {
        id: "live-voice",
        category: "ai",
        title: "Live Voice Coach (Real-Time gemini-3.8-live)",
        summary: "Have hands-free, real-time voice conversations with your coach while holding your guitar.",
        tags: ["live voice", "gemini-3.8-live", "voice", "microphone", "audio", "hands-free"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <p>
              The <strong>Live Voice Coach</strong> connects directly to <code>gemini-3.8-live</code> via WebSockets for ultra-low-latency bidirectional audio:
            </p>
            <ul className="space-y-2 list-disc list-inside text-indigo-200">
              <li>
                <strong className="text-white">Hands-Free Practice:</strong> Talk to your AI coach while both hands remain on your guitar neck.
              </li>
              <li>
                <strong className="text-white">Voice Personas:</strong> Choose from 5 natural voices: <code>Zephyr</code> (balanced), <code>Kore</code> (articulate), <code>Puck</code> (upbeat), <code>Fenrir</code> (steady rhythm), or <code>Charon</code> (analytical).
              </li>
              <li>
                <strong className="text-white">Real-Time Transcripts:</strong> View live speech-to-text input and response transcriptions on screen.
              </li>
              <li>
                <strong className="text-white">Microphone Setup:</strong> Ensure your browser grants microphone access. You can mute/unmute at any point during your session.
              </li>
            </ul>
            {onNavigate && (
              <Button size="sm" onClick={() => onNavigate("live-voice")} className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white">
                <Mic className="w-4 h-4" /> Open Live Voice Coach
              </Button>
            )}
          </div>
        ),
      },
      {
        id: "csv-export",
        category: "backup",
        title: "Download CSV: Offline Backup & Data Portability",
        summary: "Export all your recorded guitar practice sessions into an RFC-4180 compliant CSV spreadsheet file.",
        tags: ["csv", "download", "export", "backup", "excel", "sheets", "data"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <p>
              You can export your complete practice history at any time:
            </p>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white text-sm">Download CSV Button</div>
                  <div className="text-xs text-indigo-300">Located in the header toolbar of the Practice Sessions Log table.</div>
                </div>
              </div>
            </div>
            <p className="text-xs text-indigo-200">
              The downloaded CSV includes: Date, Duration (m:ss), Duration (seconds), Song Title, Difficulty Level, Correct Notes, Total Notes, Accuracy (%), Practice Speed (%), Session Type, Test Score, Rating (1-5), and Notes. Compatible with Microsoft Excel, Google Sheets, and Numbers.
            </p>
          </div>
        ),
      },
      {
        id: "faq-troubleshooting",
        category: "faq",
        title: "Frequently Asked Questions & Troubleshooting",
        summary: "Solutions for common questions about printing, audio permissions, sorting, and editing sessions.",
        tags: ["faq", "help", "troubleshooting", "microphone", "print", "edit", "delete", "firestore"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <div className="space-y-2">
              <strong className="text-white block">Q: How do I edit or delete a practice session?</strong>
              <p className="text-xs text-indigo-300">
                In the Practice Sessions Log table, click the pencil icon to edit any session (which opens the form scrolled to the top) or the trash icon to delete it after confirmation.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-indigo-900/60">
              <strong className="text-white block">Q: Microphone is not working for Live Voice?</strong>
              <p className="text-xs text-indigo-300">
                Check that your browser has permission to access your microphone for this site (click the lock/tune icon in your browser's address bar). Ensure your operating system microphone input is not muted.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-indigo-900/60">
              <strong className="text-white block">Q: How do I print my practice charts or sessions log?</strong>
              <p className="text-xs text-indigo-300">
                Click <strong>Print All</strong> in the top dashboard bar or the small printer icon on individual cards (Weekly Practice, Historical Accuracy, Practice Trends, or Sessions Log) for printer-friendly reports.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-indigo-900/60">
              <strong className="text-white block">Q: Is my data saved automatically?</strong>
              <p className="text-xs text-indigo-300">
                Yes! All sessions, songs, milestones, weekly targets, and chatbot conversation messages are securely synced to your Firebase account in real time.
              </p>
            </div>
          </div>
        ),
      },
    ],
    [onNavigate]
  );

  // Filtered topics based on search query and category
  const filteredTopics = useMemo(() => {
    return helpTopics.filter((topic) => {
      const matchesCategory = activeCategory === "all" || topic.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        topic.title.toLowerCase().includes(q) ||
        topic.summary.toLowerCase().includes(q) ||
        topic.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [helpTopics, activeCategory, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-indigo-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shrink-0">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Help Center & User Guide
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-200 border border-indigo-700">
                Documentation
              </span>
            </h2>
            <p className="text-xs text-indigo-300/80 mt-0.5">
              Everything you need to know about recording guitar sessions, tracking accuracy, reading trends, and using AI coaching
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 border-indigo-700 text-indigo-200 hover:bg-indigo-900/60 print:hidden"
            title="Print Help Guide"
          >
            <Printer className="w-4 h-4 text-indigo-400" /> Print Guide
          </Button>
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-indigo-300 hover:text-indigo-100 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="w-5 h-5 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search help topics, features, formulas (e.g. 'accuracy', 'stopwatch', 'gemini', 'csv', 'streak')..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 pr-10 py-3 text-sm bg-slate-950/80 border-indigo-700 text-white placeholder:text-indigo-400/70 h-12 rounded-xl focus:border-indigo-400 shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-indigo-400 hover:text-white rounded-full transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 dialog-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border",
                isActive
                  ? "bg-indigo-600 border-indigo-400 text-white shadow-sm font-semibold"
                  : "bg-indigo-950/60 hover:bg-indigo-900/60 border-indigo-800 text-indigo-300 hover:text-white"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Topic List */}
      <div className="space-y-4">
        {filteredTopics.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 space-y-3">
            <HelpCircle className="w-8 h-8 text-indigo-400 mx-auto" />
            <p className="text-sm font-medium">No help topics found matching "{searchQuery}"</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="border-indigo-700 text-indigo-200"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredTopics.map((topic) => {
            const isExpanded = expandedTopicId === topic.id;
            return (
              <Card
                key={topic.id}
                className={cn(
                  "border transition-all overflow-hidden bg-slate-950/80 shadow-md",
                  isExpanded
                    ? "border-indigo-500/80 shadow-indigo-950/50"
                    : "border-indigo-800/60 hover:border-indigo-700/80"
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 focus:outline-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-800">
                        {topic.category.replace("-", " ")}
                      </span>
                      <h3 className="text-base font-semibold text-white">{topic.title}</h3>
                    </div>
                    <p className="text-xs text-indigo-300/80 leading-relaxed pt-0.5">{topic.summary}</p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-5 h-5 text-indigo-400 shrink-0 transition-transform duration-200 mt-1",
                      isExpanded && "rotate-90 text-white"
                    )}
                  />
                </button>

                {isExpanded && (
                  <CardContent className="px-4 sm:px-5 pb-5 pt-0 border-t border-indigo-900/60 animate-in fade-in duration-150">
                    <div className="pt-4">{topic.content}</div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Footer Support Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 via-purple-950/50 to-slate-950/80 border border-indigo-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs text-indigo-200">
            Need hands-on assistance? Try asking the <strong>Gemini Guitar Chatbot</strong> for personalized technique advice or practice schedules!
          </div>
        </div>
        {onNavigate && (
          <Button
            size="sm"
            onClick={() => onNavigate("chatbot")}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
          >
            Ask Gemini Coach <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
