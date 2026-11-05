# addictoscope

Pipeline open-source transformant du texte libre issu de notes médicales
(addictologie) en infographies structurées et synthèses de données. Le
projet démarre uniquement avec la brique **frise chronologique** :
extraction d'événements datés depuis des notes cliniques et mise en forme
visuelle, permettant de prendre du recul sur une trajectoire de soin plutôt
que de rester noyé dans les fluctuations événementielles du quotidien.

## Principes

- **UI** : en français.
- **Code** (identifiants, commentaires, commits) : en anglais.
- **Application web** (`web/`) : TypeScript + React, servie comme un site
  statique. Elle tourne sur des postes modestes, sans installation. Le
  Python reste la couche de modélisation, de référence et d'évaluation.
- **Confidentialité** : conformité RGPD visée. La pseudonymisation des PDF
  se fait **dans le navigateur**, avant tout passage dans un pipeline IA. Les
  exemples (`data/anonymized/`) sont traités comme si les noms étaient réels.
  Voir [`docs/rgpd-pseudonymisation.md`](docs/rgpd-pseudonymisation.md).
- **Modèles** : API distantes via OpenRouter avec zéro conservation (ZDR),
  ou un point d'accès certifié HDS. Ils ne reçoivent que des documents
  pseudonymisés **et vérifiés**, ce que le code impose
  (`web/src/cloud/guard.ts`).

## Structure

```
web/                 application web (pseudonymisation locale, puis espace d'analyse)
src/addictoscope/   package Python (modèle de frise, extraction de référence, ...)
tests/               tests pytest
scripts/             génération des documents d'exemple fictifs
data/anonymized/     documents d'exemple **synthétiques** : PDF, Word, texte (+ ground_truth.json : identifiants fictifs plantés, voir data/anonymized/README.md)
data/anonymized/dossiers/  dossiers cliniques fictifs complets, avec frise et contradictions attendues
data/processed/      sorties structurées d'exemple
docs/                cahier des charges, templates, références, note RGPD
```

Ce dépôt est public et ne contient aucune donnée patient réelle — les
données brutes et le mémoire associé vivent dans un dépôt privé séparé.

## Application web

```bash
cd web
npm install          # copie le moteur OCR de secours et le runtime ONNX dans public/vendor/,
                     # et télécharge une fois dans public/models/ le modèle de noms (~110 Mo)
                     # et les modèles OCR PaddleOCR (~31 Mo, empreinte SHA-256 vérifiée)
npm run dev          # http://localhost:5173
npm run build        # site statique dans web/dist/, à servir depuis n'importe quel dossier
```

Il suffit de glisser ses documents dans la fenêtre : historiques
d'observations, comptes rendus, courriers, en **PDF** (même scannés), en
**Word** (.docx) ou en **texte** (.txt). Une note peut aussi être **collée**
directement (« Coller du texte »). Word et texte sont mis en page en PDF à
l'ouverture, dans le navigateur, puis suivent exactement le même chemin.
Pour chaque document :

1. **Lecture** : couche texte du PDF, ou OCR local pour les scans : PaddleOCR
   (PP-OCRv6), qui repère chaque ligne de la page, colonnes d'en-tête et
   marges comprises, même légèrement inclinée. Tesseract sert de secours si
   ses modèles n'ont pas pu être installés.
2. **Détection** : noms (rôle deviné d'après le contexte : patient, proche,
   soignant), IPP, NIR (clé vérifiée), n° de dossier, téléphones, e-mails,
   adresses, villes, établissements, date de naissance (seule l'année est
   gardée). Puis, en arrière-plan, un modèle d'IA local de reconnaissance des
   noms (CamemBERT-NER, quantifié, exécuté dans le navigateur) relit chaque
   page. Toute valeur trouvée une fois est recherchée dans tous les documents
   déposés.
3. **Relecture** : surlignages cliquables sur la page, liste par personne,
   ajout d'une zone en traçant un cadre.
4. **Masquage dans le PDF lui-même** (MuPDF/WebAssembly) avec étiquettes
   cohérentes, puis vérification du fichier produit. Ensuite, téléchargement
   du PDF ou de son texte (.txt), et export chiffré de la table de
   correspondance.

