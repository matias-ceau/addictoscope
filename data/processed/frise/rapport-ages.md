# Frise des dossiers fictifs, notée contre `verite.json`

Passage `age1` (04/11/2026) : prompt qui renvoie les antécédents datés par l'âge (`start_age`), dates calculées localement depuis l'année de naissance (SPEC.md). Événements attendus datés par l'âge : 17/20 trouvés (contre 11/20 au passage `run1`) ; rappel global 281/320 (contre 285/320), un seul passage.

- Modèle : anthropic/claude-sonnet-5.5 ; 1 passage(s) par dossier ; coût total 2.06 $.
- Dates des passages : 2026-11-04 → 2026-11-04.
- Chemin de l'application : couche texte → détections automatiques acceptées telles quelles (à la place de la relecture humaine) → masquage → vérification → images des pages masquées → découpage → frise.
- Tolérance sur les dates selon la certitude attendue : exacte ±3 j, mois ±15 j, année : l'année, approximative ±1 an.
- « Trouvé » = même piste, même libellé (à la formulation près), début compatible. La précision est une borne basse : un événement « en plus » peut être vrai et absent de la vérité.

## Synthèse

| Dossier | Attendus | Trouvés | Mal datés | Autre piste | Manqués | Produits | Rappel | Précision (borne basse) | Observations rendues / attendues |
|---|---|---|---|---|---|---|---|---|---|
| `alcool-cirrhose` | 28 | 24 | 2 | 1 | 1 | 36 | 86 % | 67 % | 17/17 |
| `alcool-depression` | 31 | 28 | 1 | 1 | 1 | 39 | 90 % | 72 % | 19/19 |
| `alcool-tspt` | 24 | 22 | 0 | 0 | 2 | 31 | 92 % | 71 % | 15/15 |
| `antalgiques-opioides` | 17 | 14 | 1 | 0 | 2 | 22 | 82 % | 64 % | 13/13 |
| `bupre-grossesse` | 22 | 16 | 1 | 1 | 4 | 31 | 73 % | 52 % | 16/16 |
| `bzd-anxiete` | 16 | 14 | 0 | 1 | 1 | 26 | 88 % | 54 % | 14/14 |
| `cannabis-jeune` | 19 | 16 | 2 | 0 | 1 | 20 | 84 % | 80 % | 11/11 |
| `cannabis-justice` | 19 | 17 | 1 | 0 | 1 | 21 | 89 % | 81 % | 14/14 |
| `chemsex-prep` | 27 | 25 | 1 | 0 | 1 | 37 | 93 % | 68 % | 15/15 |
| `crack-rue` | 30 | 29 | 0 | 0 | 1 | 37 | 97 % | 78 % | 18/18 |
| `jeu-bipolaire` | 23 | 21 | 0 | 0 | 2 | 27 | 91 % | 78 % | 14/14 |
| `methadone-schizophrenie` | 19 | 13 | 1 | 1 | 4 | 21 | 68 % | 62 % | 15/15 |
| `opiaces-tso` | 29 | 27 | 1 | 0 | 1 | 35 | 93 % | 77 % | 15/15 |
| `tabac-infarctus` | 16 | 15 | 0 | 0 | 1 | 21 | 94 % | 71 % | 10/10 |
| **Total** | 320 | 281 | | | | 404 | 88 % | 70 % | |

## Exactitude des événements trouvés

| Contrôle | `alcool-cirrhose` | `alcool-depression` | `alcool-tspt` | `antalgiques-opioides` | `bupre-grossesse` | `bzd-anxiete` | `cannabis-jeune` | `cannabis-justice` | `chemsex-prep` | `crack-rue` | `jeu-bipolaire` | `methadone-schizophrenie` | `opiaces-tso` | `tabac-infarctus` | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| début aussi précis | 100 % | 100 % | 100 % | 93 % | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % | 92 % | 100 % | 93 % | 99 % (278/281) |
| fin compatible | 75 % | 78 % | 75 % | 50 % | 75 % | 50 % | 50 % | 60 % | 92 % | 89 % | 67 % | 83 % | 64 % | 64 % | 72 % (83/115) |
| « en cours » juste | 75 % | 93 % | 91 % | 86 % | 75 % | 93 % | 88 % | 94 % | 96 % | 93 % | 95 % | 92 % | 89 % | 93 % | 90 % (252/281) |
| mode d'usage juste | 100 % | 86 % | 80 % | 75 % | 100 % | 100 % | 100 % | 83 % | 75 % | 100 % | 100 % | 100 % | 88 % | 100 % | 91 % (72/79) |
| au moins une source attendue | 100 % | 100 % | 100 % | 93 % | 94 % | 100 % | 100 % | 100 % | 100 % | 97 % | 100 % | 100 % | 100 % | 100 % | 99 % (278/281) |

## Rappel par piste (tous dossiers, tous passages)

| Piste | Trouvés / attendus | Rappel |
|---|---|---|
| Consommations | 79/90 | 88 % |
| Psychopathologie | 24/29 | 83 % |
| Somatique | 24/27 | 89 % |
| Médicaments | 57/63 | 90 % |
| Prises en charge | 45/55 | 82 % |
| Événements de vie | 52/56 | 93 % |

## Validation par le code

Événements rendus par le modèle, puis écartés ou fusionnés par `assembleTimeline` (`web/src/notebook/timeline.ts`).

| Passage | Dossier | Rendus | Piste inconnue | Date illisible | Sans source connue | Fusionnés (doublons) | Gardés |
|---|---|---|---|---|---|---|---|
| age1 | `alcool-cirrhose` | 37 | 0 | 3 | 0 | -2 | 36 |
| age1 | `alcool-depression` | 40 | 0 | 2 | 0 | -1 | 39 |
| age1 | `alcool-tspt` | 32 | 0 | 2 | 0 | -1 | 31 |
| age1 | `antalgiques-opioides` | 24 | 0 | 2 | 0 | 0 | 22 |
| age1 | `bupre-grossesse` | 36 | 0 | 6 | 0 | -1 | 31 |
| age1 | `bzd-anxiete` | 26 | 0 | 1 | 0 | -1 | 26 |
| age1 | `cannabis-jeune` | 20 | 0 | 4 | 0 | -4 | 20 |
| age1 | `cannabis-justice` | 21 | 0 | 3 | 0 | -3 | 21 |
| age1 | `chemsex-prep` | 38 | 0 | 3 | 0 | -2 | 37 |
| age1 | `crack-rue` | 38 | 0 | 4 | 0 | -3 | 37 |
| age1 | `jeu-bipolaire` | 27 | 0 | 0 | 0 | 0 | 27 |
| age1 | `methadone-schizophrenie` | 27 | 0 | 7 | 0 | -1 | 21 |
| age1 | `opiaces-tso` | 35 | 0 | 5 | 0 | -5 | 35 |
| age1 | `tabac-infarctus` | 21 | 0 | 2 | 0 | -2 | 21 |

## Découpage en observations

| Passage | Document | Attendues | Rendues | Dates justes |
|---|---|---|---|---|
| age1 | `alcool-cirrhose/historique.pdf` | 17 | 17 | 17/17 |
| age1 | `alcool-depression/courrier.pdf` | 1 | 1 | 0/0 |
| age1 | `alcool-depression/historique.pdf` | 18 | 18 | 18/18 |
| age1 | `alcool-tspt/historique.pdf` | 15 | 15 | 15/15 |
| age1 | `antalgiques-opioides/historique.pdf` | 13 | 13 | 13/13 |
| age1 | `bupre-grossesse/historique.pdf` | 16 | 16 | 16/16 |
| age1 | `bzd-anxiete/courrier.pdf` | 1 | 1 | 0/0 |
| age1 | `bzd-anxiete/historique.pdf` | 13 | 13 | 13/13 |
| age1 | `cannabis-jeune/historique.pdf` | 10 | 10 | 10/10 |
| age1 | `cannabis-jeune/urgences.pdf` | 1 | 1 | 0/0 |
| age1 | `cannabis-justice/historique.pdf` | 13 | 13 | 13/13 |
| age1 | `cannabis-justice/urgences.pdf` | 1 | 1 | 0/0 |
| age1 | `chemsex-prep/historique.pdf` | 15 | 15 | 15/15 |
| age1 | `crack-rue/historique.pdf` | 18 | 18 | 18/18 |
| age1 | `jeu-bipolaire/historique.pdf` | 14 | 14 | 14/14 |
| age1 | `methadone-schizophrenie/historique.pdf` | 15 | 15 | 15/15 |
| age1 | `opiaces-tso/historique.pdf` | 15 | 15 | 15/15 |
| age1 | `tabac-infarctus/historique.pdf` | 10 | 10 | 10/10 |

## Détail par dossier

