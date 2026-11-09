// ── Skeleton Loading ──────────────────────────────────────────────────────
const skeleton = document.getElementById('skeleton');
window.addEventListener('load', () => {
  setTimeout(() => {
    skeleton.classList.add('skeleton-hidden');
    setTimeout(() => skeleton.remove(), 500);
  }, 800);
});

// ── Footer year ───────────────────────────────────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();

// ── Photo Lightbox ────────────────────────────────────────────────────────
const profileImg = document.getElementById('profileImg');
const lightbox = document.getElementById('lightbox');

profileImg.addEventListener('click', () => {
  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
});

lightbox.addEventListener('click', () => {
  lightbox.classList.add('hidden');
  document.body.style.overflow = '';
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
  }
});

// ── Counter animation ─────────────────────────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1200;
  const step = target / (duration / 16);
  let current = 0;
  const tick = () => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current) + '+';
    if (current < target) requestAnimationFrame(tick);
  };
  tick();
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// ── Dark Mode (Sun/Moon Toggle) ───────────────────────────────────────────
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');

function applyTheme(dark) {
  if (dark) {
    html.classList.add('dark');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    html.classList.remove('dark');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
}

// Load saved preference or system preference
const saved = localStorage.getItem('theme');
if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  applyTheme(true);
} else {
  applyTheme(false);
}

themeToggle.addEventListener('click', () => {
  const isDark = html.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  applyTheme(!isDark);
});

// ── Chat Widget ────────────────────────────────────────────────────────────
const chatToggle = document.getElementById('chatToggle');
const chatBox = document.getElementById('chatBox');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatMessages = document.getElementById('chatMessages');

// Auto-collapse chat button to icon-only on mobile after 3s
const chatToggleLabel = document.getElementById('chatToggleLabel');
function collapseChatButton() {
  if (window.innerWidth < 640) {
    chatToggleLabel.style.maxWidth = '0';
    chatToggleLabel.style.opacity = '0';
    chatToggle.style.padding = '0.625rem';
  }
}
function expandChatButton() {
  chatToggleLabel.style.maxWidth = '10rem';
  chatToggleLabel.style.opacity = '1';
  chatToggle.style.padding = '';
}
let collapseTimer = setTimeout(collapseChatButton, 3000);

let chatAutoOpened = false;

chatToggle.addEventListener('click', () => {
  chatBox.classList.toggle('hidden');
  if (!chatBox.classList.contains('hidden')) {
    chatInput.focus();
    collapseChatButton();
    clearTimeout(collapseTimer);
    chatAutoOpened = true;
  } else {
    expandChatButton();
    collapseTimer = setTimeout(collapseChatButton, 3000);
  }
});

closeChatBtn.addEventListener('click', () => {
  chatBox.classList.add('hidden');
  expandChatButton();
  collapseTimer = setTimeout(collapseChatButton, 3000);
});

// Auto-open chat after 10s if user hasn't opened it
setTimeout(() => {
  if (!chatAutoOpened) {
    chatBox.classList.remove('hidden');
    chatAutoOpened = true;
    collapseChatButton();
    clearTimeout(collapseTimer);
  }
}, 10000);

