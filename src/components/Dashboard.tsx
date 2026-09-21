import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { Printer, Sparkles, Activity, Guitar, Plus, Clock, Target } from "lucide-react";
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
} from "../types";
import { Button } from "./ui/button";

import { Header } from "./dashboard/Header";
import { WeeklyPracticeChart } from "./dashboard/WeeklyPracticeChart";
import { HistoricalAccuracyChart } from "./dashboard/HistoricalAccuracyChart";
import { RecentSessionsTable } from "./dashboard/RecentSessionsTable";
import { MilestonesCard } from "./dashboard/MilestonesCard";
import { PracticeSessionModal } from "./dashboard/PracticeSessionModal";
import { GoalModal } from "./dashboard/GoalModal";
import { TrendsModal } from "./dashboard/TrendsModal";
import { DurationTrendsPage } from "./dashboard/DurationTrendsPage";
import { AiAnalysisModal } from "./dashboard/AiAnalysisModal";
import { ManageSongsModal } from "./dashboard/ManageSongsModal";
import { DeleteConfirmModal } from "./dashboard/DeleteConfirmModal";
import { PrintOverlays } from "./dashboard/PrintOverlays";
import { StreakCard } from "./dashboard/StreakCard";
import { WeeklyGoalsSection } from "./dashboard/WeeklyGoalsSection";
import { WeeklyGoalModal } from "./dashboard/WeeklyGoalModal";
import { calculateStreak } from "../utils/streakCalculator";
import { calculateWeeklyGoalProgress } from "../utils/goalCalculator";