### `alcool-cirrhose`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Alcool | 2015 → 2023-03-27 (year) | usage | trouvé | Alcool · 2015 → 2023-03-27 · usage |
| Consommations | Alcool | 2022-11 (month) | sevrage | mal daté | Alcool · 2023-11-20 → 2023-11-24 · sevrage |
| Consommations | Alcool | 2023-03-27 → 2023-04-07 (exact) | sevrage | trouvé | Alcool · 2023-03-27 → 2023-04-07 · sevrage |
| Consommations | Alcool | 2023-06 → 2023-11-20 (month) | rechute | trouvé | Alcool · 2023-06 → 2023-11-20 · rechute |
| Consommations | Alcool | 2024-06 (month) | craving | trouvé | Alcool · 2024-06 · craving |
| Consommations | Alcool | 2024-07 → 2024-08-25 (approx) | rechute | trouvé | Alcool · 2024-07 → 2024-08-25 · rechute |
| Consommations | Tabac | 1982 (approx) | usage | trouvé | Tabac · 1982 → · usage ⚠ « en cours » juste |
| Psychopathologie | Épisode dépressif (deuil) | 2023-07 → 2024-03 (approx) |  | trouvé | Deuil difficile · 2023-06-26 → 2024-03 |
| Psychopathologie | Thymie abaissée | 2024-09 (approx) |  | trouvé | Thymie abaissée · 2024-08-29 → ⚠ « en cours » juste |
| Somatique | Cirrhose alcoolique | 2022 (year) |  | trouvé | Cirrhose alcoolique · 2022 → ⚠ « en cours » juste |
| Somatique | Crise convulsive de sevrage | 2022-11 (month) |  | trouvé | Crise convulsive généralisée · 2022-11 |
| Somatique | Décompensation œdémato-ascitique | 2023-01 (month) |  | trouvé | Décompensation oedémato-ascitique · 2023-01 |
| Somatique | Ascite (ponctions) | 2023-10-09 (exact) |  | trouvé | Ascite, ponction évacuatrice · 2023-10-09 |
| Somatique | Hémorragie digestive (rupture de varices œsophagiennes) | 2023-11-20 → 2023-11-24 (exact) |  | trouvé | Hémorragie digestive sur rupture de varices oesophagiennes · 2023-11-20 → 2023-11-24 |
| Somatique | Décompensation hépatique (encéphalopathie) | 2024-12-02 → 2025-01-14 (exact) |  | trouvé | Hospitalisation en hépatologie (ictère, ascite, encéphalopathie hépatique) · 2024-12-02 → 2025-01-14 |
| Médicaments | Oxazépam | 2023-03-27 → 2023-04-07 (exact) |  | trouvé | Oxazépam · 2023-03-27 → 2023-04-07 |
| Médicaments | Thiamine | 2023-03-27 (exact) |  | mal daté | Thiamine · 2023-04-11 |
| Médicaments | Baclofène | 2023-04-11 → 2025-01-14 (exact) |  | trouvé | Baclofène · 2023-04-11 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Mirtazapine | 2023-07-18 → 2025-01-14 (exact) |  | trouvé | Mirtazapine · 2023-07-18 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Substituts nicotiniques | 2024-01-09 (exact) |  | trouvé | Substituts nicotiniques · 2024-01-09 → ⚠ « en cours » juste |
| Prises en charge | Suivi addictologique (CSAPA) | 2023-03-06 → 2025-01-14 (exact) |  | trouvé | Suivi addictologique · 2023-03-06 → 2025-01-21 ⚠ fin compatible |
| Prises en charge | Hospitalisation pour sevrage | 2023-03-27 → 2023-04-07 (exact) |  | trouvé | Hospitalisation en addictologie pour sevrage · 2023-03-27 → 2023-04-07 |
| Prises en charge | Suivi hépatologique | 2022 (approx) |  | manqué |  |
| Prises en charge | Accompagnement social | 2023-09-05 (exact) |  | trouvé | Entretien social · 2023-09-05 |
| Prises en charge | Inscription sur liste de greffe hépatique | 2024-06-18 → 2024-08-29 (exact) |  | autre piste | Inscription sur liste de greffe hépatique · 2024-06-18 → 2024-08-29 |
| Événements de vie | Licenciement | 2015 (year) |  | trouvé | Licenciement · 2015 |
| Événements de vie | Décès de son frère | 2023-06-26 (exact) |  | trouvé | Décès du frère · 2023-06-26 |
| Événements de vie | Décès du patient | 2025-01-14 (exact) |  | trouvé | Décès du patient · 2025-01-14 |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Alcool** · 1984 → 2015 · usage — Consommation festive depuis l'âge de 18 ans, devenue quotidienne après le licenciement en 2015.
- Consommations · **Alcool** · 2023-07-04 · craving — Craving ++ après les obsèques du frère.
- Somatique · **Bilan pré-greffe hépatique** · 2024-03 → 2024-06-18 — Consultations anesthésie, cardiologie. RCP du 18/06 : accord pour inscription sur liste. Greffe abordée en janvier 2024 (abstinence durable exigée).
- Somatique · **Ascite récidivante** · 2024-10 — Ponction prévue la semaine suivante, fatigue ++.
- Médicaments · **Oxazépam** · 2023-11-20 → 2023-11-24 — Pour le sevrage pendant l'hospitalisation pour hémorragie digestive.
- Prises en charge · **Entretien de pré-admission IDE** · 2023-03-20 — Pour sevrage hospitalier, accompagné de son épouse.
- Événements de vie · **Invalidité catégorie 2** · 2022 → — En invalidité catégorie 2 depuis 2022.
- Événements de vie · **Frère hospitalisé en soins palliatifs** · 2023-05 → 2023-06-26 — Patient préoccupé par l'état de santé de son frère.
- Événements de vie · **Épuisement de l'épouse** · 2023-09-05 — Elle « parle de partir » si les consommations continuent.

### `alcool-depression`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Alcool | 2015 → 2019 (approx) | usage | trouvé | Alcool · 2015 → 2022-12-05 · usage ⚠ fin compatible |
| Consommations | Alcool | 2019 (approx) | sevrage | autre piste | Sevrage hospitalier en clinique (clinique des Pins) · 2019 |
| Consommations | Alcool | 2019 → 2022-12-05 (approx) | rechute | mal daté | Alcool · 2023-01 · rechute |
| Consommations | Alcool | 2022-11-14 (exact) | intoxication | trouvé | Alcool · 2022-11-14 · intoxication |
| Consommations | Alcool | 2022-12-05 → 2022-12-16 (exact) | sevrage | trouvé | Alcool · 2022-12-05 → 2022-12-16 · sevrage |
| Consommations | Alcool | 2022-12-25 (exact) | rechute | trouvé | Alcool · 2022-12-25 · rechute |
| Consommations | Alcool | 2023-02 (month) | usage | trouvé | Alcool · 2023-02 · rechute ⚠ mode d'usage juste |
| Consommations | Alcool | 2023-04 (month) | craving | trouvé | Alcool · 2023-04 · craving |
| Consommations | Alcool | 2024-01 → (month) | rechute | trouvé | Alcool · 2024-01 → · rechute |
| Consommations | Tabac | 2022-11 → (approx) | usage | manqué |  |
| Psychopathologie | Épisode dépressif caractérisé | 2022-11 → 2023-09 (month) |  | trouvé | Syndrome dépressif / humeur dépressive · 2022-11-14 → 2023-01-10 ⚠ fin compatible |
| Psychopathologie | Tentative de suicide | 2016 (year) |  | trouvé | Intoxication médicamenteuse volontaire · 2016 |
| Psychopathologie | Idées de mort passives | 2023-06 (month) |  | trouvé | Idées de mort passives · 2023-06-13 |
| Somatique | Fracture du radius gauche | 2022-11-14 → 2023-01-10 (exact) |  | trouvé | Fracture de l'extrémité inférieure du radius gauche · 2022-11-14 → 2023-01-10 |
| Somatique | Stéatose hépatique | 2022-12 → (month) |  | trouvé | Stéatose hépatique · 2022-12-16 → |
| Médicaments | Diazépam | 2022-12-05 → 2022-12-16 (exact) |  | trouvé | Diazépam · 2022-12-05 → 2022-12-16 |
| Médicaments | Thiamine | 2022-11-24 (exact) |  | trouvé | Thiamine · 2022-11-24 |
| Médicaments | Acamprosate | 2022-12-16 → 2023-02-21 (exact) |  | trouvé | Acamprosate · 2022-12-16 → 2023-02-21 |
| Médicaments | Sertraline | 2023-01-10 → (exact) |  | trouvé | Sertraline · 2023-01-10 → |
| Médicaments | Baclofène | 2023-02-21 → 2023-12 (month) |  | trouvé | Baclofène · 2023-02-21 → 2023-12 |
| Médicaments | Baclofène | 2024-01-25 → (exact) |  | trouvé | Baclofène · 2024-01-25 → |
| Médicaments | Substituts nicotiniques | 2023-09-19 (exact) |  | trouvé | Patchs nicotiniques · 2023-09-19 → ⚠ « en cours » juste |
| Prises en charge | Hospitalisation pour sevrage | 2022-12-05 → 2022-12-16 (exact) |  | trouvé | Hospitalisation pour sevrage alcoolique · 2022-12-05 → 2022-12-16 |
| Prises en charge | Suivi psychiatrique en addictologie | 2022-11-24 → (exact) |  | trouvé | Suivi CSAPA (consultations addictologie et IDE) · 2022-11-24 → |
| Prises en charge | Psychothérapie (TCC) | 2022-12-12 → (exact) |  | trouvé | Suivi psychologique · 2022-12-12 → |
| Prises en charge | Accompagnement social | 2023-01-03 (exact) |  | trouvé | Entretien social · 2023-01-03 |
| Événements de vie | Divorce | 2016 (year) |  | trouvé | Divorce · 2016 |
| Événements de vie | Arrêt de travail | 2022-09-12 → 2023-09-04 (exact) |  | trouvé | Arrêt maladie (aide-soignante en EHPAD) · 2022-09-12 → 2023-09-04 |
| Événements de vie | Décès de sa mère | 2023-04 (month) |  | trouvé | Décès de la mère · 2023-04 |
| Événements de vie | Reprise du travail à mi-temps thérapeutique | 2023-09-04 (exact) |  | trouvé | Reprise du travail en mi-temps thérapeutique · 2023-09-04 → ⚠ « en cours » juste |
| Événements de vie | Départ de son fils pour Toulouse | 2024-01 (month) |  | trouvé | Départ du fils pour Toulouse (formation) · 2024-01 |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Alcool** · 1984 → 1989 · usage — Premières ivresses à l'adolescence, usage festif jusqu'à la trentaine.
- Consommations · **Alcool** · 2023-01-10 → 2023-02-21 · craving — Craving important en soirée (10/01), persistant le 21/02.
- Psychopathologie · **Épisode dépressif caractérisé d'intensité moyenne** · 2023-01-10 → 2023-09-19 — Diagnostiqué le 10/01/2023 après 3 semaines d'abstinence (perte de 4 kg). Aggravation après le décès de la mère fin avril. Thymie normalisée et rémission partielle le 19/09/2023.
- Psychopathologie · **Tristesse réactionnelle** · 2024-01-25 → — Pas d'éléments en faveur d'une rechute dépressive franche. Patiente en pleurs le 23/01, sans idée suicidaire exprimée.
- Somatique · **Hématome frontal gauche** · 2022-11-14 — Chute alcoolisée, GCS 14, TDM cérébrale sans saignement.
- Somatique · **Nausées et diarrhées** · 2023-06-13 — Liées à une erreur de prise de la sertraline : 150 mg pris au lieu de 100 mg prescrits.
- Prises en charge · **Passage aux urgences et UHCD** · 2022-11-14 → 2022-11-15 — Chute alcoolisée, surveillance jusqu'à dégrisement.
- Prises en charge · **Rencontre ELSA** · 2022-11-15 — À l'UHCD ; patiente d'accord pour un sevrage programmé et inscrite sur liste d'attente.
- Événements de vie · **Difficultés financières (pension alimentaire non versée)** · 2022 → — Pension non versée par l'ex-mari depuis l'été 2022, découvert bancaire important.

