# La Veillée — Soundbox Loup-Garou

Soundboard statique en français pour animer Les Loups-Garous de Thiercelieux. HTML, CSS et JavaScript natif ; aucune dépendance nécessaire à l’utilisation, aucun compte ni serveur applicatif.

## Lancer le site

Dans le dossier du projet :

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Ouvrir `http://localhost:8000`. Sur un téléphone connecté au même Wi-Fi, ouvrir `http://ADRESSE_IP_DU_PC:8000` (autoriser le port dans le pare-feu si nécessaire). Web Audio fonctionne après un clic ; le service worker exige HTTPS ou localhost. Le mode hors ligne sur téléphone sera donc disponible depuis GitHub Pages en HTTPS.

Les modules ES nécessitent un serveur HTTP : le double-clic sur `index.html` en `file://` n’est pas pris en charge. Un serveur local fonctionne sans accès Internet une fois les fichiers téléchargés.

## Utilisation

- Toucher une tuile pour jouer un effet ; plusieurs effets peuvent se superposer (32 voix maximum).
- Les deux ambiances « Ambiance nocturne » et « Vent inquiétant » sont des boucles exclusives. Toucher de nouveau la boucle active pour l’arrêter.
- Le bouton **Tout arrêter** et la touche **Échap** coupent toutes les voix, y compris les lectures en cours de chargement. Aucun son ne démarre au chargement.
- Les volumes Effets et Ambiances sont indépendants. Seuls les sons marqués « En boucle » passent par le volume Ambiances ; les autres sons, même dans la catégorie Ambiances, sont des effets ponctuels.
- Rechercher un nom, avec ou sans accents. La touche `/` ouvre la recherche.
- Toucher une étoile pour enregistrer un favori. Recherche, catégorie et filtre Favoris se combinent.
- **Ajouter un son** importe un fichier local de 15 Mo maximum. Nom, catégorie et boucle sont modifiables. « Supprimer » efface le fichier personnel de cet appareil.

Favoris et volumes sont conservés dans localStorage. Les fichiers personnels sont conservés dans IndexedDB. Aucune donnée ne quitte le navigateur. Les fichiers audio sont décodés avant sauvegarde pour vérifier leur lisibilité. Les noms sont insérés comme texte, jamais comme HTML.

## Hors ligne

Après une première visite complète en HTTPS ou localhost, attendre **« Prête pour vos nuits hors ligne »**. Les 32 sons et tous les fichiers nécessaires sont alors en cache. Le site peut être rechargé sans réseau. Les imports restent dans IndexedDB et ne dépendent pas du cache réseau.

Le navigateur peut supprimer ses données en cas de manque d’espace, d’effacement manuel ou de navigation privée. Conserver les fichiers personnels originaux. Les paramètres et sons ne sont pas synchronisés entre appareils. Pour mettre à jour les ressources du site, augmenter le nom de cache `la-veillee-v2` dans `sw.js` et `js/app.js`.

## Sons disponibles et provenance

**32 sons réellement présents**, au format WAV mono PCM 16 bits, 22 050 Hz, pour environ **7,3 Mo** au total. Depuis la mise à jour CC0, 25 effets ou ambiances proviennent de Freesound avec une licence CC0 1.0 vérifiée sur leur fiche ; 7 effets musicaux ou fantastiques restent des créations procédurales originales. Tous les sons sont fournis dans le dépôt et ne chargent aucun fichier audio externe.

`SOUND_SOURCES.md`, `credits.html` et `assets/licenses/sources.json` détaillent les auteurs, les fiches originales, la licence, les durées et les traitements. Les versions importées sont les préécoutes MP3 haute qualité de Freesound, converties en WAV ; pas les masters originaux. Les effets longs ont été raccourcis, les volumes normalisés, et les deux ambiances raccordées pour la boucle.

Le script Python standard `scripts/generate_audio.py` régénère uniquement les créations synthétiques et préserve les fichiers CC0 importés. Le « Cri théâtral » utilise un enregistrement CC0, distinct du cri Wilhelm. Aucun bouton n’est livré sans audio.

