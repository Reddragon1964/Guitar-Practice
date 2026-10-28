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
  ALargeSmall,
  Palette,
  Settings,
  Volume2,
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
        title: "Recording a Practice Session & Choosing Sound Source (All Fields Explained)",
        summary: "Understand how to choose your recording sound source, input device, session duration, song title, difficulty level, accuracy, and practice speed.",
        tags: ["record", "session", "modal", "sound source", "microphone", "guitar interface", "system audio", "input device", "duration", "timer", "stopwatch", "song", "accuracy", "speed"],
        content: (
          <div className="space-y-4 text-sm text-indigo-100 leading-relaxed">
            <p>
              Clicking <strong>Record Session</strong> opens the session dialog to the top of the form with these key parameters:
            </p>
            <ul className="space-y-2.5 list-disc list-inside text-indigo-200">
              <li>
                <strong className="text-white">Song / Exercise Title &amp; + New Song on Demand:</strong> Pick an existing song from your song library or click <strong>+ New Song on Demand</strong> to enter a new song title and immediately add it to your active repertoire (with optional default duration and difficulty) without leaving the session dialog.
              </li>
              <li>
                <strong className="text-rose-300">Record Song on Demand &amp; Sound Source Selection:</strong> In the top audio bar of the dialog or inside the <strong>Record Song on Demand</strong> frame, choose your <strong>Recording Sound Source</strong> before recording:
                <ul className="pl-6 mt-1.5 space-y-1 list-disc text-xs text-indigo-200/90">
                  <li><strong>Guitar Interface / Line-In (Raw Studio Audio):</strong> Disables browser echo cancellation, noise suppression, and auto-gain so sustained guitar notes and harmonics are never clipped.</li>
                  <li><strong>Microphone / Acoustic &amp; Amp Mic (Filtered):</strong> Enables noise suppression and auto-gain control for clear acoustic or room-mic recordings.</li>
                  <li><strong>System / Browser Tab Audio:</strong> Captures backing tracks, metronomes, or web amp simulators directly from your system or browser tab.</li>
                  <li><strong>Guitar Input + System Backing Track Mix:</strong> Blends your live guitar interface/microphone together with system backing track audio into a single recorded stereo track.</li>
                  <li><strong>Audio Input Device, Input Gain &amp; Live Level Test:</strong> Select any connected USB audio interface or microphone from the <strong>Input Device</strong> listbox, click <strong>Detect Audio Inputs</strong> to refresh hardware names, adjust <strong>Input Gain</strong> (75%–200%), and click <strong>Test Sound Source</strong> to preview live input levels on the spectrum meter before hitting <strong>Record Song Now</strong>.</li>
                </ul>
              </li>
              <li>
                <strong className="text-white">Date:</strong> Defaults to today's date, or select any previous date to back-log practice sessions.
              </li>
              <li>
                <strong className="text-white">Duration (m:ss):</strong> Enter in minutes:seconds format (e.g. <code>3:00</code> or <code>1:01</code>). You can also use quick presets (<code>0:30</code>, <code>1:00</code>, <code>3:00</code>, <code>5:00</code>), <code>±15s</code> / <code>+1m</code> steppers, the built-in <strong>Live Stopwatch Timer</strong>, or auto-fill from your recorded song take.
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
                <strong className="text-white">Test Session &amp; Score:</strong> Enable this if you performed a formal scoring or rhythm game test, allowing point-based test scores.
              </li>
              <li>
                <strong className="text-white">Session Notes:</strong> Note down specific guitar techniques, fretboard challenges, fingerings, or append recorded take details with one click.
              </li>
              <li>
                <strong className="text-emerald-300">Practice with Live Coach (gemini-3.8-live):</strong> Directly inside the session dialog, tap <strong>"Start Live Coach"</strong> to talk hands-free with your AI coach while practicing, running the stopwatch timer, and logging your session.
              </li>
            </ul>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-700/50 text-xs text-cyan-200">
                ✨ <strong>Rearrangeable Dialog Frames:</strong> The 7 sections inside the Record Practice Session dialog (Song &amp; Date, Record Song on Demand, Session Metrics, Duration &amp; Stopwatch, Live Coach, Options &amp; Score, Notes) are modular frames. Drag by their grip handles (⠿) or use the <strong>↑</strong> and <strong>↓</strong> buttons to customize your layout. You can also minimize frames you don't need or click <strong>Reset Order</strong> at any time. Your customized layout is automatically saved!
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/50 text-xs text-emerald-200">
                💡 <strong>Quick Entry:</strong> You can also use the collapsible <strong>Quick Entry</strong> form directly above the sessions table on the dashboard—including <strong>Record Song on Demand</strong> with Sound Source selection—for rapid logging without opening the full dialog!
              </div>
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
        title: "Advanced Progress Chart & Practice Trends (Weekly, Monthly, Yearly)",
        summary: "View daily accuracy scores, practice speed trends, and goal/milestone markers across Weekly (7d), Monthly (30d), and Yearly (365d) timeframes.",
        tags: ["trends", "advanced progress chart", "practice trends", "recharts", "weekly", "monthly", "yearly", "accuracy", "speed", "milestones", "goals", "markers"],
        content: (
          <div className="space-y-4 text-sm text-indigo-100 leading-relaxed">
            <p>
              The <strong>Advanced Progress Chart &amp; Practice Trends</strong> frame on your dashboard features two comprehensive visualization modes:
            </p>
            <ul className="space-y-2.5 list-disc list-inside text-indigo-200">
              <li>
                <strong className="text-emerald-400">Daily Accuracy Scores (%) [Left Axis]:</strong> Plots your daily average note accuracy in emerald green, with an optional dashed <strong>Peak Accuracy (%)</strong> overlay.
              </li>
              <li>
                <strong className="text-amber-400">Practice Speed Trends (%) [Right Axis]:</strong> Plots your daily average practice tempo percentage in amber, with an optional dashed <strong>Peak Speed (%)</strong> overlay.
              </li>
              <li>
                <strong className="text-yellow-300">Goal &amp; Milestone Met Markers (★):</strong> Dates when you completed custom repertoire goals, reached weekly practice minute targets, or achieved 90%+ / 95%+ / 100%+ accuracy and speed breakthroughs are highlighted with vertical reference lines and gold star markers on the chart, plus a <strong>Goals &amp; Practice Milestones Met</strong> summary strip below the graph.
              </li>
              <li>
                <strong className="text-white">Timeframe Selector (Weekly / Monthly / Yearly):</strong> Switch seamlessly between <strong>Weekly</strong> (past 7 days), <strong>Monthly</strong> (past 30 days), and <strong>Yearly</strong> (past 365 days) views.
              </li>
              <li>
                <strong className="text-sky-300">Weekly Hours Mode Toggle:</strong> Switch between <strong>Accuracy &amp; Speed</strong> (Advanced Progress Chart) and <strong>Weekly Hours</strong> (weekly accuracy vs. weekly or cumulative practice hours across 4W–All).
              </li>
              <li>
                <strong className="text-white">Song Filter:</strong> Filter the chart to any individual active song or view your entire active repertoire.
              </li>
            </ul>
            <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-700/60 text-xs text-indigo-300">
              Hover over any data point or gold star marker on the chart to inspect exact daily accuracy, peak accuracy, average/peak speed, practice minutes, and the full list of goals and milestones achieved on that date.
            </div>
          </div>
        ),
      },
      {
        id: "weekly-goals-streaks",
        category: "metrics",
        title: "Firestore Practice Streak Counter & Weekly Practice Time Targets",
        summary: "How consecutive practice days are calculated from Firestore sessions and how to set custom weekly minute goals.",
        tags: ["streak", "firestore", "consecutive days", "goals", "weekly targets", "minutes", "targets", "milestones"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <p>
              Consistency is key to mastering guitar. The tracker provides two motivational mechanics backed by your Firestore practice log:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <Flame className="w-5 h-5 fill-amber-400" />
                  Firestore Practice Streak Counter
                </div>
                <p className="text-xs text-indigo-200/90 leading-relaxed">
                  Automatically calculates the number of consecutive days you have logged at least one guitar practice session in Firestore. Displays your current streak, today's logged session count, progress toward your next streak milestone (3, 7, 14, 21, 30, 60, 90, 180, 365 days), a 7-day activity timeline with per-day session count badges, Best Streak, Active Days, and Total Logged Sessions.
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
            <div className="pt-2 border-t border-indigo-900/60">
              <div className="font-semibold text-white text-sm mb-1.5 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Printable Daily Accuracy by Song Report</span>
              </div>
              <p className="text-xs text-indigo-200">
                Click <strong>"Accuracy Report"</strong> at the top of the Practice Sessions frame to generate a printable report. It uses your filtered practice log data to display songs on the left, daily average accuracy across dates, and overall average of all entries in the final column. You can print directly or export as HTML and CSV.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "manage-songs-retired",
        category: "recording",
        title: "Song & Exercise Library: Default Settings & Retiring Songs",
        summary: "Configure default duration and difficulty per song, and learn how retiring a song hides it across the entire application until unretired.",
        tags: ["songs", "library", "retire", "retired", "unretire", "hide", "defaults", "duration", "difficulty", "manage songs"],
        content: (
          <div className="space-y-4 text-sm text-indigo-100 leading-relaxed">
            <p>
              Open the <strong>Song & Exercise Library</strong> by clicking <strong>Songs</strong> in the dashboard toolbar:
            </p>
            <ul className="space-y-2.5 list-disc list-inside text-indigo-200">
              <li>
                <strong className="text-white">Default Time & Difficulty:</strong> Each song in your library can store a default practice duration (<code>mm:ss</code>) and default difficulty level (<code>1–12</code>). Selecting that song in Record Practice Session or Quick Entry automatically fills those values.
              </li>
              <li>
                <strong className="text-white">Save as Song Defaults:</strong> Inside the Record Practice Session dialog, click <strong>"Save as Song Defaults"</strong> to update the library defaults for the currently selected song at any time.
              </li>
              <li>
                <strong className="text-amber-300">Retiring Songs (Complete Application-Wide Hiding):</strong> When you mark a song as <strong>Retired</strong> in the Song & Exercise Library (using the <strong>Retire</strong> button or status checkbox), that song and all of its associated practice sessions, Historical Accuracy chart lines, Last 7 Sessions trends, 30-Day Practice Trends, Duration Trends, Daily Accuracy Reports, Milestones, Weekly Practice Targets, and AI Coach contexts are <strong>completely hidden everywhere across the application</strong>.
              </li>
              <li>
                <strong className="text-emerald-300">Unretiring a Song:</strong> To bring a retired song back, open the <strong>Songs</strong> library, switch to the <strong>Retired</strong> or <strong>All</strong> tab, and click <strong>Unretire</strong>. All historical sessions, charts, and goals for that song will immediately reappear across the application!
              </li>
            </ul>
            {onNavigate && (
              <div className="pt-1">
                <Button size="sm" onClick={() => onNavigate("manage-songs")} className="gap-1.5">
                  <Music className="w-4 h-4" /> Open Song & Exercise Library
                </Button>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "historical-accuracy-subdivisions",
        category: "trends",
        title: "Historical Accuracy by Song: 5% & 2% Fine Grid Subdivisions",
        summary: "Use 5% and 2% horizontal accuracy subdivision grid lines alongside existing 25% major lines, plus Last 7 Sessions Progression.",
        tags: ["historical accuracy", "grid", "subdivisions", "5%", "2%", "25%", "lines", "last 7 sessions", "chart"],
        content: (
          <div className="space-y-4 text-sm text-indigo-100 leading-relaxed">
            <p>
              The <strong>Historical Accuracy Progression</strong> frame lets you inspect note accuracy trends per song and difficulty level with precision horizontal grid subdivisions:
            </p>
            <ul className="space-y-2 list-disc list-inside text-indigo-200">
              <li>
                <strong className="text-white">5% Subdivisions (Default):</strong> Adds horizontal reference grid lines and Y-axis percentage labels at every <strong>5% increment</strong> (0%, 5%, 10%, ..., 95%, 100%) while preserving emphasized 25% major grid lines.
              </li>
              <li>
                <strong className="text-white">2% Fine Subdivisions:</strong> Adds ultra-fine <strong>2% increment</strong> horizontal subdivision lines on top of the 5% and 25% grid lines so you can spot even 1%–2% accuracy gains between sessions.
              </li>
              <li>
                <strong className="text-white">25% Major Only:</strong> Displays only the primary 0%, 25%, 50%, 75%, and 100% horizontal grid lines.
              </li>
              <li>
                <strong className="text-white">Connect Data Points Toggle:</strong> Check or uncheck <strong>"Connect data points"</strong> to switch between connected trend lines and discrete session dots.
              </li>
              <li>
                <strong className="text-emerald-300">Last 7 Sessions Trend Frame:</strong> Located directly on your dashboard, this dual-axis chart plots both <strong>Session Duration (minutes)</strong> and <strong>Note Accuracy (%)</strong> across your last 7 recorded sessions, with song filtering and Smooth vs. Linear curve options.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: "adjustable-tables-and-filters",
        category: "recording",
        title: "Adjustable Table Columns, Row Spacing & Date Range Filtering",
        summary: "Resize table columns by dragging dividers, customize row density, and filter sessions by From/To date ranges.",
        tags: ["columns", "resize", "width", "table", "density", "compact", "comfortable", "date range", "from", "to", "filter"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <p>
              All data tables across the application—including the <strong>Practice Sessions Log</strong>, <strong>Song & Exercise Library</strong>, <strong>Session Duration Trends</strong>, and <strong>Daily Accuracy by Song Report</strong>—feature interactive column and layout controls:
            </p>
            <ul className="space-y-2 list-disc list-inside text-indigo-200">
              <li>
                <strong className="text-white">Drag-to-Resize Columns:</strong> Drag the vertical resize handle on the right edge of any column header to widen or narrow that column smoothly. Double-click any resize handle to reset that single column.
              </li>
              <li>
                <strong className="text-white">Batch Column Width Controls:</strong> Use the <code>- Col Width</code>, <code>+ Col Width</code>, and <code>Reset Columns</code> buttons in the table toolbar to scale all columns at once or restore defaults.
              </li>
              <li>
                <strong className="text-white">Row Spacing Density:</strong> Switch between <code>Compact</code>, <code>Default</code>, and <code>Comfortable</code> row spacing, and save your preferred layout automatically.
              </li>
              <li>
                <strong className="text-white">From / To Date Range Filtering:</strong> Filter the Practice Sessions Log, Historical Accuracy Chart, and Milestones by <strong>From</strong> (start date) and <strong>To</strong> (end date), as well as song name, speed (%), and difficulty level (1–12).
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: "ai-screen-vision-coach",
        category: "ai",
        title: "Auto-Initialized AI Screen Vision & Hands-Free Advice in Record Session",
        summary: "When you open Record Practice Session, the AI Coach automatically views your session screen and prompts you with real-time advice while you play.",
        tags: ["screen", "vision", "auto", "initialize", "advice", "record practice session", "live coach", "hands-free"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <p>
              Opening the <strong>Record Practice Session</strong> dialog automatically initializes <strong>AI Screen Vision & Live Practice Coach</strong> with zero clicks or prompts required:
            </p>
            <ul className="space-y-2 list-disc list-inside text-indigo-200">
              <li>
                <strong className="text-white">Automatic Initialization on Open:</strong> The moment you open the Record Practice Session dialog, the AI begins viewing your live practice session screen at 1 FPS (tracking your active song, speed %, difficulty level, accuracy, and timer) and connects to <code>gemini-3.8-live</code>.
              </li>
              <li>
                <strong className="text-white">Proactive Advice While You Play:</strong> Without needing to type or click anything, the AI coach automatically prompts you with tailored guitar playing advice both visually (in the top HUD banner and coach feed) and spoken aloud over your speakers.
              </li>
              <li>
                <strong className="text-white">Customizable Frequency & Screen Source:</strong> Adjust the automatic advice interval (every 15s, 25s, 45s, or 60s), click <strong>Advice Now</strong> for an instant screen check, or optionally share an external tab/window (such as Guitar Pro or backing tracks).
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: "ai-assessment-archive",
        category: "ai",
        title: "AI Practice Coach Assessment Archive",
        summary: "Generate on-demand AI performance assessments and browse or print your chronological assessment history.",
        tags: ["ai coach", "assessment", "archive", "generate", "analyze", "history", "print"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <p>
              Clicking <strong>AI Coach</strong> in the top toolbar opens the <strong>AI Practice Coach Assessment Archive</strong>:
            </p>
            <ul className="space-y-2 list-disc list-inside text-indigo-200">
              <li>
                <strong className="text-white">Generate New Assessment:</strong> Click <strong>"Generate New Assessment"</strong> at any time to evaluate your active songs, recent accuracy scores, practice speeds, and active milestones.
              </li>
              <li>
                <strong className="text-white">Chronological Archive:</strong> Every generated assessment is saved with its exact date, timestamp, and evaluated session count so you can compare coaching feedback over time.
              </li>
              <li>
                <strong className="text-white">Print & Export:</strong> Print individual assessments or your complete assessment history using the built-in print modal.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: "faq-troubleshooting",
        category: "faq",
        title: "Frequently Asked Questions & Troubleshooting",
        summary: "Solutions for common questions about retired songs, printing, audio permissions, column widths, and editing sessions.",
        tags: ["faq", "help", "troubleshooting", "microphone", "print", "edit", "delete", "retired", "firestore"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <div className="space-y-2">
              <strong className="text-white block">Q: Where do retired songs go, and how do I unretire a song?</strong>
              <p className="text-xs text-indigo-300">
                When a song is marked as retired, it does not appear anywhere in the application (charts, logs, dropdowns, goals, or reports). To view or restore a retired song, click <strong>Songs</strong> in the top toolbar, select the <strong>Retired</strong> filter tab, and click <strong>Unretire</strong>.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-indigo-900/60">
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
                Click <strong>Print All</strong> in the top dashboard bar or the small printer icon on individual cards (Weekly Practice, Historical Accuracy, Practice Trends, or Sessions Log) for printer-friendly reports. If you are viewing inside an embedded preview frame, click the <strong>Open Site</strong> button at the top of the screen to open the app in a standalone tab where printing works without iframe restrictions.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-indigo-900/60">
              <strong className="text-white block">Q: How do I scale or enlarge text across the entire app?</strong>
              <p className="text-xs text-indigo-300">
                Click the <strong>Text Size</strong> button in the top navigation bar or the dashboard toolbar. You can select presets (Compact 85%, Normal 100%, Large 115%, X-Large 130%, Max 145%), use the -5% / +5% steppers, or slide freely between 75% and 160%. Your preferred scale is saved automatically.
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
      {
        id: "text-scaling",
        category: "getting-started",
        title: "App-Wide Text Scaling, High-Contrast Inputs & 3D Raised Buttons",
        summary: "Adjust font sizes from 75% to 160%, with high-contrast white/blue textboxes & listboxes and tactile 3D raised buttons.",
        tags: ["text", "font", "scale", "zoom", "size", "accessibility", "readability", "large text", "raised buttons", "white", "blue", "textbox", "listbox"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <p>
              Guitar Practice Tracker includes a built-in text scaling engine and high-contrast tactile controls designed for effortless visibility at music stands, desktop monitors, and mobile displays:
            </p>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-900/60 text-indigo-300 border border-indigo-700/60">
                  <ALargeSmall className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Text Size Control & Tactile UI</div>
                  <div className="text-xs text-indigo-300">Located in the top header and dashboard toolbar.</div>
                </div>
              </div>
            </div>
            <ul className="space-y-2 list-disc pl-5 text-xs text-indigo-200">
              <li>
                <strong className="text-white">One-Click Text Presets & Slider:</strong> Compact (85%), Default (100%), Large (115%), X-Large (130%), and Maximum (145%), or fine-tune in 5% increments between 75% and 160%.
              </li>
              <li>
                <strong className="text-white">High-Contrast White & Blue Inputs:</strong> All textboxes, numeric inputs, date pickers, and dropdown listboxes feature crisp white backgrounds with bold blue text so values are unmistakably clear in any lighting condition.
              </li>
              <li>
                <strong className="text-white">3D Raised Tactile Buttons:</strong> Every button across the application features a raised 3D bevel, top specular highlight, drop shadow, and physical press-down feedback when clicked.
              </li>
              <li>
                <strong className="text-white">Automatic Persistence:</strong> Your chosen text scale and layout settings are saved locally in your browser and remembered across sessions.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: "settings-color-schemes",
        category: "getting-started",
        title: "Settings Dialog & Default Color Schemes",
        summary: "Customize appearance with curated default color schemes, frame neon glows, and grid line density.",
        tags: ["settings", "theme", "color scheme", "colors", "neon", "grid", "palettes", "appearance"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <p>
              Open the <strong className="text-white">Settings</strong> dialog by clicking the gear icon in the top header or the dashboard toolbar:
            </p>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-900/60 text-indigo-300 border border-indigo-700/60">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Curated Color Schemes</div>
                  <div className="text-xs text-indigo-300">Choose from 7 signature stage, studio, and vintage themes.</div>
                </div>
              </div>
            </div>
            <ul className="space-y-2 list-disc pl-5 text-xs text-indigo-200">
              <li>
                <strong className="text-white">Cyber Indigo (Default):</strong> Deep studio midnight space with electric cyan and indigo glows.
              </li>
              <li>
                <strong className="text-white">Emerald Groove:</strong> Deep lush forest pine with vibrant mint green accents for natural focus.
              </li>
              <li>
                <strong className="text-white">Synthwave Sunset:</strong> Retro 80s arcade violet plum with neon magenta lasers.
              </li>
              <li>
                <strong className="text-white">Sunburst Tweed:</strong> Warm vintage lacquer amber and tweed amp mahogany undertones.
              </li>
              <li>
                <strong className="text-white">Electric Ocean:</strong> Arctic sky blue and oceanic abyss for crystal-clear readability.
              </li>
              <li>
                <strong className="text-white">Crimson Rock:</strong> Aggressive heavy rock obsidian ruby and fiery red stage accents.
              </li>
              <li>
                <strong className="text-white">Midnight Carbon:</strong> Precision audio console carbon black with high-contrast white grids.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: "customize-volume-controls",
        category: "getting-started",
        title: "Customize Dialog, Frame Glow Colors & Windows Volume Slider",
        summary: "Set neon frame glow colors, choose your active highlighted frame, and adjust Windows audio volume levels.",
        tags: ["customize", "glow", "neon", "volume", "windows volume", "slider", "sound", "audio", "frames"],
        content: (
          <div className="space-y-3.5 text-sm text-indigo-100 leading-relaxed">
            <p>
              The <strong className="text-white">Customize</strong> dialog and <strong className="text-white">Windows Volume Slider</strong> make personalizing and managing your practice environment fast and seamless:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-800/60 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Customize Dialog
                </div>
                <p className="text-xs text-slate-300">
                  Click <strong className="text-white">Customize</strong> in the toolbar or header to open the dialog. From there, select from 6 vibrant neon glow colors (Electric Cyan, Synthwave Pink, Electric Emerald, Vintage Amber, Cosmic Violet, and Ruby Crimson), assign which frame gets the glowing border, and adjust grid line density.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-800/60 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  Windows Volume Slider
                </div>
                <p className="text-xs text-slate-300">
                  Located at the top of the Practice Tracker main form and the Record Practice Session frame top. Adjust master volume from 0% to 100% with real-time audio chime feedback, quick mute toggle, and seamless synchronization across the entire application.
                </p>
              </div>
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