function appendMessage(text, type, source) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${type}`;
  div.textContent = text;
  if (type === 'bot' && source) {
    const badge = document.createElement('span');
    badge.textContent = source === 'ai' ? '✦ AI' : '⚡ Auto';
    badge.style.cssText = 'display:block;font-size:0.62rem;opacity:0.5;margin-top:3px;';
    div.appendChild(badge);
  }
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function appendTypingDots() {
  const div = document.createElement('div');
  div.className = 'chat-bubble bot';
  div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

const QUICK_CHIPS = [
  { label: '🚀 Projects', message: 'Tell me about your projects' },
  { label: '🛠️ Skills', message: 'What are your skills?' },
  { label: '🎓 OJT', message: 'Are you looking for an OJT?' },
  { label: '📬 Contact', message: 'How do I contact you?' },
];

function appendChips() {
  const existing = chatMessages.querySelector('.chat-chips');
  if (existing) existing.remove();

  const row = document.createElement('div');
  row.className = 'chat-chips';

  QUICK_CHIPS.forEach(({ label, message }) => {
    const btn = document.createElement('button');
    btn.className = 'chat-chip';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      row.remove();
      chatInput.value = message;
      sendMessage();
    });
    row.appendChild(btn);
  });

  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show chips after the initial greeting
appendChips();

// ── AI Chat via Backend (with keyword fallback) ───────────────────────────
const CHAT_API = '/api/chat';
const chatSessionId = crypto.randomUUID();

const faqs = [
  { keys: ['name', 'who'], answer: "I'm Jhon Mark Gacelos, a 4th-year BSIT student from Samar, Philippines, currently looking for an OJT / internship in web development." },
  { keys: ['ojt', 'intern', 'practicum', 'trainee', 'hire', 'available'], answer: "Yes! I'm a 4th-year BSIT student looking for an OJT / internship in web development. Email me at jhonmark.gacelos5125@gmail.com or check my resume at the top of the page." },
  { keys: ['email', 'contact', 'reach'], answer: "You can reach me at jhonmark.gacelos5125@gmail.com or click the Send Email button above." },
  { keys: ['resume', 'cv'], answer: "You can view or download my resume with the View Resume button at the top of the page." },
  { keys: ['skill', 'tech', 'stack', 'language'], answer: "I have basic knowledge of Laravel, PHP, MySQL, Tailwind CSS, JavaScript, React, and Node.js from my projects, plus AI tools like ChatGPT, Claude Code, the Gemini API, and Cerebras AI. I'm still learning! Check the Tech Stack section." },
  { keys: ['project', 'work', 'portfolio'], answer: "I've built two capstone projects, TestSentinel (an online assessment platform) and an Integrated Barangay Management System, plus this portfolio. See the Featured Projects section!" },
  { keys: ['location', 'where', 'from'], answer: "I'm based in Samar, Philippines." },
  { keys: ['university', 'school', 'college', 'samar'], answer: "I study at Samar State University, taking up BS Information Technology (4th year)." },
  { keys: ['offer', 'do', 'build', 'create'], answer: "I've built responsive websites and school web apps with Laravel, Tailwind CSS, and JavaScript. Check the Featured Projects section!" },
  { keys: ['hello', 'hi', 'hey', 'sup'], answer: "Hey there! 👋 How can I help you? Ask me about Jhon's skills, projects, or how to get in touch." },
  { keys: ['test', 'sentinel', 'assessment', 'cheat'], answer: "TestSentinel is one of my capstone projects, an online assessment platform with anti-cheating features like tab-switch detection, fullscreen enforcement, and face detection. Built with Laravel, Tailwind CSS, and MySQL. Try it at testsentinel.online." },
  { keys: ['barangay', 'brgy', 'capstone', 'resident', 'blotter'], answer: "One of my capstone projects is an Integrated Barangay Management System: a centralized platform for managing resident records, complaint cases, document issuance, and community announcements. Built with Laravel, Blade, Tailwind CSS, Alpine.js, and PostgreSQL. It's live at brgycaranas.laravel.cloud." },
];

function getKeywordReply(input) {
  const lower = input.toLowerCase();
  for (const faq of faqs) {
    if (faq.keys.some(k => lower.includes(k))) return faq.answer;
  }
  return "I'm not sure about that. Try asking about my skills, projects, or how to contact me!";
}

async function getBotReply(input) {
  try {
    const res = await fetch(CHAT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, sessionId: chatSessionId }),
    });
    const data = await res.json();
    if (data.error) return { text: getKeywordReply(input), source: 'auto' };
    return { text: data.reply, source: data.source || 'ai' };
  } catch {
    return { text: getKeywordReply(input), source: 'auto' };
  }
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  appendMessage(text, 'user');
  chatInput.value = '';
  chatInput.disabled = true;
  chatSend.disabled = true;

  const typingEl = appendTypingDots();

  try {
    const { text: reply, source } = await getBotReply(text);
    typingEl.innerHTML = '';
    typingEl.textContent = reply;
    const badge = document.createElement('span');
    badge.textContent = source === 'ai' ? '✦ AI' : '⚡ Auto';
    badge.style.cssText = 'display:block;font-size:0.62rem;opacity:0.5;margin-top:3px;';
    typingEl.appendChild(badge);
  } catch {
    typingEl.innerHTML = '';
    typingEl.textContent = getKeywordReply(text);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatInput.disabled = false;
  chatSend.disabled = false;
  chatInput.focus();
  appendChips();
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// ── Gallery Lightbox ──────────────────────────────────────────────────────
const galleryThumbs = document.querySelectorAll('.gallery-thumb');
const galleryLightbox = document.getElementById('galleryLightbox');
const galleryLightboxImg = document.getElementById('galleryLightboxImg');
const galleryCounter = document.getElementById('galleryCounter');
const galleryClose = document.getElementById('galleryClose');
const galleryPrev = document.getElementById('galleryPrev');
const galleryNext = document.getElementById('galleryNext');

let galleryIndex = 0;
const gallerySrcs = Array.from(galleryThumbs).map(img => img.src);

function openGallery(index) {
  galleryIndex = index;
  galleryLightboxImg.src = gallerySrcs[galleryIndex];
  galleryCounter.textContent = `${galleryIndex + 1} / ${gallerySrcs.length}`;
  galleryLightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeGallery() {
  galleryLightbox.classList.add('hidden');
  document.body.style.overflow = '';
}

function navigateGallery(direction) {
  galleryIndex = (galleryIndex + direction + gallerySrcs.length) % gallerySrcs.length;
  galleryLightboxImg.src = gallerySrcs[galleryIndex];
  galleryCounter.textContent = `${galleryIndex + 1} / ${gallerySrcs.length}`;
}

galleryThumbs.forEach((thumb, i) => {
  thumb.addEventListener('click', () => openGallery(i));
});

galleryClose.addEventListener('click', closeGallery);
galleryPrev.addEventListener('click', (e) => { e.stopPropagation(); navigateGallery(-1); });
galleryNext.addEventListener('click', (e) => { e.stopPropagation(); navigateGallery(1); });

galleryLightbox.addEventListener('click', (e) => {
  if (e.target === galleryLightbox) closeGallery();
});

document.addEventListener('keydown', (e) => {
  if (galleryLightbox.classList.contains('hidden')) return;
  if (e.key === 'Escape') closeGallery();
  if (e.key === 'ArrowLeft') navigateGallery(-1);
  if (e.key === 'ArrowRight') navigateGallery(1);
});