Aucune donnée ne quitte le poste : le moteur PDF, l'OCR et les modèles sont
servis avec l'application. Le navigateur les met en cache après la première
visite.

### Analyse par IA (documents vérifiés uniquement)

Une fois un document pseudonymisé et vérifié, « Analyser le dossier » envoie à
un modèle multimodal en ligne les **images des pages pseudonymisées** et leur
texte, lignes numérotées. Le modèle est choisi dans « IA en ligne » : OpenRouter
avec zéro conservation, ou un point d'accès HDS de l'établissement compatible
OpenAI.

1. **Découpage en observations** : le modèle voit la mise en page. Il
   distingue l'encadré répété d'une nouvelle observation, et recolle une
   observation coupée par un saut de page. Il cite chaque début et fin en
   « page / ligne ». Du code vérifie ensuite la réponse (bornes, ordre,
   chevauchements, dates).
2. **Frise chronologique** : six pistes (consommations, psychopathologie,
   somatique, médicaments, prises en charge, événements de vie). Chaque
   événement cite ses observations sources. Un événement sans source ou mal
   daté est écarté.
3. **Retour à la source** : cliquer un événement ouvre la page
   pseudonymisée, avec l'observation surlignée. Une vue tableau est aussi
   disponible.

4. **Frise ré-identifiée, sur le poste** : les vrais noms et la date de
   naissance reviennent depuis la table locale (bascule « Noms réels /
   Pseudonymes »), les antécédents racontés par l'âge sont datés ici. La
   frise s'exporte en page HTML (pseudonymisée, ou marquée « identifiante »)
   et l'analyse s'enregistre en `.json` pseudonymisé, à rouvrir plus tard
   avec la table chiffrée `.axkey` (« Rouvrir une analyse »).

### Où sont les données

- Un **parcours** en six étapes, sous la barre du haut, indique pour chacune
  où sont les données : « Ce poste » ou « En ligne · ZDR ».
- L'**indicateur** de la barre du haut dit en permanence ce qui est sorti :
  « Tout reste sur ce poste », « Envoi en cours → openrouter.ai », « N envois
  pseudonymisés ».
- Le **journal des envois** liste chaque requête (destination, modèle, ZDR,
  taille, images, durée, coût) et montre exactement ce qui part, texte et
  pages. Chaque envoi est relu sur le poste : nombre de valeurs réelles
  (éléments masqués à la relecture) retrouvées dans le texte, attendu 0.
  Les refus de la garde y figurent aussi.

### Démonstration (données fictives, sans clé)

L'accueil propose quatre dossiers entièrement inventés. Lecture, détection,
relecture, masquage et vérification s'exécutent pour de vrai ; l'analyse IA
rejoue les réponses enregistrées d'un vrai passage du modèle
(`web/public/demo/`, construit par `scripts/build-demo.ts`) : la garde, les
requêtes, les contrôles et la ré-identification tournent, seul le réseau est
remplacé. Deux enregistrements par dossier (Claude Sonnet 5.5 et Claude
Haiku 5.5) montrent l'écart de qualité et de coût.

```bash
cd web && npx vite-node scripts/build-demo.ts --runs=age1,bench/anthropic__claude-haiku-5.5
```

### Choix du modèle et coût

Banc d'essai de modèles via OpenRouter, tous en zéro conservation, sur les 14
dossiers fictifs ([comparaison](data/processed/frise/comparaison-modeles.md)) :

| Modèle | Rappel | ≈ coût d'un dossier réel |
|---|---|---|
| Claude Sonnet 5.5 (défaut) | 88 % | 1,17 $ |
| Sonnet pour la frise, Haiku pour le découpage | 86 % | ≈ 0,74 $ |
| DeepSeek V4.1 Flash | 81 % | 0,33 $ |
| GPT-5.6 Luna Pro | 78 % | 0,28 $ |
| Claude Haiku 5.5 | 75 % | 0,07 $ |
| GPT-5.6 Luna | 74 % | 0,09 $ |
| Mistral Small | 54 % | 0,04 $ |
| Gemini 3.5 Flash Lite | 47 % | 0,12 $ |

