# Dossiers cliniques fictifs

Quatorze dossiers de patients **entièrement inventés** : personnes, lieux de
soins, identifiants. Chacun raconte une histoire clinique cohérente à travers
les notes de plusieurs intervenants, sur plusieurs mois, avec les défauts des
vrais dossiers :

- **un style par intervenant** : urgentiste télégraphique, interne bavard qui
  hésite, transmissions de nuit sans accents, psychologue qui cite le
  patient, assistante sociale centrée sur les démarches, courrier au médecin
  traitant ; dans les onze derniers dossiers, surtout les observations
  psychiatriques de suivi d'un CSAPA (« Vu ce jour », « Entretien
  téléphonique : », consommations chiffrées, « RO », « RDV dans 15 jours »,
  type de note parfois mal choisi) ;
- **des fautes de frappe**, y compris dans les noms (« DESMAZURE »,
  « ROUQETTE », « PEYRAUDE ») ;
- **des dates approximatives** (« il y a 3 ans », « vers 14 ans », « depuis
  les fêtes », « l'été dernier ») ;
- **des affirmations qui se contredisent** (âge de début, doses, diagnostics,
  rechute tue au psychiatre), alors que l'histoire d'ensemble reste
  cohérente ;
- **les pièges de mise en page** : encadré d'identité répété sur chaque page,
  note coupée par un saut de page, liste de l'équipe en colonne à gauche
  d'un courrier, tableau d'identité d'un compte rendu des urgences ;
- **deux mises en page d'historique** : l'historique encadré, notes de la
  plus ancienne à la plus récente, et la « fiche d'observations » (ligne
  patient avec n° d'admission, médecin référent et unités sur chaque page,
  notes de la plus récente à la plus ancienne, « Validé automatiquement le
  ... par NOM PRÉNOM »).

| Dossier | Patient·e | Documents |
|---|---|---|
| `alcool-depression/` | femme de 50 ans, trouble de l'usage de l'alcool sévère, épisode dépressif ; urgences, sevrage hospitalier, 14 mois de suivi, deuil, rechute | historique (18 notes), courrier de sortie |
| `opiaces-tso/` | homme de 35 ans sous méthadone en CSAPA ; overdose, rechute de crack, information préoccupante pour sa fille, insertion | historique (15 notes) |
| `cannabis-jeune/` | femme de 21 ans en consultation jeunes consommateurs ; hyperémèse cannabinoïde, trouble panique, TDAH discuté | historique (10 notes), compte rendu des urgences |
| `bupre-grossesse/` | femme de 28 ans sous buprénorphine ; grossesse, deux reprises ponctuelles d'héroïne, syndrome de sevrage néonatal, dépression du post-partum, séparation | historique (16 notes) |
| `chemsex-prep/` | homme de 37 ans, chemsex (3-MMC injectée, GHB/GBL) sous PrEP ; coma au GHB, sevrage hospitalier, épisode dépressif, rechute | fiche d'observations (15 notes) |
| `alcool-cirrhose/` | homme de 56 ans, alcool, cirrhose, crise convulsive de sevrage ; deuil, hémorragie digestive, greffe suspendue après rechute, décès | fiche d'observations (17 notes) |
| `crack-rue/` | femme de 32 ans sans domicile, crack et alcool, TSPT complexe ; décès de son ex-compagnon par overdose, pneumopathie, CHRS, EMDR | historique (18 notes, CAARUD et CSAPA) |
| `bzd-anxiete/` | femme de 65 ans, dépendance aux benzodiazépines, anxiété généralisée ; fracture du col, crise convulsive de sevrage, décroissance sur 19 mois | historique (13 notes), courrier du médecin traitant |
| `jeu-bipolaire/` | homme de 44 ans, paris sportifs en ligne, trouble bipolaire de type II ; dettes, interdiction de jeux, hypomanie, surendettement | fiche d'observations (14 notes) |
| `methadone-schizophrenie/` | homme de 39 ans sous méthadone, schizophrénie, curatelle ; hépatite C guérie, soins sans consentement, QTc allongé, passage aux gélules | fiche d'observations (15 notes) |
| `cannabis-justice/` | homme de 18 ans, cannabis sous obligation de soins ; épisode psychotique aux cannabinoïdes de synthèse, TDAH, apprentissage | historique (13 notes), compte rendu des urgences |
| `alcool-tspt/` | femme de 41 ans, alcool caché, TSPT après violences conjugales ; sevrage ambulatoire, rechute, intoxication médicamenteuse volontaire, EMDR | fiche d'observations (15 notes) |
| `tabac-infarctus/` | femme de 51 ans, tabagisme sévère, infarctus ; varénicline, rechute, vapoteuse, trouble de l'adaptation anxieux | historique (10 notes, tabacologie) |
| `antalgiques-opioides/` | femme de 47 ans, oxycodone et tramadol sur douleur chronique ; surdosage, buprénorphine puis injectable mensuelle, centre de la douleur | fiche d'observations (13 notes) |

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

Dans un dossier « fiche d'observations », le PDF s'appelle aussi
`historique.pdf` et ses notes sont citées « historique JJ/MM/AAAA ».

Régénérer les PDF après une modification des textes :

```bash
uv run python scripts/make_fictional_dossiers.py
```
