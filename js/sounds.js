import { sourcedSounds } from './sources.js';
/* Catalogue modifiable : les chemins restent relatifs à index.html. */
export const categories = [
  { id: 'ambiances', name: 'Ambiances', icon: '☾', description: 'Installez le décor. La nuit a ses secrets.' },
  { id: 'personnages', name: 'Personnages', icon: '✧', description: 'À chaque rôle, son entrée en scène.' },
  { id: 'evenements', name: 'Événements', icon: '⚑', description: 'Donnez du relief aux moments décisifs.' },
  { id: 'humour', name: 'Humour', icon: '☺', description: 'Même les nuits sombres ont leurs petits ratés.' }
];
const rows = [
 ['wolf','Hurlement de loup','ambiances','🐺',false,.8,4.2],
 ['rooster','Chant du coq','ambiances','🐓',false,.65,2.5],
 ['owl','Hibou','ambiances','🦉',false,.75,2.4],
 ['night','Ambiance nocturne','ambiances','🌙',true,.7,12],
 ['wind','Vent inquiétant','ambiances','🍃',true,.6,10],
 ['bells','Cloches de village','ambiances','🔔',false,.7,4.5],
 ['thunder','Tonnerre','ambiances','⛈️',false,.65,4],
 ['witch','Potion magique','personnages','🧪',false,.7,2.8],
 ['seer','Effet mystique','personnages','🔮',false,.6,3],
 ['cupid','Flèche de Cupidon','personnages','🏹',false,.7,1.2],
 ['hunter','Coup de fusil','personnages','💥',false,.55,1.5],
 ['girl','Rire inquiétant','personnages','🎀',false,.6,2.5],
 ['thief','Pièces du voleur','personnages','🗝️',false,.7,1.8],
 ['shield','Bouclier du salvateur','personnages','🛡️',false,.7,2],
 ['flute','Joueur de flûte','personnages','🪈',false,.75,3.8],
 ['crow','Croassement du corbeau','personnages','🪶',false,.7,2.2],
 ['clap','Applaudissements','evenements','👏',false,.65,3],
 ['boo','Huées','evenements','👎',false,.65,2.5],
 ['death','Mort dramatique','evenements','💀',false,.65,3.5],
 ['knell','Glas funèbre','evenements','⚰️',false,.7,5],
 ['heart','Battements de cœur','evenements','🫀',false,.8,4],
 ['drum','Roulement de tambour','evenements','🥁',false,.65,3],
 ['clock','Tic-tac','evenements','⏱️',false,.75,4],
 ['gavel','Coup de marteau','evenements','🔨',false,.7,1],
 ['village','Victoire des villageois','evenements','🌞',false,.65,4],
 ['wolves','Victoire des loups-garous','evenements','🐺',false,.65,4],
 ['fail','Trombone triste','humour','🎺',false,.7,3],
 ['scream','Cri théâtral','humour','😱',false,.6,1.8],
 ['scratch','Record scratch','humour','💿',false,.65,1],
 ['evil','Rire diabolique','humour','😈',false,.65,3],
 ['goat','Cri de chèvre','humour','🐐',false,.7,2],
 ['crickets','Grillons gênants','humour','🦗',false,.65,3]
];
export const sounds = rows.map(([id,name,category,icon,loop,volume,duration]) => ({id,name,category,icon,loop,volume,duration,src:`assets/audio/${id}.wav`,origin:'Synthèse originale',...sourcedSounds[id]}));
