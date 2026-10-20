import { sounds, categories } from './sounds.js';
import { AudioEngine } from './audio.js';
import { loadPreferences, savePreferences, customStore } from './storage.js';
const $ = selector => document.querySelector(selector);
const preferences = loadPreferences();
const clamp = (value, fallback) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
const engine = new AudioEngine(clamp(preferences.effects, .8), clamp(preferences.ambience, .45));
const favorites = new Set(Array.isArray(preferences.favorites) ? preferences.favorites.filter(id => typeof id === 'string') : []);
let catalogue = [...sounds], category = 'all', favoritesOnly = false, query = '', editingId = null, toastTimer;
const unavailable = new Set();
const sourceLabel = sound => sound.custom ? 'PERSO' : sound.license ? 'CC0' : 'SYNTHÈSE';
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae');
function toast(message) {
  $('#toast').textContent = message; $('#toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 6500);
}
function persist() {
  if (!savePreferences({ ...engine.volumes, favorites: [...favorites] })) toast('Les préférences ne peuvent pas être sauvegardées sur cet appareil.');
}
function element(tag, className, text) {
  const node = document.createElement(tag); if (className) node.className = className;
  if (text !== undefined) node.textContent = text; return node;
}
function renderCategories() {
  const nav = $('#categories');
  [{ id: 'all', name: 'Tous les sons', icon: '▦' }, ...categories].forEach(item => {
    const button = element('button', 'category'); button.dataset.category = item.id;
    button.append(element('span', '', item.icon), document.createTextNode(item.name));
    button.setAttribute('aria-pressed', String(category === item.id));
    button.onclick = () => { category = item.id; render(); }; nav.append(button);
  });
}
function render() {
  for (const button of document.querySelectorAll('.category')) button.setAttribute('aria-pressed', String(button.dataset.category === category));
  $('#favorites').setAttribute('aria-pressed', String(favoritesOnly));
  $('#favorites-count').textContent = catalogue.filter(s => favorites.has(s.id)).length;
  $('#total-count').textContent = catalogue.length;
  const info = categories.find(c => c.id === category);
  $('#category-title').textContent = favoritesOnly ? 'Vos favoris' : (info?.name || 'Tous les sons');
  $('#category-description').textContent = favoritesOnly ? 'Vos complices pour une nuit mémorable.' : (info?.description || 'Les petits bruits font les grandes histoires.');
  const filtered = catalogue.filter(s => (category === 'all' || s.category === category) && (!favoritesOnly || favorites.has(s.id)) && normalize(`${s.name} ${s.id} ${categories.find(c => c.id === s.category)?.name}`).includes(query));
  $('#result-count').textContent = `${filtered.length} son${filtered.length > 1 ? 's' : ''}`;
  $('#empty-state').hidden = filtered.length !== 0;
  $('#empty-description').textContent = favoritesOnly ? 'Touchez l’étoile d’un son pour le retrouver ici. Les filtres de catégorie restent actifs.' : 'Essayez un autre mot ou une autre catégorie.';
  const grid = $('#sound-grid'); grid.replaceChildren();
  for (const sound of filtered) {
    const card = element('article', 'sound-card'); card.dataset.id = sound.id;
    const star = element('button', 'favorite-toggle', favorites.has(sound.id) ? '★' : '☆');
    star.setAttribute('aria-label', `${favorites.has(sound.id) ? 'Retirer des' : 'Ajouter aux'} favoris : ${sound.name}`);
    star.setAttribute('aria-pressed', String(favorites.has(sound.id)));
    star.onclick = () => { favorites.has(sound.id) ? favorites.delete(sound.id) : favorites.add(sound.id); persist(); render(); };
    const play = element('button', 'play-sound'); play.type = 'button';
    play.setAttribute('aria-label', `${sound.loop ? 'Démarrer ou arrêter' : 'Jouer'} : ${sound.name}`);
    play.title = sound.custom ? 'Fichier personnel · stocké sur cet appareil' : sound.license ? `${sound.author} · ${sound.license} · Fichier local` : 'Création synthétisée originale (interprétation stylisée)';
    play.append(element('span', 'sound-icon', sound.icon), element('span', 'sound-name', sound.name), element('span', 'sound-meta', sound.loop ? `↻ EN BOUCLE · ${sourceLabel(sound)}` : `${sound.duration ? `${sound.duration.toFixed(1).replace('.', ',')} s` : 'Audio personnel'} · ${sourceLabel(sound)}`));
    play.onclick = async () => {
      try { await engine.play(sound); }
      catch (error) {
        if (error.unavailable) { unavailable.add(sound.id); updatePlayback(); toast(`« ${sound.name} » indisponible : fichier absent ou format audio non pris en charge.`); }
        else toast(error.message || 'Lecture impossible. Touchez à nouveau le son.');
      }
    };
    card.append(star, play);
    if (sound.loop) card.append(element('span', 'loop-badge', '↻'));
    if (sound.custom) {
      const actions = element('div', 'custom-actions');
      const rename = element('button', '', '✎ Modifier'); rename.setAttribute('aria-label', `Modifier ${sound.name}`); rename.onclick = () => openEditor(sound);
      const remove = element('button', '', 'Supprimer'); remove.setAttribute('aria-label', `Supprimer ${sound.name}`);
      remove.onclick = async () => {
        try {
          await customStore.remove(sound.id); engine.stop(sound.id); catalogue = catalogue.filter(s => s.id !== sound.id); favorites.delete(sound.id); persist(); render(); toast('Son personnel supprimé.');
        } catch { toast('Impossible de supprimer ce son : le stockage est indisponible.'); }
      };
      actions.append(rename, remove); card.append(actions);
    }
    grid.append(card);
  }
  updatePlayback();
}
function updatePlayback() {
  for (const card of document.querySelectorAll('.sound-card')) {
    const active = engine.active(card.dataset.id), missing = unavailable.has(card.dataset.id);
    card.classList.toggle('is-active', active); card.classList.toggle('is-unavailable', missing);
    const play = card.querySelector('.play-sound');
    play.disabled = missing; play.setAttribute('aria-pressed', String(active));
    if (missing) card.querySelector('.sound-meta').textContent = '⚠ INDISPONIBLE';
    else if (active) card.querySelector('.sound-meta').textContent = '♫ EN LECTURE';
    else {
      const sound = catalogue.find(s => s.id === card.dataset.id);
      card.querySelector('.sound-meta').textContent = sound.loop ? `↻ EN BOUCLE · ${sourceLabel(sound)}` : `${sound.duration ? `${sound.duration.toFixed(1).replace('.', ',')} s` : 'Audio personnel'} · ${sourceLabel(sound)}`;
    }
  }
  const loop = catalogue.find(s => s.id === engine.loopId);
  $('#play-status').textContent = loop ? loop.name : engine.voices.size ? `${engine.voices.size} effet${engine.voices.size > 1 ? 's' : ''} en lecture` : 'Le village est silencieux';
  $('.mixer').classList.toggle('playing', engine.voices.size > 0);
}
engine.addEventListener('change', updatePlayback);
for (const type of ['effects', 'ambience']) {
  const input = $(`#${type}-volume`), output = $(`#${type}-value`);
  input.value = Math.round(engine.volumes[type] * 100); output.textContent = `${input.value} %`;
  input.oninput = () => { engine.setVolume(type, input.valueAsNumber / 100); output.textContent = `${input.value} %`; persist(); };
}
$('#stop-all').onclick = () => { engine.stopAll(); toast('Tous les sons sont arrêtés.'); };
$('#search').oninput = event => { query = normalize(event.target.value.trim()); render(); };
$('#favorites').onclick = () => { favoritesOnly = !favoritesOnly; render(); };
document.addEventListener('keydown', event => {
  const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName);
  if (event.key === 'Escape') engine.stopAll();
  if (event.key === '/' && !typing && !$('#sound-dialog').open) { event.preventDefault(); $('#search').focus(); }
});
function openEditor(sound) {
  editingId = sound?.id || null; $('#sound-form').reset(); $('#form-message').textContent = '';
  $('#dialog-title').textContent = sound ? 'Modifier le son' : 'Ajouter un son';
  $('#save-sound').textContent = sound ? 'Enregistrer' : 'Ajouter à la veillée';
  $('#sound-name').value = sound?.name || ''; $('#sound-category').value = sound?.category || 'ambiances';
  $('#sound-loop').checked = sound?.loop || false; $('#file-label').hidden = Boolean(sound);
  $('#sound-file').required = !sound; $('#sound-dialog').showModal(); $('#sound-name').focus();
}
$('#add-sound').onclick = () => openEditor();
$('#close-dialog').onclick = $('#cancel-dialog').onclick = () => $('#sound-dialog').close();
$('#sound-file').onchange = () => {
  const file = $('#sound-file').files[0];
  if (file && !$('#sound-name').value) $('#sound-name').value = file.name.replace(/\.[^.]+$/, '').slice(0,55);
};
$('#sound-form').onsubmit = async event => {
  event.preventDefault(); const button = $('#save-sound'); button.disabled = true;
  try {
    const name = $('#sound-name').value.trim(); if (!name) throw new Error('Donnez un nom à votre son.');
    let sound = catalogue.find(s => s.id === editingId);
    if (!sound) {
      const file = $('#sound-file').files[0];
      if (!file) throw new Error('Choisissez un fichier audio.');
      if (file.size > 15 * 1024 * 1024) throw new Error('Le fichier dépasse 15 Mo. Choisissez un fichier plus léger.');
      if (!file.size) throw new Error('Ce fichier est vide.');
      await engine.unlock();
      let decoded;
      try { decoded = await engine.context.decodeAudioData(await file.arrayBuffer()); }
      catch { throw new Error('Ce fichier est illisible ou son format audio n’est pas pris en charge. Essayez un fichier WAV ou MP3.'); }
      sound = { id: `custom-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`, custom: true, blob: file, icon: '🎵', volume: .7, duration: decoded.duration };
    }
    const saved = { ...sound, name, category: $('#sound-category').value, loop: $('#sound-loop').checked };
    try { await customStore.put(saved); }
    catch (error) { throw new Error(error.name === 'QuotaExceededError' ? 'Stockage saturé : supprimez des sons personnels ou libérez de l’espace.' : 'Stockage indisponible : ce navigateur ne peut pas conserver le fichier. Essayez hors navigation privée.'); }
    if (editingId) { engine.stop(editingId); catalogue = catalogue.map(s => s.id === editingId ? saved : s); }
    else catalogue.push(saved);
    $('#sound-dialog').close(); render(); toast(editingId ? 'Son personnel modifié.' : 'Son ajouté et sauvegardé sur cet appareil.');
  } catch (error) { $('#form-message').textContent = error.message || 'Impossible d’ajouter ce son.'; }
  finally { button.disabled = false; }
};
renderCategories(); render();
customStore.all().then(custom => { catalogue.push(...custom); render(); }).catch(() => toast('Stockage des sons personnels indisponible. Les sons du catalogue restent accessibles.'));
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').then(async registration => {
    const ready = await navigator.serviceWorker.ready;
    const updateStatus = async () => {
      const cache = await caches.open('la-veillee-v2');
      $('#offline-status').textContent = await cache.match(new URL('assets/audio/crickets.wav', location.href)) ? '✓ Prête pour vos nuits hors ligne' : '◌ Mode hors ligne en préparation';
    };
    navigator.serviceWorker.addEventListener('message', event => { if (event.data === 'offline-ready') updateStatus().catch(() => {}); });
    await updateStatus();
  }).catch(() => { $('#offline-status').textContent = 'Mode hors ligne indisponible · utilisez les fichiers téléchargés avec un serveur local.'; });
} else $('#offline-status').textContent = 'Hors ligne : lancez les fichiers avec un serveur local.';
