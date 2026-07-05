const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const themeToggle = document.getElementById('theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeKey = 'lin-shuiyue-theme';

function applyTheme(theme) {
  const isNight = theme === 'night';
  document.documentElement.dataset.theme = isNight ? 'night' : 'day';
  themeToggle?.setAttribute('aria-pressed', String(isNight));
  if (themeToggle) themeToggle.textContent = isNight ? '昼' : '夜';
  themeMeta?.setAttribute('content', isNight ? '#171923' : '#f5f0e8');
}

let savedTheme = null;
try {
  savedTheme = localStorage.getItem(themeKey);
} catch {
  savedTheme = null;
}
applyTheme(savedTheme === 'night' ? 'night' : 'day');

themeToggle?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'night' ? 'day' : 'night';
  applyTheme(nextTheme);
  try {
    localStorage.setItem(themeKey, nextTheme);
  } catch {
    // 隐私模式禁止本地存储时，主题仍可在当前页面生效。
  }
});

const animatedElements = document.querySelectorAll('.project-card, .about-copy');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  animatedElements.forEach((element) => {
    element.classList.add('will-animate');
    observer.observe(element);
  });
}

const style = document.createElement('style');
style.textContent = '.will-animate{opacity:0;transform:translateY(28px);transition:opacity .6s ease,transform .6s ease}.visible{opacity:1;transform:translateY(0)}';
document.head.appendChild(style);

const guestbookForm = document.getElementById('guestbook-form');
const guestbookList = document.getElementById('guestbook-list');
const storageKey = 'lin-shuiyue-guestbook';

function readMessages() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function renderMessages() {
  if (!guestbookList) return;
  const messages = readMessages();
  guestbookList.replaceChildren();

  messages.forEach(({ name, message, date }) => {
    const card = document.createElement('article');
    card.className = 'guest-message';
    const author = document.createElement('strong');
    const content = document.createElement('p');
    const time = document.createElement('small');
    author.textContent = name;
    content.textContent = message;
    time.textContent = date;
    card.append(author, content, time);
    guestbookList.append(card);
  });
}

guestbookForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(guestbookForm);
  const message = String(data.get('message') || '').trim();
  if (!message) return;

  const messages = readMessages();
  messages.unshift({
    name: String(data.get('name') || '').trim() || '一位神秘朋友',
    message,
    date: new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date())
  });
  localStorage.setItem(storageKey, JSON.stringify(messages.slice(0, 12)));
  guestbookForm.reset();
  renderMessages();
});

renderMessages();
