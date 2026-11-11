# Dossiers fictifs longs

Des dossiers **entièrement inventés** (personnes, lieux de soins,
identifiants), de la taille des vrais : 20 à 30 pages, plusieurs années de
suivi, plusieurs dizaines de notes. C'est sur eux que la frise est évaluée.
Les dossiers courts de [`../dossiers/`](../dossiers/) (2 à 5 pages) restent
des cas de mise en page et de pseudonymisation.

Ce qui les distingue des dossiers courts, et qui fait la difficulté des vrais
dossiers :

- **une observation d'entrée** longue (700 à 1 400 mots) qui retrace tout le
  parcours : histoire de chaque consommation, antécédents psychiatriques,
  somatiques et familiaux, traitements, biographie ; presque tout y est daté
  par l'âge ou de façon approximative ;
- **des éléments révélés plus tard** : des faits anciens absents de
  l'observation d'entrée, confiés des mois ou des années après (au
  psychologue, à l'assistante sociale), ou retrouvés dans un courrier reçu ;
  certains corrigent ce que l'observation d'entrée affirmait ;
- **la répétition** : les notes de suivi recopient des rappels d'antécédents,
  parfois avec des variantes ;
- **le bruit** : rendez-vous manqués, appels de la pharmacie,
  renouvellements, transmissions sans événement ;
- **la durée** : un même traitement ou une même consommation commence dans
  une note et s'arrête trois ans et vingt pages plus loin.

## Calibrage

La structure est calée sur des comptes mesurés sur de vrais exports (aucun
contenu réel n'a servi) :

| | Dossiers réels (5 de plus de 10 pages) | Cible |
|---|---|---|
| Pages | 19 à 92 | 20 à 30 |
| Mots | 5 600 à 29 600 | 9 000 à 13 000 |
| Observations | 16 à 211 | 45 à 75 |
| Durée du suivi | 2 à 11 ans | 4 à 9 ans |
| Longueur médiane d'une observation | 81 à 167 mots | 60 à 110 mots |
| 9e décile | 214 à 547 mots | 250 à 500 mots |
| Observation la plus longue | 489 à 1 467 mots, parmi les premières dans 4 dossiers sur 5 | 700 à 1 400 mots, à l'entrée |

## Recette

1. **La vérité d'abord.** Écrire le parcours complet du patient, de l'enfance
   à la dernière note : chaque fait avec sa date, puis le plan des notes (qui
   écrit quoi, quand, ce qui est su à ce moment-là, ce qui est tu, ce qui est
   faux).
2. **Les notes ensuite**, dans l'ordre chronologique, chacune avec la voix de
   son auteur et ce qu'il sait ce jour-là.
3. **`verite.json` à partir des notes relues**, pas du plan : n'y figure que
   ce qu'un lecteur attentif peut tirer du dossier.
4. **Contrôle automatique** : `uv run python scripts/check_long_dossier.py <slug>`
   (format, sources, origines, taille) et
   `uv run python scripts/make_fictional_dossiers.py --check --only <slug>` (mise en page,
   identifiants).
5. **Audit indépendant** par un relecteur qui n'a pas écrit le dossier : chaque
   événement de la vérité est-il bien dans les notes citées, avec cette date ?
   Chaque fait daté des notes est-il dans la vérité ?

## Format

Comme les dossiers courts (voir `scripts/make_fictional_dossiers.py`), avec :

- `notes.txt` toujours **dans l'ordre chronologique** ; pour une « fiche
  d'observations », `"reverse": true` sur le document dans `verite.json` fait
  dessiner les notes de la plus récente à la plus ancienne ;
- dans `verite.json`, chaque événement de `timeline` porte une **origine** :

| `origin` | Sens |
|---|---|
| `intake` | antécédent, commencé avant le premier contact et rapporté dans les notes d'entrée (premier mois) |
| `follow_up` | survient pendant le suivi et est noté sur le moment |
| `late` | fait absent des notes d'entrée, mentionné pour la première fois plus de six mois après sa survenue : révélé ou retrouvé tard |

### Ce qui compte comme un événement

La vérité suit le modèle de l'application (six pistes) :

- `substance_use` : une piste par produit. Un événement par période d'usage
  (`mode` `usage` ; un changement net de niveau ouvre une nouvelle période),
  par sevrage (`sevrage`), par rechute (`rechute`), par intoxication notable
  (`intoxication` : surdose, ivresse aux urgences). `craving` seulement s'il
  est au centre d'une période. L'abstinence n'est pas un événement.
  `loss_of_control: true` si la perte de contrôle est décrite.
- `medication` : un événement par molécule et par période continue ; les
  changements de dose vont dans `note`.
- `psychiatric` : un événement par trouble ou par épisode.
- `somatic` : un événement par problème ou par accident aigu.
- `therapeutic_psycho` : un événement par prise en charge (le suivi lui-même,
  chaque hospitalisation, une psychothérapie, un groupe, une postcure).
- `life_event` : un événement par fait (emploi, logement, couple, deuil,
  justice, naissance).

N'y figurent pas : la logistique des rendez-vous, les résultats biologiques
isolés, l'état clinique d'un jour.

Dates : `start` et `end` en `AAAA`, `AAAA-MM` ou `AAAA-MM-JJ`, à la précision
que le dossier permet. `certainty` : `exact` (jour connu), `month`, `year`,
`approx` (« vers 16 ans », « il y a une dizaine d'années »). Un antécédent
daté par l'âge s'écrit avec l'année calculée depuis l'année de naissance et
`approx`. `ongoing: true` si toujours en cours à la dernière note. `sources` :
les notes où le fait est écrit, la première mention d'abord, sous la forme
`historique JJ/MM/AAAA` (date de la note) ou le nom d'un autre document
(`courrier`, `urgences`).
