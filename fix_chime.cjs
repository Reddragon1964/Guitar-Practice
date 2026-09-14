const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Add useRef to imports
content = content.replace(
  /import React, \{ useState, useEffect, useMemo \} from "react";/,
  'import React, { useState, useEffect, useMemo, useRef } from "react";'
);

// 2. Add playChime function outside the component
const playChimeFunc = `
const playChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playTone = (freq: number, startTime: number, duration: number) => {
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

export default function Dashboard() {
`;
content = content.replace(/export default function Dashboard\(\) \{/, playChimeFunc);

// 3. Add hasChimed ref and useEffect
const refAnchor = `const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);`;
const refInjection = `const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const hasChimed = useRef(false);

  useEffect(() => {
    if (timerRemainingSeconds === 0 && !hasChimed.current) {
      playChime();
      hasChimed.current = true;
    } else if (timerRemainingSeconds > 0) {
      hasChimed.current = false;
    }
  }, [timerRemainingSeconds]);`;
content = content.replace(refAnchor, refInjection);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('Chime added');