### `alcool-tspt`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Alcool | 2022 → 2024-06-30 (year) | usage | trouvé | Alcool · 2022 → 2024-06-30 · usage |
| Consommations | Alcool | 2024-07-01 → 2024-07-12 (exact) | sevrage | trouvé | Alcool · 2024-07-01 → 2024-07-12 · sevrage |
| Consommations | Alcool | 2024-08-15 → 2024-09-21 (exact) | rechute | trouvé | Alcool · 2024-08-15 → 2024-09-21 · rechute |
| Consommations | Alcool | 2024-12-25 (exact) | rechute | trouvé | Alcool · 2024-12-25 · usage ⚠ mode d'usage juste |
| Consommations | Tabac | 2024-06 → (approx) | usage | trouvé | Tabac · 2024-06-03 → · usage |
| Psychopathologie | Trouble de stress post-traumatique | 2024-06 → (approx) |  | manqué |  |
| Psychopathologie | Scarifications | 1999 → 2003 (approx) |  | trouvé | Scarifications · 1999 → 2003 |
| Psychopathologie | Épisode dépressif caractérisé sévère | 2024-08 → 2024-12 (approx) |  | trouvé | Épisode dépressif caractérisé sévère · 2024-08-27 → 2024-12-10 |
| Psychopathologie | Tentative de suicide | 2024-09-21 (exact) |  | trouvé | Intoxication médicamenteuse volontaire · 2024-09-21 |
| Somatique | Intoxication au paracétamol, réanimation | 2024-09-21 → 2024-09-24 (exact) |  | trouvé | Intoxication au paracétamol, réanimation · 2024-09-21 → 2024-09-24 |
| Médicaments | Diazépam | 2024-07-01 → 2024-07-12 (exact) |  | trouvé | Diazépam · 2024-07-01 → 2024-07-12 |
| Médicaments | Thiamine | 2024-07-01 (approx) |  | trouvé | Thiamine · 2024-07-09 |
| Médicaments | Acamprosate | 2024-07-09 → 2024-08-15 (exact) |  | trouvé | Acamprosate · 2024-07-09 → 2024-08-27 ⚠ fin compatible |
| Médicaments | Sertraline | 2024-10 → (approx) |  | trouvé | Sertraline · 2024-09 → |
| Médicaments | Naltrexone | 2024-10-15 → (exact) |  | trouvé | Naltrexone · 2024-10-15 → |
| Médicaments | Substituts nicotiniques | 2025-10-21 → (exact) |  | trouvé | Patch nicotinique · 2025-10-21 → |
| Prises en charge | Suivi addictologique (CSAPA) | 2024-06-03 → (exact) |  | trouvé | Suivi addictologique et psychiatrique · 2024-06-03 → |
| Prises en charge | Hospitalisation en clinique psychiatrique | 2024-09-24 → 2024-10-12 (exact) |  | trouvé | Hospitalisation en clinique psychiatrique · 2024-09-24 → 2024-10-12 |
| Prises en charge | Psychothérapie (psychotrauma, EMDR) | 2024-10-29 → (exact) |  | trouvé | Psychothérapie : stabilisation · 2024-10-29 → 2025-02-18 ⚠ fin compatible, « en cours » juste |
| Événements de vie | Violences conjugales | 2015 → 2022 (year) |  | trouvé | Violences conjugales · 2015 → 2022 |
| Événements de vie | Arrêt de travail | 2024-06-18 → 2025-09-01 (exact) |  | trouvé | Arrêt de travail · 2024-06-18 ⚠ fin compatible |
| Événements de vie | Enfants confiés à sa sœur | 2024-09-21 → 2024-10 (approx) |  | manqué |  |
| Événements de vie | Décision du JAF (résidence des enfants) | 2025-06-10 (exact) |  | trouvé | Décision du JAF · 2025-06-10 |
| Événements de vie | Reprise du travail à mi-temps thérapeutique | 2025-09-01 (exact) |  | trouvé | Reprise du travail en mi-temps thérapeutique · 2025-09-01 → ⚠ « en cours » juste |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Alcool** · 2024-09-24 → 2024-10-12 · sevrage — Sevrage fait en clinique psychiatrique, abstinente depuis l'IMV du 21/09.
- Consommations · **Alcool** · 2025-06-10 · craving — Envie forte le soir de la décision du JAF, sans consommation. Elle a appelé sa sœur.
- Psychopathologie · **TSPT** · 2024-06-03 → — Probable TSPT au premier entretien : hypervigilance, sursauts, cauchemars, évitement. Confirmé par le CR de la clinique. Décrit en avril 2025 comme TSPT complexe, sans trouble de la personnalité borderline retenu. Reviviscences après le tribunal en juin 2025, cauchemars rares en septembre 2025.
- Somatique · **Bilan biologique perturbé (GGT, VGM)** · 2024-06-18 → 2025-10-14 — GGT 186 et VGM 101 le 18/06/2024. Bilan du 14/10/2025 normalisé : GGT 28, CDT et VGM normaux.
- Prises en charge · **Sevrage ambulatoire avec IDE et IDEL** · 2024-07-01 → 2024-07-07 — Passages IDE à domicile jusqu'à J7. Hospitalisation refusée à cause des enfants.
- Prises en charge · **Plan de sécurité** · 2024-10-15 — Plan de sécurité rédigé avec le médecin, orientation vers une prise en charge du psychotrauma.
- Prises en charge · **EMDR** · 2025-02-18 → — Cible : la scène de 2019 devant les enfants, SUD de 9 à 5 en fin de séance. EMDR poursuivi le 17/06/2025.
- Événements de vie · **Ordonnance de protection** · 2023 — Ordonnance de protection obtenue en 2023.
- Événements de vie · **Retour des enfants à la maison** · 2024-10 — Enfants rentrés fin octobre, gardés par sa sœur pendant l'hospitalisation.

### `antalgiques-opioides`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Opioïdes (tramadol, oxycodone) | 2020 → 2024-09-29 (approx) | usage | trouvé | Opioïdes · 2020 → 2024-09-29 · usage |
| Consommations | Opioïdes (tramadol, oxycodone) | 2024-08-17 (exact) | intoxication | trouvé | Opioïdes · 2024-08-17 · intoxication |
| Consommations | Opioïdes (tramadol, oxycodone) | 2024-09-29 → 2024-09-30 (exact) | sevrage | trouvé | Opioïdes · 2024-10 · rechute ⚠ fin compatible, mode d'usage juste, au moins une source attendue |
| Consommations | Oxycodone | 2025-04 (month) | rechute | manqué |  |
| Consommations | Tabac | 2024-09 → (approx) | usage | trouvé | Tabac · 2024-09-11 → · usage |
| Psychopathologie | Épisode dépressif caractérisé | 2023-06 → 2025-06 (approx) |  | trouvé | Épisode dépressif caractérisé d'intensité moyenne · 2023-06 → ⚠ fin compatible, « en cours » juste |
| Somatique | Lombalgie chronique (arthrodèse L4-L5) | 2021 → (year) |  | trouvé | Arthrodèse L4-L5 · 2021 ⚠ « en cours » juste |
| Somatique | Fibromyalgie | 2025-01-13 → (exact) |  | manqué |  |
| Médicaments | Buprénorphine | 2024-09-30 → 2025-10-13 (exact) |  | trouvé | Buprénorphine sublinguale · 2024-09-30 → 2025-10-13 |
| Médicaments | Buprénorphine LP injectable mensuelle | 2025-10-14 → (exact) |  | trouvé | Buprénorphine LP injectable mensuelle · 2025-10-14 → |
| Médicaments | Naloxone (kit) | 2024-10-01 (exact) |  | trouvé | Naloxone · 2024-10-01 |
| Médicaments | Duloxétine | 2024-11-26 → (exact) |  | trouvé | Duloxétine · 2024-11-26 → |
| Prises en charge | Suivi addictologique (CSAPA) | 2024-09-11 → (exact) |  | trouvé | Suivi CSAPA (addictologie) · 2024-09-11 → |
| Prises en charge | Centre de la douleur (CETD) | 2025-01-13 → (exact) |  | mal daté | Consultation CETD (douleur) · 2024-11-26 |
| Prises en charge | Accompagnement social | 2024-11-05 (exact) |  | trouvé | Entretien social · 2024-11-05 |
| Événements de vie | Licenciement pour inaptitude | 2023-06 (month) |  | trouvé | Licenciement pour inaptitude · 2023-06 |
| Événements de vie | Départ de son fils pour ses études | 2025-09-01 (exact) |  | trouvé | Départ du fils pour ses études · 2025-09-01 |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Opioïdes** · 2025-04 → 2025-04 · rechute — Reprise d'oxycodone mi-avril pendant 3 jours lors d'une poussée douloureuse (anciennes boîtes retrouvées). Révélée spontanément. Pas de surdosage. Boîtes rapportées à la pharmacie. Le 17/06 elle dit avoir pris de l'oxycodone « une seule fois ».
- Consommations · **Opioïdes** · 2025-04 · craving — Craving faible depuis l'épisode d'avril 2025 (observation du 06/05/2025).
- Médicaments · **Tramadol** · 2020 → 2024-09-29 — Débuté en 2020, antalgique ; urines positives le 19/09/2024. Date précise d'arrêt non indiquée (arrêt dans le cadre du relais par buprénorphine).
- Médicaments · **Oxycodone** · 2021 → 2024-09-29 — Oxycodone LP 40 mg x 2 + LI 10 mg jusqu'à 4/j, après la chirurgie de 2021, poursuivie par le MG. Dernière prise le 29/09/2024.
- Prises en charge · **Passage aux urgences** · 2024-08-17 — Passage aux urgences après l'intoxication aux opioïdes ; patiente ensuite adressée par son MG.
- Prises en charge · **Activité physique adaptée** · 2025-01 → — Programme proposé par le CETD le 13/01/2025. En 06/2025 : marche 30 min/j, piscine 1 fois/semaine.
- Événements de vie · **Démarches d'invalidité (RQTH, pension d'invalidité CPAM)** · 2024-11 → — Démarches en cours au 05/11/2024 : RQTH et demande de pension d'invalidité.

