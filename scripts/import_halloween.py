from pathlib import Path
import urllib.request,re,html,json,hashlib,subprocess,wave,struct,concurrent.futures
ROOT=Path(__file__).resolve().parents[1];TMP=Path(__import__('tempfile').mkdtemp(prefix='veillee-halloween-'))
ROWS=[
 ('hw-child','Teumova','439667',5),('hw-song','AlucardsBride','193939',20),
 ('hw-glass','reg7783','204185',4),('hw-saw','Kate_is_yellow','708202',7),
 ('hw-chainsaw','Hard3eat','351775',9),('hw-knock','Fabrizio84','458007',6),
 ('hw-creak','Sandwichbill','842232',4),('hw-chains','evantheblonde','368995',4),
 ('hw-ghost','Argon098','338344',7)]
def get(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (La Veillee; sound credits)'}),timeout=40) as r:return r.read()
def fetch(row):
 id,author,sid,maximum=row;page=f'https://freesound.org/people/{author}/sounds/{sid}/'
 s=get(page).decode();(TMP/f'{id}.html').write_text(s)
 license=re.search(r'<a[^>]+href=[\"\']https?://creativecommons.org/publicdomain/zero/1.0/[\"\'][^>]*>.*?</a>',s,re.S)
 if not license:raise ValueError(f'{id}: CC0 absent')
 url=html.unescape(re.search(r'data-static-file-url="([^"]+)"',s)[1])
 title=html.unescape(re.search(r'<meta property="og:audio:title" content="([^"]*)"',s)[1]);author=html.unescape(re.search(r'<meta property="og:audio:artist" content="([^"]*)"',s)[1])
 raw=get(url);(TMP/f'{id}.mp3').write_bytes(raw)
 pcm=TMP/f'{id}.pcm'
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(TMP/f'{id}.mp3'),'-t',str(maximum),'-ac','1','-ar','22050','-f','s16le',str(pcm)],check=True)
 data=list(struct.unpack('<%dh'%(pcm.stat().st_size//2),pcm.read_bytes()))
 first=next((i for i,v in enumerate(data) if abs(v)>100),0);data=data[max(0,first-441):]
 for i in range(min(220,len(data)//10)):data[i]=round(data[i]*i/min(220,len(data)//10))
 fade=min(2205,len(data)//8)
 for i in range(fade):data[-i-1]=round(data[-i-1]*i/fade)
 mean=sum(data)/len(data);data=[v-mean for v in data];peak=max(abs(v) for v in data)
 if peak<200:raise ValueError('Audio trop faible')
 data=[round(v/peak*25558) for v in data];out=ROOT/'assets/audio'/f'{id}.wav'
 with wave.open(str(out),'wb') as w:w.setparams((1,2,22050,0,'NONE','not compressed'));w.writeframes(struct.pack('<%dh'%len(data),*data))
 item={'id':id,'title':title,'author':author,'sourceUrl':page,'downloadUrl':url,'license':'CC0 1.0','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','retrievedOn':'2026-10-30','duration':round(len(data)/22050,3),'sourceSha256':hashlib.sha256(raw).hexdigest(),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'processing':f'Extrait depuis le début, {len(data)/22050:.3f} s ; mono PCM 16 bits, 22 050 Hz ; retrait du silence initial, fondus courts ; crête normalisée à -2,16 dBFS.','licenseEvidence':re.sub(r'\s+',' ',license[0]),'sourcePageSha256':hashlib.sha256(s.encode()).hexdigest(),'format':'WAV PCM 16 bits mono, 22 050 Hz','note':'Copie locale de la préécoute MP3 haute qualité publiée par Freesound.'}
 (TMP/f'{id}.json').write_text(json.dumps(item,ensure_ascii=False,indent=2)+'\n');print(id,title,author,'CC0',item['duration'],flush=True)
 return item
if __name__ == '__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  downloaded=list(pool.map(fetch,ROWS))
 assert len(downloaded)==9, 'Les neuf nouveaux fichiers doivent être présents.'
 manifest=ROOT/'assets/licenses/sources.json'
 sources=json.loads(manifest.read_text())
 for item in downloaded:sources[item['id']]=item
 for alias,original in [('hw-scream','scream'),('hw-thunder','thunder'),('hw-evil','evil')]:
  sources[alias]={**sources[original],'id':alias,'aliasOf':original,'src':f'assets/audio/{original}.wav'}
 manifest.write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n')
 metadata={id:{'duration':v['duration'],'origin':'Freesound · CC0','author':v['author'],'sourceUrl':v['sourceUrl'],'license':v['license'],'licenseUrl':v['licenseUrl'],**({'src':v['src']} if 'src' in v else {})} for id,v in sources.items()}
 (ROOT/'js/sources.js').write_text('// Provenance vérifiée des fichiers importés. Détails : assets/licenses/sources.json.\nexport const sourcedSounds = '+json.dumps(metadata,ensure_ascii=False,indent=2)+';\n')
 catalogue=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {sounds} from './js/sounds.js'; console.log(JSON.stringify(sounds));"],cwd=ROOT))
 halloween=[s for s in catalogue if s['category']=='halloween'];assert len(halloween)==12
 block='\n## Sélection Halloween — 30 octobre 2026\n\nLes neuf nouveaux fichiers ont une licence CC0 vérifiée sur leur fiche. Trois boutons réutilisent les fichiers CC0 déjà présents (cri, tonnerre, rire diabolique), sans dupliquer les données audio. La chansonnette est un extrait fredonné de la composition originale « Devil’s Waltz » d’AlucardsBride.\n\n| Son | Fichier local | Auteur | Source | Licence | Durée |\n|---|---|---|---|---|---|\n'
 credits='<h2>🎃 Halloween</h2><p>Neuf nouveaux enregistrements CC0 et trois effets déjà présents, réutilisés pour cette sélection. La chansonnette est un extrait fredonné de « Devil’s Waltz », composition originale d’AlucardsBride.</p><ul class="credit-list">'
 for s in halloween:
  v=sources[s['id']]
  block+=f"| {s['name']} | `{s['src']}` | {v['author']} | [Freesound]({v['sourceUrl']}) | [CC0 1.0]({v['licenseUrl']}) | {v['duration']:.3f} s |\n"
  credits+=f'<li><strong>{html.escape(s["name"])}</strong><small>{html.escape(v["title"])} — {html.escape(v["author"])}</small><small><a href="{v["sourceUrl"]}" target="_blank" rel="noopener noreferrer">Fiche originale ↗</a> · <a href="{v["licenseUrl"]}" target="_blank" rel="noopener noreferrer">CC0 1.0 ↗</a></small></li>'
 credits+='</ul>'
 p=ROOT/'SOUND_SOURCES.md';text=p.read_text().split('\n## Sélection Halloween')[0]
 text=text.replace('Mise à jour du 20 octobre 2026 : **25 fichiers importés depuis Freesound sous CC0 1.0**, et **7 créations synthétisées originales**. Les 32 fichiers','Mise à jour du 30 octobre 2026 : **34 fichiers importés depuis Freesound sous CC0 1.0**, et **7 créations synthétisées originales**. Les 41 fichiers servent 44 boutons (dont 3 réutilisations dans Halloween) et')
 p.write_text(text+block)
 p=ROOT/'credits.html';text=p.read_text();text=re.sub(r'<!-- HALLOWEEN START -->.*?<!-- HALLOWEEN END -->','',text,flags=re.S)
 text=text.replace('25 sons sous licence CC0 1.0, téléchargés depuis Freesound, et 7 créations synthétisées originales.','37 entrées sous licence CC0 1.0 (34 fichiers téléchargés depuis Freesound), et 7 créations synthétisées originales.')
 text=text.replace('</main>','<!-- HALLOWEEN START -->'+credits+'<!-- HALLOWEEN END --></main>');p.write_text(text)
 p=ROOT/'README.md';text=p.read_text();text=text.split('\n## Halloween')[0]
 text=text.replace('**32 sons réellement présents**','**44 boutons avec un vrai son (41 fichiers distincts)**').replace('environ **7,3 Mo**','environ **'+str(round(sum(p.stat().st_size for p in (ROOT/'assets/audio').glob('*.wav'))/1000000,1)).replace('.',',')+' Mo**')
 text=text.replace('Depuis la mise à jour CC0, 25 effets ou ambiances proviennent de Freesound avec une licence CC0 1.0 vérifiée sur leur fiche ; 7 effets musicaux ou fantastiques restent des créations procédurales originales.','34 fichiers proviennent de Freesound avec une licence CC0 1.0 vérifiée sur leur fiche, utilisés dans 37 entrées du catalogue ; 7 effets restent des créations procédurales originales.')
 text=text.replace('les 25 autres sont des fichiers CC0 importés','les 37 autres entrées utilisent des fichiers CC0 importés').replace('la-veillee-v2','la-veillee-v3')
 text+='\n## Halloween\n\nL’onglet 🎃 Halloween regroupe 12 sons : cri strident, rire d’enfant, chansonnette, coup de tonnerre, rire diabolique, verre brisé, scie, tronçonneuse, frappe à la porte, porte qui grince, chaînes hantées et souffle spectral. Les 12 utilisent des sons CC0 ; les trois effets déjà présents sont réutilisés sans recopier leurs fichiers. Les favoris, la recherche, les volumes et le STOP fonctionnent aussi dans cet onglet. Les imports personnels peuvent être classés dans Halloween.\n\nLes nouveaux fichiers sont courts, normalisés et inclus dans le cache hors ligne v3. Après une mise à jour, laisser le nouveau cache se télécharger puis recharger l’onglet. Les préférences et IndexedDB ne sont pas effacés.\n\nLe script de maintenance optionnel `python scripts/import_halloween.py` télécharge neuf préécoutes haute qualité depuis leurs fiches Freesound, exige un lien CC0 sur chacune, prépare des WAV avec FFmpeg et met à jour les crédits et empreintes. Python, Node et FFmpeg sont nécessaires uniquement à cette préparation ; le site publié reste entièrement statique, sans dépendance.\n'
 p.write_text(text)
 print('Halloween intégré : 12 entrées CC0, 9 nouveaux fichiers, crédits et empreintes mis à jour.',flush=True)