export function Dashboard() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
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
  const [totalNotes, setTotalNotes] = useState("");
  const [speed, setSpeed] = useState("");
  const [duration, setDuration] = useState("");
  const [isPartial, setIsPartial] = useState(false);
  const [isTestSession, setIsTestSession] = useState(false);
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");
  const [practiceDate, setPracticeDate] = useState(new Date().toISOString().split("T")[0]);
  const songTotalsRef = useRef<Record<string, number>>({});

  const [goalTitle, setGoalTitle] = useState("");
  const [goalSongTitle, setGoalSongTitle] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);
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
        setDuration(lastPractice.duration !== undefined ? lastPractice.duration.toString() : "");
        setIsPartial(lastPractice.isPartial || false);
        setScore("");
      } else {
        setDifficulty(1);
        setTotalNotes(carriedTotal ? carriedTotal.toString() : "");
        setSpeed("");
        setDuration("");
        setIsPartial(false);
        setScore("");
        setNote("");
      }
    }
  };

  const resetPracticeForm = () => {
    setSongTitle("");
    setNewSongInput("");
    setDifficulty(1);
    setCorrectNotes("");
    setTotalNotes("");
    setSpeed("");
    setDuration("");
    setIsPartial(false);
    setIsTestSession(false);
    setScore("");
    setNote("");
    setEditingPracticeId(null);
  };

  const handleEditPractice = (p: Practice) => {
    setSongTitle(p.songTitle);
    setDifficulty(p.difficulty);
    setCorrectNotes(p.correctNotes.toString());
    setTotalNotes(p.totalNotes.toString());
    setSpeed(p.speed.toString());
    setDuration(p.duration !== undefined ? p.duration.toString() : "");
    setIsPartial(p.isPartial || false);
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

    return () => {
      unsubscribePractices();
      unsubscribeGoals();
      unsubscribeSongs();
      unsubscribeUsage();
      unsubscribeWeeklyGoals();
    };
  }, []);

  const handleAddPractice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const spd = parseInt(speed);
    if (isNaN(spd)) return;

    let total = parseInt(totalNotes);
    if (isNaN(total) || total <= 0) {
      const carried =
        songTotalsRef.current[songTitle] ||
        practices.find((p) => p.songTitle === songTitle && p.totalNotes > 0)?.totalNotes;
      total = carried || 0;
    }

    let correct = 0;
    let accuracy = 0;

    if (isTestSession) {
      correct = 0;
      accuracy = total > 0 && correct > 0 ? Math.round((correct / total) * 100) : 0;
    } else {
      correct = parseInt(correctNotes);
      if (isNaN(correct) || isNaN(total) || total === 0) return;
      accuracy = Math.round((correct / total) * 100);
    }

    if (songTitle && total > 0) {
      songTotalsRef.current[songTitle] = total;
    }

    const parsedScore =
      isTestSession && score.trim() !== "" && !isNaN(Number(score)) ? Number(score) : undefined;

    const parsedDuration =
      duration.trim() !== "" && !isNaN(Number(duration)) && Number(duration) > 0
        ? Math.round(Number(duration))
        : undefined;

    try {
      if (editingPracticeId) {
        const existingPractice = practices.find((p) => p.id === editingPracticeId);
        if (existingPractice) {
          await updateDoc(doc(db, "practices", editingPracticeId), {
            userId: existingPractice.userId,
            songTitle,
            difficulty,
            correctNotes: correct,
            totalNotes: total,
            accuracy,
            speed: spd,
            date: practiceDate,
            isPartial,
            isTestSession,
            createdAt: existingPractice.createdAt,
            note,
            ...(parsedDuration !== undefined
              ? { duration: parsedDuration }
              : { duration: deleteField() }),
            ...(parsedScore !== undefined ? { score: parsedScore } : { score: deleteField() }),
          });
        }
      } else {
        const newPractice: any = {
          userId: auth.currentUser.uid,
          songTitle,
          difficulty,
          correctNotes: correct,
          totalNotes: total,
          accuracy,
          speed: spd,
          date: practiceDate,
          isPartial,
          isTestSession,
          createdAt: Date.now(),
          note,
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
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "practices");
    }
  };

  const handleAnalyze = async (force = false) => {
    setView("ai-analysis");
    if (aiAnalysis && !force) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practices, goals, songs }),
      });
      const data = await response.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis(data.error || "Failed to analyze data.");
      }
    } catch (err) {
      console.error(err);
      setAiAnalysis(err instanceof Error ? err.message : "Error connecting to AI Coach.");
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
      }
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        type === "weeklyGoal" ? `weeklyGoals/${id}` : `${type}s/${id}`
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
        } else if (sessionSortField === "songTitle") {
          comparison = a.songTitle.localeCompare(b.songTitle);
        } else if (sessionSortField === "accuracy") {
          comparison = a.accuracy - b.accuracy;
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
        currentStreak={streakInfo.currentStreak}
        hasPracticedToday={streakInfo.hasPracticedToday}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === "dashboard" && (
          <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
              <div className="flex flex-wrap gap-2 print:hidden">
                <Button
                  onClick={() => handlePrint("all")}
                  variant="outline"
                  className="gap-2 border-indigo-700 text-indigo-100 hover:bg-indigo-800"
                >
                  <Printer className="w-4 h-4" /> Print All
                </Button>
                <Button
                  onClick={() => handleAnalyze()}
                  variant="outline"
                  className="gap-2 bg-indigo-900/50 hover:bg-indigo-800 border-indigo-700 text-indigo-100"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" /> AI Coach
                </Button>
                <Button
                  onClick={() => setView("trends")}
                  variant="outline"
                  className="gap-2 border-indigo-700 text-indigo-100 hover:bg-indigo-800"
                >
                  <Activity className="w-4 h-4" /> Trends
                </Button>
                <Button
                  onClick={() => setView("duration-trends")}
                  variant="outline"
                  className="gap-2 border-indigo-700 text-indigo-100 hover:bg-indigo-800"
                >
                  <Clock className="w-4 h-4 text-emerald-400" /> Durations
                </Button>
                <Button
                  onClick={() => setView("manage-songs")}
                  variant="outline"
                  className="gap-2"
                >
                  <Guitar className="w-4 h-4" /> Songs
                </Button>
                <Button
                  onClick={() => {
                    setEditingWeeklyGoal(null);
                    setIsWeeklyGoalModalOpen(true);
                  }}
                  variant="outline"
                  className="gap-2 border-indigo-700 text-indigo-100 hover:bg-indigo-800"
                >
                  <Target className="w-4 h-4 text-indigo-400" /> Weekly Target
                </Button>
                <Button
                  onClick={() => setView("add-goal")}
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" /> Milestone
                </Button>
                <Button
                  onClick={() => {
                    resetPracticeForm();
                    setView("add-practice");
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" /> Session
                </Button>
              </div>
            </div>

            {/* Daily Practice Streak Card */}
            <StreakCard
              streakInfo={streakInfo}
              onLogSession={() => {
                resetPracticeForm();
                setView("add-practice");
              }}
              printMode={printMode}
            />

            {/* Weekly Practice Goals Section */}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:flex print:flex-col">
              {/* Main Content (Charts & Table) */}
              <div className="lg:col-span-2 space-y-8 print:w-full">
                <WeeklyPracticeChart
                  data={barChartData}
                  printMode={printMode}
                  onPrint={handlePrint}
                />

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
                  onEditSession={handleEditPractice}
                  onDeleteSession={deletePractice}
                  printMode={printMode}
                  onPrint={handlePrint}
                />
              </div>

              {/* Sidebar (Milestones & Goals) */}
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
            </div>
          </div>
        )}

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
          <TrendsModal
            data={trendsData}
            printMode={printMode}
            onPrint={handlePrint}
            onBack={() => setView("dashboard")}
          />
        )}

        {view === "duration-trends" && (
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
          />
        )}

        {view === "ai-analysis" && (
          <AiAnalysisModal
            isAnalyzing={isAnalyzing}
            aiAnalysis={aiAnalysis}
            onReanalyze={() => handleAnalyze(true)}
            onBack={() => setView("dashboard")}
          />
        )}

        {view === "manage-songs" && (
          <ManageSongsModal
            songs={songs}
            newSongInput={newSongInput}
            onNewSongInputChange={setNewSongInput}
            onAddSong={handleAddSong}
            onToggleSongRetired={toggleSongRetired}
            onDeleteSong={deleteSong}
            onDone={() => setView("dashboard")}
          />
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
      </main>
    </div>
  );
}