### `bupre-grossesse`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Héroïne | 2014 → 2019 (approx) | usage | trouvé | Héroïne · 2013 → 2019 · usage |
| Consommations | Héroïne | 2024-05 (month) | rechute | trouvé | Héroïne · 2024-05 · rechute |
| Consommations | Héroïne | 2025-05-10 (exact) | rechute | trouvé | Héroïne · 2025-05-10 · rechute |
| Consommations | Cannabis | 2024-01 → 2024-03-03 (approx) | usage | trouvé | Cannabis · 2024-10 → · usage ⚠ fin compatible, « en cours » juste, au moins une source attendue |
| Consommations | Cannabis | 2024-10 → (month) | rechute | manqué |  |
| Consommations | Tabac | 2024-01 → (approx) | usage | manqué |  |
| Psychopathologie | Épisode dépressif du post-partum | 2024-10 → 2025-09 (approx) |  | trouvé | Épisode dépressif caractérisé du post-partum · 2024-12 → 2025-09-09 |
| Somatique | Grossesse | 2024-01 → 2024-09-29 (month) |  | trouvé | Grossesse · 2024-01 → 2024-09-29 |
| Somatique | Syndrome de sevrage néonatal (nouveau-né) | 2024-10-01 → 2024-10-08 (approx) |  | manqué |  |
| Médicaments | Buprénorphine | 2019 → (year) |  | trouvé | Buprénorphine haut dosage (BHD) · 2019 → |
| Médicaments | Substituts nicotiniques | 2024-03-07 (exact) |  | trouvé | Substituts nicotiniques · 2024-03-07 |
| Médicaments | Substituts nicotiniques | 2025-09-09 → (exact) |  | trouvé | Substituts nicotiniques · 2025-09-09 → |
| Médicaments | Naloxone (kit) | 2024-03-07 (exact) |  | trouvé | Naloxone (kit) · 2024-03-07 |
| Médicaments | Sertraline | 2025-01-23 → (exact) |  | trouvé | Sertraline · 2025-01-23 → |
| Prises en charge | Suivi CSAPA (TSO) | 2019 → (approx) |  | trouvé | Suivi CSAPA · 2018 → |
| Prises en charge | Suivi conjoint maternité (sage-femme) | 2024-04-18 → 2024-10-03 (exact) |  | mal daté | Suivi de grossesse conjoint CSAPA / maternité · 2024-03-07 → 2024-09-29 |
| Prises en charge | Accompagnement social | 2024-03-21 → (exact) |  | autre piste | Demande de logement social plus grand · 2024-03-21 |
| Prises en charge | Suivi psychologique (PMI) | 2025-02 → (month) |  | trouvé | Psychothérapie avec la psychologue de la PMI · 2025-02 ⚠ « en cours » juste |
| Événements de vie | Naissance de son fils | 2024-09-29 (exact) |  | trouvé | Naissance de son fils · 2024-09-29 |
| Événements de vie | Séparation | 2024-12 (month) |  | manqué |  |
| Événements de vie | Entrée de son fils en crèche | 2025-06 (month) |  | trouvé | Place en crèche pour son fils · 2025-06 → ⚠ « en cours » juste |
| Événements de vie | Reprise du travail à mi-temps | 2025-09-01 (exact) |  | trouvé | Reprise du travail à mi-temps · 2025-09-01 → ⚠ « en cours » juste |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Héroïne** · 2024-05-30 · craving — Craving en fin de journée, manque léger le soir (bâillements, jambes sans repos).
- Consommations · **Héroïne** · 2024-07-25 · sevrage — Signes de manque en fin de journée malgré le fractionnement de la BHD, attendus au 3e trimestre. Pas de nouvelle consommation d'héroïne.
- Consommations · **Héroïne** · 2025-01 · sevrage — Signes de manque le soir depuis la diminution de la BHD en janvier 2025, rapportés le 22/05/2025.
- Médicaments · **Naloxone (kit)** · 2025-05-15 — Nouveau kit remis, l'ancien étant périmé.
- Psychopathologie · **Anxiété** · 2024-03-04 — Très angoissée, pleure à l'annonce de la grossesse, peur que « le bébé soit accro ».
- Psychopathologie · **Anxiété anticipatoire** · 2024-05-30 — Anxiété sur l'accouchement et le regard de l'équipe de maternité, thymie légèrement abaissée, pas d'idées suicidaires.
- Psychopathologie · **Symptômes dépressifs du post-partum** · 2024-10-22 — Fatigue intense, pleurs fréquents, sentiment de ne pas être une bonne mère, sommeil fragmenté, EPDS à 14. Vigilance dépression du post-partum.
- Prises en charge · **Staff périnatalité (maternité, PMI, CSAPA)** · 2024-08-02 — Staff prévu le 02/08/2024.
- Prises en charge · **Suivi PMI (visites à domicile)** · 2024-10 — Visites organisées dès la sortie de l'enfant ; passage hebdomadaire en décembre 2024.
- Prises en charge · **Point sevrage tabac avec l'IDE tabacologue** · 2025-09-09 — Prévu à l'issue de la consultation du 09/09/2025.
- Événements de vie · **Relation de couple avec M.** · 2021-01 → 2024-12 — En couple « depuis 3 ans » en janvier 2024. M. est parti du domicile début décembre 2024 après plusieurs disputes ; séparation vécue comme un abandon.
- Événements de vie · **Allaitement** · 2024-09-29 → 2025-01 — Tire son lait en octobre 2024, compatible avec la BHD. Arrêté début janvier 2025.
- Événements de vie · **Demande de RSA majoré et révision des APL** · 2024-12-12 — Parent isolé, seule avec son fils dans le T2.

### `bzd-anxiete`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Benzodiazépines (alprazolam) | 2005 → 2024-03-05 (approx) | usage | trouvé | Benzodiazépines · 2005 → 2025-09-30 · usage ⚠ fin compatible |
| Consommations | Benzodiazépines (alprazolam) | 2024-01-13 → 2024-02-09 (approx) | sevrage | trouvé | Benzodiazépines · 2024-01-17 · sevrage ⚠ fin compatible |
| Consommations | Benzodiazépines (alprazolam) | 2024-11 → 2024-12 (month) | rechute | trouvé | Benzodiazépines · 2024-11 → 2024-12 · rechute |
| Consommations | Zolpidem | 2019 → 2025-01-01 (year) | usage | autre piste | Zolpidem · 2019 → 2025-01-01 |
| Consommations | Alcool | 2024-02 (approx) | usage | trouvé | Alcool · 2024-02-20 → · usage ⚠ « en cours » juste |
| Psychopathologie | Trouble anxieux généralisé | 1998 → (approx) |  | trouvé | Trouble anxieux généralisé · 1998 → |
| Somatique | Fracture du col du fémur droit | 2024-01-12 → 2024-02-09 (exact) |  | trouvé | Fracture du col du fémur droit (prothèse totale de hanche) · 2024-01-12 ⚠ fin compatible |
| Somatique | Crise convulsive de sevrage aux benzodiazépines | 2024-01-17 (exact) |  | trouvé | Crise convulsive généralisée · 2024-01-17 |
| Médicaments | Diazépam | 2024-03-05 → 2025-09-30 (exact) |  | trouvé | Diazépam · 2024-03-05 → 2025-09-30 |
| Médicaments | Sertraline | 2024-04-23 → (exact) |  | trouvé | Sertraline · 2024-04-23 → |
| Prises en charge | Suivi addictologique (CSAPA) | 2024-02-20 → (exact) |  | trouvé | Suivi psychiatrique / addictologique · 2024-02-20 → |
| Prises en charge | Hospitalisation (orthopédie puis SSR) | 2024-01-12 → 2024-02-09 (exact) |  | trouvé | Hospitalisation en orthopédie puis rééducation en SSR · 2024-01-12 → 2024-02-09 |
| Prises en charge | Psychothérapie (TCC) | 2025-03 → (month) |  | trouvé | TCC de l'insomnie et de l'anxiété · 2025-03 → |
| Événements de vie | Veuvage | 2019 (year) |  | manqué |  |
| Événements de vie | Hospitalisation de sa sœur (AVC) | 2024-11 (month) |  | trouvé | Hospitalisation de la sœur aînée (AVC) · 2024-11 |
| Événements de vie | Déménagement près de sa fille | 2025-03-01 (exact) |  | trouvé | Déménagement en rez-de-chaussée près de sa fille · 2025-03-01 |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Benzodiazépines** · 2024-11-05 · craving — Demande à reprendre « son Xanax, juste le temps que ça passe » dans un contexte d'anxiété (sœur hospitalisée). Refus expliqué.
- Consommations · **Benzodiazépines** · 2025-06-03 · craving — Ne pense plus au Xanax « que le soir des mauvaises nouvelles ».
- Consommations · **Benzodiazépines** · 2025-09-30 → 2025-10 · sevrage — Arrêt du diazépam le 30/09/2025. Quelques nuits d'insomnie de rebond la première semaine, puis retour à la normale. Pas de reprise d'alprazolam ni de zolpidem.
- Médicaments · **Alprazolam** · 2005 → 2024-03-05 — 0,5 mg trois fois par jour selon les ordonnances du médecin généraliste, dose réelle 3 mg/j. Relais par diazépam le 05/03/2024.
- Médicaments · **Alprazolam** · 2024-11 → 2024-12 — Reprise ponctuelle à partir d'une boîte prescrite par un médecin remplaçant fin novembre. Plus d'alprazolam en 03/2025.
- Psychopathologie · **Majoration de l'anxiété** · 2024-09 — Anxiété majorée à l'approche de l'anniversaire du décès du mari.
- Psychopathologie · **Majoration de l'anxiété et insomnie** · 2024-11-05 — Anxiété importante et insomnie après l'hospitalisation de sa sœur aînée.
- Prises en charge · **Prescription sécurisée (ordonnance sécurisée, délivrance hebdomadaire)** · 2024-03-05 — Arrêt du second prescripteur, la psychiatre devient seule prescriptrice des benzodiazépines, médecin généraliste informé.
- Prises en charge · **Entretien infirmier et mise en place d'un pilulier** · 2024-03-26 — Bonne tolérance du diazépam, somnolence l'après-midi les premiers jours, pas de chute. Pilulier mis en place avec sa fille.
- Prises en charge · **Contrat de soins rediscuté** · 2025-01-14 — Un seul prescripteur, une seule pharmacie, médecin généraliste d'accord.
- Événements de vie · **Décès du mari** · 2019 — Veuve depuis 2019, vit seule. Début du zolpidem à cette période selon le médecin généraliste.

