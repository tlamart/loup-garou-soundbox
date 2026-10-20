import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { sounds } from '../js/sounds.js';
import { AudioEngine } from '../js/audio.js';
import { loadPreferences, savePreferences } from '../js/storage.js';
class Context {
  state = 'running'; currentTime = 0; destination = {};
  createGain() { return { gain: { value: 0, setTargetAtTime(v) { this.value = v; } }, connect() {}, disconnect() {} }; }
  createBufferSource() { return { connect() {}, disconnect() {}, start() {}, stop() { this.onended?.(); } }; }
  async decodeAudioData() { return { duration: 3 }; }
  async resume() { this.state = 'running'; }
}
globalThis.window = { AudioContext: Context };
globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) });
const sound = (id, loop = false) => ({ id, loop, src: `${id}.wav`, volume: .7 });
test('32 sons uniques avec un vrai fichier WAV non silencieux et un manifeste complet', () => {
  assert.equal(sounds.length, 32); assert.equal(new Set(sounds.map(s => s.id)).size, 32);
  for (const s of sounds) {
    for (const key of ['id','name','category','icon','src','loop','volume']) assert.notEqual(s[key], undefined);
    const path = new URL(`../${s.src}`, import.meta.url); assert.ok(existsSync(path));
    const bytes = readFileSync(path);
    assert.equal(bytes.toString('ascii',0,4), 'RIFF'); assert.equal(bytes.toString('ascii',8,12), 'WAVE');
    let peak = 0; for (let i=44;i<bytes.length;i+=2) peak = Math.max(peak, Math.abs(bytes.readInt16LE(i)));
    assert.ok(peak > 1000, `${s.id} ne doit pas être silencieux`);
  }
});
test('effets superposés, fin de lecture et STOP', async () => {
  const e = new AudioEngine(); assert.equal(e.voices.size,0);
  await e.play(sound('wolf')); await e.play(sound('bell'));
  assert.equal(e.voices.size,2); assert.ok(e.active('wolf'));
  const voice = [...e.voices][0]; voice.source.onended(); assert.equal(e.voices.size,1);
  e.stopAll(); assert.equal(e.voices.size,0);
});
test('boucle exclusive, changement, second clic, volumes indépendants', async () => {
  const e = new AudioEngine();
  await e.play(sound('night',true)); assert.equal(e.loopId,'night');
  await e.play(sound('wind',true)); assert.equal(e.loopId,'wind'); assert.equal(e.voices.size,1);
  await e.play(sound('owl')); assert.equal(e.voices.size,2);
  e.setVolume('effects',.3); e.setVolume('ambience',.6);
  assert.equal(e.effects.gain.value,.3); assert.equal(e.ambience.gain.value,.6);
  await e.play(sound('wind',true)); assert.equal(e.loopId,null); assert.equal(e.voices.size,1);
  e.stopAll();
});
test('STOP annule aussi une lecture en cours de chargement', async () => {
  const e = new AudioEngine(); let complete;
  e.buffer = () => new Promise(resolve => { complete = resolve; });
  const pending = e.play(sound('slow')); await Promise.resolve();
  e.stopAll(); complete({}); await pending; assert.equal(e.voices.size,0);
});
test('un fichier absent produit une erreur contrôlable, les autres sons fonctionnent', async () => {
  const e = new AudioEngine();
  const goodFetch = globalThis.fetch; globalThis.fetch = async () => ({ ok:false });
  await assert.rejects(e.play(sound('missing')), err => err.unavailable === true);
  globalThis.fetch = goodFetch;
  await e.play(sound('good')); assert.equal(e.voices.size,1); e.stopAll();
});
test('persistance des favoris et volumes, stockage indisponible et JSON corrompu', () => {
  let stored;
  globalThis.localStorage = { getItem: () => stored, setItem: (_,value) => { stored=value; } };
  const prefs = { effects:.6, ambience:.2, favorites:['wolf'] };
  assert.equal(savePreferences(prefs),true); assert.deepEqual(loadPreferences(),prefs);
  stored='malformed'; assert.deepEqual(loadPreferences(),{});
  globalThis.localStorage = { getItem(){throw Error();},setItem(){throw Error();} };
  assert.equal(savePreferences(prefs),false); assert.deepEqual(loadPreferences(),{});
});
