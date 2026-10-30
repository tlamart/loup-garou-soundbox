"""Optional QA only: requires Playwright + Chromium; no application dependency."""
from pathlib import Path
import functools, threading, http.server, json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
checks=[]
def ok(name):checks.append(name);print('PASS',name,flush=True)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=__import__('os').environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  context=browser.new_context(viewport={'width':1440,'height':1000})
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url);page.wait_for_selector('.sound-card');assert page.locator('.sound-card').count()==44
  assert page.locator('.is-active').count()==0;ok('44 boutons, aucun démarrage automatique')
  decoded=page.evaluate('''async () => { const {sounds}=await import('./js/sounds.js'); const c=new AudioContext(); const results=[]; for(const s of sounds) {const r=await fetch(s.src);if(!r.ok)throw Error(s.id);const b=await c.decodeAudioData(await r.arrayBuffer());if(b.duration<=0)throw Error(s.id);results.push(s.id);} await c.close();return results;}''')
  assert len(decoded)==44;ok('44 entrées audio réellement décodés par Web Audio Chromium')
  tile=lambda id:page.locator(f'.sound-card[data-id="{id}"] .play-sound')
  tile('wolf').click();page.wait_for_selector('[data-id="wolf"].is-active');ok('lecture d’un effet réel')
  tile('night').click();page.wait_for_selector('[data-id="night"].is-active')
  tile('wind').click();page.wait_for_selector('[data-id="wind"].is-active');assert page.locator('[data-id="night"].is-active').count()==0;ok('boucle et changement exclusif d’ambiance')
  tile('wolf').click();tile('bells').click();page.wait_for_function('document.querySelectorAll(".is-active").length>=3');ok('superposition d’effets avec ambiance')
  page.locator('#stop-all').click();assert page.locator('.is-active').count()==0;ok('STOP général')
  page.locator('#effects-volume').evaluate('(e)=>{e.value=31;e.dispatchEvent(new Event("input",{bubbles:true}));}')
  page.locator('#ambience-volume').evaluate('(e)=>{e.value=22;e.dispatchEvent(new Event("input",{bubbles:true}));}')
  page.locator('[data-id="wolf"] .favorite-toggle').click();page.locator('#favorites').click();assert page.locator('.sound-card').count()==1
  page.locator('#favorites').click();page.locator('#search').fill('COEUR');assert page.locator('.sound-card').count()==1;page.locator('#search').fill('');ok('favoris et recherche sans accents')
  page.locator('#add-sound').click();page.locator('#sound-file').set_input_files(ROOT/'assets/audio/gavel.wav');page.locator('#sound-name').fill('Test personnel');page.locator('#save-sound').click();page.wait_for_selector('.sound-card:has-text("Test personnel")')
  custom=page.locator('.sound-card:has-text("Test personnel")');custom.locator('.play-sound').click();page.wait_for_selector('.sound-card.is-active:has-text("Test personnel")');ok('import IndexedDB et lecture du fichier personnel')
  custom.get_by_role('button',name='Modifier Test personnel',exact=True).click();page.locator('#sound-name').fill('Test renommé');page.locator('#save-sound').click();page.wait_for_selector('.sound-card:has-text("Test renommé")');ok('renommage')
  page.reload();page.wait_for_selector('.sound-card:has-text("Test renommé")');assert page.locator('#effects-volume').input_value()=='31';assert page.locator('#ambience-volume').input_value()=='22';assert page.locator('[data-id="wolf"] .favorite-toggle').get_attribute('aria-pressed')=='true';ok('persistance après rechargement : sons, favoris et volumes')
  page.locator('.sound-card:has-text("Test renommé")').get_by_role('button',name='Supprimer Test renommé',exact=True).click();page.wait_for_function('document.querySelectorAll(".sound-card").length===44');page.reload();page.wait_for_function('document.querySelectorAll(".sound-card").length===44');ok('suppression persistante du son personnel')
  page.locator('[data-category=personnages]').click();assert page.locator('.sound-card').count()==9
  page.locator('[data-category=all]').click();ok('navigation par catégories')
  page.locator('[data-category=halloween]').click();assert page.locator('.sound-card').count()==12
  assert page.get_by_role('heading',name='Halloween',exact=True).count()==1
  tile('hw-child').click();page.wait_for_selector('[data-id="hw-child"].is-active');page.locator('#stop-all').click()
  page.locator('#search').fill('tronconneuse');assert page.locator('.sound-card').count()==1;page.locator('#search').fill('')
  for hid in ['hw-song','hw-glass','hw-saw','hw-chainsaw','hw-knock','hw-creak','hw-chains','hw-ghost']:
   tile(hid).click();page.wait_for_selector(f'[data-id="{hid}"].is-active');page.locator('#stop-all').click()
  ok('Halloween : 12 sons CC0, recherche et lecture des nouveaux fichiers')
  page.locator('[data-id="hw-knock"] .favorite-toggle').click();page.reload();page.wait_for_selector('.sound-card')
  page.locator('[data-category=halloween]').click();assert page.locator('[data-id="hw-knock"] .favorite-toggle').get_attribute('aria-pressed')=='true'
  ok('favori Halloween conservé après rechargement')
  page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');stop=page.locator('#stop-all').bounding_box();assert stop['y']+stop['height']<=844
  page.screenshot(path='/tmp/veillee-mobile.png',full_page=True);ok('mobile 390 px : sans défilement horizontal et STOP visible')
  for width in [320,360,768,1440]:
   page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
  ok('largeurs 320, 360, 768 et 1440 px')
  page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path='/tmp/veillee-desktop.png',full_page=True)
  page.wait_for_function('document.querySelector("#offline-status").textContent.includes("Prête")',timeout=30000)
  context.set_offline(True);page.reload();page.wait_for_selector('.sound-card');page.locator('[data-category=halloween]').click();tile('hw-knock').click();page.wait_for_selector('[data-id="hw-knock"].is-active');page.goto(url+'credits.html');assert page.get_by_role('heading',name='Les voix de la veillée.').count()==1;ok('rechargement, lecture et crédits hors ligne')
  context.set_offline(False)
  bad=browser.new_context(service_workers='block');bp=bad.new_page();bp.on('pageerror',lambda e:errors.append(str(e)))
  bp.route('**/assets/audio/owl.wav',lambda route:route.fulfill(status=404,body='missing'))
  bp.goto(url);bp.locator('[data-id="owl"] .play-sound').click();bp.wait_for_selector('[data-id="owl"].is-unavailable');assert bp.locator('[data-id="owl"] .play-sound').is_disabled()
  bp.locator('[data-id="wolf"] .play-sound').click();bp.wait_for_selector('[data-id="wolf"].is-active');ok('fichier absent : état explicite, autres sons opérationnels')
  assert not errors,errors;ok('aucune exception JavaScript non gérée')
  browser.close()
finally:server.shutdown()
print(json.dumps({'checks':len(checks),'results':checks},ensure_ascii=False,indent=2))
