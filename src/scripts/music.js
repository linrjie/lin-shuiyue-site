import moonwalk from '../assets/music/moonwalk.wav';
import aquaTheatre from '../assets/music/aqua-theatre.wav';
import starlightGoodnight from '../assets/music/starlight-goodnight.wav';

const audio = document.getElementById('pet-audio');
const musicConsole = document.querySelector('.music-console');
const musicTitle = document.getElementById('music-title');
const musicPlay = document.getElementById('music-play');
const musicPrev = document.getElementById('music-prev');
const musicNext = document.getElementById('music-next');
const musicProgress = document.getElementById('music-progress');
const musicCurrent = document.getElementById('music-current');
const musicDuration = document.getElementById('music-duration');
const musicVolume = document.getElementById('music-volume');
const musicStateKey = 'lin-shuiyue-music';
const musicTracks = [
  { title: '月下漫游', src: moonwalk },
  { title: '水色剧场', src: aquaTheatre },
  { title: '星海晚安', src: starlightGoodnight }
];
let musicIndex = 0;

function formatAudioTime(value) {
  if (!Number.isFinite(value)) return '0:00';
  return `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
}
function saveMusicState() {
  if (!audio) return;
  try { localStorage.setItem(musicStateKey, JSON.stringify({ index: musicIndex, volume: audio.volume })); } catch {}
}
function loadMusicTrack(index, autoplay = false) {
  if (!audio) return;
  musicIndex = (index + musicTracks.length) % musicTracks.length;
  const track = musicTracks[musicIndex];
  audio.src = track.src;
  audio.load();
  if (musicTitle) musicTitle.textContent = track.title;
  if (musicProgress) musicProgress.value = '0';
  if (musicCurrent) musicCurrent.textContent = '0:00';
  saveMusicState();
  if (autoplay) audio.play().catch(() => {});
}

if (audio) audio.volume = 0.55;
try {
  const saved = JSON.parse(localStorage.getItem(musicStateKey));
  if (saved && Number.isInteger(saved.index)) musicIndex = saved.index;
  if (audio && saved && Number.isFinite(saved.volume)) audio.volume = Math.max(0, Math.min(1, saved.volume));
} catch {}
if (musicVolume && audio) musicVolume.value = String(audio.volume);
loadMusicTrack(musicIndex);

musicPlay?.addEventListener('click', () => { if (audio?.paused) audio.play().catch(() => {}); else audio?.pause(); });
musicPrev?.addEventListener('click', () => loadMusicTrack(musicIndex - 1, !audio?.paused));
musicNext?.addEventListener('click', () => loadMusicTrack(musicIndex + 1, !audio?.paused));
audio?.addEventListener('play', () => {
  if (musicPlay) { musicPlay.textContent = 'Ⅱ'; musicPlay.setAttribute('aria-label', '暂停'); }
  musicConsole?.classList.add('is-playing');
});
audio?.addEventListener('pause', () => {
  if (musicPlay) { musicPlay.textContent = '▶'; musicPlay.setAttribute('aria-label', '播放'); }
  musicConsole?.classList.remove('is-playing');
});
audio?.addEventListener('loadedmetadata', () => {
  if (musicProgress) musicProgress.max = String(audio.duration || 48);
  if (musicDuration) musicDuration.textContent = formatAudioTime(audio.duration || 48);
});
audio?.addEventListener('timeupdate', () => {
  if (musicProgress && document.activeElement !== musicProgress) musicProgress.value = String(audio.currentTime);
  if (musicCurrent) musicCurrent.textContent = formatAudioTime(audio.currentTime);
});
audio?.addEventListener('ended', () => loadMusicTrack(musicIndex + 1, true));
musicProgress?.addEventListener('input', () => {
  if (!audio || audio.readyState === 0) return;
  audio.currentTime = Number(musicProgress.value);
  if (musicCurrent) musicCurrent.textContent = formatAudioTime(audio.currentTime);
});
musicVolume?.addEventListener('input', () => {
  if (!audio) return;
  audio.volume = Number(musicVolume.value);
  saveMusicState();
});
