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
data/anonymized/     documents d'exemple fictifs : PDF, Word, texte (+ ground_truth.json des identifiants plantés)
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
```

Pour l'e2e, soit `npx playwright install chromium`, soit un Chromium déjà
installé : `PW_CHROMIUM=/usr/bin/chromium npm run e2e`.

## État actuel

- ✅ Jalon 1 : pseudonymisation locale des PDF dans le navigateur.
- ✅ Jalon 2 : espace d'analyse (découpage des observations par un modèle
  multimodal, frise chronologique), réservé aux documents vérifiés.
  Testé de bout en bout avec un modèle simulé. La qualité réelle des
  réponses reste à évaluer avec une clé d'API.
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
