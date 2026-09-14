import React, { useState, useEffect, useMemo, useRef } from "react";
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc, where } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, auth } from "../lib/firebase";
import { Practice, Goal, Song } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Circle, Trash2, Plus, LogOut, Guitar, Edit2, Sparkles, Loader2, Printer, Play, Pause, RotateCcw, Timer } from "lucide-react";
import { cn } from "../lib/utils";


const playChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(523.25, now, 2); // C5
    playTone(659.25, now + 0.1, 2); // E5
    playTone(783.99, now + 0.2, 3); // G5
    playTone(1046.50, now + 0.3, 4); // C6
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export function Dashboard() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [view, setView] = useState<"dashboard" | "add-practice" | "add-goal" | "manage-songs" | "ai-analysis">("dashboard");
  const activeSongs = songs.filter(s => !s.retired);

  // Form states
  const [songTitle, setSongTitle] = useState("");
  const [newSongInput, setNewSongInput] = useState("");
  const [difficulty, setDifficulty] = useState<number>(1);
  const [correctNotes, setCorrectNotes] = useState("");
  const [totalNotes, setTotalNotes] = useState("");
  const [speed, setSpeed] = useState("");
  const [duration, setDuration] = useState("");
  const [timerInitialMinutes, setTimerInitialMinutes] = useState(15);
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(15 * 60);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const hasChimed = useRef(false);

  useEffect(() => {
    if (timerRemainingSeconds === 0 && !hasChimed.current) {
      playChime();
      hasChimed.current = true;
    } else if (timerRemainingSeconds > 0) {
      hasChimed.current = false;
    }
  }, [timerRemainingSeconds]);
  const [isPartial, setIsPartial] = useState(false);
  const [practiceDate, setPracticeDate] = useState(new Date().toISOString().split('T')[0]);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalSongTitle, setGoalSongTitle] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'practice' | 'goal' | 'song', message: string } | null>(null);
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
  const [printMode, setPrintMode] = useState<"all" | "weekly" | "historical" | "recent" | "milestones" | null>(null);
  const [printError, setPrintError] = useState(false);

  const handlePrint = (mode: "all" | "weekly" | "historical" | "recent" | "milestones") => {
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
      
      window.addEventListener('afterprint', handleAfterPrint);
      
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error("Print failed", err);
          setPrintError(true);
        }
      }, 500); // Give the DOM time to apply the print:hidden classes

      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
        clearTimeout(timer);
      };
    }
  }, [printMode]);

  const handleSongTitleChange = (newTitle: string) => {
    setSongTitle(newTitle);
    if (!editingPracticeId) {
      const lastPractice = practices.find(p => p.songTitle === newTitle);
      if (lastPractice) {
        setDifficulty(lastPractice.difficulty);
        setTotalNotes(lastPractice.totalNotes.toString());
        setSpeed(lastPractice.speed.toString());
      } else {
        setDifficulty(1);
        setTotalNotes("");
        setSpeed("");
    setDuration("");
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStopwatchRunning && timerRemainingSeconds > 0) {
      interval = setInterval(() => {
        setTimerRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsStopwatchRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning, timerRemainingSeconds]);

  const formatStopwatch = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStopwatchToggle = () => {
    if (isStopwatchRunning) {
      setIsStopwatchRunning(false);
      const practicedSeconds = (timerInitialMinutes * 60) - timerRemainingSeconds;
      const mins = Math.max(1, Math.ceil(practicedSeconds / 60));
      setDuration(mins.toString());
    } else {
      if (timerRemainingSeconds > 0) {
        setIsStopwatchRunning(true);
      }
    }
  };

  const handleStopwatchReset = () => {
    setIsStopwatchRunning(false);
    setTimerRemainingSeconds(timerInitialMinutes * 60);
  };
  
  const handleAdjustTime = (delta: number) => {
    if (isStopwatchRunning) return;
    const newMins = Math.max(1, Math.min(120, timerInitialMinutes + delta));
    setTimerInitialMinutes(newMins);
    setTimerRemainingSeconds(newMins * 60);
  };

  const resetPracticeForm = (resetTimer = false) => {
    setSongTitle("");
    setDifficulty(1);
    setCorrectNotes("");
    setTotalNotes("");
    setSpeed("");
    if (resetTimer) {
      setDuration("");
      setIsStopwatchRunning(false);
      setTimerRemainingSeconds(timerInitialMinutes * 60);
    }
    setIsPartial(false);
    setPracticeDate(new Date().toISOString().split('T')[0]);
    setEditingPracticeId(null);
  };

  const handleEditPractice = (p: Practice) => {
    setSongTitle(p.songTitle);
    setDifficulty(p.difficulty);
    setCorrectNotes(p.correctNotes.toString());
    setTotalNotes(p.totalNotes.toString());
    setSpeed(p.speed.toString());
    setDuration(p.duration ? p.duration.toString() : "");
    setIsPartial(p.isPartial || false);
    setPracticeDate(p.date);
    setEditingPracticeId(p.id);
    setView("add-practice");
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const qPractices = query(collection(db, "practices"), where("userId", "==", uid));
    const unsubscribePractices = onSnapshot(qPractices, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Practice));
      p.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.createdAt - a.createdAt;
      });
      setPractices(p);
    }, (error) => handleFirestoreError(error, OperationType.GET, "practices"));

    const qGoals = query(collection(db, "goals"), where("userId", "==", uid));
    const unsubscribeGoals = onSnapshot(qGoals, (snapshot) => {
      const g = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
      g.sort((a, b) => a.targetDate.localeCompare(b.targetDate));
      setGoals(g);
    }, (error) => handleFirestoreError(error, OperationType.GET, "goals"));

    const qSongs = query(collection(db, "songs"), where("userId", "==", uid));
    const unsubscribeSongs = onSnapshot(qSongs, (snapshot) => {
      const s = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
      s.sort((a, b) => a.title.localeCompare(b.title));
      setSongs(s);
    }, (error) => handleFirestoreError(error, OperationType.GET, "songs"));

    return () => {
      unsubscribePractices();
      unsubscribeGoals();
      unsubscribeSongs();
    };
  }, []);

  const handleAddPractice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    const correct = parseInt(correctNotes);
    const total = parseInt(totalNotes);
    const spd = parseInt(speed);
    const dur = duration ? parseInt(duration) : 15;

    if (isNaN(correct) || isNaN(total) || isNaN(spd) || total === 0) return;

    const accuracy = Math.round((correct / total) * 100);

    try {
      if (editingPracticeId) {
        const existingPractice = practices.find(p => p.id === editingPracticeId);
        if (existingPractice) {
          await updateDoc(doc(db, "practices", editingPracticeId), {
            userId: existingPractice.userId,
            songTitle,
            difficulty,
            correctNotes: correct,
            duration: dur,
            totalNotes: total,
            accuracy,
            speed: spd,
            date: practiceDate,
            isPartial,
            createdAt: existingPractice.createdAt
          });
        }
      } else {
        const newPractice = {
          userId: auth.currentUser.uid,
          songTitle,
          difficulty,
          correctNotes: correct,
          duration: dur,
          totalNotes: total,
          accuracy,
          speed: spd,
          date: practiceDate,
          isPartial,
          createdAt: Date.now()
        };
        await addDoc(collection(db, "practices"), newPractice);
      }
      setView("dashboard");
      resetPracticeForm(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "practices");
    }
  };

  const handleAnalyze = async (force = false) => {
    setView("ai-analysis");
    if (aiAnalysis && !force) return; // Already analyzed
    
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practices, goals, songs })
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

    const newGoal = {
      userId: auth.currentUser.uid,
      title: goalTitle,
      songTitle: goalSongTitle,
      targetDate: goalDate,
      achieved: false,
      createdAt: Date.now()
    };

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
    setDeleteConfirm({ id, type: 'practice', message: "Delete this record?" });
  };

  const deleteGoal = (id: string) => {
    setDeleteConfirm({ id, type: 'goal', message: "Delete this goal?" });
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newSongInput.trim()) return;

    const newSong = {
      userId: auth.currentUser.uid,
      title: newSongInput.trim(),
      createdAt: Date.now()
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
        retired: !song.retired
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "songs");
    }
  };

  const deleteSong = (id: string) => {
    setDeleteConfirm({ id, type: 'song', message: "Delete this song? It will not delete associated practice logs." });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    try {
      if (type === 'practice') {
        await deleteDoc(doc(db, "practices", id));
      } else if (type === 'goal') {
        await deleteDoc(doc(db, "goals", id));
      } else if (type === 'song') {
        await deleteDoc(doc(db, "songs", id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${type}s/${id}`);
    }
    setDeleteConfirm(null);
  };

  const barChartData = React.useMemo(() => {
    const data = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data[dateStr] = {
        label: format(d, "EEE"), // e.g. Mon, Tue
        totalMinutes: 0
      };
    }

    practices.forEach(p => {
      if (data[p.date]) {
        data[p.date].totalMinutes += (p.duration || 15);
      }
    });

    return Object.values(data);
  }, [practices]);

  const { chartData, songKeys } = React.useMemo(() => {
    const groupedByDate: Record<string, Record<string, { totalAcc: number; count: number }>> = {};
    const keys = new Set<string>();

    const filtered = practices.filter(p => {
      const matchStart = chartFilterStartDate ? p.date >= chartFilterStartDate : true;
      const matchEnd = chartFilterEndDate ? p.date <= chartFilterEndDate : true;
      const matchSong = chartFilterSongName ? p.songTitle === chartFilterSongName : true;
      const matchSpeed = chartFilterSpeed ? p.speed.toString() === chartFilterSpeed : true;
      const matchLevel = chartFilterLevel ? p.difficulty.toString() === chartFilterLevel : true;
      return matchStart && matchEnd && matchSong && matchSpeed && matchLevel;
    });

    [...filtered].sort((a, b) => a.date.localeCompare(b.date)).forEach(p => {
      const dateKey = p.date;
      const songKey = `${p.songTitle} (Lvl ${p.difficulty})`;
      keys.add(songKey);
      
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = {};
      if (!groupedByDate[dateKey][songKey]) groupedByDate[dateKey][songKey] = { totalAcc: 0, count: 0 };
      
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
  }, [practices, chartFilterStartDate, chartFilterEndDate, chartFilterSongName, chartFilterSpeed, chartFilterLevel]);

  const COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];


  const filteredGoals = goals.filter(g => {
    const matchSong = milestoneFilterSong ? g.songTitle === milestoneFilterSong : true;
    const matchStart = milestoneFilterStartDate ? g.targetDate >= milestoneFilterStartDate : true;
    const matchEnd = milestoneFilterEndDate ? g.targetDate <= milestoneFilterEndDate : true;
    return matchSong && matchStart && matchEnd;
  });

  const filteredPractices = practices.filter(p => {
    const matchName = sessionFilterName ? p.songTitle === sessionFilterName : true;
    const matchDate = sessionFilterDate ? p.date === sessionFilterDate : true;
    const matchSpeed = sessionFilterSpeed ? p.speed.toString() === sessionFilterSpeed : true;
    const matchLevel = sessionFilterLevel ? p.difficulty.toString() === sessionFilterLevel : true;
    return matchName && matchDate && matchSpeed && matchLevel;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-indigo-50 font-sans">
      <header className="bg-indigo-950/60 backdrop-blur-md border-b border-indigo-800 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-300">
            <Guitar className="w-6 h-6" />
            <h1 className="font-bold text-lg tracking-tight">Practice Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-indigo-400 hidden sm:inline-block">{auth.currentUser?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => auth.signOut()}>
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline-block">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === "dashboard" && (
          <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
              <div className="flex flex-wrap gap-2 print:hidden">
                <Button onClick={() => handlePrint("all")} variant="outline" className="gap-2 border-indigo-700 text-indigo-100 hover:bg-indigo-800">
                  <Printer className="w-4 h-4" /> Print All
                </Button>
                <Button onClick={handleAnalyze} variant="outline" className="gap-2 bg-indigo-900/50 hover:bg-indigo-800 border-indigo-700 text-indigo-100">
                  <Sparkles className="w-4 h-4 text-amber-400" /> AI Coach
                </Button>
                <Button onClick={() => setView("manage-songs")} variant="outline" className="gap-2">
                  <Guitar className="w-4 h-4" /> Songs
                </Button>
                <Button onClick={() => setView("add-goal")} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" /> Goal
                </Button>
                <Button onClick={() => { resetPracticeForm(false); setView("add-practice"); }} className="gap-2">
                  <Plus className="w-4 h-4" /> Session
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:flex print:flex-col">
              {/* Main Content (Chart & Table) */}
              <div className="lg:col-span-2 space-y-8 print:w-full">
                {/* Global Practice Timer */}
                <Card className="print:hidden border-indigo-500/30 bg-indigo-900/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-900/50 flex items-center justify-center border border-indigo-700">
                        <Timer className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-indigo-100">Live Practice Timer</h3>
                        {timerRemainingSeconds === 0 ? (
                          <p className="text-sm font-medium text-emerald-400">*** Great work, time to take a break!!!</p>
                        ) : (
                          <p className="text-sm text-indigo-400">Track your session duration accurately</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 rounded-full text-indigo-400 hover:text-indigo-200 disabled:opacity-30"
                          onClick={() => handleAdjustTime(-1)}
                          disabled={isStopwatchRunning || timerRemainingSeconds !== timerInitialMinutes * 60}
                        >-</Button>
                        <div className="font-mono text-4xl tabular-nums text-indigo-50 tracking-wider w-[120px] text-center">
                          {formatStopwatch(timerRemainingSeconds)}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 rounded-full text-indigo-400 hover:text-indigo-200 disabled:opacity-30"
                          onClick={() => handleAdjustTime(1)}
                          disabled={isStopwatchRunning || timerRemainingSeconds !== timerInitialMinutes * 60}
                        >+</Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          type="button" 
                          size="icon" 
                          className={`w-12 h-12 rounded-full ${isStopwatchRunning ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                          onClick={handleStopwatchToggle}
                        >
                          {isStopwatchRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                        </Button>
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="ghost" 
                          className="w-10 h-10 rounded-full text-indigo-400 hover:text-indigo-200 bg-indigo-900/30"
                          onClick={handleStopwatchReset}
                          disabled={timerRemainingSeconds === timerInitialMinutes * 60 && !isStopwatchRunning}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Practice Time Chart */}
                <Card className={printMode && printMode !== "weekly" && printMode !== "all" ? "print:hidden" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Weekly Practice Time</CardTitle>
                    <Button variant="ghost" size="sm" className="print:hidden h-8" onClick={() => handlePrint("weekly")}>
                      <Printer className="w-4 h-4 text-indigo-400" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#3730a3" vertical={false} />
                          <XAxis dataKey="label" stroke="#818cf8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#818cf8" fontSize={12} tickLine={false} axisLine={false} unit="m" />
                          <Tooltip
                            cursor={{ fill: '#312e81' }}
                            contentStyle={{ backgroundColor: '#1e1b4b', borderRadius: '8px', border: '1px solid #3730a3', color: '#e0e7ff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                            itemStyle={{ color: '#e0e7ff' }}
                          />
                          <Bar dataKey="totalMinutes" name="Minutes" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Chart */}
                <Card className={printMode && printMode !== "historical" && printMode !== "all" ? "print:hidden" : ""}>
                  <CardHeader className="flex flex-col gap-3">
                    <div className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle>Historical Accuracy by Song</CardTitle>
                      <Button variant="ghost" size="sm" className="print:hidden h-8" onClick={() => handlePrint("historical")}>
                        <Printer className="w-4 h-4 text-indigo-400" />
                      </Button>
                    </div>
                    
                    <div className="hidden print:block text-sm text-indigo-300 italic mb-4">
                      {(chartFilterSongName || chartFilterSpeed || chartFilterLevel || chartFilterStartDate || chartFilterEndDate) ? 
                        `Active Filters: ${[chartFilterSongName, chartFilterSpeed ? "Speed " + chartFilterSpeed + "%" : "", chartFilterLevel ? "Level " + chartFilterLevel : "", chartFilterStartDate ? "From " + chartFilterStartDate : "", chartFilterEndDate ? "To " + chartFilterEndDate : ""].filter(Boolean).join(', ')}` 
                        : 'Active Filters: None'}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 print:hidden">
                      <Select value={chartFilterSongName} onChange={e => setChartFilterSongName(e.target.value)} className="h-8 text-xs py-1 w-36">
                        <option value="">All Songs</option>
                        {activeSongs.map((s) => (
                          <option key={s.id} value={s.title}>{s.title}</option>
                        ))}
                      </Select>
                      <Input type="number" placeholder="Speed" className="h-8 text-xs w-20" value={chartFilterSpeed} onChange={e => setChartFilterSpeed(e.target.value)} min={1} />
                      <Input type="number" placeholder="Level" className="h-8 text-xs w-20" value={chartFilterLevel} onChange={e => setChartFilterLevel(e.target.value)} min={1} />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-indigo-300">From</span>
                        <Input type="date" className="h-8 text-xs" value={chartFilterStartDate} onChange={e => setChartFilterStartDate(e.target.value)} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-indigo-300">To</span>
                        <Input type="date" className="h-8 text-xs" value={chartFilterEndDate} onChange={e => setChartFilterEndDate(e.target.value)} />
                      </div>
                      {(chartFilterStartDate || chartFilterEndDate || chartFilterSongName || chartFilterSpeed || chartFilterLevel) && (
                        <Button variant="ghost" size="sm" onClick={() => { setChartFilterStartDate(""); setChartFilterEndDate(""); setChartFilterSongName(""); setChartFilterSpeed(""); setChartFilterLevel(""); }} className="h-8 px-2 text-xs">
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {chartData.length > 0 ? (
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#3730a3" vertical={false} />
                            <XAxis dataKey="date" stroke="#818cf8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#818cf8" fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1e1b4b', borderRadius: '8px', border: '1px solid #3730a3', color: '#e0e7ff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                              itemStyle={{ color: '#e0e7ff' }}
                            />
                            {songKeys.map((key, idx) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                name={key}
                                stroke={COLORS[idx % COLORS.length]}
                                strokeWidth={3}
                                connectNulls={true}
                                dot={{ r: 4, fill: COLORS[idx % COLORS.length], strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                                label={{ position: 'top', fill: COLORS[idx % COLORS.length], fontSize: 11, fontWeight: 500, formatter: (val: any) => val ? `${val}%` : '' }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-72 flex items-center justify-center text-indigo-500 text-sm">
                        No practice data yet. Add a session to see your progress!
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Table */}
                <Card className={printMode && printMode !== "recent" && printMode !== "all" ? "print:hidden" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Recent Sessions</CardTitle>
                    <div className="flex gap-2 print:hidden">
                      <Button variant="ghost" size="sm" onClick={() => handlePrint("recent")}>
                        <Printer className="w-4 h-4 text-indigo-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { resetPracticeForm(false); setView("add-practice"); }}>
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    
                    <div className="hidden print:block text-sm text-indigo-300 italic mb-4">
                      {(sessionFilterName || sessionFilterDate || sessionFilterSpeed || sessionFilterLevel) ? 
                        `Active Filters: ${[sessionFilterName, sessionFilterDate ? "Date: " + sessionFilterDate : "", sessionFilterSpeed ? "Speed: " + sessionFilterSpeed + "%" : "", sessionFilterLevel ? "Level: " + sessionFilterLevel : ""].filter(Boolean).join(', ')}` 
                        : 'Active Filters: None'}
                    </div>
                    <div className="mb-4 flex flex-wrap gap-3 print:hidden">
                      <Select 
                        value={sessionFilterName} 
                        onChange={(e) => setSessionFilterName(e.target.value)}
                        className="w-48"
                      >
                        <option value="">All Songs</option>
                        {activeSongs.map((s) => (
                          <option key={s.id} value={s.title}>{s.title}</option>
                        ))}
                      </Select>
                      <Input 
                        type="number" 
                        placeholder="Speed"
                        value={sessionFilterSpeed} 
                        onChange={(e) => setSessionFilterSpeed(e.target.value)}
                        className="w-24"
                        min={1}
                      />
                      <Input 
                        type="number" 
                        placeholder="Level"
                        value={sessionFilterLevel} 
                        onChange={(e) => setSessionFilterLevel(e.target.value)}
                        className="w-24"
                        min={1}
                      />
                      <Input 
                        type="date" 
                        value={sessionFilterDate} 
                        onChange={(e) => setSessionFilterDate(e.target.value)}
                        className="w-40"
                      />
                      {(sessionFilterName || sessionFilterDate || sessionFilterSpeed || sessionFilterLevel) && (
                        <Button variant="ghost" onClick={() => { setSessionFilterName(''); setSessionFilterDate(''); setSessionFilterSpeed(''); setSessionFilterLevel(''); }}>
                          Clear
                        </Button>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-indigo-400 uppercase bg-indigo-900/40 border-b border-indigo-800">
                          <tr>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Song / Difficulty</th>
                            <th className="px-4 py-3 font-medium text-right">Notes (✓/Total)</th>
                            <th className="px-4 py-3 font-medium text-right">Accuracy</th>
                            <th className="px-4 py-3 font-medium text-right">Speed</th>
                            <th className="px-4 py-3 print:hidden"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPractices.map((p) => (
                            <tr key={p.id} className="border-b border-indigo-800 last:border-0 hover:bg-indigo-900/20 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-indigo-300">
                                {format(parseISO(p.date), "MMM d, yyyy")}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-indigo-50 flex items-center gap-2">
                                  {p.songTitle}
                                  {p.isPartial && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-indigo-900/60 text-indigo-300 border border-indigo-700">Partial</span>}
                                </div>
                                <div className="text-xs text-indigo-400">Level {p.difficulty}</div>
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-indigo-300">
                                <span className="font-medium text-indigo-50">{p.correctNotes}</span> / {p.totalNotes}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                  p.accuracy >= 90 ? "bg-emerald-900/40 text-emerald-300" : p.accuracy >= 70 ? "bg-amber-900/40 text-amber-300" : "bg-red-900/40 text-red-300"
                                )}>
                                  {p.accuracy}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-indigo-300">
                                {p.speed} <span className="text-xs">%</span>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap print:hidden">
                                <button onClick={() => handleEditPractice(p)} className="text-indigo-500 hover:text-indigo-400 transition-colors mr-3">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => deletePractice(p.id)} className="text-indigo-500 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {practices.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-indigo-500">
                                No sessions recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar (Goals) */}
              <div className={`space-y-8 ${printMode === "milestones" || printMode === "all" ? "" : "print:hidden"}`}>
                <Card className={`h-full border-indigo-800 bg-purple-900/20 ${printMode && printMode !== "milestones" && printMode !== "all" ? "print:hidden" : ""}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-purple-100">Milestones & Goals</CardTitle>
                    <Button variant="ghost" size="sm" className="print:hidden h-8 hover:bg-purple-800/50" onClick={() => handlePrint("milestones")}>
                      <Printer className="w-4 h-4 text-purple-300" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    
                    <div className="hidden print:block text-sm text-purple-300 italic mb-4">
                      {(milestoneFilterSong || milestoneFilterStartDate || milestoneFilterEndDate) ? 
                        `Active Filters: ${[milestoneFilterSong, milestoneFilterStartDate ? "From " + milestoneFilterStartDate : "", milestoneFilterEndDate ? "To " + milestoneFilterEndDate : ""].filter(Boolean).join(', ')}` 
                        : 'Active Filters: None'}
                    </div>
                    <div className="mb-6 flex flex-col gap-3 bg-indigo-950/40 p-3 rounded-md border border-indigo-900/50 print:hidden">
                      <Select 
                        value={milestoneFilterSong} 
                        onChange={(e) => setMilestoneFilterSong(e.target.value)}
                      >
                        <option value="">All Songs</option>
                        {activeSongs.map((s) => (
                          <option key={s.id} value={s.title}>{s.title}</option>
                        ))}
                      </Select>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-300 pl-1">From</span>
                          <Input 
                            type="date" 
                            className="h-9 text-xs w-full"
                            value={milestoneFilterStartDate} 
                            onChange={(e) => setMilestoneFilterStartDate(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-300 pl-1">To</span>
                          <Input 
                            type="date" 
                            className="h-9 text-xs w-full"
                            value={milestoneFilterEndDate} 
                            onChange={(e) => setMilestoneFilterEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                      {(milestoneFilterSong || milestoneFilterStartDate || milestoneFilterEndDate) && (
                        <Button variant="secondary" size="sm" onClick={() => { setMilestoneFilterSong(''); setMilestoneFilterStartDate(''); setMilestoneFilterEndDate(''); }} className="h-8 text-xs w-full mt-1 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-200">
                          Clear Filters
                        </Button>
                      )}
                    </div>
                    <div className="space-y-6">
                      {Object.entries(
                        filteredGoals.reduce((acc, g) => {
                          const key = g.songTitle || 'General Milestones';
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(g);
                          return acc;
                        }, {} as Record<string, Goal[]>)
                      ).map(([groupName, groupGoals]) => (
                        <div key={groupName} className="space-y-3">
                          <h4 className="text-sm font-semibold text-purple-200 border-b border-indigo-800/50 pb-1">
                            {groupName}
                          </h4>
                          <div className="space-y-3">
                            {(groupGoals as Goal[]).map((g) => (
                              <div key={g.id} className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                                g.achieved ? "bg-indigo-900/40 border-indigo-800 opacity-60" : "bg-indigo-950/60 backdrop-blur-md border-indigo-800 shadow-sm"
                              )}>
                                <button onClick={() => toggleGoal(g)} className="mt-0.5 shrink-0 transition-colors">
                                  {g.achieved ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-indigo-600 hover:text-indigo-400" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-sm font-medium break-words", g.achieved ? "line-through text-indigo-400" : "text-indigo-50")}>
                                    {g.title}
                                  </p>
                                  <p className="text-xs text-indigo-400 mt-1">
                                    Target: {format(parseISO(g.targetDate), "MMM d, yyyy")}
                                  </p>
                                </div>
                                <button onClick={() => deleteGoal(g.id)} className="shrink-0 text-indigo-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {filteredGoals.length === 0 && (
                        <div className="text-center text-sm text-indigo-400 py-6">
                          {goals.length === 0 ? "No active goals. Set a milestone to keep yourself motivated!" : "No goals match your filters."}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {view === "add-practice" && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>{editingPracticeId ? "Edit Practice Session" : "Log Practice Session"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPractice} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-indigo-200">Song / Exercise Title</label>
                      {activeSongs.length > 0 ? (
                        <Select required value={songTitle} onChange={e => handleSongTitleChange(e.target.value)}>
                          <option value="" disabled>Select a song...</option>
                          {activeSongs.map(s => (
                            <option key={s.id} value={s.title}>{s.title}</option>
                          ))}
                        </Select>
                      ) : (
                        <div className="text-sm text-amber-300 bg-amber-900/20 p-3 rounded border border-amber-800">
                          Please add some songs to your library first using the "Songs" button on the dashboard.
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-indigo-200">Difficulty (1-12)</label>
                      <Input type="number" min="1" max="12" required value={difficulty} onChange={e => setDifficulty(parseInt(e.target.value) || 1)} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-indigo-200">Date</label>
                      <Input type="date" required value={practiceDate} onChange={e => setPracticeDate(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-indigo-200">Correct Notes</label>
                      <Input type="number" min="0" required value={correctNotes} onChange={e => setCorrectNotes(e.target.value)} placeholder="e.g. 142" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-indigo-200">Total Notes to Play</label>
                      <Input type="number" min="1" required value={totalNotes} onChange={e => setTotalNotes(e.target.value)} placeholder="e.g. 150" />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-indigo-200">Practice Duration (Minutes)</label>
                      <Input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 15" />
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center gap-2 mb-4">
                        <input 
                          type="checkbox" 
                          id="isPartial"
                          className="rounded border-indigo-700 bg-indigo-900/50 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
                          checked={isPartial}
                          onChange={(e) => setIsPartial(e.target.checked)}
                        />
                        <label htmlFor="isPartial" className="text-sm font-medium text-indigo-200 cursor-pointer">
                          Partial Song Practice
                        </label>
                      </div>
                      <label className="text-sm font-medium text-indigo-200">Speed (%)</label>
                      <Input type="number" min="0" max="100" required value={speed} onChange={e => setSpeed(e.target.value)} placeholder="e.g. 100" />
                    </div>
                  </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-indigo-800">
                      <Button type="button" variant="ghost" onClick={() => { setView("dashboard"); resetPracticeForm(false); }}>Cancel</Button>
                      <Button type="submit" disabled={activeSongs.length === 0}>{editingPracticeId ? "Update Session" : "Save Session"}</Button>
                    </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {view === "add-goal" && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Set New Milestone</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddGoal} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-indigo-200">Target Song (Optional)</label>
                    <Select value={goalSongTitle} onChange={e => setGoalSongTitle(e.target.value)}>
                      <option value="">No specific song</option>
                      {activeSongs.map(s => (
                        <option key={s.id} value={s.title}>{s.title}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-indigo-200">Goal Description</label>
                    <Input required value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="e.g. Master the solo" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-indigo-200">Target Date</label>
                    <Input type="date" required value={goalDate} onChange={e => setGoalDate(e.target.value)} />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-indigo-800">
                    <Button type="button" variant="ghost" onClick={() => setView("dashboard")}>Cancel</Button>
                    <Button type="submit">Add Goal</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
        {view === "ai-analysis" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="border-indigo-800 bg-indigo-950/40 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-indigo-100">
                  <Sparkles className="w-6 h-6 text-amber-400" /> AI Practice Analysis
                </CardTitle>
                <Button variant="ghost" onClick={() => setView("dashboard")}>Back to Dashboard</Button>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-12 text-indigo-300">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                    <p>Analyzing your performance...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-indigo max-w-none">
                    {aiAnalysis ? (
                      <div className="space-y-4 whitespace-pre-wrap text-indigo-200">
                        {aiAnalysis}
                      </div>
                    ) : (
                      <p className="text-indigo-400 text-center py-8">No analysis available.</p>
                    )}
                  </div>
                )}
                {!isAnalyzing && (
                  <div className="flex justify-center mt-8">
                     <Button variant="outline" onClick={() => { handleAnalyze(true); }} className="gap-2">
                       <Sparkles className="w-4 h-4" /> Re-analyze Performance
                     </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {view === "manage-songs" && (
          <div className="max-w-md mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Song Library</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSong} className="flex gap-2 mb-6">
                  <Input 
                    placeholder="New song title..." 
                    value={newSongInput} 
                    onChange={e => setNewSongInput(e.target.value)} 
                    required 
                  />
                  <Button type="submit">Add</Button>
                </form>

                <div className="space-y-2">
                  {songs.map(song => (
                    <div key={song.id} className="flex items-center justify-between p-3 bg-indigo-900/40 rounded-lg border border-indigo-800">
                      <span className={`font-medium text-sm ${song.retired ? 'text-indigo-400 line-through' : 'text-indigo-200'}`}>{song.title}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="checkbox" 
                            id={`retired-${song.id}`}
                            className="rounded border-indigo-700 bg-indigo-900/50 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5"
                            checked={song.retired || false}
                            onChange={() => toggleSongRetired(song)}
                          />
                          <label htmlFor={`retired-${song.id}`} className="text-xs font-medium text-indigo-300 cursor-pointer">
                            Retired
                          </label>
                        </div>
                        <button onClick={() => deleteSong(song.id)} className="text-indigo-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {songs.length === 0 && (
                    <div className="text-center text-sm text-indigo-400 py-4">
                      No songs in your library. Add one above!
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t border-indigo-800">
                  <Button type="button" variant="ghost" onClick={() => setView("dashboard")}>Done</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      
      {printError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden p-4">
          <div className="bg-slate-900 border border-indigo-700 shadow-2xl rounded-xl p-8 max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-amber-900/30 p-3 rounded-full shrink-0">
                <Printer className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">Preview Printing Blocked</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  Your browser's security settings prevent printing directly from inside an embedded preview window.
                </p>
                <div className="bg-slate-800 rounded p-4 border border-slate-700 mb-2">
                  <p className="text-sm font-medium text-slate-200 mb-2">To print this page:</p>
                  <ol className="list-decimal pl-5 text-sm text-slate-400 space-y-1">
                    <li>Look at the top right of this preview panel</li>
                    <li>Click the <strong>"Open in new tab"</strong> icon</li>
                    <li>Try printing again from the new tab</li>
                  </ol>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setPrintError(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white w-full">
                Got it, thanks
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {printMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center print:hidden">
           <div className="bg-indigo-900 shadow-2xl rounded-full p-2 pr-6 border border-indigo-500 flex items-center gap-4">
              <div className="bg-indigo-800 p-2 rounded-full animate-pulse">
                <Printer className="w-5 h-5 text-indigo-300" />
              </div>
              <p className="text-sm font-medium text-indigo-100">Preparing print layout...</p>
              <Button size="sm" variant="ghost" onClick={() => setPrintMode(null)} className="ml-4 hover:bg-indigo-800 text-indigo-300">
                Cancel
              </Button>
           </div>
        </div>
      )}
      </main>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full shadow-lg">
            <CardHeader>
              <CardTitle>Confirm Delete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-indigo-300 mb-6">{deleteConfirm.message}</p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={executeDelete}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