### `cannabis-jeune`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Cannabis | 2017 → 2020-03 (approx) | usage | trouvé | Cannabis · 2016 → 2024-03-31 · usage ⚠ fin compatible |
| Consommations | Cannabis | 2020-03 → 2024-04-01 (month) | usage | manqué |  |
| Consommations | Cannabis | 2024-04-01 → 2024-04-08 (exact) | sevrage | trouvé | Cannabis · 2024-04-01 → 2024-04-23 · sevrage ⚠ fin compatible |
| Consommations | Cannabis | 2024-04-23 → (approx) | rechute | trouvé | Cannabis · 2024-04-23 → · rechute |
| Consommations | Alcool | 2024-03 → (approx) | usage | trouvé | Alcool · 2024-03-26 · usage ⚠ « en cours » juste |
| Consommations | Alcool | 2024-06 (month) | intoxication | trouvé | Alcool · 2024-06 · intoxication |
| Consommations | Tabac | 2024-03 → (approx) | usage | trouvé | Tabac · 2024-03-17 · usage ⚠ « en cours » juste |
| Psychopathologie | Trouble panique avec agoraphobie | 2023-07 → (approx) |  | mal daté | Trouble panique avec agoraphobie (probable) · 2015 → |
| Psychopathologie | TDAH (évaluation) | 2024-03-12 → (exact) |  | mal daté | Difficultés attentionnelles / suspicion de TDAH · 2009 → |
| Somatique | Syndrome d'hyperémèse cannabinoïde | 2024-02-10 → 2024-03-18 (exact) |  | trouvé | Syndrome d'hyperémèse cannabinoïde · 2024-02-10 → 2024-03-18 |
| Médicaments | Hydroxyzine | 2024-03-26 → (exact) |  | trouvé | Hydroxyzine · 2024-03-26 → |
| Médicaments | Halopéridol | 2024-03-17 (exact) |  | trouvé | Halopéridol · 2024-03-17 |
| Prises en charge | Consultation jeunes consommateurs | 2024-02-15 → (exact) |  | trouvé | Suivi CJC (éducatrice spécialisée) · 2024-02-15 → |
| Prises en charge | Psychothérapie (TCC) | 2024-03-12 → (exact) |  | trouvé | TCC (psychologue) · 2024-03-12 → |
| Prises en charge | Suivi psychiatrique | 2024-03-26 → (exact) |  | trouvé | Suivi psychiatrique · 2024-03-26 → |
| Événements de vie | Départ de son père | 2009 (year) |  | trouvé | Départ du père · 2009 |
| Événements de vie | Arrêt du BTS | 2024-01 (month) |  | trouvé | Arrêt du BTS (MCO) · 2024-01 |
| Événements de vie | Rupture avec son compagnon | 2024-04 (approx) |  | trouvé | Rupture avec le petit ami · 2024-04 |
| Événements de vie | Emploi saisonnier | 2024-07-01 → 2024-09 (exact) |  | trouvé | Emploi saisonnier au camping · 2024-07-01 → 2024-09 |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Prises en charge · **Passage aux urgences avec nuit en UHCD** · 2024-03-17 → 2024-03-18 — Syndrome d'hyperémèse cannabinoïde, arrêt complet du cannabis conseillé. "J'ai eu vraiment peur cette fois".
- Prises en charge · **Bilan neuropsychologique demandé** · 2024-06-18 — Demandé pour évaluer un TDAH, délai d'environ 6 mois.

### `cannabis-justice`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Cannabis | 2018 → 2024-11-08 (approx) | usage | trouvé | Cannabis · 2018 → 2024-11-08 · usage |
| Consommations | Cannabinoïdes de synthèse (PTC) | 2024-11-08 (exact) | intoxication | trouvé | Cannabinoïdes de synthèse · 2024-11-08 · intoxication |
| Consommations | Cannabis | 2024-12 (month) | rechute | trouvé | Cannabis · 2024-12 · usage ⚠ mode d'usage juste |
| Consommations | Cannabis | 2025-02 → (month) | rechute | trouvé | Cannabis · 2025-02 → · rechute |
| Consommations | Alcool | 2024-06 → (approx) | usage | trouvé | Alcool · 2024-06-25 → · usage |
| Consommations | Tabac | 2024-06 → (approx) | usage | trouvé | Tabac · 2024-06-25 → · usage |
| Psychopathologie | Épisode psychotique induit (cannabinoïdes de synthèse) | 2024-11-08 → 2024-11-19 (exact) |  | trouvé | Trouble psychotique induit par les cannabinoïdes de synthèse · 2024-11-08 ⚠ fin compatible |
| Psychopathologie | TDAH | 2025-02 → (month) |  | mal daté | TDAH · 2011 → |
| Médicaments | Loxapine | 2024-11-08 (exact) |  | trouvé | Loxapine · 2024-11-08 |
| Médicaments | Rispéridone | 2024-11 → 2025-03-01 (month) |  | trouvé | Rispéridone · 2024-11 → 2025-03-01 |
| Médicaments | Méthylphénidate | 2025-07-01 → (exact) |  | trouvé | Méthylphénidate · 2025-07-01 → |
| Prises en charge | Obligation de soins (sursis probatoire) | 2024-05-14 → 2025-11-14 (exact) |  | manqué |  |
| Prises en charge | Consultation jeunes consommateurs | 2024-06-11 → (exact) |  | trouvé | Suivi CJC/CSAPA (obligation de soins) · 2024-06-11 → |
| Prises en charge | Hospitalisation en psychiatrie (soins libres) | 2024-11-08 → 2024-11-19 (exact) |  | trouvé | Hospitalisation en psychiatrie (soins libres) · 2024-11-08 → 2024-11-19 |
| Prises en charge | Bilan neuropsychologique | 2025-02 (month) |  | trouvé | Bilan neuropsychologique · 2025-02 |
| Événements de vie | Conduite sous stupéfiants, refus d'obtempérer | 2024-02 (month) |  | trouvé | Conduite sous stupéfiants et refus d'obtempérer · 2024-02 |
| Événements de vie | Jugement (sursis probatoire) | 2024-05-14 (exact) |  | trouvé | Sursis probatoire avec obligation de soins · 2024-05-14 → 2025-11-14 ⚠ fin compatible |
| Événements de vie | Arrêt du CAP | 2023 (year) |  | trouvé | CAP interrompu · 2023 |
| Événements de vie | Début de l'apprentissage en mécanique | 2025-09-01 (exact) |  | trouvé | Apprentissage en mécanique auto · 2025-09-01 → ⚠ « en cours » juste |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Cannabis** · 2024-12-10 · craving — Craving le soir, il fait du vélo pour « tenir ».
- Prises en charge · **Passage aux urgences** · 2024-11-08 — Amené par les pompiers à la demande de sa mère, arrivée à 02h10, transfert en psychiatrie à 14h30.
- Événements de vie · **Redoublement du CP** · 2011 → 2016 — Rapporté par la mère : redoublement du CP, pas de suivi à l'époque.

