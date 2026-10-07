import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  deleteDoc,
  doc,
  updateDoc,
  where,
  increment,
  setDoc,
  deleteField,
} from "firebase/firestore";
import { format, parseISO } from "date-fns";
import {
  Printer,
  Sparkles,
  Activity,
  Guitar,
  Plus,
  Clock,
  Target,
  MessageSquare,
  Mic,
  HelpCircle,
  Flame,
  RotateCcw,
} from "lucide-react";
import { db, handleFirestoreError, OperationType, auth } from "../lib/firebase";
import {
  Practice,
  Goal,
  Song,
  DashboardView,
  SessionSortField,
  SortDirection,
  PrintMode,
  DeleteConfirmState,
  WeeklyGoal,
  ChatMessage,
  AiAssessment,
} from "../types";
import { Button } from "./ui/button";

import { Header } from "./dashboard/Header";
import { WeeklyPracticeChart } from "./dashboard/WeeklyPracticeChart";
import { HistoricalAccuracyChart } from "./dashboard/HistoricalAccuracyChart";
import { RecentSessionsTable, QuickRecordPayload } from "./dashboard/RecentSessionsTable";
import { MilestonesCard } from "./dashboard/MilestonesCard";
import { PracticeSessionModal } from "./dashboard/PracticeSessionModal";
import { PostSessionFeedbackModal } from "./dashboard/PostSessionFeedbackModal";
import { GoalModal } from "./dashboard/GoalModal";
import { TrendsModal } from "./dashboard/TrendsModal";
import { PracticeTrendsSection } from "./dashboard/PracticeTrendsSection";
import { DurationTrendsPage } from "./dashboard/DurationTrendsPage";
import { AiAnalysisModal } from "./dashboard/AiAnalysisModal";
import { GeminiChatbotModal } from "./dashboard/GeminiChatbotModal";
import { LiveVoiceCoachModal } from "./dashboard/LiveVoiceCoachModal";
import { HelpModal } from "./dashboard/HelpModal";
import { ManageSongsModal } from "./dashboard/ManageSongsModal";
import { DeleteConfirmModal } from "./dashboard/DeleteConfirmModal";
import { PrintOverlays } from "./dashboard/PrintOverlays";
import { MoveableResizableFrame } from "./ui/MoveableResizableFrame";
import { DashboardFrame, FrameWidth } from "./dashboard/DashboardFrame";
import { StreakCard } from "./dashboard/StreakCard";
import { WeeklyGoalsSection } from "./dashboard/WeeklyGoalsSection";
import { formatDurationColon, parseDurationInputToSeconds } from "../utils/durationFormat";
import { WeeklyGoalModal } from "./dashboard/WeeklyGoalModal";
import { calculateStreak } from "../utils/streakCalculator";
import { calculateWeeklyGoalProgress } from "../utils/goalCalculator";

