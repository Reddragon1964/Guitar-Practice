import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Trash2,
  ArrowLeft,
  Zap,
  Brain,
  Cpu,
  Sliders,
  Music,
  Gauge,
  Compass,
  Calendar,
  Mic,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Practice, Song, Goal, ChatMessage } from "../../types";
import { cn } from "../../lib/utils";

export type GeminiChatModelId =
  | "gemini-3.5-flash"
  | "gemini-3.1-pro-preview"
  | "gemini-3.1-flash-lite";

export interface ChatbotPersona {
  id: string;
  name: string;
  badge: string;
  description: string;
  defaultModel: GeminiChatModelId;
  systemInstruction: string;
  starterPrompts: string[];
}

export const CHATBOT_PERSONAS: ChatbotPersona[] = [
  {
    id: "coach",
    name: "Guitar Practice Coach",
    badge: "Overall Coaching",
    description:
      "Analyzes your logged sessions, accuracy scores, and speed to give tailored feedback.",
    defaultModel: "gemini-3.5-flash",
    systemInstruction:
      "You are an encouraging, analytical Guitar Practice Coach. Your role is to review the player's practice history, accuracy (correct notes / total notes), and speed percentages, celebrate wins, diagnose bottlenecks, and recommend concrete exercises for their next session. You must communicate exclusively in English at all times.",
    starterPrompts: [
      "Based on my recent sessions, which song should I focus on today?",
      "How can I improve my note accuracy without losing tempo?",
      "Give me a 10-minute warm-up routine before practicing my songs.",
    ],
  },
  {
    id: "technique",
    name: "Technique & Speed Specialist",
    badge: "Speed & Precision",
    description:
      "Specializes in alternate picking, legato, fret-hand economy, and metronome speed ladders.",
    defaultModel: "gemini-3.1-flash-lite",
    systemInstruction:
      "You are a world-class Guitar Technique & Speed Specialist. Your role is to break down mechanical challenges (picking synchronization, string crossing, fretting tension, rhythm precision) into step-by-step metronome speed-building drills. Keep advice crisp, tactical, and immediately playable. You must communicate exclusively in English at all times.",
    starterPrompts: [
      "I'm stuck at 85% speed on a difficult passage—how do I break through to 100%?",
      "How do I stop my fretting hand from tensing up on fast runs?",
      "Give me a progressive metronome ladder drill for clean string skipping.",
    ],
  },
  {
    id: "theory",
    name: "Music Theory & Fretboard Mentor",
    badge: "Deep Theory",
    description:
      "Explains scales, chord progressions, modes, intervals, and fretboard visualization.",
    defaultModel: "gemini-3.1-pro-preview",
    systemInstruction:
      "You are a comprehensive Music Theory & Fretboard Mentor for guitarists. Your role is to explain harmonic concepts, scales, modes, CAGED shapes, voice leading, and song analysis clearly and deeply, connecting every theory concept directly to practical positions on the 6-string fretboard. You must communicate exclusively in English at all times.",
    starterPrompts: [
      "Explain how to connect minor pentatonic boxes with diatonic modes across the neck.",
      "How can I analyze the chord progression of the songs I'm practicing?",
      "Design a deep fretboard visualization exercise for finding root-3rd-7th triads.",
    ],
  },
  {
    id: "planner",
    name: "Practice Routine Architect",
    badge: "Structured Plans",
    description:
      "Designs weekly schedules, time blocks, and milestone roadmaps around your goals.",
    defaultModel: "gemini-3.1-pro-preview",
    systemInstruction:
      "You are a strategic Practice Routine Architect. Your role is to design structured, time-boxed daily and weekly guitar practice schedules that balance warm-ups, song repertoire, weak-spot isolation, and speed tests so the player achieves their milestones on schedule. You must communicate exclusively in English at all times.",
    starterPrompts: [
      "Build a 45-minute structured practice plan using my current active songs.",
      "How should I split my weekly practice hours between accuracy drills and full run-throughs?",
      "Create a 2-week roadmap to get my lowest-accuracy song above 95%.",
    ],
  },
];