### `chemsex-prep`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Cathinones (3-MMC) | 2021 → 2024-06-10 (approx) | usage | trouvé | 3-MMC · 2021-03 → 2024-05-18 · usage |
| Consommations | Cathinones (3-MMC) | 2024-07 (month) | rechute | trouvé | 3-MMC · 2024-07 · usage ⚠ mode d'usage juste |
| Consommations | Cathinones (3-MMC) | 2024-10-12 → 2024-10-19 (exact) | rechute | trouvé | 3-MMC · 2024-10-12 → 2024-10-19 · rechute |
| Consommations | Cathinones (3-MMC) | 2025-04-05 (exact) | rechute | trouvé | 3-MMC · 2025-04-05 · usage ⚠ mode d'usage juste |
| Consommations | GHB/GBL | 2021 → 2024-06-10 (approx) | usage | mal daté | GHB/GBL · 2024-01 → 2024-06-10 · usage |
| Consommations | GHB/GBL | 2024-05-18 (exact) | intoxication | trouvé | GHB/GBL · 2024-05-18 · intoxication |
| Consommations | GHB/GBL | 2024-06-10 → 2024-06-17 (exact) | sevrage | trouvé | GHB/GBL · 2024-06-10 → 2024-06-17 · sevrage |
| Consommations | GHB/GBL | 2024-10-12 → 2024-10-19 (exact) | rechute | trouvé | GHB/GBL · 2024-10-12 → 2024-10-19 · rechute |
| Consommations | Alcool | 2024-03 → (approx) | usage | trouvé | Alcool · 2024-03-12 · usage ⚠ « en cours » juste |
| Psychopathologie | Épisode dépressif (ancien) | 2012 (approx) |  | trouvé | Épisode dépressif · 2011 → 2013 ⚠ fin compatible |
| Psychopathologie | Épisode dépressif caractérisé | 2023-12 → 2025-02 (approx) |  | trouvé | Épisode dépressif caractérisé · 2024-03 → 2025-02 |
| Somatique | Coma au GHB, réanimation | 2024-05-18 → 2024-05-19 (exact) |  | trouvé | Coma au GHB / réanimation · 2024-05-18 → 2024-05-19 |
| Somatique | Syphilis | 2022 (year) |  | trouvé | Syphilis · 2022 |
| Somatique | Syphilis (recontamination) | 2024-07-09 → 2024-07-25 (exact) |  | trouvé | Syphilis (recontamination probable) · 2024-07-09 → 2024-07-25 |
| Médicaments | PrEP (ténofovir/emtricitabine) | 2019 → (year) |  | trouvé | Ténofovir/emtricitabine (PrEP) · 2019 → |
| Médicaments | Escitalopram | 2024-03-28 → (exact) |  | trouvé | Escitalopram · 2024-03-28 → |
| Médicaments | Diazépam | 2024-06-10 → 2024-06-17 (exact) |  | trouvé | Diazépam · 2024-06-10 → 2024-06-17 |
| Médicaments | Baclofène | 2024-06-10 → 2024-07 (approx) |  | trouvé | Baclofène · 2024-06-10 → 2024-07 |
| Médicaments | Benzathine benzylpénicilline | 2024-07-25 (exact) |  | trouvé | Benzathine pénicilline (Extencilline) · 2024-07-25 |
| Prises en charge | Suivi addictologique (CSAPA) | 2024-03-12 → (exact) |  | trouvé | Suivi psychiatrique en addictologie · 2024-03-12 → |
| Prises en charge | Psychothérapie (psychologue) | 2024-04-16 → (exact) |  | trouvé | Suivi psychologique · 2024-04-16 → |
| Prises en charge | Hospitalisation pour sevrage GHB | 2024-06-10 → 2024-06-17 (exact) |  | trouvé | Hospitalisation pour sevrage GHB/GBL · 2024-06-10 → 2024-06-17 |
| Prises en charge | Suivi CeGIDD (PrEP) | 2019 → (year) |  | trouvé | Suivi CeGIDD (infectiologue) · 2019 → |
| Événements de vie | Arrêt de travail | 2024-05-21 → 2024-09-02 (exact) |  | trouvé | Arrêt de travail · 2024-05-21 → 2024-09-01 |
| Événements de vie | Reprise du travail à mi-temps thérapeutique | 2024-09-02 → 2025-02-01 (exact) |  | trouvé | Mi-temps thérapeutique · 2024-09-02 → 2025-02-01 |
| Événements de vie | Séparation | 2024-09 (month) |  | manqué |  |
| Événements de vie | Nouvelle relation | 2025-01 → (approx) |  | trouvé | Nouvelle relation (couple fermé) · 2025-01 → |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **3-MMC** · 2023-09 → 2024-05-18 · usage — Injection (slam) depuis environ 6 mois à l'évaluation du 12/03/2024. Session du 23-24/03 : 6 injections en environ 36h.
- Consommations · **3-MMC** · 2025-04 · craving — Craving les jours suivant la consommation du 05/04. A appelé sa psychologue.
- Consommations · **Alcool** · 2024-05-18 · intoxication — Alcool associé au GBL lors du coma du 18/05/2024.
- Consommations · **Alcool** · 2025-06-17 · usage — 2 verres le samedi, sans ivresse.
- Consommations · **Poppers** · 2024-03-12 · usage — Poppers occasionnels.
- Consommations · **Poppers** · 2025-06-17 · usage — Poppers occasionnels.
- Psychopathologie · **Idées noires passives** · 2024-03 — Idées noires passives (« à quoi bon ») pendant la descente jusqu'au mercredi après la session du 23-24/03. Pas d'idées suicidaires actives.
- Psychopathologie · **Idées noires passives** · 2024-10 — Idées noires passives à la descente après les sessions d'octobre, sans scénario ni intention.
- Événements de vie · **Période de dissimulation en petite ville** · 1993 → 2007 — Enfance dans une petite ville où il s'est « caché » jusqu'à ses 20 ans.
- Événements de vie · **Couple avec son compagnon (couple ouvert)** · 2018-03 → 2024-09 — En couple depuis 6 ans à l'évaluation de mars 2024. Le compagnon est parti début septembre 2024 (« on s'aimait plus que comme des colocs »).
- Événements de vie · **Reprise du travail à temps plein** · 2025-02-01 → — Bonne réintégration dans l'équipe.

### `crack-rue`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Crack (cocaïne basée) | 2016 → 2024-03-28 (approx) | usage | trouvé | Crack · 2015 → 2024-12-24 · usage |
| Consommations | Crack (cocaïne basée) | 2024-04 → 2024-12-24 (approx) | usage | trouvé | Crack · 2024-02-10 → 2024-02-20 · usage ⚠ au moins une source attendue |
| Consommations | Crack (cocaïne basée) | 2025-03 (month) | rechute | trouvé | Crack · 2025-03 → 2025-03 · rechute ⚠ fin compatible |
| Consommations | Alcool | 2023-09 → 2024-03-28 (approx) | usage | trouvé | Alcool · 2023-09-06 → 2024-03-28 · usage |
| Consommations | Alcool | 2024-03-28 → 2024-04-04 (exact) | sevrage | trouvé | Alcool · 2024-03-28 → 2024-04-04 · sevrage |
| Consommations | Alcool | 2024-04 → (approx) | usage | trouvé | Alcool · 2024-04-04 → · usage |
| Consommations | Cannabis | 2023-09 (approx) | usage | trouvé | Cannabis · 2023-09-14 · usage |
| Consommations | Tabac | 2023-09 → (approx) | usage | trouvé | Tabac · 2023-09-14 → · usage |
| Psychopathologie | Trouble de stress post-traumatique (complexe) | 2023-09 → (approx) |  | trouvé | TSPT complexe · 2023-09-14 → |
| Psychopathologie | Idées de mort passives | 2024-02 (month) |  | trouvé | Idées de mort passives · 2024-02-20 |
| Somatique | Brûlures des doigts et des lèvres | 2023-09 (approx) |  | trouvé | Brûlures des doigts et des lèvres · 2023-10-03 |
| Somatique | Pneumopathie | 2024-03-28 → 2024-04-04 (exact) |  | trouvé | Pneumopathie · 2024-03-28 → 2024-04-04 |
| Médicaments | Vaccin hépatite B | 2023-10-03 (exact) |  | trouvé | Vaccin hépatite B · 2023-10-03 |
| Médicaments | Prazosine | 2023-11-21 → (exact) |  | trouvé | Prazosine · 2023-11-21 → |
| Médicaments | Hydroxyzine | 2023-11-21 (exact) |  | trouvé | Hydroxyzine · 2023-11-21 → ⚠ « en cours » juste |
| Médicaments | Naloxone (kit) | 2024-02-20 (exact) |  | trouvé | Naloxone · 2024-02-20 |
| Médicaments | Diazépam | 2024-03-28 → 2024-04-04 (exact) |  | trouvé | Diazépam · 2024-03-28 → 2024-04-04 |
| Médicaments | Sertraline | 2024-09-17 → (exact) |  | trouvé | Sertraline · 2024-09-17 → |
| Prises en charge | Accompagnement CAARUD (réduction des risques) | 2023-09-06 → (exact) |  | trouvé | Suivi CAARUD · 2023-09-06 → |
| Prises en charge | Suivi psychiatrique (CSAPA) | 2023-09-14 → (exact) |  | trouvé | Suivi psychiatrique · 2023-09-14 → |
| Prises en charge | Accompagnement social | 2023-10-25 → (exact) |  | manqué |  |
| Prises en charge | EMDR (centre de psychotraumatologie) | 2024-12 → (month) |  | trouvé | EMDR au centre de psychotraumatologie · 2024-12 → |
| Événements de vie | Placement en foyer | 2002 (approx) |  | trouvé | Placement en foyer · 2002 |
| Événements de vie | Placement de son fils chez sa grand-mère paternelle | 2021 (year) |  | trouvé | Placement du fils chez la grand-mère paternelle · 2021 |
| Événements de vie | Sans domicile | 2022 → 2024-06-03 (year) |  | trouvé | Sans domicile après expulsion · 2022 → 2024-06-03 |
| Événements de vie | Agression sexuelle | 2023-11 (month) |  | trouvé | Agression sexuelle · 2023-11 |
| Événements de vie | Décès de son ex-compagnon | 2024-02-10 (exact) |  | trouvé | Décès de l'ex-compagnon par overdose · 2024-02-10 |
| Événements de vie | Entrée en CHRS | 2024-06-03 → 2025-05-26 (exact) |  | trouvé | Hébergement en CHRS · 2024-06-03 → 2025-05-26 |
| Événements de vie | Reprise des visites avec son fils | 2024-06-28 (exact) |  | trouvé | Première visite médiatisée avec son fils · 2024-06-28 |
| Événements de vie | Entrée en résidence sociale | 2025-05-26 (exact) |  | trouvé | Résidence sociale · 2025-05-26 → ⚠ « en cours » juste |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Psychopathologie · **Humeur triste** · 2023-09-14 → 2025-07-01 — Thymie triste en 2023, humeur triste de fond en septembre 2024, anxiété marquée en mars 2025, thymie neutre en juillet 2025.
- Somatique · **Toux grasse** · 2023-09 — Toux grasse depuis 3 semaines au 03/10/2023, sans fièvre, à surveiller.
- Médicaments · **Antibiotiques** · 2024-04-04 → 2024-04-09 — Prescrits à la sortie pour la pneumopathie, traitement terminé au 09/04. Molécule non précisée.
- Prises en charge · **Hospitalisation en médecine** · 2024-03-28 → 2024-04-04 — Pneumopathie, avec sevrage alcool pendant le séjour. Une hospitalisation en addictologie/psychiatrie avait été refusée en février 2024.
- Événements de vie · **Abus sexuels dans l'enfance** · 1996 → 2001 — Abus sexuels dans l'enfance.
- Événements de vie · **Mise à l'abri hivernale** · 2024-01-08 — Gymnase, places 115. Dort mieux.
- Événements de vie · **Convocation au tribunal pour le procès de l'agresseur** · 2025-03 — Convocation début mars 2025, procès renvoyé. Anxiété marquée.
- Événements de vie · **Élargissement des droits de visite** · 2025-06 → — Le juge des enfants autorise des visites sans médiatisation un samedi sur deux à partir de juin 2025.