Sur les 6 dossiers réels, Claude Haiku 5.5 coûte 0,50 $ au total contre 7,00 $,
mais ne retrouve que la moitié des événements de la frise de Sonnet (67 % sur
les dossiers fictifs) : l'écart se creuse sur les dossiers longs.

```bash
cd web && npx vite-node scripts/run-frise.ts --model=<id> [--segment-model=<id>] --out=bench/<id avec __>
uv run python scripts/compare_models.py
```

## Installation (Python)

```bash
uv sync
```

## Tests

```bash
uv run pytest tests/ -v                        # Python
cd web && npm test                             # règles, masquage et vérification sur les documents fictifs
cd web && npm run e2e                          # parcours complet dans Chromium, aucune requête externe
uv run python scripts/make_synthetic_pdfs.py   # régénère les PDF fictifs
uv run python scripts/make_synthetic_texts.py  # puis la note Word et la note texte fictives
uv run python scripts/make_fictional_dossiers.py  # puis les dossiers cliniques fictifs
```

### Qualité de la frise (modèle réel, dossiers fictifs)

```bash
cd web && OPENROUTER_API_KEY=... npx vite-node scripts/run-frise.ts --out=run1   # masquage, découpage, frise
uv run python scripts/score_frise.py                                             # note contre verite.json
```

Le premier script suit le chemin de l'application sur chaque dossier de
`data/anonymized/dossiers/` et garde les réponses du modèle dans
`data/processed/frise/run1/`. Le second compare chaque frise à la frise
attendue de `verite.json` et écrit `data/processed/frise/rapport.md`.

Frise interactive (une page HTML autonome, lisible sur téléphone), à partir
d'un passage, avec le texte complet des notes (identités masquées) :

```bash
uv run python scripts/render_frise.py data/processed/frise/run1/opiaces-tso.json \
    --notes data/anonymized/dossiers/opiaces-tso -o data/processed/frise/interactive/opiaces-tso.html
```

Pour l'e2e, soit `npx playwright install chromium`, soit un Chromium déjà
installé : `PW_CHROMIUM=/usr/bin/chromium npm run e2e`.

## État actuel

- ✅ Jalon 1 : pseudonymisation locale des PDF dans le navigateur.
- ✅ Jalon 2 : espace d'analyse (découpage des observations par un modèle
  multimodal, frise chronologique), réservé aux documents vérifiés.
  Testé de bout en bout avec un modèle simulé, puis avec le modèle par
  défaut sur les quatorze dossiers fictifs (3 passages pour les trois
  premiers, 1 pour les onze autres) : chaque note découpée et datée, dans
  les deux mises en page d'historique, 88 % des événements attendus
  retrouvés sur la bonne piste et à la bonne date, chacun avec sa note
  source ([rapport](data/processed/frise/rapport.md) ; frises interactives
  dans `data/processed/frise/interactive/`). À évaluer encore sur des
  dossiers réels.
- ✅ Démonstration de bout en bout sur données fictives, journal des envois,
  ré-identification locale, export et réouverture d'une analyse.
- ⏳ Jalon 3 : questions sur le dossier avec renvoi à la page source.
- 🎯 Périmètre validé pour l'instant : **PDF avec couche texte, Word, texte
  et texte collé**. Les scans
  passent par PaddleOCR et sont masqués, mais leur évaluation est remise à
  plus tard : **la relecture humaine doit les vérifier**.
- 🔜 Plus tard : les scans (PDF image), puis l'écriture manuscrite
  (ordonnances, annotations), lue de travers par l'OCR et masquée seulement
  si un indice l'entoure (« Mr. », « Dr »).

## Licence

Code du projet sous licence MIT. L'application web embarque MuPDF
(AGPL-3.0, Artifex) pour le masquage dans le PDF : l'application web,
distribuée dans son ensemble, doit donc respecter l'AGPL, ce que fait la
publication de ce dépôt.