export const GEMINI_CHAT_MODELS: {
  id: GeminiChatModelId;
  label: string;
  tier: string;
  description: string;
}[] = [
  {
    id: "gemini-3.5-flash",
    label: "gemini-3.5-flash",
    tier: "General Tasks",
    description: "Balanced reasoning and speed for everyday guitar coaching",
  },
  {
    id: "gemini-3.1-pro-preview",
    label: "gemini-3.1-pro-preview",
    tier: "Complex Tasks",
    description: "Deep reasoning for custom practice plans & music theory analysis",
  },
  {
    id: "gemini-3.1-flash-lite",
    label: "gemini-3.1-flash-lite",
    tier: "Fast Tasks",
    description: "Ultra-fast responses for quick tempo & technique tips",
  },
];

interface GeminiChatbotModalProps {
  practices: Practice[];
  songs: Song[];
  goals: Goal[];
  persistedMessages: ChatMessage[];
  onSaveMessage: (msg: Omit<ChatMessage, "id" | "userId" | "createdAt">) => Promise<void>;
  onClearHistory: (personaId: string) => Promise<void>;
  onOpenLiveVoice: () => void;
  onBack: () => void;
}

export const GeminiChatbotModal: React.FC<GeminiChatbotModalProps> = ({
  practices,
  songs,
  goals,
  persistedMessages,
  onSaveMessage,
  onClearHistory,
  onOpenLiveVoice,
  onBack,
}) => {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("coach");
  const [selectedModel, setSelectedModel] = useState<GeminiChatModelId>("gemini-3.5-flash");
  const [customInstruction, setCustomInstruction] = useState<string>(
    CHATBOT_PERSONAS[0].systemInstruction
  );
  const [showInstructionEditor, setShowInstructionEditor] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Local optimistic messages while waiting or if offline
  const [localPendingMessages, setLocalPendingMessages] = useState<ChatMessage[]>([]);

  const threadEndRef = useRef<HTMLDivElement>(null);

  const activePersona = useMemo(
    () => CHATBOT_PERSONAS.find((p) => p.id === selectedPersonaId) || CHATBOT_PERSONAS[0],
    [selectedPersonaId]
  );

  // Switch persona handler
  const handleSelectPersona = (persona: ChatbotPersona) => {
    setSelectedPersonaId(persona.id);
    setSelectedModel(persona.defaultModel);
    setCustomInstruction(persona.systemInstruction);
    setErrorMsg(null);
  };

  // Filter conversation history for the active persona
  const threadMessages = useMemo(() => {
    const fromDb = persistedMessages.filter((m) => m.personaId === selectedPersonaId);
    const pendingForPersona = localPendingMessages.filter(
      (m) => m.personaId === selectedPersonaId
    );
    return [...fromDb, ...pendingForPersona].sort((a, b) => a.createdAt - b.createdAt);
  }, [persistedMessages, localPendingMessages, selectedPersonaId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages.length, isSending]);

  // Build context-enriched system instruction with the user's real practice data
  const fullSystemInstruction = useMemo(() => {
    const activeSongTitles = songs
      .filter((s) => !s.retired)
      .map((s) => s.title)
      .slice(0, 15);
    const recentSessionsSummary = practices.slice(0, 10).map((p) => ({
      date: p.date,
      song: p.songTitle,
      level: p.difficulty,
      accuracy: `${p.accuracy}% (${p.correctNotes}/${p.totalNotes})`,
      speed: `${p.speed}%`,
      durationSec: p.duration,
      note: p.note,
    }));
    const activeGoalsSummary = goals
      .filter((g) => !g.achieved)
      .slice(0, 8)
      .map((g) => ({ title: g.title, song: g.songTitle, targetDate: g.targetDate }));

    return `${customInstruction.trim()}

Player's Current Guitar Practice Context:
- Active Songs (${activeSongTitles.length}): ${
      activeSongTitles.length > 0 ? activeSongTitles.join(", ") : "None added yet"
    }
- Recent Practice Sessions (last ${recentSessionsSummary.length}): ${JSON.stringify(
      recentSessionsSummary
    )}
- Active Milestones/Goals: ${JSON.stringify(activeGoalsSummary)}

Always tailor your advice to their specific songs, accuracy scores, and speed levels when relevant.`;
  }, [customInstruction, songs, practices, goals]);

  const handleSendMessage = async (textToSend?: string) => {
    const trimmed = (textToSend ?? inputMessage).trim();
    if (!trimmed || isSending) return;

    setInputMessage("");
    setErrorMsg(null);
    setIsSending(true);

    const historyForApi = threadMessages.map((m) => ({
      role: m.role,
      text: m.text,
    }));

    const tempUserMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      userId: "local",
      role: "user",
      text: trimmed,
      personaId: selectedPersonaId,
      model: selectedModel,
      createdAt: Date.now(),
    };

    setLocalPendingMessages((prev) => [...prev, tempUserMsg]);

    try {
      // Save user message to Firestore
      await onSaveMessage({
        role: "user",
        text: trimmed,
        personaId: selectedPersonaId,
        model: selectedModel,
      });

      setLocalPendingMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
          model: selectedModel,
          systemInstruction: fullSystemInstruction,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to get response from Gemini.");
      }

      await onSaveMessage({
        role: "model",
        text: data.reply,
        personaId: selectedPersonaId,
        model: data.modelUsed || selectedModel,
      });
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorMsg(err?.message || "Failed to send message. Please try again.");
      setLocalPendingMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  const getPersonaIcon = (id: string) => {
    if (id === "coach") return <Music className="w-4 h-4 text-indigo-400" />;
    if (id === "technique") return <Gauge className="w-4 h-4 text-emerald-400" />;
    if (id === "theory") return <Compass className="w-4 h-4 text-amber-400" />;
    return <Calendar className="w-4 h-4 text-purple-400" />;
  };

  const getModelIcon = (id: GeminiChatModelId) => {
    if (id === "gemini-3.1-pro-preview") return <Brain className="w-3.5 h-3.5 text-purple-400" />;
    if (id === "gemini-3.1-flash-lite") return <Zap className="w-3.5 h-3.5 text-amber-400" />;
    return <Cpu className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Gemini Guitar Chatbot
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-indigo-900/70 text-indigo-200 border border-indigo-700">
                Multi-Turn AI Assistant
              </span>
            </h2>
            <p className="text-xs text-indigo-300/80 mt-0.5">
              Choose a specialized guitar mentor role and Gemini model for complex, general, or fast tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onOpenLiveVoice}
            className="gap-2 border-emerald-600/70 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60"
          >
            <Mic className="w-4 h-4 text-emerald-400" /> Live Voice (gemini-3.8-live)
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

      {/* Role (Persona) Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CHATBOT_PERSONAS.map((persona) => {
          const isSelected = persona.id === selectedPersonaId;
          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => handleSelectPersona(persona)}
              className={cn(
                "text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2",
                isSelected
                  ? "bg-indigo-900/60 border-indigo-400 shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400/50"
                  : "bg-slate-950/60 border-indigo-800/60 hover:bg-indigo-950/60 hover:border-indigo-700"
              )}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-white">
                    {getPersonaIcon(persona.id)}
                    <span className="truncate">{persona.name}</span>
                  </div>
                </div>
                <p className="text-xs text-indigo-300/80 line-clamp-2 leading-relaxed">
                  {persona.description}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-indigo-800/50 text-[10px] font-mono text-indigo-300">
                <span>Role: {persona.badge}</span>
                <span className="text-emerald-300">{persona.defaultModel}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Chat Card */}
      <Card className="border-indigo-700/80 bg-slate-950/90 shadow-2xl overflow-hidden flex flex-col h-[620px]">
        <CardHeader className="p-4 border-b border-indigo-800/70 bg-indigo-950/50 space-y-3 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Active Role Info */}
            <div className="flex items-center gap-2.5">
              {getPersonaIcon(activePersona.id)}
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  {activePersona.name}
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-200 border border-indigo-700/70">
                    {activePersona.badge}
                  </span>
                </CardTitle>
              </div>
            </div>

            {/* Model Switcher + System Instruction Toggle + Clear Thread */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg bg-slate-950/90 p-1 border border-indigo-800/80">
                {GEMINI_CHAT_MODELS.map((m) => {
                  const isActive = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      title={`${m.tier}: ${m.description}`}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all",
                        isActive
                          ? "bg-indigo-600 text-white font-semibold shadow-sm"
                          : "text-indigo-300 hover:text-white hover:bg-indigo-900/40"
                      )}
                    >
                      {getModelIcon(m.id)}
                      <span>{m.tier}</span>
                      <span className="hidden xl:inline text-[10px] opacity-80">
                        ({m.label})
                      </span>
                    </button>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowInstructionEditor((prev) => !prev)}
                className={cn(
                  "h-8 text-xs gap-1.5 border-indigo-700 text-indigo-200 hover:bg-indigo-900/60",
                  showInstructionEditor && "bg-indigo-900/80 border-indigo-400 text-white"
                )}
                title="View or customize the chatbot's role system instruction"
              >
                <Sliders className="w-3.5 h-3.5" />
                System Role
              </Button>

              {threadMessages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onClearHistory(selectedPersonaId)}
                  className="h-8 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/50 gap-1"
                  title="Clear conversation history for this role"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Collapsible System Instruction Editor */}
          {showInstructionEditor && (
            <div className="pt-2 border-t border-indigo-800/60 space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                  Active System Instruction (Role Definition)
                </label>
                <button
                  type="button"
                  onClick={() => setCustomInstruction(activePersona.systemInstruction)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-200 underline"
                >
                  Reset to default
                </button>
              </div>
              <textarea
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-indigo-700 bg-slate-950/90 text-indigo-100 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Define the system instruction and role for the Gemini chatbot..."
              />
              <p className="text-[11px] text-indigo-400">
                Active Model:{" "}
                <strong className="font-mono text-indigo-200">{selectedModel}</strong> • Your
                songs, recent sessions, and milestones are automatically included in context.
              </p>
            </div>
          )}
        </CardHeader>

        {/* Scrollable Conversation Thread */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 dialog-scrollbar">
          {threadMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8 space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-900/30 border border-indigo-700/50 text-indigo-300">
                <Bot className="w-10 h-10 mx-auto mb-2 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">
                  Chat with your {activePersona.name}
                </h3>
                <p className="text-xs text-indigo-300/90 mt-1 leading-relaxed">
                  {activePersona.description} Multi-turn conversation history is automatically
                  saved to your account.
                </p>
              </div>

              <div className="w-full space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Suggested Starter Prompts
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {activePersona.starterPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left p-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-800/70 hover:border-indigo-600 text-xs text-indigo-100 transition-all flex items-center justify-between gap-2 group"
                    >
                      <span>"{prompt}"</span>
                      <Send className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            threadMessages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[88%]",
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                      isUser
                        ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-200"
                        : "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                    )}
                  >
                    {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm space-y-1.5 shadow-md",
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-indigo-950/90 border border-indigo-800/80 text-indigo-100 rounded-tl-sm"
                    )}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    <div
                      className={cn(
                        "flex items-center gap-2 text-[10px] font-mono pt-1",
                        isUser ? "text-indigo-200 justify-end" : "text-indigo-400 justify-between"
                      )}
                    >
                      {!isUser && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-emerald-300 border border-indigo-800/60">
                          <Sparkles className="w-2.5 h-2.5" />
                          {msg.model}
                        </span>
                      )}
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex gap-3 mr-auto max-w-[80%]">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border bg-emerald-600/20 border-emerald-500/40 text-emerald-300">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-indigo-950/90 border border-indigo-800/80 text-indigo-200 text-xs flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>
                  {activePersona.name} is thinking with{" "}
                  <strong className="font-mono text-emerald-300">{selectedModel}</strong>...
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-700/80 text-rose-200 text-xs text-center">
              {errorMsg}
            </div>
          )}

          <div ref={threadEndRef} />
        </CardContent>

        {/* Message Input Footer */}
        <div className="p-3.5 border-t border-indigo-800/70 bg-indigo-950/60 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <Input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isSending}
              placeholder={`Ask ${activePersona.name} (${selectedModel})...`}
              className="flex-1 bg-slate-950/90 border-indigo-700 text-white placeholder:text-indigo-400/70 h-11"
            />
            <Button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="h-11 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-1.5"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
