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

Le navigateur peut supprimer ses données en cas de manque d’espace, d’effacement manuel ou de navigation privée. Conserver les fichiers personnels originaux. Les paramètres et sons ne sont pas synchronisés entre appareils. Pour mettre à jour les ressources du site, augmenter le nom de cache `la-veillee-v1` dans `sw.js` et `js/app.js`.

## Sons disponibles et provenance

**32 sons réellement présents**, au format WAV mono PCM 16 bits, 22 050 Hz, environ 4,6 Mo au total. Ce sont des créations procédurales originales, sans enregistrement externe. `SOUND_SOURCES.md` détaille chaque fichier. Le script Python standard `scripts/generate_audio.py` permet de les régénérer sans dépendance.

Les imitations organiques (loup, coq, rires, chèvre, applaudissements…) sont volontairement stylisées et ne remplacent pas des enregistrements réalistes. Le « Cri théâtral » est une alternative synthétique originale, pas le cri Wilhelm. Aucun élément du catalogue n’est un bouton sans audio ; aucun fichier manquant à la livraison.

## Architecture

```text
index.html                 Interface accessible en français
css/style.css              Thème sombre, responsive, mouvement réduit
js/app.js                  Recherche, catégories, favoris, import et interface
js/audio.js                Web Audio, deux bus, exclusivité et superposition
js/sounds.js               Catalogue modifiable et métadonnées
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

Le lancement d’un serveur et les tests dans un navigateur ont été bloqués par les permissions de l’environnement de développement. Les parcours visuels, le mode hors ligne, IndexedDB, l’import/suppression et le comportement sur appareil mobile restent à vérifier dans un navigateur réel. La grille prévoit 2 colonnes sur les écrans très étroits, 3 sur téléphone, puis 4 ou 5 selon l’espace disponible ; le STOP reste flottant sur mobile.

## Limites connues

- Les sons sont synthétiques, en particulier les imitations de voix et d’animaux.
- La lecture dépend des formats pris en charge par le navigateur ; WAV PCM et MP3 sont conseillés pour les imports.
- iOS et Android peuvent interrompre l’audio lors du verrouillage de l’écran ou d’un appel. Le premier clic autorise la lecture ; une restriction du navigateur produit un message invitant à réessayer.
- Une ressource absente ou illisible est désactivée explicitement sans bloquer les autres sons. Recharger la page après réparation du fichier.
- Les gros fichiers compressés peuvent occuper beaucoup plus de mémoire une fois décodés. Privilégier des effets courts.
- Projet indépendant, non affilié aux auteurs ou à l’éditeur du jeu.