### `jeu-bipolaire`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Jeu (paris sportifs en ligne) | 2018 → 2024-01-29 (year) | usage | trouvé | Jeu d'argent (paris sportifs en ligne) · 2018 → 2024-01-29 · usage |
| Consommations | Jeu (paris sportifs en ligne) | 2024-06 → 2024-07-05 (month) | rechute | trouvé | Jeu d'argent (paris sportifs en ligne) · 2024-06 → 2024-07-05 · rechute |
| Consommations | Jeu (grattage) | 2025-03 (month) | rechute | trouvé | Jeux de grattage · 2025-03 · rechute |
| Consommations | Alcool | 2024-01 → (approx) | usage | trouvé | Alcool · 2024-01-18 → · usage |
| Consommations | Tabac | 2019 (year) | sevrage | manqué |  |
| Psychopathologie | Épisode dépressif | 2010 (year) |  | trouvé | Épisode dépressif · 2010 |
| Psychopathologie | Épisode dépressif | 2016 (year) |  | trouvé | Épisode dépressif · 2016 |
| Psychopathologie | Trouble bipolaire de type II | 2024-02-01 → (exact) |  | trouvé | Trouble bipolaire de type II · 2024-02-01 → |
| Psychopathologie | Épisode hypomaniaque | 2024-06-15 → 2024-07-09 (approx) |  | trouvé | Épisode hypomaniaque · 2024-06-15 → 2024-07-09 |
| Psychopathologie | Épisode dépressif caractérisé | 2024-11 → 2025-01 (month) |  | trouvé | Épisode dépressif caractérisé · 2024-11-05 → 2025-01 |
| Médicaments | Paroxétine | 2016 (year) |  | trouvé | Paroxétine · 2016 |
| Médicaments | Lithium | 2024-03-05 → (exact) |  | trouvé | Lithium · 2024-03-05 → |
| Médicaments | Quétiapine | 2024-06-25 → 2025-05 (exact) |  | trouvé | Quétiapine · 2024-06-25 → 2025-05 |
| Médicaments | Lamotrigine | 2024-11-26 → (exact) |  | trouvé | Lamotrigine · 2024-11-26 → |
| Prises en charge | Suivi addictologique (CSAPA) | 2024-01-18 → (exact) |  | manqué |  |
| Prises en charge | Interdiction volontaire de jeux (ANJ) | 2024-01-29 → (exact) |  | trouvé | Interdiction volontaire de jeux (ANJ) · 2024-01-29 → |
| Prises en charge | Psychothérapie (TCC jeu) | 2024-04-16 → (exact) |  | trouvé | Psychothérapie TCC du jeu · 2024-04-16 → 2025-04-15 ⚠ fin compatible, « en cours » juste |
| Prises en charge | Accompagnement social (surendettement) | 2024-02 (approx) |  | trouvé | Accompagnement social (surendettement) · 2024-02-01 → 2024-10-15 ⚠ fin compatible |
| Prises en charge | Thérapie de couple | 2024-08 (month) |  | trouvé | Thérapie de couple · 2024-08 |
| Événements de vie | Découverte des dettes par son épouse | 2023-12 (month) |  | trouvé | Découverte de crédits à la consommation par l'épouse · 2023-12 |
| Événements de vie | Arrêt de travail | 2024-06-25 → 2024-07-15 (exact) |  | trouvé | Arrêt de travail · 2024-06-25 → 2024-07-15 |
| Événements de vie | Plan de surendettement | 2024-10-08 (exact) |  | trouvé | Plan de surendettement accepté · 2024-10-08 |
| Événements de vie | Arrêt de travail | 2024-11-26 → 2024-12 (exact) |  | trouvé | Arrêt de travail · 2024-11-26 ⚠ fin compatible |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Nicotine (vapotage)** · 2019 → · usage — Vapote depuis 2019, ancien fumeur (15 paquets-années).
- Consommations · **Jeu d'argent (paris sportifs en ligne)** · 2025-01 · craving — Envies pendant la Ligue des champions, sans parier (« je regarde sans parier, c'est nouveau »).
- Consommations · **Jeu d'argent (paris sportifs en ligne)** · 2025-07-01 · craving — Craving rare, surtout les soirs de match, géré en éteignant le téléphone. Pas de jeu depuis mars.
- Psychopathologie · **Période hypomaniaque** · 2016 — Anamnèse thymique avec l'épouse : période de « pleine forme » sous paroxétine en 2016 (peu de sommeil, dépenses et paris plus importants). D'autres périodes similaires de quelques jours à 2 semaines sont évoquées sans date.
- Prises en charge · **Suivi psychiatrique ambulatoire** · 2024-01-18 → — Premier entretien orienté par son médecin généraliste. Suivi régulier.
- Prises en charge · **Psychoéducation et plan de crise** · 2025-07-01 — Signes d'alerte rappelés (sommeil < 6h, achats), plan de crise écrit avec son épouse.

### `methadone-schizophrenie`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Héroïne | 2003 → 2009 (approx) | usage | trouvé | Héroïne · 2003 → 2009 · usage |
| Consommations | Héroïne | 2023-05 (month) | rechute | trouvé | Héroïne · 2023-05 · rechute |
| Consommations | Cannabis | 2023-02 → (approx) | usage | trouvé | Cannabis · 2023-02 → · usage |
| Consommations | Tabac | 2023-02 → (approx) | usage | trouvé | Tabac · 2023-02 → · usage |
| Psychopathologie | Schizophrénie paranoïde | 2005 → (approx) |  | trouvé | Schizophrénie paranoïde · 2005 → |
| Psychopathologie | Décompensation délirante | 2024-09 → 2024-10-25 (approx) |  | trouvé | Décompensation délirante (idées de persécution) · 2024-09 → 2024-10-25 |
| Somatique | Hépatite C | 2023-02 → 2024-06-11 (approx) |  | manqué |  |
| Somatique | Allongement du QTc | 2025-01-09 → 2025-03-11 (exact) |  | trouvé | Allongement du QTc · 2025-01-09 → 2025-03-11 |
| Médicaments | Méthadone sirop | 2010 → 2025-07-15 (approx) |  | trouvé | Méthadone · 2010 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Méthadone gélules | 2025-07-15 → (exact) |  | manqué |  |
| Médicaments | Palipéridone LP (injection mensuelle) | 2023-02 → 2024-08-06 (approx) |  | manqué |  |
| Médicaments | Aripiprazole LP (injection mensuelle) | 2024-10 → (approx) |  | trouvé | Aripiprazole LP · 2024 → |
| Médicaments | Glécaprévir/pibrentasvir | 2024-01-08 → 2024-03-04 (exact) |  | trouvé | Glécaprévir/pibrentasvir · 2024-01-08 → 2024-03-04 |
| Médicaments | Hydroxyzine | 2024-11 → 2025-01-14 (approx) |  | manqué |  |
| Prises en charge | Suivi CSAPA (TSO) | 2010 → (approx) |  | trouvé | Suivi CSAPA (traitement de substitution) · 2010 → |
| Prises en charge | Suivi CMP | 2023-02 → (approx) |  | mal daté | Renforcement des visites à domicile infirmières (CMP) · 2025-05 |
| Prises en charge | Hospitalisation sous contrainte (SDT) | 2024-09-14 → 2024-10-25 (exact) |  | trouvé | Hospitalisation en psychiatrie sous contrainte (SDT) · 2024-09-14 → 2024-10-25 |
| Prises en charge | Curatelle renforcée | 2018 → (year) |  | autre piste | Curatelle renforcée (UDAF) · 2018 → |
| Événements de vie | Entrée de sa mère en EHPAD | 2025-04 (month) |  | trouvé | Entrée de la mère en EHPAD · 2025-04 |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Héroïne** · 2023-05 → 2023-09 · craving — Manque en fin de journée depuis plusieurs semaines (bâillements, crampes, anxiété) et craving. Disparu sous méthadone 100 mg en septembre 2023.
- Consommations · **Cannabis** · 2024-08 → 2024-09-17 · usage — Cannabis ++ ces dernières semaines avant l'hospitalisation. Le patient dit : « je fumais trop ».
- Consommations · **Alcool** · 2023-02 · usage — Alcool rare. En 2023-03, ne boit pas d'alcool selon lui.
- Prises en charge · **Programme de soins** · 2024-10-25 → — Programme de soins à la sortie d'hospitalisation, coordination CMP pour les injections.
- Événements de vie · **Demande de renouvellement de l'AAH** · 2024-11-19 — Renouvellement de l'AAH en cours.
- Psychopathologie · **Tristesse et sentiment de solitude** · 2025-05 — Se sent « plus seul » après l'entrée de sa mère en EHPAD. Sommeil correct, pas de recrudescence délirante.

