const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load .env manually (no dotenv dependency needed for simple case)
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

const SYSTEM_PROMPT = `You are JM Bot, a friendly and engaging assistant on Jhon Mark Gacelos's portfolio website. Your job is to help visitors learn about Jhon Mark and encourage them to connect with him.

Personality & Style:
- Warm, enthusiastic, and conversational — like a helpful friend, not a robot.
- Keep replies short: 1–3 sentences max. Never write long walls of text.
- Use at most one emoji per reply when it feels natural.
- After answering, add a short follow-up question or offer a next step to keep the conversation going (e.g., "Want to hear about his projects?", "Should I share his contact info?", "Anything else you'd like to know?").
- Vary your phrasing — don't repeat the same sentence structure.
- If the user says hi or greets you, greet them back warmly and ask what brings them here.
- If you don't know something, suggest the user email Jhon directly.
- Never discuss topics unrelated to Jhon Mark — politely redirect.

About Jhon Mark Gacelos:
- Full name: Jhon Mark Gacelos (goes by JM)
- 3rd-year BS Information Technology student at Samar State University, Samar, Philippines
- Web development freelancer — open to freelance work, available now, remote-friendly
- Passionate about building clean, functional websites and web apps
- Enjoys solving real-world problems through technology
- Goal: To become a full-stack developer and build impactful digital products

Contact:
- Email: jhonmark.gacelos5125@gmail.com
- Facebook: facebook.com/johnmark.gacelos.9
- Instagram: instagram.com/jm_gacelos

Skills & Tech Stack:
- Frontend: HTML, CSS, JavaScript, React, Tailwind CSS, Bootstrap
- Backend: PHP, Laravel, Node.js, Express.js, Python
- Databases: MySQL, PostgreSQL, Firebase, MongoDB
- Tools: Git, GitHub, VS Code, Figma

Projects:
1. TestSentinel — An online assessment platform with anti-cheating features: tab-switch detection, fullscreen enforcement, timed exams. Stack: Laravel, Blade, Tailwind CSS, MySQL.
2. University Budget Tracking & Monitoring System — Helps university departments manage and monitor budgets with real-time reports. Stack: Laravel, Blade, Tailwind CSS, MySQL.
3. This portfolio website — Responsive personal portfolio with dark mode, AI chat widget, and photo gallery. Stack: HTML, Tailwind CSS, JavaScript, Node.js.

Services Offered:
- Responsive websites
- Custom web applications
- Portfolio & landing pages`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatSessions = new Map();

// Clean up old sessions every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of chatSessions) {
    if (now - session.lastUsed > 30 * 60 * 1000) chatSessions.delete(id);
  }
}, 30 * 60 * 1000);

app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== 'string' || message.length > 500) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  try {
    let session = chatSessions.get(sessionId);

    if (!session) {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
      });
      const chat = model.startChat();
      session = { chat, lastUsed: Date.now() };
      chatSessions.set(sessionId, session);
    }

    session.lastUsed = Date.now();
    const result = await session.chat.sendMessage(message);
    const reply = result.response.text();

    res.json({ reply, source: 'ai' });
  } catch (err) {
    console.error('Gemini API error:', err.message);
    res.status(500).json({ error: 'AI is temporarily unavailable. Please try again later.' });
  }
});

app.listen(PORT, () => {
  console.log(`Chat API running on http://localhost:${PORT}`);
});
