const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add states
const stateStr = `const [sessionFilterDate, setSessionFilterDate] = useState("");`;
const newStateStr = `const [sessionFilterDate, setSessionFilterDate] = useState("");
  const [sessionFilterSpeed, setSessionFilterSpeed] = useState("");
  const [sessionFilterLevel, setSessionFilterLevel] = useState("");`;
content = content.replace(stateStr, newStateStr);

const chartStateStr = `const [chartFilterSongName, setChartFilterSongName] = useState("");`;
const newChartStateStr = `const [chartFilterSongName, setChartFilterSongName] = useState("");
  const [chartFilterSpeed, setChartFilterSpeed] = useState("");
  const [chartFilterLevel, setChartFilterLevel] = useState("");`;
content = content.replace(chartStateStr, newChartStateStr);

// 1. Chart filter logic
const chartFilterLogic = `    const filtered = practices.filter(p => {
      const matchStart = chartFilterStartDate ? p.date >= chartFilterStartDate : true;
      const matchEnd = chartFilterEndDate ? p.date <= chartFilterEndDate : true;
      const matchSong = chartFilterSongName ? p.songTitle === chartFilterSongName : true;
      return matchStart && matchEnd && matchSong;
    });`;
const newChartFilterLogic = `    const filtered = practices.filter(p => {
      const matchStart = chartFilterStartDate ? p.date >= chartFilterStartDate : true;
      const matchEnd = chartFilterEndDate ? p.date <= chartFilterEndDate : true;
      const matchSong = chartFilterSongName ? p.songTitle === chartFilterSongName : true;
      const matchSpeed = chartFilterSpeed ? p.speed.toString() === chartFilterSpeed : true;
      const matchLevel = chartFilterLevel ? p.difficulty.toString() === chartFilterLevel : true;
      return matchStart && matchEnd && matchSong && matchSpeed && matchLevel;
    });`;
content = content.replace(chartFilterLogic, newChartFilterLogic);

const chartDeps = `}, [practices, chartFilterStartDate, chartFilterEndDate, chartFilterSongName]);`;
const newChartDeps = `}, [practices, chartFilterStartDate, chartFilterEndDate, chartFilterSongName, chartFilterSpeed, chartFilterLevel]);`;
content = content.replace(chartDeps, newChartDeps);

// 2. Session filter logic
const sessionFilterLogic = `const filteredPractices = practices.filter(p => {
    const matchName = sessionFilterName ? p.songTitle === sessionFilterName : true;
    const matchDate = sessionFilterDate ? p.date === sessionFilterDate : true;
    return matchName && matchDate;
  });`;
const newSessionFilterLogic = `const filteredPractices = practices.filter(p => {
    const matchName = sessionFilterName ? p.songTitle === sessionFilterName : true;
    const matchDate = sessionFilterDate ? p.date === sessionFilterDate : true;
    const matchSpeed = sessionFilterSpeed ? p.speed.toString() === sessionFilterSpeed : true;
    const matchLevel = sessionFilterLevel ? p.difficulty.toString() === sessionFilterLevel : true;
    return matchName && matchDate && matchSpeed && matchLevel;
  });`;
content = content.replace(sessionFilterLogic, newSessionFilterLogic);

fs.writeFileSync(file, content);
console.log("Updated filter logic");
