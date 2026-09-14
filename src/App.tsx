/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, loginWithGoogle } from "./lib/firebase";
import { Dashboard } from "./components/Dashboard";
import { Button } from "./components/ui/button";
import { Guitar } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
        <div className="animate-pulse flex flex-col items-center gap-4 text-indigo-500">
          <Guitar className="w-12 h-12" />
          <p className="text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-4">
        <div className="max-w-md w-full bg-indigo-950/60 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center border border-indigo-800">
          <div className="w-16 h-16 bg-indigo-900/50 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-12">
            <Guitar className="w-8 h-8 -rotate-12" />
          </div>
          <h1 className="text-3xl font-bold text-indigo-50 mb-3 tracking-tight">Practice Tracker</h1>
          <p className="text-indigo-400 mb-8 leading-relaxed">
            Track your guitar progress, measure accuracy, and achieve your musical milestones.
          </p>
          <Button size="lg" className="w-full text-base font-semibold" onClick={loginWithGoogle}>
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

