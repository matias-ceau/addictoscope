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
- **Extraction** : Python, en priorité stdlib.
- **Rendu dynamique** (pages HTML) : Java/TypeScript, à un stade ultérieur.
- **Cible finale** : application web tournant en local (pas de service cloud
  pour les données patient).
- **Confidentialité** : conformité RGPD visée. Toute note d'entrée doit être
  anonymisée avant tout traitement ou passage dans un pipeline IA — y
  compris les exemples fournis ici (`data/anonymized/`), traités par le
  pipeline comme si les noms étaient réels.
- **Modèles** : prototypage via API distantes, exclusivement au travers
  d'OpenRouter. Les modèles locaux sont une étape ultérieure.

## Structure

```
src/addictoscope/   package Python (extraction, anonymisation, frise, ...)
tests/               tests pytest
data/anonymized/     notes d'exemple anonymisées, pour illustrer l'outil
data/processed/      sorties structurées d'exemple
docs/                cahier des charges, templates, références
```

Ce dépôt est public et ne contient aucune donnée patient réelle — les
données brutes et le mémoire associé vivent dans un dépôt privé séparé.

## Installation

```bash
uv sync
```

## Tests

```bash
uv run pytest tests/ -v
```

## État actuel

Squelette de dépôt uniquement. La brique frise chronologique sera
implémentée une fois le template et le cahier des charges (`docs/`)
exploités.
