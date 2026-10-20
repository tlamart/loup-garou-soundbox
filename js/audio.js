/** Two independent volume buses; one exclusive loop; overlapping one-shots. */
export class AudioEngine extends EventTarget {
  constructor(effects = .8, ambience = .45) {
    super(); this.volumes = { effects, ambience }; this.buffers = new Map();
    this.voices = new Set(); this.epoch = 0; this.loopRequest = 0; this.loopId = null;
  }
  async unlock() {
    if (!this.context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error('Ce navigateur ne prend pas en charge Web Audio.');
      this.context = new Context();
      for (const type of ['effects', 'ambience']) {
        this[type] = this.context.createGain();
        this[type].gain.value = this.volumes[type]; this[type].connect(this.context.destination);
      }
    }
    if (this.context.state !== 'running') await this.context.resume();
    if (this.context.state !== 'running') throw new Error('Touchez à nouveau le son pour autoriser la lecture.');
  }
  async buffer(sound) {
    if (!this.buffers.has(sound.id)) {
      const pending = (async () => {
        let bytes;
        if (sound.blob) bytes = await sound.blob.arrayBuffer();
        else {
          const response = await fetch(sound.src);
          if (!response.ok) throw new Error('Fichier audio absent.');
          bytes = await response.arrayBuffer();
        }
        return this.context.decodeAudioData(bytes);
      })();
      this.buffers.set(sound.id, pending);
    }
    try { return await this.buffers.get(sound.id); }
    catch (e) { this.buffers.delete(sound.id); e.unavailable = true; throw e; }
  }
  emit() { this.dispatchEvent(new Event('change')); }
  active(id) { return [...this.voices].some(v => v.id === id); }
  async play(sound) {
    const epoch = this.epoch;
    let request;
    if (sound.loop) {
      request = ++this.loopRequest;
      if (this.loopId === sound.id) { this.stopLoop(); return; }
    }
    await this.unlock();
    const buffer = await this.buffer(sound);
    if (epoch !== this.epoch || (sound.loop && request !== this.loopRequest)) return;
    if (sound.loop) this.stopLoop(false);
    // Bound resource use during repeated rapid taps.
    if (this.voices.size >= 32) this.stopVoice(this.voices.values().next().value);
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer; source.loop = sound.loop; gain.gain.value = sound.volume ?? .7;
    source.connect(gain); gain.connect(sound.loop ? this.ambience : this.effects);
    const voice = { id: sound.id, source, gain, loop: sound.loop };
    source.onended = () => { this.voices.delete(voice); source.disconnect(); gain.disconnect(); this.emit(); };
    this.voices.add(voice);
    if (sound.loop) this.loopId = sound.id;
    source.start(); this.emit();
  }
  stopVoice(voice) {
    try { voice.source.stop(); } catch { /* Already ended. */ }
    this.voices.delete(voice);
  }
  stopLoop(invalidate = true) {
    if (invalidate) this.loopRequest++;
    for (const v of this.voices) if (v.loop) this.stopVoice(v);
    this.loopId = null; this.emit();
  }
  stop(id) {
    for (const v of this.voices) if (v.id === id) this.stopVoice(v);
    if (this.loopId === id) this.stopLoop();
    this.buffers.delete(id); this.emit();
  }
  stopAll() {
    this.epoch++; this.loopRequest++;
    for (const v of this.voices) this.stopVoice(v);
    this.loopId = null; this.emit();
  }
  setVolume(type, value) {
    this.volumes[type] = value;
    if (this[type]) this[type].gain.setTargetAtTime(value, this.context.currentTime, .02);
  }
}
