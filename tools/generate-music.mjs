import fs from 'node:fs';
import path from 'node:path';

const sampleRate = 22050;
const duration = 48;
const outputDir = path.resolve('src/assets/music');

const tracks = [
  {
    file: 'moonwalk.wav',
    bpm: 80,
    chords: [[50, 54, 57], [45, 49, 52], [47, 50, 54], [43, 47, 50]],
    melody: [74, 78, 81, 78, 76, 74, 69, null, 71, 74, 78, 74, 71, 69, 66, null]
  },
  {
    file: 'aqua-theatre.wav',
    bpm: 96,
    chords: [[53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53]],
    melody: [77, 79, 81, 84, 81, 79, 77, 72, 74, 77, 79, 81, 79, 77, 74, null]
  },
  {
    file: 'starlight-goodnight.wav',
    bpm: 68,
    chords: [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 43, 47]],
    melody: [69, null, 72, 76, 74, null, 72, 69, 67, null, 71, 74, 72, 71, 67, null]
  }
];

const frequency = (midi) => 440 * (2 ** ((midi - 69) / 12));
const clamp = (value) => Math.max(-1, Math.min(1, value));

function oscillator(freq, time, kind = 'sine') {
  const phase = 2 * Math.PI * freq * time;
  if (kind === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(phase));
  return Math.sin(phase);
}

function edgeEnvelope(phase, edge = 0.08) {
  return Math.min(1, phase / edge, (1 - phase) / edge);
}

function renderTrack(track) {
  const count = sampleRate * duration;
  const pcm = Buffer.alloc(count * 2);
  const secondsPerBeat = 60 / track.bpm;

  for (let i = 0; i < count; i += 1) {
    const time = i / sampleRate;
    const beat = time / secondsPerBeat;
    const measure = Math.floor(beat / 4);
    const measurePhase = (beat % 4) / 4;
    const chord = track.chords[measure % track.chords.length];
    const padEnvelope = edgeEnvelope(measurePhase, 0.06);

    let sample = 0;
    chord.forEach((note, index) => {
      sample += oscillator(frequency(note), time, index === 1 ? 'triangle' : 'sine') * (index === 0 ? 0.11 : 0.065) * padEnvelope;
    });

    const bassPhase = beat % 1;
    const bassEnvelope = Math.exp(-bassPhase * 3.2);
    sample += oscillator(frequency(chord[0] - 12), time, 'sine') * 0.12 * bassEnvelope;

    const halfBeat = beat * 2;
    const melodyNote = track.melody[Math.floor(halfBeat) % track.melody.length];
    const notePhase = halfBeat % 1;
    if (melodyNote !== null) {
      const attack = Math.min(1, notePhase / 0.08);
      const decay = Math.exp(-notePhase * 3.8);
      const bell = oscillator(frequency(melodyNote), time, 'sine') * 0.18
        + oscillator(frequency(melodyNote) * 2, time, 'sine') * 0.045;
      sample += bell * attack * decay;
    }

    sample += oscillator(0.08, time) * oscillator(880, time, 'sine') * 0.006;
    const globalFade = Math.min(1, time / 1.5, (duration - time) / 2.2);
    pcm.writeInt16LE(Math.round(clamp(sample * globalFade) * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

fs.mkdirSync(outputDir, { recursive: true });
for (const track of tracks) {
  const output = path.join(outputDir, track.file);
  fs.writeFileSync(output, renderTrack(track));
  console.log(`Generated ${output}`);
}