### `opiaces-tso`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Cannabis | 2002 → (year) | usage | trouvé | Cannabis · 2002 → · usage |
| Consommations | Héroïne | 2006 → 2012 (approx) | usage | trouvé | Héroïne · 2006 · usage ⚠ fin compatible |
| Consommations | Héroïne | 2022-12 → 2023-02-18 (month) | rechute | trouvé | Héroïne · 2022-12 → 2023-02-18 · rechute |
| Consommations | Héroïne | 2023-02-18 (exact) | intoxication | trouvé | Héroïne · 2023-02-18 · intoxication |
| Consommations | Cocaïne | 2023-01 → 2023-09 (approx) | usage | trouvé | Cocaïne · 2023-01 → 2023-09 · usage |
| Consommations | Cocaïne | 2023-09 → 2023-10 (month) | rechute | trouvé | Cocaïne · 2023-09 → 2023-10 · rechute |
| Consommations | Benzodiazépines (hors prescription) | 2023-02-18 (exact) | usage | trouvé | Benzodiazépines (clonazépam) · 2023-02-18 · intoxication ⚠ mode d'usage juste |
| Consommations | Tabac | 2023-01 → (approx) | usage | trouvé | Tabac · 2023-01 → · usage |
| Psychopathologie | TDAH (enfance) | 1997 (approx) |  | mal daté | TDAH · 1994 → 1999 |
| Somatique | Hépatite C | 2019 → 2019 (year) |  | trouvé | Hépatite C (VHC) · 2019 → 2019 |
| Somatique | Overdose, réanimation | 2023-02-18 → 2023-02-19 (exact) |  | trouvé | Overdose d'opioïdes (héroïne + clonazépam) · 2023-02-18 ⚠ fin compatible |
| Médicaments | Méthadone sirop | 2012 → 2024-01-09 (year) |  | trouvé | Méthadone · 2012 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Méthadone gélules | 2024-01-09 → (exact) |  | manqué |  |
| Médicaments | Naloxone (kit) | 2023-02-20 (exact) |  | trouvé | Naloxone · 2023-02-20 |
| Médicaments | Sofosbuvir/velpatasvir | 2019 → 2019 (year) |  | trouvé | Sofosbuvir/velpatasvir · 2019 → 2019 |
| Médicaments | Méthylphénidate | 1997 (approx) |  | trouvé | Méthylphénidate · 1997 |
| Prises en charge | Suivi CSAPA (TSO) | 2012 → (year) |  | trouvé | Suivi CSAPA · 2012 → |
| Prises en charge | Délivrance quotidienne au CSAPA | 2023-02-22 → 2023-05-02 (exact) |  | trouvé | Délivrance quotidienne de méthadone au CSAPA · 2023-02-22 → 2023-04-30 |
| Prises en charge | Suivi éducatif | 2023-03-07 → (exact) |  | trouvé | Suivi éducatif rapproché · 2023-03-07 → |
| Prises en charge | Réduction des risques crack | 2023-10-03 (exact) |  | trouvé | Orientation vers le programme de RdR crack · 2023-10-03 |
| Prises en charge | Accompagnement social | 2023-03-28 → (exact) |  | trouvé | Accompagnement social · 2023-03-28 ⚠ « en cours » juste |
| Événements de vie | Placements en foyer | 2002 (approx) |  | trouvé | Placements en foyer · 2000 → 2005 ⚠ fin compatible |
| Événements de vie | Incarcération | 2014 → 2015 (year) |  | trouvé | Incarcération · 2014 → 2015 |
| Événements de vie | Suspension du permis | 2019 (year) |  | trouvé | Suspension du permis B · 2019 → ⚠ « en cours » juste |
| Événements de vie | Naissance de sa fille | 2020-03 (approx) |  | trouvé | Naissance de la fille · 2020-03 |
| Événements de vie | Décès de son père | 2021-08 (month) |  | trouvé | Décès du père · 2021-08 |
| Événements de vie | Information préoccupante (PMI) | 2023-11-08 (exact) |  | trouvé | Information préoccupante (PMI) · 2023-11-08 |
| Événements de vie | Mesure d'AEMO | 2024-01 → (month) |  | trouvé | Mesure d'AEMO · 2024-01 → |
| Événements de vie | Chantier d'insertion | 2024-01-22 → (exact) |  | trouvé | Chantier d'insertion (espaces verts) · 2024-01-22 → |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Psychopathologie · **Suspicion de trouble de la personnalité antisociale** · 2022-03-14 → 2023-02-22 — Évoquée par l'interne le 14/03/2022. Le psychiatre le 22/02/2023 ne retient pas d'argument franc et juge la note à nuancer.
- Prises en charge · **Délivrance hebdomadaire de méthadone en pharmacie** · 2021 → 2023-02-22 — Délivrance hebdomadaire à la pharmacie du Marché depuis 2021, interrompue après l'overdose.
- Prises en charge · **Délivrance hebdomadaire de méthadone en pharmacie** · 2023-05-02 → — Reprise de la délivrance hebdomadaire en pharmacie depuis le 02/05/2023.
- Prises en charge · **Hospitalisation en réanimation** · 2023-02-18 → 2023-02-19 — Hospitalisation de 24h après l'overdose, sortie contre avis médical le dimanche.
- Événements de vie · **Violence paternelle dans l'enfance** · 1994 → 1999 — Enfance marquée par la violence paternelle.
- Événements de vie · **Dette de loyer** · 2023-03-28 → — Dette de 1 800 euros auprès du bailleur social, dossier FSL en cours. Ressources : RSA couple, APL.
- Événements de vie · **Menace de départ de la compagne avec l'enfant** · 2023-09-26 — Dans le contexte de la consommation de crack. Tensions de couple confirmées par la compagne le 14/11.

### `tabac-infarctus`

Statut au passage `age1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Tabac | 1986 → 2024-10-15 (approx) | usage | trouvé | Tabac · 1986 → 2024-09 · usage |
| Consommations | Tabac | 2024-10-15 (exact) | sevrage | trouvé | Tabac · 2024-10-15 → 2025-01-06 · sevrage ⚠ fin compatible |
| Consommations | Tabac | 2025-01-06 → 2025-04-01 (exact) | rechute | trouvé | Tabac · 2025-01-06 → 2025-04-01 · rechute |
| Consommations | Cannabis | 1990 → 1997 (approx) | usage | trouvé | Cannabis · 1990 → 1997 · usage |
| Consommations | Alcool | 2024-10 → (approx) | usage | trouvé | Alcool · 2024-10-10 → · usage |
| Psychopathologie | Trouble de l'adaptation anxio-dépressif | 2025-01 → 2025-06 (approx) |  | trouvé | Trouble de l'adaptation avec anxiété et humeur dépressive · 2024-10-10 → 2025-06-24 |
| Somatique | Infarctus du myocarde | 2024-09-03 (exact) |  | trouvé | Infarctus du myocarde · 2024-09-03 |
| Somatique | Prise de poids après l'arrêt du tabac | 2024-11 → 2025-09 (approx) |  | trouvé | Prise de poids · 2024-11 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Varénicline | 2024-10-10 → 2024-11-12 (exact) |  | trouvé | Varénicline · 2024-10-08 → 2024-11-12 |
| Médicaments | Substituts nicotiniques | 2024-11-12 → 2025-04 (approx) |  | trouvé | Patch nicotinique 21 mg · 2024-11 → 2025-01 |
| Médicaments | Vapoteuse (cigarette électronique) | 2025-01-14 → (exact) |  | manqué |  |
| Prises en charge | Consultation de tabacologie | 2024-10-08 → (exact) |  | trouvé | Suivi en tabacologie · 2024-10-08 → |
| Prises en charge | Suivi psychiatrique | 2024-10-10 → 2025-06-24 (exact) |  | trouvé | Suivi psychiatrique · 2024-10-10 → 2025-06-24 |
| Prises en charge | Psychothérapie (TCC) | 2025-03 → 2025-06 (approx) |  | trouvé | TCC (thérapie cognitivo-comportementale) · 2025-03 ⚠ fin compatible |
| Prises en charge | Réadaptation cardiaque | 2024-09 → 2024-10 (approx) |  | trouvé | Réadaptation cardiaque · 2024-10-08 ⚠ fin compatible |
| Événements de vie | Reprise du travail | 2025-01-06 (exact) |  | trouvé | Reprise du travail et conflit avec sa responsable · 2025-01-06 |

En plus (passage `age1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Tabac** · 2024-09 → 2024-10-15 · rechute — Reprise de 'quelques-unes' au retour à domicile, 10 cig/j au 08/10, CO 32 ppm. Cigarettes du soir reconnues le 10/10. Arrêt fixé au 15/10.
- Consommations · **Tabac** · 2025-04-01 → · sevrage — Aucune cigarette depuis le 01/04/2025, CO 2 ppm ; 6 mois sans tabac au 30/09/2025.
- Consommations · **Nicotine (vapoteuse)** · 2025-02 → · usage — Vapoteuse proposée le 14/01/2025 (12 mg/mL), en cours au 04/02. Dosage réduit : 6 mg/mL en juin, 3 mg/mL en septembre. Projet d'arrêt de la vape d'ici la fin d'année.
- Médicaments · **Gommes à la nicotine 2 mg** · 2024-11 — Associées au patch en relais de la varénicline. Date de fin non précisée.
- Médicaments · **Patch nicotinique 21 mg** · 2025-01-14 → 2025-04 — Patch repris avec la vapoteuse, poursuivi au 04/02. Patch arrêté, constaté le 15/04/2025.
- Prises en charge · **Orientation vers une diététicienne** · 2025-04-15 — Orientation pour la prise de poids.

