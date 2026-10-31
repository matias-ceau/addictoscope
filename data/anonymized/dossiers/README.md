# Dossiers cliniques fictifs

Trois dossiers de patients **entièrement inventés** : personnes, lieux de
soins, identifiants. Chacun raconte une histoire clinique cohérente à travers
les notes de plusieurs intervenants, sur plusieurs mois, avec les défauts des
vrais dossiers :

- **un style par intervenant** : urgentiste télégraphique, interne bavard qui
  hésite, transmissions de nuit sans accents, psychologue qui cite le
  patient, assistante sociale centrée sur les démarches, courrier au médecin
  traitant ;
- **des fautes de frappe**, y compris dans les noms (« DESMAZURE »,
  « ROUQETTE », « PEYRAUDE ») ;
- **des dates approximatives** (« il y a 3 ans », « vers 14 ans », « depuis
  les fêtes », « l'été dernier ») ;
- **des affirmations qui se contredisent** (âge de début, doses, diagnostics,
  rechute tue au psychiatre), alors que l'histoire d'ensemble reste
  cohérente ;
- **les pièges de mise en page** : encadré d'identité répété sur chaque page,
  note coupée par un saut de page, liste de l'équipe en colonne à gauche
  d'un courrier, tableau d'identité d'un compte rendu des urgences.

| Dossier | Patient·e | Documents |
|---|---|---|
| `alcool-depression/` | femme de 50 ans, trouble de l'usage de l'alcool sévère, épisode dépressif ; urgences, sevrage hospitalier, 14 mois de suivi, deuil, rechute | historique (18 notes), courrier de sortie |
| `opiaces-tso/` | homme de 35 ans sous méthadone en CSAPA ; overdose, rechute de crack, information préoccupante pour sa fille, insertion | historique (15 notes) |
| `cannabis-jeune/` | femme de 21 ans en consultation jeunes consommateurs ; hyperémèse cannabinoïde, trouble panique, TDAH discuté | historique (10 notes), compte rendu des urgences |

## Contenu de chaque dossier

- `notes.txt`, `courrier.txt`, `urgences.txt` : les textes tels qu'écrits.
- `*.pdf` : les documents mis en page, à déposer dans l'application.
- `verite.json` : ce qu'un lecteur attentif doit en retenir :
  - `documents.*.identifiers` : chaque identifiant planté, document par
    document (ils figurent aussi dans `../ground_truth.json`, et les tests
    vérifient qu'aucun ne reste lisible après pseudonymisation) ;
  - `timeline` : la frise attendue, dans le modèle de l'application (pistes,
    dates partielles `AAAA`, `AAAA-MM` ou `AAAA-MM-JJ`, mode d'usage), avec le
    degré de certitude de chaque date et les notes sources ;
  - `contradictions` : chaque contradiction plantée, ses versions et la
    lecture à retenir.

Noter la frise que produit l'application contre `verite.json` (modèle réel,
clé OpenRouter) : voir « Qualité de la frise » dans le README principal ;
dernier rapport : [`data/processed/frise/rapport.md`](../../processed/frise/rapport.md).

Régénérer les PDF après une modification des textes :

```bash
uv run python scripts/make_fictional_dossiers.py
```
