const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are Jhon Mark Gacelos's portfolio assistant. Answer concisely (1-2 sentences). Only discuss Jhon Mark's info below. Redirect unrelated questions politely.

Bio: 3rd-year BSIT student at Samar State University, Samar, Philippines. Web dev freelancer. Open to freelance, available now, remote friendly.
Email: jhonmark.gacelos5125@gmail.com | Facebook: facebook.com/johnmark.gacelos.9 | Instagram: instagram.com/jm_gacelos
Skills: HTML, CSS, JS, React, Tailwind, Bootstrap, PHP, Laravel, Node.js, Express, Python, MySQL, PostgreSQL, Firebase, MongoDB, Git, GitHub, VS Code, Figma.
Projects: 1) TestSentinel - online assessment with anti-cheating (Laravel, MySQL, Tailwind). 2) University Budget Tracking (Laravel, MySQL, Tailwind). 3) This portfolio (HTML, Tailwind, JS).
Services: Responsive websites, custom web apps, portfolios & landing pages.`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.length > 500) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });
    const result = await model.generateContent(message);
    const reply = result.response.text();
    res.json({ reply, source: 'ai' });
  } catch (err) {
    console.error('Gemini API error:', err.message);
    res.status(500).json({ error: 'AI is temporarily unavailable. Please try again later.' });
  }
};