export function Dashboard() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [usageLogs, setUsageLogs] = useState<{ date: string; minutes: number }[]>([]);
  const [view, setView] = useState<DashboardView>("dashboard");
  const [isWeeklyGoalModalOpen, setIsWeeklyGoalModalOpen] = useState(false);
  const [editingWeeklyGoal, setEditingWeeklyGoal] = useState<WeeklyGoal | null>(null);
  const activeSongs = songs.filter((s) => !s.retired);

  // Form states
  const [songTitle, setSongTitle] = useState("");
  const [newSongInput, setNewSongInput] = useState("");
  const [difficulty, setDifficulty] = useState<number>(1);
  const [correctNotes, setCorrectNotes] = useState("");
  const [totalNotes, setTotalNotes] = useState("100");
  const [speed, setSpeed] = useState("100");
  const [duration, setDuration] = useState("");
  const [isPartial, setIsPartial] = useState(false);
  const [isShortVersion, setIsShortVersion] = useState(false);
  const [isTestSession, setIsTestSession] = useState(false);
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");
  const [practiceDate, setPracticeDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSavingPractice, setIsSavingPractice] = useState(false);
  const [practiceSaveError, setPracticeSaveError] = useState<string | null>(null);
  const songTotalsRef = useRef<Record<string, number>>({});

  const [goalTitle, setGoalTitle] = useState("");
  const [goalSongTitle, setGoalSongTitle] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [aiAssessments, setAiAssessments] = useState<AiAssessment[]>(() => {
    try {
      const saved = localStorage.getItem("guitar_tracker_ai_assessments");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);
  const [feedbackPractice, setFeedbackPractice] = useState<Practice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  // Sorting & Filtering
  const [sessionSearchQuery, setSessionSearchQuery] = useState("");
  const [sessionSortField, setSessionSortField] = useState<SessionSortField>("date");
  const [sessionSortDirection, setSessionSortDirection] = useState<SortDirection>("desc");
  const [sessionFilterName, setSessionFilterName] = useState("");
  const [sessionFilterDate, setSessionFilterDate] = useState("");
  const [sessionFilterSpeed, setSessionFilterSpeed] = useState("");
  const [sessionFilterLevel, setSessionFilterLevel] = useState("");

  const [milestoneFilterSong, setMilestoneFilterSong] = useState("");
  const [milestoneFilterStartDate, setMilestoneFilterStartDate] = useState("");
  const [milestoneFilterEndDate, setMilestoneFilterEndDate] = useState("");

  const [chartFilterStartDate, setChartFilterStartDate] = useState("");
  const [chartFilterEndDate, setChartFilterEndDate] = useState("");
  const [chartFilterSongName, setChartFilterSongName] = useState("");
  const [chartFilterSpeed, setChartFilterSpeed] = useState("");
  const [chartFilterLevel, setChartFilterLevel] = useState("");

  const [printMode, setPrintMode] = useState<PrintMode>(null);
  const [printError, setPrintError] = useState(false);

  // Movable and Resizable Dashboard Frames Layout Configuration
  const [frameLayout, setFrameLayout] = useState<
    { id: "streak" | "goals" | "trends" | "milestones" | "weeklyChart" | "accuracyChart" | "sessions"; width: FrameWidth; isMinimized: boolean }[]
  >(() => {
    const defaultLayout = [
      { id: "streak" as const, width: "full" as FrameWidth, isMinimized: false },
      { id: "goals" as const, width: "full" as FrameWidth, isMinimized: false },
      { id: "trends" as const, width: "two-thirds" as FrameWidth, isMinimized: false },
      { id: "milestones" as const, width: "one-third" as FrameWidth, isMinimized: false },
      { id: "weeklyChart" as const, width: "half" as FrameWidth, isMinimized: false },
      { id: "accuracyChart" as const, width: "half" as FrameWidth, isMinimized: false },
      { id: "sessions" as const, width: "full" as FrameWidth, isMinimized: false },
    ];
    try {
      const saved = localStorage.getItem("guitar_dashboard_frames_layout");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === defaultLayout.length) {
          return parsed;
        }
      }
    } catch {}
    return defaultLayout;
  });

  const saveFrameLayout = (
    newLayout: { id: "streak" | "goals" | "trends" | "milestones" | "weeklyChart" | "accuracyChart" | "sessions"; width: FrameWidth; isMinimized: boolean }[]
  ) => {
    setFrameLayout(newLayout);
    try {
      localStorage.setItem("guitar_dashboard_frames_layout", JSON.stringify(newLayout));
    } catch {}
  };

  const moveFrame = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= frameLayout.length) return;
    const updated = [...frameLayout];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    saveFrameLayout(updated);
  };

  const updateFrameWidth = (
    id: "streak" | "goals" | "trends" | "milestones" | "weeklyChart" | "accuracyChart" | "sessions",
    width: FrameWidth
  ) => {
    const updated = frameLayout.map((f) => (f.id === id ? { ...f, width } : f));
    saveFrameLayout(updated);
  };

  const toggleFrameMinimize = (
    id: "streak" | "goals" | "trends" | "milestones" | "weeklyChart" | "accuracyChart" | "sessions"
  ) => {
    const updated = frameLayout.map((f) =>
      f.id === id ? { ...f, isMinimized: !f.isMinimized } : f
    );
    saveFrameLayout(updated);
  };

  const resetFrameLayout = () => {
    const defaultLayout = [
      { id: "streak" as const, width: "full" as FrameWidth, isMinimized: false },
      { id: "goals" as const, width: "full" as FrameWidth, isMinimized: false },
      { id: "trends" as const, width: "two-thirds" as FrameWidth, isMinimized: false },
      { id: "milestones" as const, width: "one-third" as FrameWidth, isMinimized: false },
      { id: "weeklyChart" as const, width: "half" as FrameWidth, isMinimized: false },
      { id: "accuracyChart" as const, width: "half" as FrameWidth, isMinimized: false },
      { id: "sessions" as const, width: "full" as FrameWidth, isMinimized: false },
    ];
    saveFrameLayout(defaultLayout);
  };

  // Focus and highlight Practice Sessions Log when session saves and closes
  const [highlightSessionsLog, setHighlightSessionsLog] = useState(false);

  const focusPracticeSessionsLog = useCallback(() => {
    // 1. If the Practice Sessions frame is minimized, expand it so the table is fully visible
    setFrameLayout((prev) =>
      prev.map((f) => (f.id === "sessions" ? { ...f, isMinimized: false } : f))
    );

    // 2. Allow modal unmount to finish, then smoothly scroll to the TOP of the Practice Sessions Log
    // and set focus on the button at the top to start the next session
    setTimeout(() => {
      const topTarget =
        document.getElementById("practice-sessions-log-top") ||
        document.getElementById("practice-sessions-log");
      if (topTarget) {
        topTarget.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      const startNextBtn = document.getElementById("start-next-practice-session-btn");
      if (startNextBtn) {
        startNextBtn.focus({ preventScroll: true });
      } else if (topTarget) {
        topTarget.focus({ preventScroll: true });
      }

      setHighlightSessionsLog(true);
      setTimeout(() => {
        setHighlightSessionsLog(false);
      }, 3000);
    }, 120);
  }, []);

  // Ensure opening Record Practice Session (or any sub-view) scrolls to the top
  useEffect(() => {
    if (view !== "dashboard") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [view]);

  const handlePrint = (mode: NonNullable<PrintMode>) => {
    if (window.parent !== window) {
      setPrintError(true);
      return;
    }
    setPrintMode(mode);
  };

  useEffect(() => {
    if (printMode) {
      const handleAfterPrint = () => {
        setPrintMode(null);
      };

      window.addEventListener("afterprint", handleAfterPrint);

      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error("Print failed", err);
          setPrintError(true);
        }
      }, 500);

      return () => {
        window.removeEventListener("afterprint", handleAfterPrint);
        clearTimeout(timer);
      };
    }
  }, [printMode]);

  const handleSongTitleChange = (newTitle: string) => {
    setSongTitle(newTitle);
    if (!editingPracticeId) {
      const lastPractice = practices.find((p) => p.songTitle === newTitle);
      const carriedTotal =
        songTotalsRef.current[newTitle] ||
        practices.find((p) => p.songTitle === newTitle && p.totalNotes > 0)?.totalNotes;

      if (lastPractice) {
        setDifficulty(lastPractice.difficulty);
        setTotalNotes(
          carriedTotal
            ? carriedTotal.toString()
            : lastPractice.totalNotes > 0
            ? lastPractice.totalNotes.toString()
            : ""
        );
        const practiceWithNote = practices.find((p) => p.songTitle === newTitle && p.note);
        setNote(practiceWithNote?.note || "");
        setSpeed(lastPractice.speed.toString());
        setDuration(lastPractice.duration !== undefined ? formatDurationColon(lastPractice.duration) : "");
        setIsPartial(lastPractice.isPartial || false);
        setIsShortVersion(lastPractice.isShortVersion || false);
        setScore("");
        // Do not inherit correct notes for a new practice session - must remain blank
        setCorrectNotes("");
      } else {
        setDifficulty(1);
        setTotalNotes(carriedTotal ? carriedTotal.toString() : "100");
        // Always blank for new session
        setCorrectNotes("");
        setSpeed("100");
        setDuration("");
        setIsPartial(false);
        setIsShortVersion(false);
        setScore("");
        setNote("");
      }
    }
  };

  const resetPracticeForm = () => {
    setSongTitle("");
    setNewSongInput("");
    setDifficulty(1);
    // Correct notes must be blank when a new session is started
    setCorrectNotes("");
    setTotalNotes("100");
    setSpeed("100");
    setDuration("");
    setIsPartial(false);
    setIsShortVersion(false);
    setIsTestSession(false);
    setScore("");
    setNote("");
    setEditingPracticeId(null);
    setPracticeSaveError(null);
    setIsSavingPractice(false);
  };

  const handleEditPractice = (p: Practice) => {
    setSongTitle(p.songTitle);
    setDifficulty(p.difficulty);
    setCorrectNotes(p.correctNotes.toString());
    setTotalNotes(p.totalNotes.toString());
    setSpeed(p.speed.toString());
    setDuration(p.duration !== undefined ? formatDurationColon(p.duration) : "");
    setIsPartial(p.isPartial || false);
    setIsShortVersion(p.isShortVersion || false);
    setIsTestSession(p.isTestSession || false);
    setScore(p.score !== undefined ? p.score.toString() : "");
    setNote(p.note || "");
    setPracticeDate(p.date);
    setEditingPracticeId(p.id);
    setView("add-practice");
  };

  // Invisible timer to track app open time and update dailyUsage
  useEffect(() => {
    if (!auth.currentUser) return;

    const interval = setInterval(async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const today = new Date().toISOString().split("T")[0];
      const docId = `${uid}_${today}`;
      const usageRef = doc(db, "dailyUsage", docId);

      try {
        await setDoc(
          usageRef,
          {
            userId: uid,
            date: today,
            minutes: increment(1),
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Failed to update usage", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Firebase Realtime Listeners
  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const qPractices = query(collection(db, "practices"), where("userId", "==", uid));
    const unsubscribePractices = onSnapshot(
      qPractices,
      (snapshot) => {
        const p = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Practice));
        p.sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          return b.createdAt - a.createdAt;
        });
        p.forEach((practice) => {
          if (practice.songTitle && practice.totalNotes > 0) {
            if (!songTotalsRef.current[practice.songTitle]) {
              songTotalsRef.current[practice.songTitle] = practice.totalNotes;
            }
          }
        });
        setPractices(p);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "practices")
    );

    const qGoals = query(collection(db, "goals"), where("userId", "==", uid));
    const unsubscribeGoals = onSnapshot(
      qGoals,
      (snapshot) => {
        const g = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Goal));
        g.sort((a, b) => a.targetDate.localeCompare(b.targetDate));
        setGoals(g);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "goals")
    );

    const qSongs = query(collection(db, "songs"), where("userId", "==", uid));
    const unsubscribeSongs = onSnapshot(
      qSongs,
      (snapshot) => {
        const s = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Song));
        s.sort((a, b) => a.title.localeCompare(b.title));
        setSongs(s);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "songs")
    );

    const qUsage = query(collection(db, "dailyUsage"), where("userId", "==", uid));
    const unsubscribeUsage = onSnapshot(
      qUsage,
      (snapshot) => {
        const u = snapshot.docs.map((d) => d.data() as { date: string; minutes: number });
        setUsageLogs(u);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "dailyUsage")
    );

    const qWeeklyGoals = query(collection(db, "weeklyGoals"), where("userId", "==", uid));
    const unsubscribeWeeklyGoals = onSnapshot(
      qWeeklyGoals,
      (snapshot) => {
        const wg = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as WeeklyGoal));
        wg.sort((a, b) => {
          if (!a.songTitle && b.songTitle) return -1;
          if (a.songTitle && !b.songTitle) return 1;
          return a.title.localeCompare(b.title);
        });
        setWeeklyGoals(wg);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "weeklyGoals")
    );

    const qChatMessages = query(collection(db, "chatMessages"), where("userId", "==", uid));
    const unsubscribeChatMessages = onSnapshot(
      qChatMessages,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
        msgs.sort((a, b) => a.createdAt - b.createdAt);
        setChatMessages(msgs);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "chatMessages")
    );

    const qAiAssessments = query(collection(db, "aiAssessments"), where("userId", "==", uid));
    const unsubscribeAiAssessments = onSnapshot(
      qAiAssessments,
      (snapshot) => {
        const assessments = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as AiAssessment)
        );
        assessments.sort((a, b) => b.createdAt - a.createdAt);
        setAiAssessments(assessments);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "aiAssessments")
    );

    return () => {
      unsubscribePractices();
      unsubscribeGoals();
      unsubscribeSongs();
      unsubscribeUsage();
      unsubscribeWeeklyGoals();
      unsubscribeChatMessages();
      unsubscribeAiAssessments();
    };
  }, []);

  const handleSaveChatMessage = async (
    msg: Omit<ChatMessage, "id" | "userId" | "createdAt">
  ) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, "chatMessages"), {
        userId: auth.currentUser.uid,
        role: msg.role,
        text: msg.text.slice(0, 10000),
        personaId: msg.personaId.slice(0, 100),
        model: msg.model.slice(0, 100),
        createdAt: Date.now(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "chatMessages");
    }
  };

  const handleClearChatHistory = async (personaId: string) => {
    if (!auth.currentUser) return;
    const toDelete = chatMessages.filter((m) => m.personaId === personaId);
    for (const msg of toDelete) {
      try {
        await deleteDoc(doc(db, "chatMessages", msg.id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `chatMessages/${msg.id}`);
      }
    }
  };

  const ensureSongInLibrary = async (title: string) => {
    if (!auth.currentUser) return;
    const trimmed = title.trim().slice(0, 200);
    if (!trimmed) return;
    const exists = songs.some((s) => s.title.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      try {
        await addDoc(collection(db, "songs"), {
          userId: auth.currentUser.uid,
          title: trimmed,
          createdAt: Date.now(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "songs");
      }
    }
  };

  const handleAddPractice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setPracticeSaveError("Please sign in to save practice sessions.");
      return;
    }

    const trimmedTitle = songTitle.trim().slice(0, 200);
    if (!trimmedTitle) {
      setPracticeSaveError("Please enter or select a song title.");
      return;
    }

    const rawSpeed = parseInt(speed, 10);
    const spd = isNaN(rawSpeed) || rawSpeed <= 0 ? 100 : Math.min(200, rawSpeed);

    let total = parseInt(totalNotes, 10);
    if (isNaN(total) || total <= 0) {
      const carried =
        songTotalsRef.current[trimmedTitle] ||
        practices.find((p) => p.songTitle === trimmedTitle && p.totalNotes > 0)?.totalNotes;
      total = carried || 100;
    }

    let correct = 0;
    let accuracy = 0;

    if (isTestSession) {
      correct = 0;
      accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    } else {
      if (correctNotes.trim() === "") {
        setPracticeSaveError("Please enter your correct notes count (or 0).");
        return;
      }
      const parsedCorrect = parseInt(correctNotes, 10);
      if (isNaN(parsedCorrect)) {
        setPracticeSaveError("Please enter a valid number of correct notes.");
        return;
      }
      correct = Math.max(0, parsedCorrect);
      accuracy = total > 0 ? Math.min(100, Math.max(0, Math.round((correct / total) * 100))) : 100;
    }

    if (trimmedTitle && total > 0) {
      songTotalsRef.current[trimmedTitle] = total;
    }

    const parsedScore =
      isTestSession && score.trim() !== "" && !isNaN(Number(score)) ? Number(score) : undefined;

    const parsedDuration = parseDurationInputToSeconds(duration);
    const safeDifficulty = Math.min(12, Math.max(1, difficulty || 1));

    setIsSavingPractice(true);
    setPracticeSaveError(null);

    try {
      await ensureSongInLibrary(trimmedTitle);

      if (editingPracticeId) {
        const existingPractice = practices.find((p) => p.id === editingPracticeId);
        if (existingPractice) {
          await updateDoc(doc(db, "practices", editingPracticeId), {
            userId: existingPractice.userId,
            songTitle: trimmedTitle,
            difficulty: safeDifficulty,
            correctNotes: correct,
            totalNotes: total,
            accuracy,
            speed: spd,
            date: practiceDate,
            isPartial: Boolean(isPartial),
            isShortVersion: Boolean(isShortVersion),
            isTestSession: Boolean(isTestSession),
            createdAt: existingPractice.createdAt,
            note: note || "",
            ...(existingPractice.difficultyRating !== undefined
              ? { difficultyRating: existingPractice.difficultyRating }
              : {}),
            ...(parsedDuration !== undefined
              ? { duration: parsedDuration }
              : { duration: deleteField() }),
            ...(parsedScore !== undefined ? { score: parsedScore } : { score: deleteField() }),
          });
        }
      } else {
        const newPractice: any = {
          userId: auth.currentUser.uid,
          songTitle: trimmedTitle,
          difficulty: safeDifficulty,
          correctNotes: correct,
          totalNotes: total,
          accuracy,
          speed: spd,
          date: practiceDate,
          isPartial: Boolean(isPartial),
          isShortVersion: Boolean(isShortVersion),
          isTestSession: Boolean(isTestSession),
          createdAt: Date.now(),
          note: note || "",
        };
        if (parsedDuration !== undefined) {
          newPractice.duration = parsedDuration;
        }
        if (parsedScore !== undefined) {
          newPractice.score = parsedScore;
        }
        await addDoc(collection(db, "practices"), newPractice);
      }
      setView("dashboard");
      resetPracticeForm();
      focusPracticeSessionsLog();
    } catch (error: any) {
      console.error("Save practice error:", error);
      setPracticeSaveError(error?.message || "Failed to save practice session. Please try again.");
      handleFirestoreError(error, OperationType.CREATE, "practices");
    } finally {
      setIsSavingPractice(false);
    }
  };

  const handleQuickRecordSession = async (payload: QuickRecordPayload) => {
    if (!auth.currentUser) return;
    const trimmedTitle = payload.songTitle.trim().slice(0, 200);
    if (!trimmedTitle) return;

    try {
      await ensureSongInLibrary(trimmedTitle);
      const newPractice: any = {
        userId: auth.currentUser.uid,
        songTitle: trimmedTitle,
        difficulty: Math.min(12, Math.max(1, payload.difficulty || 1)),
        correctNotes: payload.correctNotes,
        totalNotes: payload.totalNotes,
        accuracy: payload.accuracy,
        speed: payload.speed,
        date: payload.date,
        isPartial: false,
        isTestSession: false,
        createdAt: Date.now(),
        note: payload.note || "",
      };
      if (payload.durationSeconds !== undefined) {
        newPractice.duration = payload.durationSeconds;
      }
      await addDoc(collection(db, "practices"), newPractice);
      focusPracticeSessionsLog();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "practices");
    }
  };

  const handleSaveSessionFeedback = async (
    practiceId: string,
    rating: number,
    feedbackNote: string
  ) => {
    const existingPractice = practices.find((p) => p.id === practiceId);
    if (!existingPractice) return;
    try {
      const updatedPayload: any = {
        userId: existingPractice.userId,
        songTitle: existingPractice.songTitle,
        difficulty: existingPractice.difficulty,
        correctNotes: existingPractice.correctNotes,
        totalNotes: existingPractice.totalNotes,
        accuracy: existingPractice.accuracy,
        speed: existingPractice.speed,
        date: existingPractice.date,
        createdAt: existingPractice.createdAt,
        note: feedbackNote,
      };
      if (existingPractice.duration !== undefined) {
        updatedPayload.duration = existingPractice.duration;
      }
      if (existingPractice.isPartial !== undefined) {
        updatedPayload.isPartial = existingPractice.isPartial;
      }
      if (existingPractice.isTestSession !== undefined) {
        updatedPayload.isTestSession = existingPractice.isTestSession;
      }
      if (existingPractice.score !== undefined) {
        updatedPayload.score = existingPractice.score;
      }
      if (rating >= 1 && rating <= 5) {
        updatedPayload.difficultyRating = rating;
      }
      await updateDoc(doc(db, "practices", practiceId), updatedPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `practices/${practiceId}`);
    }
  };

  const handleAnalyze = async (force = false) => {
    setView("ai-analysis");
    // If user already has assessments and didn't explicitly request a new one, show archive
    if (aiAssessments.length > 0 && !force) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practices, goals, songs }),
      });
      const data = await response.json();
      if (data.analysis) {
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const timeStr = now.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        const newAssessmentPayload: Omit<AiAssessment, "id"> = {
          userId: auth.currentUser?.uid || "guest",
          analysis: data.analysis,
          date: dateStr,
          time: timeStr,
          createdAt: Date.now(),
          sessionCount: practices.length,
          summary: `${practices.length} sessions evaluated`,
        };

        if (auth.currentUser) {
          await addDoc(collection(db, "aiAssessments"), newAssessmentPayload);
        } else {
          const localItem: AiAssessment = {
            id: `local-${Date.now()}`,
            ...newAssessmentPayload,
          };
          setAiAssessments((prev) => [localItem, ...prev]);
        }
      }
    } catch (err) {
      console.error("Error generating AI Assessment:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !goalTitle || !goalDate) return;

    const newGoal: {
      userId: string;
      title: string;
      targetDate: string;
      achieved: boolean;
      createdAt: number;
      songTitle?: string;
    } = {
      userId: auth.currentUser.uid,
      title: goalTitle,
      targetDate: goalDate,
      achieved: false,
      createdAt: Date.now(),
    };
    if (goalSongTitle) {
      newGoal.songTitle = goalSongTitle;
    }

    try {
      await addDoc(collection(db, "goals"), newGoal);
      setView("dashboard");
      setGoalTitle("");
      setGoalSongTitle("");
      setGoalDate("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "goals");
    }
  };

  const toggleGoal = async (goal: Goal) => {
    try {
      await updateDoc(doc(db, "goals", goal.id), { achieved: !goal.achieved });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `goals/${goal.id}`);
    }
  };

  const deletePractice = (id: string) => {
    setDeleteConfirm({ id, type: "practice", message: "Delete this record?" });
  };

  const deleteGoal = (id: string) => {
    setDeleteConfirm({ id, type: "goal", message: "Delete this goal?" });
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newSongInput.trim()) return;

    const newSong = {
      userId: auth.currentUser.uid,
      title: newSongInput.trim(),
      createdAt: Date.now(),
    };

    try {
      await addDoc(collection(db, "songs"), newSong);
      setNewSongInput("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "songs");
    }
  };

  const toggleSongRetired = async (song: Song) => {
    try {
      await updateDoc(doc(db, "songs", song.id), {
        retired: !song.retired,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "songs");
    }
  };

  const deleteSong = (id: string) => {
    setDeleteConfirm({
      id,
      type: "song",
      message: "Delete this song? It will not delete associated practice logs.",
    });
  };

  const handleSaveWeeklyGoal = async (
    goalData: { title: string; songTitle?: string; targetMinutes: number },
    existingId?: string
  ) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    try {
      if (existingId && existingId !== "default-overall") {
        await updateDoc(doc(db, "weeklyGoals", existingId), {
          title: goalData.title,
          ...(goalData.songTitle ? { songTitle: goalData.songTitle } : { songTitle: deleteField() }),
          targetMinutes: goalData.targetMinutes,
        });
      } else {
        const newGoal: any = {
          userId: uid,
          title: goalData.title,
          targetMinutes: goalData.targetMinutes,
          createdAt: Date.now(),
        };
        if (goalData.songTitle) {
          newGoal.songTitle = goalData.songTitle;
        }
        await addDoc(collection(db, "weeklyGoals"), newGoal);
      }
    } catch (error) {
      handleFirestoreError(
        error,
        existingId && existingId !== "default-overall" ? OperationType.UPDATE : OperationType.CREATE,
        existingId && existingId !== "default-overall" ? `weeklyGoals/${existingId}` : "weeklyGoals"
      );
    }
  };

  const handleQuickAdjustWeeklyGoal = async (id: string, deltaMinutes: number) => {
    if (!auth.currentUser) return;
    if (id === "default-overall") {
      await handleSaveWeeklyGoal({
        title: "Overall Weekly Practice",
        targetMinutes: Math.max(15, 180 + deltaMinutes),
      });
      return;
    }

    const goal = weeklyGoals.find((g) => g.id === id);
    if (!goal) return;

    const newTarget = Math.max(15, goal.targetMinutes + deltaMinutes);
    try {
      await updateDoc(doc(db, "weeklyGoals", id), {
        targetMinutes: newTarget,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `weeklyGoals/${id}`);
    }
  };

  const handleDeleteWeeklyGoal = (id: string) => {
    setDeleteConfirm({
      id,
      type: "weeklyGoal",
      message: "Delete this weekly practice target?",
    });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    try {
      if (type === "practice") {
        await deleteDoc(doc(db, "practices", id));
      } else if (type === "goal") {
        await deleteDoc(doc(db, "goals", id));
      } else if (type === "song") {
        await deleteDoc(doc(db, "songs", id));
      } else if (type === "weeklyGoal") {
        await deleteDoc(doc(db, "weeklyGoals", id));
      } else if (type === "assessment") {
        if (auth.currentUser) {
          await deleteDoc(doc(db, "aiAssessments", id));
        }
        setAiAssessments((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        type === "weeklyGoal"
          ? `weeklyGoals/${id}`
          : type === "assessment"
          ? `aiAssessments/${id}`
          : `${type}s/${id}`
      );
    }
    setDeleteConfirm(null);
  };

  const handleSort = (field: SessionSortField) => {
    if (sessionSortField === field) {
      setSessionSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSessionSortField(field);
      setSessionSortDirection(field === "date" ? "desc" : "asc");
    }
  };

  // Effective Weekly Goals (defaults to overall 3h goal if user has none defined)
  const effectiveWeeklyGoals = useMemo(() => {
    if (weeklyGoals.length > 0) return weeklyGoals;
    return [
      {
        id: "default-overall",
        userId: auth.currentUser?.uid || "",
        title: "Overall Weekly Practice",
        targetMinutes: 180,
        createdAt: 0,
      },
    ];
  }, [weeklyGoals, auth.currentUser]);

  // Calculate Weekly Goals Progress
  const weeklyGoalProgress = useMemo(() => {
    return calculateWeeklyGoalProgress(effectiveWeeklyGoals, practices, usageLogs);
  }, [effectiveWeeklyGoals, practices, usageLogs]);

  // Calculate Streak Information
  const streakInfo = useMemo(() => {
    return calculateStreak(practices, usageLogs);
  }, [practices, usageLogs]);

  // Memoized Chart Calculations
  const barChartData = useMemo(() => {
    const data: Record<string, { label: string; totalMinutes: number }> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      data[dateStr] = {
        label: format(d, "EEE"),
        totalMinutes: 0,
      };
    }

    usageLogs.forEach((u) => {
      if (data[u.date]) {
        data[u.date].totalMinutes += u.minutes;
      }
    });

    return Object.values(data);
  }, [usageLogs]);

  const trendsData = useMemo(() => {
    const data: Record<
      string,
      {
        label: string;
        accuracySum: number;
        accCount: number;
        speedSum: number;
        count: number;
        accuracy: number;
        speed: number;
      }
    > = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      data[dateStr] = {
        label: format(d, "MMM d"),
        accuracySum: 0,
        accCount: 0,
        speedSum: 0,
        count: 0,
        accuracy: 0,
        speed: 0,
      };
    }

    practices.forEach((p) => {
      if (data[p.date]) {
        if (!p.isTestSession || p.correctNotes > 0) {
          data[p.date].accuracySum += p.accuracy;
          data[p.date].accCount += 1;
        }
        data[p.date].speedSum += p.speed;
        data[p.date].count += 1;
      }
    });

    return Object.values(data).map((d) => ({
      label: d.label,
      accuracy: d.accCount > 0 ? Math.round(d.accuracySum / d.accCount) : null,
      speed: d.count > 0 ? Math.round(d.speedSum / d.count) : null,
    }));
  }, [practices]);

  const { chartData, songKeys } = useMemo(() => {
    const groupedByDate: Record<string, Record<string, { totalAcc: number; count: number }>> = {};
    const keys = new Set<string>();

    const filtered = practices.filter((p) => {
      const matchStart = chartFilterStartDate ? p.date >= chartFilterStartDate : true;
      const matchEnd = chartFilterEndDate ? p.date <= chartFilterEndDate : true;
      const matchSong = chartFilterSongName ? p.songTitle === chartFilterSongName : true;
      const matchSpeed = chartFilterSpeed ? p.speed.toString() === chartFilterSpeed : true;
      const matchLevel = chartFilterLevel ? p.difficulty.toString() === chartFilterLevel : true;
      return matchStart && matchEnd && matchSong && matchSpeed && matchLevel;
    });

    [...filtered]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((p) => {
        if (p.isTestSession && p.correctNotes === 0) return;
        const dateKey = p.date;
        const songKey = `${p.songTitle} (Lvl ${p.difficulty})`;
        keys.add(songKey);

        if (!groupedByDate[dateKey]) groupedByDate[dateKey] = {};
        if (!groupedByDate[dateKey][songKey]) {
          groupedByDate[dateKey][songKey] = { totalAcc: 0, count: 0 };
        }

        groupedByDate[dateKey][songKey].totalAcc += p.accuracy;
        groupedByDate[dateKey][songKey].count += 1;
      });

    const data = Object.entries(groupedByDate).map(([date, songData]) => {
      const row: any = { date: format(parseISO(date), "MMM d") };
      Object.entries(songData).forEach(([songKey, accData]) => {
        row[songKey] = Math.round(accData.totalAcc / accData.count);
      });
      return row;
    });

    return { chartData: data, songKeys: Array.from(keys) };
  }, [
    practices,
    chartFilterStartDate,
    chartFilterEndDate,
    chartFilterSongName,
    chartFilterSpeed,
    chartFilterLevel,
  ]);

  // Filtered & Sorted Recent Practices
  const filteredPractices = useMemo(() => {
    const query = sessionSearchQuery.trim().toLowerCase();

    return [...practices]
      .filter((p) => {
        const matchSearch = query
          ? p.songTitle.toLowerCase().includes(query) ||
            Boolean(p.note && p.note.toLowerCase().includes(query))
          : true;
        const matchName = sessionFilterName ? p.songTitle === sessionFilterName : true;
        const matchDate = sessionFilterDate ? p.date === sessionFilterDate : true;
        const matchSpeed = sessionFilterSpeed ? p.speed.toString() === sessionFilterSpeed : true;
        const matchLevel = sessionFilterLevel ? p.difficulty.toString() === sessionFilterLevel : true;
        return matchSearch && matchName && matchDate && matchSpeed && matchLevel;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sessionSortField === "date") {
          comparison = a.date.localeCompare(b.date);
          if (comparison === 0) {
            comparison = a.createdAt - b.createdAt;
          }
        } else if (sessionSortField === "duration") {
          comparison = (a.duration || 0) - (b.duration || 0);
        } else if (sessionSortField === "songTitle") {
          comparison = a.songTitle.localeCompare(b.songTitle);
        } else if (sessionSortField === "difficulty") {
          comparison = a.difficulty - b.difficulty;
        } else if (sessionSortField === "accuracy") {
          comparison = a.accuracy - b.accuracy;
        } else if (sessionSortField === "speed") {
          comparison = a.speed - b.speed;
        }
        return sessionSortDirection === "asc" ? comparison : -comparison;
      });
  }, [
    practices,
    sessionSearchQuery,
    sessionFilterName,
    sessionFilterDate,
    sessionFilterSpeed,
    sessionFilterLevel,
    sessionSortField,
    sessionSortDirection,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-indigo-50 font-sans">
      <Header
        userEmail={auth.currentUser?.email}
        onSignOut={() => auth.signOut()}
        onOpenHelp={() => setView("help")}
        currentStreak={streakInfo.currentStreak}
        hasPracticedToday={streakInfo.hasPracticedToday}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header Actions Bar with Clean Visual Grouping */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-indigo-950/40 border border-indigo-800/60 p-4 rounded-2xl shadow-sm print:hidden">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Overview</h2>
                <p className="text-xs text-indigo-300/80 mt-0.5">
                  Track your guitar sessions, measure accuracy, and accelerate progress with AI coaching
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Primary Action Button */}
                <Button
                  onClick={() => {
                    resetPracticeForm();
                    setView("add-practice");
                  }}
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 h-9 px-4"
                >
                  <Plus className="w-4 h-4" /> Record Session
                </Button>

                {/* AI Coaching Suite */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/70 border border-indigo-800/80">
                  <Button
                    onClick={() => setView("live-voice")}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-emerald-300 hover:text-white hover:bg-emerald-950/70"
                    title="Real-time voice conversation with gemini-3.8-live"
                  >
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Voice</span>
                  </Button>
                  <Button
                    onClick={() => setView("chatbot")}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-indigo-200 hover:text-white hover:bg-indigo-900/60"
                    title="Multi-turn Gemini guitar assistant"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Gemini Chat</span>
                  </Button>
                  <Button
                    onClick={() => handleAnalyze()}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-amber-300 hover:text-white hover:bg-amber-950/50"
                    title="Instant AI progress assessment"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Coach</span>
                  </Button>
                </div>

                {/* Analytics & Library Suite */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/70 border border-indigo-800/80">
                  <Button
                    onClick={() => setView("trends")}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-indigo-200 hover:text-white hover:bg-indigo-900/60"
                    title="Accuracy and practice hours trends"
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Trends</span>
                  </Button>
                  <Button
                    onClick={() => setView("duration-trends")}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-indigo-200 hover:text-white hover:bg-indigo-900/60"
                    title="Duration analysis over time"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Durations</span>
                  </Button>
                  <Button
                    onClick={() => setView("manage-songs")}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-indigo-200 hover:text-white hover:bg-indigo-900/60"
                    title="Manage song library"
                  >
                    <Guitar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Songs</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingWeeklyGoal(null);
                      setIsWeeklyGoalModalOpen(true);
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-indigo-200 hover:text-white hover:bg-indigo-900/60"
                    title="Set weekly practice targets"
                  >
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Weekly Target</span>
                  </Button>
                  <Button
                    onClick={() => setView("add-goal")}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-indigo-200 hover:text-white hover:bg-indigo-900/60"
                    title="Add milestone goal"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Milestone</span>
                  </Button>
                </div>

                {/* Utilities: Help & Print */}
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => setView("help")}
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 border-indigo-700/80 bg-indigo-950/60 hover:bg-indigo-800 text-indigo-200"
                    title="Open Help Files & User Guide"
                  >
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    <span>Help</span>
                  </Button>
                  <Button
                    onClick={() => handlePrint("all")}
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 border-indigo-700/80 bg-indigo-950/60 hover:bg-indigo-800 text-indigo-200"
                    title="Print reports"
                  >
                    <Printer className="w-4 h-4 text-indigo-400" />
                    <span>Print All</span>
                  </Button>
                  <Button
                    onClick={resetFrameLayout}
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 border-indigo-700/80 bg-indigo-950/60 hover:bg-indigo-800 text-indigo-200"
                    title="Reset dashboard frames to default positions and sizes"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Reset Layout</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Movable & Resizable Dashboard Frames Grid */}
            <div className="grid grid-cols-12 gap-6 items-start print:flex print:flex-col">
              {frameLayout.map((frame, index) => {
                if (frame.id === "streak") {
                  return (
                    <DashboardFrame
                      key="streak"
                      id="streak"
                      title="Daily Practice Streak & Consistency"
                      subtitle="Track consecutive days practiced, milestones, and record sessions"
                      icon={<Flame className="w-4 h-4 text-amber-400" />}
                      width={frame.width}
                      onWidthChange={(w) => updateFrameWidth("streak", w)}
                      isMinimized={frame.isMinimized}
                      onToggleMinimize={() => toggleFrameMinimize("streak")}
                      onMoveUp={() => moveFrame(index, "up")}
                      onMoveDown={() => moveFrame(index, "down")}
                      canMoveUp={index > 0}
                      canMoveDown={index < frameLayout.length - 1}
                    >
                      <StreakCard
                        streakInfo={streakInfo}
                        onLogSession={() => {
                          resetPracticeForm();
                          setView("add-practice");
                        }}
                        printMode={printMode}
                      />
                    </DashboardFrame>
                  );
                }

                if (frame.id === "goals") {
                  return (
                    <DashboardFrame
                      key="goals"
                      id="goals"
                      title="Weekly Practice Goals & Targets"
                      subtitle="Target minutes, daily paces, and song-specific progress bars"
                      icon={<Target className="w-4 h-4 text-indigo-400" />}
                      width={frame.width}
                      onWidthChange={(w) => updateFrameWidth("goals", w)}
                      isMinimized={frame.isMinimized}
                      onToggleMinimize={() => toggleFrameMinimize("goals")}
                      onMoveUp={() => moveFrame(index, "up")}
                      onMoveDown={() => moveFrame(index, "down")}
                      canMoveUp={index > 0}
                      canMoveDown={index < frameLayout.length - 1}
                    >
                      <WeeklyGoalsSection
                        overallProgress={weeklyGoalProgress.overallProgress}
                        songProgresses={weeklyGoalProgress.songProgresses}
                        weekRangeLabel={weeklyGoalProgress.weekRangeLabel}
                        daysRemainingInWeek={weeklyGoalProgress.daysRemainingInWeek}
                        onOpenAddGoalModal={(goal) => {
                          setEditingWeeklyGoal(goal && goal.id !== "default-overall" ? goal : null);
                          setIsWeeklyGoalModalOpen(true);
                        }}
                        onDeleteGoal={handleDeleteWeeklyGoal}
                        onQuickAdjust={handleQuickAdjustWeeklyGoal}
                        printMode={printMode}
                      />
                    </DashboardFrame>
                  );
                }

                if (frame.id === "trends") {
                  return (
                    <DashboardFrame
                      key="trends"
                      id="trends"
                      title="30-Day Practice Trends & Progression"
                      subtitle="Interactive weekly accuracy trends, time metrics, and performance trajectory"
                      icon={<Activity className="w-4 h-4 text-emerald-400" />}
                      width={frame.width}
                      onWidthChange={(w) => updateFrameWidth("trends", w)}
                      isMinimized={frame.isMinimized}
                      onToggleMinimize={() => toggleFrameMinimize("trends")}
                      onMoveUp={() => moveFrame(index, "up")}
                      onMoveDown={() => moveFrame(index, "down")}
                      canMoveUp={index > 0}
                      canMoveDown={index < frameLayout.length - 1}
                    >
                      <PracticeTrendsSection
                        practices={practices}
                        activeSongs={activeSongs}
                        usageLogs={usageLogs}
                        printMode={printMode}
                        onPrint={handlePrint}
                        onOpenFullTrends={() => setView("trends")}
                      />
                    </DashboardFrame>
                  );
                }

                if (frame.id === "milestones") {
                  return (
                    <DashboardFrame
                      key="milestones"
                      id="milestones"
                      title="Milestones & Repertoire Goals"
                      subtitle="Track completed vs active song milestones and target dates"
                      icon={<Sparkles className="w-4 h-4 text-purple-400" />}
                      width={frame.width}
                      onWidthChange={(w) => updateFrameWidth("milestones", w)}
                      isMinimized={frame.isMinimized}
                      onToggleMinimize={() => toggleFrameMinimize("milestones")}
                      onMoveUp={() => moveFrame(index, "up")}
                      onMoveDown={() => moveFrame(index, "down")}
                      canMoveUp={index > 0}
                      canMoveDown={index < frameLayout.length - 1}
                    >
                      <MilestonesCard
                        goals={goals}
                        activeSongs={activeSongs}
                        songFilter={milestoneFilterSong}
                        onSongFilterChange={setMilestoneFilterSong}
                        startDateFilter={milestoneFilterStartDate}
                        onStartDateFilterChange={setMilestoneFilterStartDate}
                        endDateFilter={milestoneFilterEndDate}
                        onEndDateFilterChange={setMilestoneFilterEndDate}
                        onClearFilters={() => {
                          setMilestoneFilterSong("");
                          setMilestoneFilterStartDate("");
                          setMilestoneFilterEndDate("");
                        }}
                        onToggleGoal={toggleGoal}
                        onDeleteGoal={deleteGoal}
                        printMode={printMode}
                        onPrint={handlePrint}
                      />
                    </DashboardFrame>
                  );
                }

                if (frame.id === "weeklyChart") {
                  return (
                    <DashboardFrame
                      key="weeklyChart"
                      id="weeklyChart"
                      title="Weekly Practice Hours Distribution"
                      subtitle="Day-by-day practice duration across Monday through Sunday"
                      icon={<Clock className="w-4 h-4 text-indigo-400" />}
                      width={frame.width}
                      onWidthChange={(w) => updateFrameWidth("weeklyChart", w)}
                      isMinimized={frame.isMinimized}
                      onToggleMinimize={() => toggleFrameMinimize("weeklyChart")}
                      onMoveUp={() => moveFrame(index, "up")}
                      onMoveDown={() => moveFrame(index, "down")}
                      canMoveUp={index > 0}
                      canMoveDown={index < frameLayout.length - 1}
                    >
                      <WeeklyPracticeChart
                        data={barChartData}
                        printMode={printMode}
                        onPrint={handlePrint}
                      />
                    </DashboardFrame>
                  );
                }

                if (frame.id === "accuracyChart") {
                  return (
                    <DashboardFrame
                      key="accuracyChart"
                      id="accuracyChart"
                      title="Historical Accuracy Progression"
                      subtitle="Filterable accuracy trendlines per song, speed, and difficulty level"
                      icon={<Activity className="w-4 h-4 text-indigo-400" />}
                      width={frame.width}
                      onWidthChange={(w) => updateFrameWidth("accuracyChart", w)}
                      isMinimized={frame.isMinimized}
                      onToggleMinimize={() => toggleFrameMinimize("accuracyChart")}
                      onMoveUp={() => moveFrame(index, "up")}
                      onMoveDown={() => moveFrame(index, "down")}
                      canMoveUp={index > 0}
                      canMoveDown={index < frameLayout.length - 1}
                    >
                      <HistoricalAccuracyChart
                        chartData={chartData}
                        songKeys={songKeys}
                        activeSongs={activeSongs}
                        songFilter={chartFilterSongName}
                        onSongFilterChange={setChartFilterSongName}
                        speedFilter={chartFilterSpeed}
                        onSpeedFilterChange={setChartFilterSpeed}
                        levelFilter={chartFilterLevel}
                        onLevelFilterChange={setChartFilterLevel}
                        startDateFilter={chartFilterStartDate}
                        onStartDateFilterChange={setChartFilterStartDate}
                        endDateFilter={chartFilterEndDate}
                        onEndDateFilterChange={setChartFilterEndDate}
                        onClearFilters={() => {
                          setChartFilterStartDate("");
                          setChartFilterEndDate("");
                          setChartFilterSongName("");
                          setChartFilterSpeed("");
                          setChartFilterLevel("");
                        }}
                        printMode={printMode}
                        onPrint={handlePrint}
                      />
                    </DashboardFrame>
                  );
                }

                if (frame.id === "sessions") {
                  return (
                    <DashboardFrame
                      key="sessions"
                      id="sessions"
                      title="Recent Practice Sessions Log"
                      subtitle="Searchable and sortable log with quick record, feedback, edit, and print"
                      icon={<Guitar className="w-4 h-4 text-indigo-400" />}
                      width={frame.width}
                      onWidthChange={(w) => updateFrameWidth("sessions", w)}
                      isMinimized={frame.isMinimized}
                      onToggleMinimize={() => toggleFrameMinimize("sessions")}
                      onMoveUp={() => moveFrame(index, "up")}
                      onMoveDown={() => moveFrame(index, "down")}
                      canMoveUp={index > 0}
                      canMoveDown={index < frameLayout.length - 1}
                    >
                      <RecentSessionsTable
                        practices={filteredPractices}
                        totalCount={practices.length}
                        activeSongs={activeSongs}
                        searchQuery={sessionSearchQuery}
                        onSearchQueryChange={setSessionSearchQuery}
                        sortField={sessionSortField}
                        sortDirection={sessionSortDirection}
                        onSort={handleSort}
                        filterName={sessionFilterName}
                        onFilterNameChange={setSessionFilterName}
                        filterDate={sessionFilterDate}
                        onFilterDateChange={setSessionFilterDate}
                        filterSpeed={sessionFilterSpeed}
                        onFilterSpeedChange={setSessionFilterSpeed}
                        filterLevel={sessionFilterLevel}
                        onFilterLevelChange={setSessionFilterLevel}
                        onClearFilters={() => {
                          setSessionSearchQuery("");
                          setSessionFilterName("");
                          setSessionFilterDate("");
                          setSessionFilterSpeed("");
                          setSessionFilterLevel("");
                          setSessionSortField("date");
                          setSessionSortDirection("desc");
                        }}
                        onAddSession={() => {
                          resetPracticeForm();
                          setView("add-practice");
                        }}
                        onQuickRecordSession={handleQuickRecordSession}
                        onEditSession={handleEditPractice}
                        onDeleteSession={deletePractice}
                        onFeedbackSession={(p) => setFeedbackPractice(p)}
                        printMode={printMode}
                        onPrint={handlePrint}
                        isHighlighted={highlightSessionsLog}
                      />
                    </DashboardFrame>
                  );
                }

                return null;
              })}
            </div>
          </div>

        {/* Moveable & Resizable Windows */}
        {view === "add-practice" && (
          <PracticeSessionModal
            editingPracticeId={editingPracticeId}
            activeSongs={activeSongs}
            songTitle={songTitle}
            onSongTitleChange={handleSongTitleChange}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            practiceDate={practiceDate}
            onPracticeDateChange={setPracticeDate}
            correctNotes={correctNotes}
            onCorrectNotesChange={setCorrectNotes}
            totalNotes={totalNotes}
            onTotalNotesChange={setTotalNotes}
            duration={duration}
            onDurationChange={setDuration}
            isPartial={isPartial}
            onIsPartialChange={setIsPartial}
            isShortVersion={isShortVersion}
            onIsShortVersionChange={setIsShortVersion}
            isTestSession={isTestSession}
            onIsTestSessionChange={(checked) => {
              setIsTestSession(checked);
              if (checked) {
                setCorrectNotes("");
              }
            }}
            score={score}
            onScoreChange={setScore}
            speed={speed}
            onSpeedChange={setSpeed}
            note={note}
            onNoteChange={setNote}
            isSaving={isSavingPractice}
            saveError={practiceSaveError}
            onSubmit={handleAddPractice}
            onCancel={() => {
              resetPracticeForm();
              setView("dashboard");
            }}
          />
        )}

        {view === "add-goal" && (
          <GoalModal
            activeSongs={activeSongs}
            goalSongTitle={goalSongTitle}
            onGoalSongTitleChange={setGoalSongTitle}
            goalTitle={goalTitle}
            onGoalTitleChange={setGoalTitle}
            goalDate={goalDate}
            onGoalDateChange={setGoalDate}
            onSubmit={handleAddGoal}
            onCancel={() => setView("dashboard")}
          />
        )}

        {view === "trends" && (
          <MoveableResizableFrame
            isOpen={true}
            onClose={() => setView("dashboard")}
            title="Practice Trends & Analytics"
            subtitle="Weekly accuracy improvements, total practice hours, and session trends"
            icon={<Activity className="w-5 h-5 text-indigo-400" />}
            initialWidth={1040}
            initialHeight={780}
            minWidth={460}
            minHeight={360}
            ariaLabel="Practice Trends & Analytics"
            headerActions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrint("trends")}
                className="gap-1.5 border-indigo-700/80 bg-indigo-950/60 hover:bg-indigo-800 text-indigo-200 text-xs h-8"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </Button>
            }
          >
            <TrendsModal
              data={trendsData}
              practices={practices}
              activeSongs={activeSongs}
              usageLogs={usageLogs}
              printMode={printMode}
              onPrint={handlePrint}
              onBack={() => setView("dashboard")}
            />
          </MoveableResizableFrame>
        )}

        {view === "duration-trends" && (
          <MoveableResizableFrame
            isOpen={true}
            onClose={() => setView("dashboard")}
            title="Session Duration Trends"
            subtitle="Analyze your practice session lengths and duration milestones"
            icon={<Clock className="w-5 h-5 text-emerald-400" />}
            initialWidth={1060}
            initialHeight={800}
            minWidth={460}
            minHeight={360}
            ariaLabel="Session Duration Trends"
          >
            <DurationTrendsPage
              practices={practices}
              activeSongs={activeSongs}
              usageLogs={usageLogs}
              printMode={printMode}
              onPrint={handlePrint}
              onBack={() => setView("dashboard")}
              onAddSession={() => {
                resetPracticeForm();
                setView("add-practice");
              }}
              onEditSession={handleEditPractice}
              onFeedbackSession={(p) => setFeedbackPractice(p)}
            />
          </MoveableResizableFrame>
        )}

        {view === "ai-analysis" && (
          <MoveableResizableFrame
            isOpen={true}
            onClose={() => setView("dashboard")}
            title="AI Practice Coach Assessment Archive"
            subtitle="Personalized performance insights preserved chronologically by date and time"
            icon={<Sparkles className="w-5 h-5 text-amber-400" />}
            initialWidth={1040}
            initialHeight={780}
            minWidth={460}
            minHeight={360}
            ariaLabel="AI Practice Coach Assessment Archive"
          >
            <AiAnalysisModal
              assessments={aiAssessments}
              isAnalyzing={isAnalyzing}
              onGenerateAssessment={() => handleAnalyze(true)}
              onDeleteAssessment={(id) => {
                setDeleteConfirm({
                  id,
                  type: "assessment",
                  message: "Delete this AI practice assessment from your history?",
                });
              }}
              onBack={() => setView("dashboard")}
            />
          </MoveableResizableFrame>
        )}

        {view === "chatbot" && (
          <MoveableResizableFrame
            isOpen={true}
            onClose={() => setView("dashboard")}
            title="Gemini AI Guitar Assistant"
            subtitle="Multi-turn guidance, technique tips, and practice feedback"
            icon={<MessageSquare className="w-5 h-5 text-indigo-400" />}
            initialWidth={920}
            initialHeight={760}
            minWidth={440}
            minHeight={400}
            ariaLabel="Gemini AI Guitar Assistant"
          >
            <GeminiChatbotModal
              practices={practices}
              songs={songs}
              goals={goals}
              persistedMessages={chatMessages}
              onSaveMessage={handleSaveChatMessage}
              onClearHistory={handleClearChatHistory}
              onOpenLiveVoice={() => setView("live-voice")}
              onBack={() => setView("dashboard")}
            />
          </MoveableResizableFrame>
        )}

        {view === "live-voice" && (
          <MoveableResizableFrame
            isOpen={true}
            onClose={() => setView("dashboard")}
            title="Live Voice Coach (gemini-3.8-live)"
            subtitle="Hands-free, real-time voice conversations while you practice"
            icon={<Mic className="w-5 h-5 text-emerald-400" />}
            initialWidth={760}
            initialHeight={700}
            minWidth={420}
            minHeight={380}
            ariaLabel="Live Voice Coach"
          >
            <LiveVoiceCoachModal
              practices={practices}
              songs={songs}
              goals={goals}
              onOpenChatbot={() => setView("chatbot")}
              onBack={() => setView("dashboard")}
            />
          </MoveableResizableFrame>
        )}

        {view === "help" && (
          <MoveableResizableFrame
            isOpen={true}
            onClose={() => setView("dashboard")}
            title="Help Files & User Guide"
            subtitle="Comprehensive documentation, scoring formulas, and shortcuts"
            icon={<HelpCircle className="w-5 h-5 text-indigo-400" />}
            initialWidth={960}
            initialHeight={780}
            minWidth={440}
            minHeight={360}
            ariaLabel="Help Files & User Guide"
          >
            <HelpModal
              onBack={() => setView("dashboard")}
              onNavigate={(targetView) => setView(targetView)}
            />
          </MoveableResizableFrame>
        )}

        {view === "manage-songs" && (
          <MoveableResizableFrame
            isOpen={true}
            onClose={() => setView("dashboard")}
            title="Song & Exercise Library"
            subtitle="Manage songs, retire inactive exercises, and review repertoire"
            icon={<Guitar className="w-5 h-5 text-indigo-400" />}
            initialWidth={720}
            initialHeight={620}
            minWidth={400}
            minHeight={320}
            ariaLabel="Song & Exercise Library"
          >
            <ManageSongsModal
              songs={songs}
              newSongInput={newSongInput}
              onNewSongInputChange={setNewSongInput}
              onAddSong={handleAddSong}
              onToggleSongRetired={toggleSongRetired}
              onDeleteSong={deleteSong}
              onDone={() => setView("dashboard")}
            />
          </MoveableResizableFrame>
        )}

        <WeeklyGoalModal
          activeSongs={activeSongs}
          initialGoal={editingWeeklyGoal}
          isOpen={isWeeklyGoalModalOpen}
          onClose={() => {
            setIsWeeklyGoalModalOpen(false);
            setEditingWeeklyGoal(null);
          }}
          onSave={handleSaveWeeklyGoal}
        />

        <PrintOverlays
          printError={printError}
          onDismissError={() => setPrintError(false)}
          printMode={printMode}
          onCancelPrint={() => setPrintMode(null)}
        />

        <DeleteConfirmModal
          confirmState={deleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={executeDelete}
        />

        <PostSessionFeedbackModal
          isOpen={Boolean(feedbackPractice)}
          practice={feedbackPractice}
          onClose={() => {
            setFeedbackPractice(null);
            focusPracticeSessionsLog();
          }}
          onSaveFeedback={async (rating, note) => {
            if (feedbackPractice) {
              await handleSaveSessionFeedback(feedbackPractice.id, rating, note);
            }
            focusPracticeSessionsLog();
          }}
        />

        {/* Floating Quick-Launch Dock for Gemini Chatbot & Live Voice */}
        {view !== "chatbot" && view !== "live-voice" && (
          <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setView("live-voice")}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xl shadow-emerald-950/80 border border-emerald-400/60 transition-transform hover:scale-105"
              title="Start a real-time voice conversation with gemini-3.8-live"
            >
              <Mic className="w-4 h-4" />
              <span>Live Voice</span>
            </button>
            <button
              type="button"
              onClick={() => setView("chatbot")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xl shadow-indigo-950/80 border border-indigo-400/60 transition-transform hover:scale-105"
              title="Open Multi-Turn Gemini Guitar Chatbot"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Gemini Chat</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
