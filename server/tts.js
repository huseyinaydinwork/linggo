// Yüksek kaliteli seslendirme (TTS): Azure / Google / ElevenLabs + diskte kalıcı önbellek
// Anahtarlar .env'de: AZURE_SPEECH_KEY + AZURE_SPEECH_REGION | GOOGLE_TTS_KEY | ELEVENLABS_API_KEY
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from './config.js';
import { getContent } from './content.js';

const env = process.env;
const CACHE_DIR = path.join(path.dirname(config.dbPath), 'tts');
fs.mkdirSync(CACHE_DIR, { recursive: true });
export const LANGS = ['tr-TR', 'en-US', 'en-GB'];

export function availableProviders() {
  return {
    azure: !!(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION),
    google: !!env.GOOGLE_TTS_KEY,
    elevenlabs: !!env.ELEVENLABS_API_KEY,
  };
}
export function activeProvider() {
  const v = getContent('voice'), av = availableProviders();
  if (v.provider === 'off') return null;
  if (v.provider !== 'auto') return av[v.provider] ? v.provider : null;
  return av.azure ? 'azure' : av.google ? 'google' : av.elevenlabs && Object.values(v.voices.elevenlabs || {}).some(Boolean) ? 'elevenlabs' : null;
}

const xml = s => s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

async function azure(text, lang, voice, rate) {
  const pct = Math.round((rate - 1) * 100);
  const ssml = `<speak version="1.0" xml:lang="${lang}"><voice name="${xml(voice)}"><prosody rate="${pct >= 0 ? '+' : ''}${pct}%">${xml(text)}</prosody></voice></speak>`;
  const r = await fetch(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'pratilange' },
    body: ssml,
  });
  if (!r.ok) throw new Error(`Azure TTS ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return Buffer.from(await r.arrayBuffer());
}
async function google(text, lang, voice, rate) {
  const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(env.GOOGLE_TTS_KEY)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: { text }, voice: { languageCode: lang, name: voice }, audioConfig: { audioEncoding: 'MP3', speakingRate: rate } }),
  });
  if (!r.ok) throw new Error(`Google TTS ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return Buffer.from((await r.json()).audioContent, 'base64');
}
async function elevenlabs(text, lang, voice) {
  if (!voice) throw new Error(`ElevenLabs için ${lang} sesi seçilmedi.`);
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_64`, {
    method: 'POST', headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.8 } }),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return Buffer.from(await r.arrayBuffer());
}
const IMPL = { azure, google, elevenlabs };

const inflight = new Map();
// Returns { file } or null when no provider is configured
export async function synth(text, lang, { rate: rateOverride } = {}) {
  const provider = activeProvider(); if (!provider) return null;
  const v = getContent('voice');
  const voice = v.voices[provider]?.[lang] || '';
  const rate = Math.max(0.5, Math.min(1.5, rateOverride || v.rate?.[lang] || 1));
  const h = crypto.createHash('sha256').update(`${provider}|${voice}|${lang}|${rate}|${text}`).digest('hex');
  const file = path.join(CACHE_DIR, h.slice(0, 2), h + '.mp3');
  if (fs.existsSync(file)) return { file, cached: true };
  if (inflight.has(file)) { await inflight.get(file); return { file, cached: true }; }
  const job = (async () => {
    const buf = await IMPL[provider](text, lang, voice, rate);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file + '.tmp', buf); fs.renameSync(file + '.tmp', file);
  })();
  inflight.set(file, job);
  try { await job; } finally { inflight.delete(file); }
  return { file, cached: false };
}

export function cacheStats() {
  let files = 0, bytes = 0;
  if (!fs.existsSync(CACHE_DIR)) return { files, bytes };
  for (const d of fs.readdirSync(CACHE_DIR)) {
    const p = path.join(CACHE_DIR, d); if (!fs.statSync(p).isDirectory()) continue;
    for (const f of fs.readdirSync(p)) { files++; bytes += fs.statSync(path.join(p, f)).size; }
  }
  return { files, bytes };
}
export function clearCache() { fs.rmSync(CACHE_DIR, { recursive: true, force: true }); fs.mkdirSync(CACHE_DIR, { recursive: true }); }
