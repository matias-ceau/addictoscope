# Données anonymisées : exemples fictifs

**Tout ce dossier est synthétique.** Aucun document, nom, date de naissance,
numéro ou adresse ne vient d'un vrai patient ni d'un vrai soignant : les
personnes, les établissements et les identifiants sont inventés par les
scripts `scripts/make_synthetic_*.py` et `scripts/make_fictional_dossiers.py`.
Les coordonnées (`example.fr`, numéros `06 12 34 56 78`…) sont des valeurs
d'exemple.

## `ground_truth.json`

Liste, pour chaque document d'exemple, les **identifiants fictifs plantés**
dans ce document (noms, dates de naissance, numéros, adresses…). Les tests
s'en servent pour vérifier que le masquage ne laisse rien passer.

Ce sont des valeurs inventées, pas des informations de patients : le fichier
peut donc rester dans le dépôt public. Il est régénéré par
`scripts/make_synthetic_pdfs.py` ; ne jamais y ajouter un identifiant réel.

## Autres fichiers

- `synthetique-*` : documents d'exemple (PDF, Word, texte) à un seul patient fictif.
- `dossiers/` : trois dossiers cliniques fictifs complets avec leur frise
  attendue (`verite.json`), voir `dossiers/README.md`.
