// Writes scripts/fixtures/tone.wav: 2 s of mono 16-bit 16 kHz PCM,
// two sine bursts separated by silence. Non-speech on purpose: the
// transcribe check verifies the API shape (status, transcript field,
// duration echo), not word accuracy.
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rate = 16000;
const seconds = 2;
const samples = rate * seconds;
const data = Buffer.alloc(samples * 2);
const burst = (from, to, freq) => {
  for (let i = from; i < to; i += 1) {
    const t = i / rate;
    const env = Math.min(1, (i - from) / 800, (to - i) / 800);
    const value = Math.round(12000 * env * Math.sin(2 * Math.PI * freq * t));
    data.writeInt16LE(Math.max(-12000, Math.min(12000, value)), i * 2);
  }
};
burst(0, rate / 2, 440);
burst(rate, (rate * 3) / 2, 660);

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

const dir = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(dir, "fixtures", "tone.wav"), Buffer.concat([header, data]));
console.log("wrote fixtures/tone.wav");
