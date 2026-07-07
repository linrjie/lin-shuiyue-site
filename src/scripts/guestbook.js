const guestbookForm = document.getElementById('guestbook-form');
const guestbookList = document.getElementById('guestbook-list');
const guestbookStatus = document.getElementById('guestbook-status');
const storageKey = 'lin-shuiyue-guestbook';

function readMessages() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || []; } catch { return []; }
}

function renderMessages() {
  if (!guestbookList) return;
  guestbookList.replaceChildren();
  readMessages().forEach(({ name, message, date }) => {
    const card = document.createElement('article');
    const author = document.createElement('strong');
    const content = document.createElement('p');
    const time = document.createElement('small');
    card.className = 'guest-message';
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
  try {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(0, 12)));
  } catch {
    if (guestbookStatus) guestbookStatus.textContent = '留言没有保存：浏览器拒绝了本地存储。';
    return;
  }
  guestbookForm.reset();
  renderMessages();
  if (guestbookStatus) guestbookStatus.textContent = '留言已贴到留言板。';
});

renderMessages();
