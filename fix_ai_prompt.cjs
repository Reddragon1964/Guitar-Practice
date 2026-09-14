const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldPrompt = `      const prompt = \`You are an expert guitar coach and data analyst.
Analyze the user's practice data and provide a concise, encouraging, and actionable assessment.
Here is the user's data:
Songs: \${JSON.stringify(songs.map((s: any) => s.title))}
Goals/Milestones: \${JSON.stringify(goals)}
Practice Sessions: \${JSON.stringify(practices)}

Provide:
1. A brief overview of their recent progress (accuracy, speed).
2. Which songs they are doing well on, and which need more work.
3. Are they on track to hit their goals?
4. A specific recommendation for their next practice session.
Keep it structured with bullet points. Don't be too verbose. Limit to about 200-300 words.\`;`;

const newPrompt = `      const prompt = \`You are an expert guitar coach and data analyst.
Analyze the user's practice data and provide a concise, encouraging, and actionable assessment.

IMPORTANT: You must deeply analyze the progression over time for each song. Specifically, you need to calculate and describe the INCREASE or DECREASE in:
- Accuracy (%) between sessions
- Speed (%) between sessions
- Difficulty level between sessions

Look at how they progressed from their first recorded session of a song to their most recent.

Here is the user's data:
Songs: \${JSON.stringify(songs.map((s: any) => s.title))}
Goals/Milestones: \${JSON.stringify(goals)}
Practice Sessions: \${JSON.stringify(practices)}

Provide:
1. **Trend Analysis**: Explicitly detail the increases or decreases in accuracy, speed, and difficulty level across consecutive sessions for their practiced songs.
2. **Goal Trajectory**: Are they on track to hit their goals based on these specific trajectory metrics?
3. **Actionable Recommendation**: Based on the trends (e.g. if speed increased but accuracy decreased), give a specific recommendation for their next practice session.

Keep it structured with bullet points. Be analytical but encouraging. Limit to about 200-300 words.\`;`;

content = content.replace(oldPrompt, newPrompt);
fs.writeFileSync('server.ts', content);
console.log('AI Prompt updated');