## Architecture

```text
index.html                 Interface accessible en français
css/style.css              Thème sombre, responsive, mouvement réduit
js/app.js                  Recherche, catégories, favoris, import et interface
js/audio.js                Web Audio, deux bus, exclusivité et superposition
js/sounds.js               Catalogue modifiable et métadonnées
js/sources.js              Provenance et durées des sons CC0
credits.html               Crédits accessibles depuis l’application
assets/licenses/sources.json  Sources, licences, traitements et empreintes
js/storage.js              localStorage et IndexedDB
assets/audio/*.wav         32 fichiers audio locaux
assets/village.svg         Illustration originale du village
sw.js                      Cache hors ligne, chemins relatifs
scripts/generate_audio.py  Synthèse reproductible des fichiers
tests/core.test.js        Tests automatisés sans dépendance
```

Pour ajouter un son livré avec le site : placer le fichier dans `assets/audio/`, ajouter ses métadonnées dans `js/sounds.js`, l’ajouter au précache `sw.js`, incrémenter le cache, et renseigner sa provenance et sa licence dans `SOUND_SOURCES.md`.

## GitHub Pages

1. Mettre le contenu de ce dossier à la racine d’un dépôt GitHub.
2. Dans **Settings → Pages**, choisir **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Ouvrir l’adresse HTTPS annoncée par GitHub. Aucun build ni installation npm n’est nécessaire.
4. Visiter depuis le téléphone, attendre l’indication hors ligne, puis toucher un son pour autoriser l’audio.

Tous les chemins sont relatifs ; le site fonctionne dans un sous-dossier GitHub Pages.

## Vérifications

```sh
node --test tests/*.test.js
```

Les tests vérifient le catalogue et l’amplitude des 32 WAV, la superposition, l’exclusivité des boucles, le STOP y compris pendant le chargement, les volumes indépendants, un fichier absent suivi d’un son valide et la persistance des préférences. Le moteur audio est testé avec une doublure Web Audio ; cela ne valide pas la restitution sur un haut-parleur physique.

La mise à jour CC0 a également été testée dans Chromium avec Web Audio et IndexedDB réels : 17 scénarios réussis, dont le décodage des 32 fichiers, lecture/superposition, boucles exclusives, STOP, recherche/favoris, volumes, import/renommage/suppression, persistance après rechargement, mode hors ligne et fichier absent. Aucun événement pageerror n’a été observé. L’absence de défilement horizontal a été vérifiée à 320, 360, 390, 768 et 1440 px, avec STOP visible sur mobile. Ces tests sur navigateur de bureau en mode mobile ne remplacent pas une écoute sur un téléphone physique, notamment sous Safari iOS.

Le test navigateur optionnel `python tests/browser_qa.py` nécessite Playwright et Chromium installés dans l’environnement de développement ; l’application elle-même ne nécessite aucune dépendance. Les 7 tests Node se lancent aussi avec `nodetests/core.test.js`. Le test de provenance compare les empreintes SHA-256 des 25 fichiers CC0 au manifeste.

## Limites connues

- Sept effets musicaux ou fantastiques restent synthétisés ; les 25 autres sont des fichiers CC0 importés. La fidélité des préécoutes MP3 source et le format mono limitent la qualité par rapport aux masters.
- La lecture dépend des formats pris en charge par le navigateur ; WAV PCM et MP3 sont conseillés pour les imports.
- iOS et Android peuvent interrompre l’audio lors du verrouillage de l’écran ou d’un appel. Le premier clic autorise la lecture ; une restriction du navigateur produit un message invitant à réessayer.
- Une ressource absente ou illisible est désactivée explicitement sans bloquer les autres sons. Recharger la page après réparation du fichier.
- Les gros fichiers compressés peuvent occuper beaucoup plus de mémoire une fois décodés. Privilégier des effets courts.
- Projet indépendant, non affilié aux auteurs ou à l’éditeur du jeu.
