# Frise des dossiers fictifs, notée contre `verite.json`

- Modèle : anthropic/claude-sonnet-5.5 ; 3 ou 1 passage(s) par dossier ; coût total 2.66 $.
- Dates des passages : 2026-10-31 → 2026-11-04.
- Chemin de l'application : couche texte → détections automatiques acceptées telles quelles (à la place de la relecture humaine) → masquage → vérification → images des pages masquées → découpage → frise.
- Tolérance sur les dates selon la certitude attendue : exacte ±3 j, mois ±15 j, année : l'année, approximative ±1 an.
- « Trouvé » = même piste, même libellé (à la formulation près), début compatible. La précision est une borne basse : un événement « en plus » peut être vrai et absent de la vérité.

Les nombres donnent la moyenne des passages, puis (min–max).

## Synthèse

| Dossier | Attendus | Trouvés | Mal datés | Autre piste | Manqués | Produits | Rappel | Précision (borne basse) | Observations rendues / attendues |
|---|---|---|---|---|---|---|---|---|---|
| `alcool-cirrhose` | 28 | 24 | 1 | 0 | 3 | 31 | 86 % | 77 % | 17/17 |
| `alcool-depression` | 31 | 29 (29–29) | 0 (0–1) | 1 (0–1) | 1 (1–1) | 35 (34–36) | 94 (94–94) % | 82 (81–85) % | 19 (19–19)/19 |
| `alcool-tspt` | 24 | 21 | 0 | 0 | 3 | 29 | 88 % | 72 % | 15/15 |
| `antalgiques-opioides` | 17 | 15 | 0 | 0 | 2 | 22 | 88 % | 68 % | 13/13 |
| `bupre-grossesse` | 22 | 19 | 0 | 1 | 2 | 31 | 86 % | 61 % | 16/16 |
| `bzd-anxiete` | 16 | 14 | 0 | 1 | 1 | 20 | 88 % | 70 % | 14/14 |
| `cannabis-jeune` | 19 | 17 (17–18) | 0 (0–0) | 0 (0–0) | 2 (1–2) | 20 (19–20) | 91 (89–95) % | 88 (85–90) % | 11 (11–11)/11 |
| `cannabis-justice` | 19 | 18 | 0 | 0 | 1 | 20 | 95 % | 90 % | 14/14 |
| `chemsex-prep` | 27 | 25 | 1 | 0 | 1 | 29 | 93 % | 86 % | 15/15 |
| `crack-rue` | 30 | 28 | 0 | 0 | 2 | 38 | 93 % | 74 % | 18/18 |
| `jeu-bipolaire` | 23 | 21 | 0 | 0 | 2 | 27 | 91 % | 78 % | 14/14 |
| `methadone-schizophrenie` | 19 | 17 | 0 | 1 | 1 | 24 | 89 % | 71 % | 15/15 |
| `opiaces-tso` | 29 | 22 (21–23) | 1 (1–2) | 0 (0–0) | 5 (4–7) | 33 (30–34) | 77 (72–79) % | 68 (68–70) % | 15 (15–15)/15 |
| `tabac-infarctus` | 16 | 14 | 0 | 0 | 2 | 22 | 88 % | 64 % | 10/10 |
| **Total** (tous passages réunis) | 478 | 422 | | | | 556 | 88 % | 76 % | |

## Exactitude des événements trouvés

| Contrôle | `alcool-cirrhose` | `alcool-depression` | `alcool-tspt` | `antalgiques-opioides` | `bupre-grossesse` | `bzd-anxiete` | `cannabis-jeune` | `cannabis-justice` | `chemsex-prep` | `crack-rue` | `jeu-bipolaire` | `methadone-schizophrenie` | `opiaces-tso` | `tabac-infarctus` | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| début aussi précis | 100 % | 100 % | 100 % | 93 % | 100 % | 100 % | 92 % | 100 % | 100 % | 100 % | 95 % | 94 % | 100 % | 93 % | 98 % (414/422) |
| fin compatible | 69 % | 75 % | 82 % | 50 % | 75 % | 50 % | 58 % | 60 % | 100 % | 78 % | 50 % | 78 % | 63 % | 80 % | 71 % (115/163) |
| « en cours » juste | 83 % | 86 % | 90 % | 80 % | 89 % | 93 % | 96 % | 94 % | 100 % | 89 % | 90 % | 94 % | 93 % | 100 % | 91 % (384/422) |
| mode d'usage juste | 100 % | 88 % | 80 % | 75 % | 80 % | 100 % | 100 % | 100 % | 75 % | 100 % | 75 % | 100 % | 86 % | 100 % | 90 % (111/123) |
| au moins une source attendue | 100 % | 100 % | 100 % | 93 % | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % (421/422) |

## Rappel par piste (tous dossiers, tous passages)

| Piste | Trouvés / attendus | Rappel |
|---|---|---|
| Consommations | 123/140 | 88 % |
| Psychopathologie | 35/41 | 85 % |
| Somatique | 35/37 | 95 % |
| Médicaments | 83/91 | 91 % |
| Prises en charge | 65/79 | 82 % |
| Événements de vie | 81/90 | 90 % |

## Validation par le code

Événements rendus par le modèle, puis écartés ou fusionnés par `assembleTimeline` (`web/src/notebook/timeline.ts`).

| Passage | Dossier | Rendus | Piste inconnue | Date illisible | Sans source connue | Fusionnés (doublons) | Gardés |
|---|---|---|---|---|---|---|---|
| run1 | `alcool-cirrhose` | 31 | 0 | 0 | 0 | 0 | 31 |
| run1 | `alcool-depression` | 36 | 0 | 0 | 0 | 0 | 36 |
| run2 | `alcool-depression` | 34 | 0 | 0 | 0 | 0 | 34 |
| run3 | `alcool-depression` | 36 | 0 | 0 | 0 | 0 | 36 |
| run1 | `alcool-tspt` | 29 | 0 | 0 | 0 | 0 | 29 |
| run1 | `antalgiques-opioides` | 22 | 0 | 0 | 0 | 0 | 22 |
| run1 | `bupre-grossesse` | 31 | 0 | 0 | 0 | 0 | 31 |
| run1 | `bzd-anxiete` | 20 | 0 | 0 | 0 | 0 | 20 |
| run1 | `cannabis-jeune` | 19 | 0 | 0 | 0 | 0 | 19 |
| run2 | `cannabis-jeune` | 20 | 0 | 0 | 0 | 0 | 20 |
| run3 | `cannabis-jeune` | 20 | 0 | 0 | 0 | 0 | 20 |
| run1 | `cannabis-justice` | 20 | 0 | 0 | 0 | 0 | 20 |
| run1 | `chemsex-prep` | 29 | 0 | 0 | 0 | 0 | 29 |
| run1 | `crack-rue` | 38 | 0 | 0 | 0 | 0 | 38 |
| run1 | `jeu-bipolaire` | 27 | 0 | 0 | 0 | 0 | 27 |
| run1 | `methadone-schizophrenie` | 24 | 0 | 0 | 0 | 0 | 24 |
| run1 | `opiaces-tso` | 34 | 0 | 0 | 0 | 0 | 34 |
| run2 | `opiaces-tso` | 30 | 0 | 0 | 0 | 0 | 30 |
| run3 | `opiaces-tso` | 34 | 0 | 0 | 0 | 0 | 34 |
| run1 | `tabac-infarctus` | 22 | 0 | 0 | 0 | 0 | 22 |

## Découpage en observations

| Passage | Document | Attendues | Rendues | Dates justes |
|---|---|---|---|---|
| run1 | `alcool-cirrhose/historique.pdf` | 17 | 17 | 17/17 |
| run1 | `alcool-depression/courrier.pdf` | 1 | 1 | 0/0 |
| run1 | `alcool-depression/historique.pdf` | 18 | 18 | 18/18 |
| run2 | `alcool-depression/courrier.pdf` | 1 | 1 | 0/0 |
| run2 | `alcool-depression/historique.pdf` | 18 | 18 | 18/18 |
| run3 | `alcool-depression/courrier.pdf` | 1 | 1 | 0/0 |
| run3 | `alcool-depression/historique.pdf` | 18 | 18 | 18/18 |
| run1 | `alcool-tspt/historique.pdf` | 15 | 15 | 15/15 |
| run1 | `antalgiques-opioides/historique.pdf` | 13 | 13 | 13/13 |
| run1 | `bupre-grossesse/historique.pdf` | 16 | 16 | 16/16 |
| run1 | `bzd-anxiete/courrier.pdf` | 1 | 1 | 0/0 |
| run1 | `bzd-anxiete/historique.pdf` | 13 | 13 | 13/13 |
| run1 | `cannabis-jeune/historique.pdf` | 10 | 10 | 10/10 |
| run1 | `cannabis-jeune/urgences.pdf` | 1 | 1 | 0/0 |
| run2 | `cannabis-jeune/historique.pdf` | 10 | 10 | 10/10 |
| run2 | `cannabis-jeune/urgences.pdf` | 1 | 1 | 0/0 |
| run3 | `cannabis-jeune/historique.pdf` | 10 | 10 | 10/10 |
| run3 | `cannabis-jeune/urgences.pdf` | 1 | 1 | 0/0 |
| run1 | `cannabis-justice/historique.pdf` | 13 | 13 | 13/13 |
| run1 | `cannabis-justice/urgences.pdf` | 1 | 1 | 0/0 |
| run1 | `chemsex-prep/historique.pdf` | 15 | 15 | 15/15 |
| run1 | `crack-rue/historique.pdf` | 18 | 18 | 18/18 |
| run1 | `jeu-bipolaire/historique.pdf` | 14 | 14 | 14/14 |
| run1 | `methadone-schizophrenie/historique.pdf` | 15 | 15 | 15/15 |
| run1 | `opiaces-tso/historique.pdf` | 15 | 15 | 15/15 |
| run2 | `opiaces-tso/historique.pdf` | 15 | 15 | 15/15 |
| run3 | `opiaces-tso/historique.pdf` | 15 | 15 | 15/15 |
| run1 | `tabac-infarctus/historique.pdf` | 10 | 10 | 10/10 |

## Stabilité d'un passage à l'autre

| Dossier | Trouvés à chaque passage | Parfois | Jamais |
|---|---|---|---|
| `alcool-depression` | 28 | 2 | 1 |
| `cannabis-jeune` | 16 | 3 | 0 |
| `opiaces-tso` | 19 | 6 | 4 |

## Détail par dossier

### `alcool-cirrhose`

Statut au passage `run1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Alcool | 2015 → 2023-03-27 (year) | usage | trouvé | Alcool · 2015 → 2023-03-27 · usage |
| Consommations | Alcool | 2022-11 (month) | sevrage | trouvé | Alcool · 2022-11 · sevrage |
| Consommations | Alcool | 2023-03-27 → 2023-04-07 (exact) | sevrage | trouvé | Alcool · 2023-03-27 → 2023-04-07 · sevrage |
| Consommations | Alcool | 2023-06 → 2023-11-20 (month) | rechute | trouvé | Alcool · 2023-06 → 2023-11-20 · rechute |
| Consommations | Alcool | 2024-06 (month) | craving | trouvé | Alcool · 2024-06-25 · craving |
| Consommations | Alcool | 2024-07 → 2024-08-25 (approx) | rechute | trouvé | Alcool · 2024-07 → 2024-08-25 · rechute |
| Consommations | Tabac | 1982 (approx) | usage | manqué |  |
| Psychopathologie | Épisode dépressif (deuil) | 2023-07 → 2024-03 (approx) |  | trouvé | Deuil difficile avec symptomatologie dépressive · 2023-07 → 2024-03 |
| Psychopathologie | Thymie abaissée | 2024-09 (approx) |  | trouvé | Thymie abaissée / découragement · 2024-08-29 → ⚠ « en cours » juste |
| Somatique | Cirrhose alcoolique | 2022 (year) |  | trouvé | Cirrhose alcoolique · 2022 → 2025-01-14 ⚠ fin compatible |
| Somatique | Crise convulsive de sevrage | 2022-11 (month) |  | trouvé | Crise convulsive généralisée · 2022-11 |
| Somatique | Décompensation œdémato-ascitique | 2023-01 (month) |  | trouvé | Décompensation oedémato-ascitique et ligature de varices oesophagiennes · 2023-01 |
| Somatique | Ascite (ponctions) | 2023-10-09 (exact) |  | trouvé | Ascite : ponction évacuatrice · 2023-10-09 |
| Somatique | Hémorragie digestive (rupture de varices œsophagiennes) | 2023-11-20 → 2023-11-24 (exact) |  | trouvé | Hémorragie digestive sur rupture de varices oesophagiennes · 2023-11-20 → 2023-11-24 |
| Somatique | Décompensation hépatique (encéphalopathie) | 2024-12-02 → 2025-01-14 (exact) |  | trouvé | Hospitalisation en hépatologie (ictère, ascite, encéphalopathie hépatique) · 2024-12-02 → 2025-01-14 |
| Médicaments | Oxazépam | 2023-03-27 → 2023-04-07 (exact) |  | trouvé | Oxazépam · 2023-03-27 → 2023-04-07 |
| Médicaments | Thiamine | 2023-03-27 (exact) |  | mal daté | Thiamine · 2023-04-11 |
| Médicaments | Baclofène | 2023-04-11 → 2025-01-14 (exact) |  | trouvé | Baclofène · 2023-04-11 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Mirtazapine | 2023-07-18 → 2025-01-14 (exact) |  | trouvé | Mirtazapine · 2023-07-18 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Substituts nicotiniques | 2024-01-09 (exact) |  | trouvé | Substituts nicotiniques · 2024-01-09 → ⚠ « en cours » juste |
| Prises en charge | Suivi addictologique (CSAPA) | 2023-03-06 → 2025-01-14 (exact) |  | trouvé | Suivi addictologique ambulatoire · 2023-03-06 → 2025-01-21 ⚠ fin compatible |
| Prises en charge | Hospitalisation pour sevrage | 2023-03-27 → 2023-04-07 (exact) |  | trouvé | Hospitalisation de sevrage en unité d'addictologie · 2023-03-27 → 2023-04-07 |
| Prises en charge | Suivi hépatologique | 2022 (approx) |  | manqué |  |
| Prises en charge | Accompagnement social | 2023-09-05 (exact) |  | trouvé | Entretien social · 2023-09-05 |
| Prises en charge | Inscription sur liste de greffe hépatique | 2024-06-18 → 2024-08-29 (exact) |  | manqué |  |
| Événements de vie | Licenciement | 2015 (year) |  | trouvé | Licenciement (chauffeur poids lourd) · 2015 |
| Événements de vie | Décès de son frère | 2023-06-26 (exact) |  | trouvé | Décès du frère (cancer du pancréas) · 2023-06-26 |
| Événements de vie | Décès du patient | 2025-01-14 (exact) |  | trouvé | Décès du patient · 2025-01-14 |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Alcool** · 2023-11-20 → 2023-11-24 · sevrage — Sevrage pendant l'hospitalisation pour hémorragie digestive, sous oxazépam, non compliqué. Pas d'alcool depuis le 20/11.
- Médicaments · **Oxazépam** · 2023-11-20 → 2023-11-24 — Traitement du sevrage pendant l'hospitalisation en hépatologie.
- Somatique · **Parcours de greffe hépatique** · 2024-01 → 2024-08-29 — Bilan pré-greffe, accord d'inscription sur liste en RCP le 18/06/2024, inscription suspendue le 29/08/2024. Réévaluation prévue à 6 mois.
- Somatique · **Ascite récidivante** · 2024-10 — Ponction prévue la semaine suivant le 15/10/2024. Fatigue importante.
- Événements de vie · **Invalidité catégorie 2** · 2022 → — Épouse travaillant à mi-temps.
- Événements de vie · **Suspension de l'inscription sur liste de greffe** · 2024-08-29 — Décision de la RCP après EthG positif. Déception et colère contre lui-même.

### `alcool-depression`

Statut au passage `run1`, et nombre de passages où l'événement est trouvé (sur 3).

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle | Trouvé |
|---|---|---|---|---|---|---|
| Consommations | Alcool | 2015 → 2019 (approx) | usage | trouvé | Alcool · 2015 → 2022-12-05 · usage ⚠ fin compatible | 3/3 |
| Consommations | Alcool | 2019 (approx) | sevrage | autre piste | Sevrage hospitalier (clinique des Pins) · 2019 | 1/3 |
| Consommations | Alcool | 2019 → 2022-12-05 (approx) | rechute | manqué |  | 0/3 |
| Consommations | Alcool | 2022-11-14 (exact) | intoxication | trouvé | Alcool · 2022-11-14 · intoxication | 3/3 |
| Consommations | Alcool | 2022-12-05 → 2022-12-16 (exact) | sevrage | trouvé | Alcool · 2022-12-05 → 2022-12-16 · sevrage | 3/3 |
| Consommations | Alcool | 2022-12-25 (exact) | rechute | trouvé | Alcool · 2022-12-25 · rechute | 3/3 |
| Consommations | Alcool | 2023-02 (month) | usage | trouvé | Alcool · 2023-02 → 2023-02 · rechute ⚠ fin compatible, mode d'usage juste | 3/3 |
| Consommations | Alcool | 2023-04 (month) | craving | trouvé | Alcool · 2023-05 · craving | 3/3 |
| Consommations | Alcool | 2024-01 → (month) | rechute | trouvé | Alcool · 2024-01 → · rechute | 3/3 |
| Consommations | Tabac | 2022-11 → (approx) | usage | trouvé | Tabac · 2022-11-14 → · usage | 3/3 |
| Psychopathologie | Épisode dépressif caractérisé | 2022-11 → 2023-09 (month) |  | trouvé | Symptomatologie dépressive / trouble de l'adaptation suspecté · 2022-11-24 → 2023-01-10 ⚠ fin compatible | 3/3 |
| Psychopathologie | Tentative de suicide | 2016 (year) |  | trouvé | Intoxication médicamenteuse volontaire · 2016 | 3/3 |
| Psychopathologie | Idées de mort passives | 2023-06 (month) |  | trouvé | Idées de mort passives · 2023-06-13 | 2/3 |
| Somatique | Fracture du radius gauche | 2022-11-14 → 2023-01-10 (exact) |  | trouvé | Fracture de l'extrémité inférieure du radius gauche · 2022-11-14 → 2023-01-10 | 3/3 |
| Somatique | Stéatose hépatique | 2022-12 → (month) |  | trouvé | Stéatose hépatique · 2022-12-16 ⚠ « en cours » juste | 3/3 |
| Médicaments | Diazépam | 2022-12-05 → 2022-12-16 (exact) |  | trouvé | Diazépam · 2022-12-05 → 2022-12-16 | 3/3 |
| Médicaments | Thiamine | 2022-11-24 (exact) |  | trouvé | Thiamine · 2022-11-24 → ⚠ « en cours » juste | 3/3 |
| Médicaments | Acamprosate | 2022-12-16 → 2023-02-21 (exact) |  | trouvé | Acamprosate · 2022-12-16 → 2023-02-21 | 3/3 |
| Médicaments | Sertraline | 2023-01-10 → (exact) |  | trouvé | Sertraline · 2023-01-10 → | 3/3 |
| Médicaments | Baclofène | 2023-02-21 → 2023-12 (month) |  | trouvé | Baclofène · 2023-02-21 → 2023-12 | 3/3 |
| Médicaments | Baclofène | 2024-01-25 → (exact) |  | trouvé | Baclofène · 2024-01-25 → | 3/3 |
| Médicaments | Substituts nicotiniques | 2023-09-19 (exact) |  | trouvé | Substituts nicotiniques (patchs) · 2023-09-19 → ⚠ « en cours » juste | 3/3 |
| Prises en charge | Hospitalisation pour sevrage | 2022-12-05 → 2022-12-16 (exact) |  | trouvé | Hospitalisation pour sevrage · 2022-12-05 → 2022-12-16 | 3/3 |
| Prises en charge | Suivi psychiatrique en addictologie | 2022-11-24 → (exact) |  | trouvé | Suivi consultation addictologie CSAPA · 2022-11-24 → | 3/3 |
| Prises en charge | Psychothérapie (TCC) | 2022-12-12 → (exact) |  | trouvé | Suivi psychologique · 2022-12-12 → | 3/3 |
| Prises en charge | Accompagnement social | 2023-01-03 (exact) |  | trouvé | Entretien social · 2023-01-03 | 3/3 |
| Événements de vie | Divorce | 2016 (year) |  | trouvé | Divorce · 2016 | 3/3 |
| Événements de vie | Arrêt de travail | 2022-09-12 → 2023-09-04 (exact) |  | trouvé | Arrêt maladie (aide-soignante en EHPAD) · 2022-09-12 → 2023-09-04 | 3/3 |
| Événements de vie | Décès de sa mère | 2023-04 (month) |  | trouvé | Décès de la mère · 2023-04 | 3/3 |
| Événements de vie | Reprise du travail à mi-temps thérapeutique | 2023-09-04 (exact) |  | trouvé | Reprise du travail en mi-temps thérapeutique · 2023-09-04 → ⚠ « en cours » juste | 3/3 |
| Événements de vie | Départ de son fils pour Toulouse | 2024-01 (month) |  | trouvé | Départ du fils pour Toulouse (formation) · 2024-01 | 3/3 |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Alcool** · 2023-01-10 → 2023-02-21 · craving — Craving important en soirée, persistant en février malgré l'acamprosate.
- Psychopathologie · **Épisode dépressif caractérisé** · 2023-01-10 → — EDC d'intensité moyenne retenu après 3 semaines d'abstinence. Amélioration en septembre 2023 : rémission partielle. Janvier 2024 : tristesse réactionnelle sans rechute dépressive franche.
- Prises en charge · **Passage aux urgences / UHCD** · 2022-11-14 → 2022-11-15 — Surveillance jusqu'à dégrisement, immobilisation du poignet.
- Prises en charge · **Rencontre ELSA** · 2022-11-15 — Acceptation d'une hospitalisation pour sevrage programmé et inscription sur liste d'attente.
- Prises en charge · **Suivi infirmier CSAPA** · 2022-12-16 → — IDE hebdomadaire prévu à la sortie, maintenu en janvier 2024.
- Événements de vie · **Difficultés financières** · 2022 → — Découvert bancaire important, pension alimentaire non versée depuis l'été 2022.

### `alcool-tspt`

Statut au passage `run1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Alcool | 2022 → 2024-06-30 (year) | usage | trouvé | Alcool · 2022 → 2024-06-30 · usage |
| Consommations | Alcool | 2024-07-01 → 2024-07-12 (exact) | sevrage | trouvé | Alcool · 2024-07-01 → 2024-07-09 · sevrage |
| Consommations | Alcool | 2024-08-15 → 2024-09-21 (exact) | rechute | trouvé | Alcool · 2024-08-15 → 2024-09-21 · rechute |
| Consommations | Alcool | 2024-12-25 (exact) | rechute | trouvé | Alcool · 2024-12-25 · usage ⚠ mode d'usage juste |
| Consommations | Tabac | 2024-06 → (approx) | usage | trouvé | Tabac · 2024-06-03 → · usage |
| Psychopathologie | Trouble de stress post-traumatique | 2024-06 → (approx) |  | trouvé | Trouble de stress post-traumatique (TSPT) · 2024-06-03 → |
| Psychopathologie | Scarifications | 1999 → 2003 (approx) |  | manqué |  |
| Psychopathologie | Épisode dépressif caractérisé sévère | 2024-08 → 2024-12 (approx) |  | trouvé | Épisode dépressif caractérisé sévère · 2024-08-27 → 2025-09-09 |
| Psychopathologie | Tentative de suicide | 2024-09-21 (exact) |  | trouvé | Intoxication médicamenteuse volontaire (tentative de suicide) · 2024-09-21 |
| Somatique | Intoxication au paracétamol, réanimation | 2024-09-21 → 2024-09-24 (exact) |  | trouvé | Intoxication au paracétamol · 2024-09-21 → 2024-09-24 |
| Médicaments | Diazépam | 2024-07-01 → 2024-07-12 (exact) |  | trouvé | Diazépam · 2024-07-01 → 2024-07-12 |
| Médicaments | Thiamine | 2024-07-01 (approx) |  | trouvé | Thiamine · 2024-07-09 |
| Médicaments | Acamprosate | 2024-07-09 → 2024-08-15 (exact) |  | trouvé | Acamprosate · 2024-07-09 → 2024-08-27 ⚠ fin compatible |
| Médicaments | Sertraline | 2024-10 → (approx) |  | trouvé | Sertraline · 2024-09 → |
| Médicaments | Naltrexone | 2024-10-15 → (exact) |  | trouvé | Naltrexone · 2024-10-15 → |
| Médicaments | Substituts nicotiniques | 2025-10-21 → (exact) |  | trouvé | Patch nicotinique · 2025-10-21 → |
| Prises en charge | Suivi addictologique (CSAPA) | 2024-06-03 → (exact) |  | manqué |  |
| Prises en charge | Hospitalisation en clinique psychiatrique | 2024-09-24 → 2024-10-12 (exact) |  | trouvé | Clinique psychiatrique · 2024-09-24 → 2024-10-12 |
| Prises en charge | Psychothérapie (psychotrauma, EMDR) | 2024-10-29 → (exact) |  | trouvé | Psychothérapie : stabilisation · 2024-10-29 → 2025-02-18 ⚠ fin compatible, « en cours » juste |
| Événements de vie | Violences conjugales | 2015 → 2022 (year) |  | trouvé | Violences conjugales (ex-conjoint) · 2015 → 2022 |
| Événements de vie | Arrêt de travail | 2024-06-18 → 2025-09-01 (exact) |  | trouvé | Arrêt de travail · 2024-06-18 → 2025-09-01 |
| Événements de vie | Enfants confiés à sa sœur | 2024-09-21 → 2024-10 (approx) |  | manqué |  |
| Événements de vie | Décision du JAF (résidence des enfants) | 2025-06-10 (exact) |  | trouvé | Décision du JAF · 2025-06-10 |
| Événements de vie | Reprise du travail à mi-temps thérapeutique | 2025-09-01 (exact) |  | trouvé | Reprise du travail en mi-temps thérapeutique (EHPAD) · 2025-09-01 → ⚠ « en cours » juste |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Alcool** · 2025-06-10 · craving — Envie forte le soir de la décision du JAF, sans consommation ; a appelé sa sœur.
- Somatique · **Perturbation du bilan hépatique (GGT, VGM élevés)** · 2024-06-18 → 2025-10-14 — GGT 186 et VGM 101 en juin 2024 ; GGT 28, CDT et VGM normaux au bilan du 14/10/2025.
- Prises en charge · **Sevrage ambulatoire encadré (IDE + IDEL)** · 2024-07-01 → 2024-07-09 — Passages IDE à domicile jusqu'à J7, suivi à J8 ; hospitalisation refusée à cause des enfants.
- Prises en charge · **Réanimation** · 2024-09-21 → 2024-09-24 — Hospitalisation en réanimation après l'IMV.
- Prises en charge · **Psychothérapie : EMDR** · 2025-02-18 → — Début de l'EMDR après 4 mois de stabilisation, poursuivi en juin 2025.
- Événements de vie · **Ordonnance de protection** · 2023 — Ordonnance de protection obtenue en 2023.
- Événements de vie · **Audience devant le JAF** · 2024-08 — Audience avec l'ex-conjoint présent, suivie de la rechute le 15/08.
- Événements de vie · **Retour des enfants à la maison** · 2024-10 — Enfants gardés par la sœur pendant l'hospitalisation, de retour fin octobre.

### `antalgiques-opioides`

Statut au passage `run1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Opioïdes (tramadol, oxycodone) | 2020 → 2024-09-29 (approx) | usage | trouvé | Opioïdes · 2020 → 2024-09-29 · usage |
| Consommations | Opioïdes (tramadol, oxycodone) | 2024-08-17 (exact) | intoxication | trouvé | Opioïdes · 2024-08-17 · intoxication |
| Consommations | Opioïdes (tramadol, oxycodone) | 2024-09-29 → 2024-09-30 (exact) | sevrage | trouvé | Opioïdes · 2024-10 · usage ⚠ fin compatible, mode d'usage juste, au moins une source attendue |
| Consommations | Oxycodone | 2025-04 (month) | rechute | manqué |  |
| Consommations | Tabac | 2024-09 → (approx) | usage | trouvé | Tabac · 2024-09-11 → · usage |
| Psychopathologie | Épisode dépressif caractérisé | 2023-06 → 2025-06 (approx) |  | trouvé | Épisode dépressif caractérisé d'intensité moyenne · 2023-06 → ⚠ fin compatible, « en cours » juste |
| Somatique | Lombalgie chronique (arthrodèse L4-L5) | 2021 → (year) |  | trouvé | Arthrodèse L4-L5 · 2021 ⚠ « en cours » juste |
| Somatique | Fibromyalgie | 2025-01-13 → (exact) |  | manqué |  |
| Médicaments | Buprénorphine | 2024-09-30 → 2025-10-13 (exact) |  | trouvé | Buprénorphine sublinguale · 2024-09-30 → 2025-10-13 |
| Médicaments | Buprénorphine LP injectable mensuelle | 2025-10-14 → (exact) |  | trouvé | Buprénorphine LP injectable mensuelle · 2025-10-14 → |
| Médicaments | Naloxone (kit) | 2024-10-01 (exact) |  | trouvé | Naloxone (kit) · 2024-10-01 |
| Médicaments | Duloxétine | 2024-11-26 → (exact) |  | trouvé | Duloxétine · 2024-11-26 → |
| Prises en charge | Suivi addictologique (CSAPA) | 2024-09-11 → (exact) |  | trouvé | Suivi CSAPA (prescripteur unique d'opioïdes) · 2024-09-11 → |
| Prises en charge | Centre de la douleur (CETD) | 2025-01-13 → (exact) |  | trouvé | Consultation CETD (centre d'étude et de traitement de la douleur) · 2025-01-13 ⚠ « en cours » juste |
| Prises en charge | Accompagnement social | 2024-11-05 (exact) |  | trouvé | Entretien social (RQTH, pension d'invalidité) · 2024-11-05 |
| Événements de vie | Licenciement pour inaptitude | 2023-06 (month) |  | trouvé | Licenciement pour inaptitude · 2023-06 |
| Événements de vie | Départ de son fils pour ses études | 2025-09-01 (exact) |  | trouvé | Départ du fils pour ses études à Toulouse · 2025-09-01 |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Opioïdes** · 2025-04 → 2025-04 · rechute — Reprise d'oxycodone pendant 3 jours mi-avril lors d'une poussée douloureuse (anciennes boîtes retrouvées). Pas de surdosage. En juin, elle dit n'en avoir pris qu'une seule fois.
- Consommations · **Opioïdes** · 2025-05-06 · craving — Craving faible depuis l'épisode d'avril.
- Psychopathologie · **Trouble de l'usage des opioïdes sévère** · 2024-09-11 → — Diagnostic posé au premier entretien, sur douleur chronique.
- Somatique · **Surdosage opioïde (somnolence, chute, bradypnée)** · 2024-08-17 — Passage aux urgences, naloxone par le SMUR.
- Médicaments · **Tramadol** · 2020 → 2024-09 — Associé à l'oxycodone. Urines positives le 19/09/2024. Arrêt autour de l'induction. À ne pas associer à la buprénorphine.
- Médicaments · **Oxycodone** · 2021 → 2024-09-29 — LP 40 mg x2 + LI 10 mg jusqu'à 4/j. Dernière prise le 29/09/2024.
- Prises en charge · **Activité physique adaptée, TENS, balnéothérapie** · 2025-01 → — Programme proposé par le CETD. En juin 2025 : marche 30 min/j et piscine 1 fois/semaine.

### `bupre-grossesse`

Statut au passage `run1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Héroïne | 2014 → 2019 (approx) | usage | manqué |  |
| Consommations | Héroïne | 2024-05 (month) | rechute | trouvé | Héroïne · 2024-05 · rechute |
| Consommations | Héroïne | 2025-05-10 (exact) | rechute | trouvé | Héroïne · 2025-05-10 · rechute |
| Consommations | Cannabis | 2024-01 → 2024-03-03 (approx) | usage | trouvé | Cannabis · 2024-01-15 → 2024-03-03 · usage |
| Consommations | Cannabis | 2024-10 → (month) | rechute | trouvé | Cannabis · 2024-10 → · usage ⚠ mode d'usage juste |
| Consommations | Tabac | 2024-01 → (approx) | usage | trouvé | Tabac · 2024-01-15 → · usage |
| Psychopathologie | Épisode dépressif du post-partum | 2024-10 → 2025-09 (approx) |  | trouvé | Épisode dépressif caractérisé du post-partum · 2024-12 → 2025-09-09 |
| Somatique | Grossesse | 2024-01 → 2024-09-29 (month) |  | trouvé | Grossesse · 2024-01 → 2024-09-29 |
| Somatique | Syndrome de sevrage néonatal (nouveau-né) | 2024-10-01 → 2024-10-08 (approx) |  | manqué |  |
| Médicaments | Buprénorphine | 2019 → (year) |  | trouvé | Buprénorphine haut dosage (BHD) · 2019 → |
| Médicaments | Substituts nicotiniques | 2024-03-07 (exact) |  | trouvé | Substituts nicotiniques (patch + gommes) · 2024-03-07 |
| Médicaments | Substituts nicotiniques | 2025-09-09 → (exact) |  | trouvé | Substituts nicotiniques (patch + forme orale) · 2025-09-09 → |
| Médicaments | Naloxone (kit) | 2024-03-07 (exact) |  | trouvé | Naloxone (kit) · 2024-03-07 |
| Médicaments | Sertraline | 2025-01-23 → (exact) |  | trouvé | Sertraline · 2025-01-23 → |
| Prises en charge | Suivi CSAPA (TSO) | 2019 → (approx) |  | trouvé | Suivi CSAPA avec TSO par BHD · 2019 → |
| Prises en charge | Suivi conjoint maternité (sage-femme) | 2024-04-18 → 2024-10-03 (exact) |  | trouvé | Consultation conjointe CSAPA / maternité · 2024-04-18 ⚠ fin compatible |
| Prises en charge | Accompagnement social | 2024-03-21 → (exact) |  | autre piste | Demande de logement social plus grand · 2024-03-21 |
| Prises en charge | Suivi psychologique (PMI) | 2025-02 → (month) |  | trouvé | Suivi avec la psychologue de la PMI · 2025-02 → |
| Événements de vie | Naissance de son fils | 2024-09-29 (exact) |  | trouvé | Naissance du fils · 2024-09-29 |
| Événements de vie | Séparation | 2024-12 (month) |  | trouvé | Séparation d'avec le compagnon · 2024-12 |
| Événements de vie | Entrée de son fils en crèche | 2025-06 (month) |  | trouvé | Place en crèche pour le fils · 2025-06 → ⚠ « en cours » juste |
| Événements de vie | Reprise du travail à mi-temps | 2025-09-01 (exact) |  | trouvé | Reprise du travail à mi-temps · 2025-09-01 → ⚠ « en cours » juste |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Héroïne** · 2024-05-30 · craving — Craving en fin de journée, avec sensation de manque légère le soir (bâillements, jambes sans repos).
- Consommations · **Héroïne** · 2024-07-25 · sevrage — Signes de manque en fin de journée malgré le fractionnement de la BHD, attendus au 3e trimestre. Pas de nouvelle consommation d'héroïne.
- Médicaments · **Naloxone (kit)** · 2025-05-15 — Nouveau kit remis, l'ancien étant périmé.
- Psychopathologie · **Anxiété et thymie abaissée** · 2024-05-30 — Thymie légèrement abaissée, anxiété anticipatoire sur l'accouchement et le regard de l'équipe de maternité. Pas d'idées suicidaires.
- Psychopathologie · **Symptômes dépressifs du post-partum** · 2024-10-22 — Fatigue intense, pleurs, culpabilité, sommeil fragmenté. EPDS à 14. Vigilance dépression du post-partum.
- Somatique · **Nausées matinales** · 2024-04-18 → 2024-05-30 — Nausées matinales sans vomissements à 12 SA, encore marquées (++) à 18 SA.
- Prises en charge · **Visites PMI à domicile** · 2024-10-08 → 2024-12-12 — Visites organisées dès la sortie de l'enfant ; passage hebdomadaire en décembre 2024. Date de fin non précisée.
- Prises en charge · **Point sevrage tabac avec l'IDE tabacologue** · 2025-09-09 — Point de sevrage tabac prévu avec l'IDE tabacologue.
- Événements de vie · **Vie en couple avec M.** · 2021 → 2024-12 — En couple depuis 3 ans en janvier 2024. Le compagnon est parti du domicile début décembre 2024 après des disputes.
- Événements de vie · **Projet d'enfant (retrait de l'implant)** · 2023-11 — Implant retiré en novembre 2023 pour un projet d'enfant.
- Événements de vie · **Allaitement** · 2024-09 → 2025-01 — Allaitement maternel compatible avec la BHD, arrêté début janvier 2025.

### `bzd-anxiete`

Statut au passage `run1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Benzodiazépines (alprazolam) | 2005 → 2024-03-05 (approx) | usage | trouvé | Benzodiazépines · 2005 → 2025-09-30 · usage ⚠ fin compatible |
| Consommations | Benzodiazépines (alprazolam) | 2024-01-13 → 2024-02-09 (approx) | sevrage | trouvé | Benzodiazépines · 2024-01-17 · sevrage ⚠ fin compatible |
| Consommations | Benzodiazépines (alprazolam) | 2024-11 → 2024-12 (month) | rechute | trouvé | Benzodiazépines · 2024-11 → 2024-12 · rechute |
| Consommations | Zolpidem | 2019 → 2025-01-01 (year) | usage | autre piste | Zolpidem · 2019 → 2025-01-01 |
| Consommations | Alcool | 2024-02 (approx) | usage | trouvé | Alcool · 2024-02-20 → · usage ⚠ « en cours » juste |
| Psychopathologie | Trouble anxieux généralisé | 1998 → (approx) |  | trouvé | Trouble anxieux généralisé · 1998 → |
| Somatique | Fracture du col du fémur droit | 2024-01-12 → 2024-02-09 (exact) |  | trouvé | Fracture du col du fémur droit (chute nocturne) · 2024-01-12 ⚠ fin compatible |
| Somatique | Crise convulsive de sevrage aux benzodiazépines | 2024-01-17 (exact) |  | trouvé | Crise convulsive généralisée · 2024-01-17 |
| Médicaments | Diazépam | 2024-03-05 → 2025-09-30 (exact) |  | trouvé | Diazépam · 2024-03-05 → 2025-09-30 |
| Médicaments | Sertraline | 2024-04-23 → (exact) |  | trouvé | Sertraline · 2024-04-23 → |
| Prises en charge | Suivi addictologique (CSAPA) | 2024-02-20 → (exact) |  | trouvé | Suivi psychiatrique / addictologique · 2024-02-20 → |
| Prises en charge | Hospitalisation (orthopédie puis SSR) | 2024-01-12 → 2024-02-09 (exact) |  | trouvé | Hospitalisation orthopédie puis rééducation en SSR · 2024-01-12 → 2024-02-09 |
| Prises en charge | Psychothérapie (TCC) | 2025-03 → (month) |  | trouvé | TCC de l'anxiété et de l'insomnie · 2025-03 → |
| Événements de vie | Veuvage | 2019 (year) |  | manqué |  |
| Événements de vie | Hospitalisation de sa sœur (AVC) | 2024-11 (month) |  | trouvé | Hospitalisation de la sœur aînée (AVC) · 2024-11 |
| Événements de vie | Déménagement près de sa fille | 2025-03-01 (exact) |  | trouvé | Déménagement près de sa fille · 2025-03-01 |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Benzodiazépines** · 2024-03-05 → 2025-09-30 · sevrage — Sevrage progressif sous diazépam (30 mg/j puis 25, 20, 15, 12, 8, 4, 2 mg/j), arrêt le 30/09/2025 avec insomnie de rebond transitoire.
- Consommations · **Benzodiazépines** · 2024-11-05 · craving — Demande de reprendre son alprazolam (Xanax) lors d'une période d'anxiété et d'insomnie (sœur hospitalisée) ; refus expliqué.
- Consommations · **Benzodiazépines** · 2025-06-03 · craving — Pense encore au Xanax uniquement le soir des mauvaises nouvelles.
- Médicaments · **Alprazolam** · 2005 → 2024-03-05 — 0,5 mg x3/j prescrits, dose réelle 3 mg/j ; remplacé par le diazépam le 05/03/2024.
- Événements de vie · **Décès du mari** · 2019 — Veuve depuis 2019 ; anxiété majorée à l'approche de la date anniversaire en septembre.

### `cannabis-jeune`

Statut au passage `run1`, et nombre de passages où l'événement est trouvé (sur 3).

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle | Trouvé |
|---|---|---|---|---|---|---|
| Consommations | Cannabis | 2017 → 2020-03 (approx) | usage | manqué |  | 2/3 |
| Consommations | Cannabis | 2020-03 → 2024-04-01 (month) | usage | trouvé | Cannabis · 2020 → 2024-03-31 · usage | 1/3 |
| Consommations | Cannabis | 2024-04-01 → 2024-04-08 (exact) | sevrage | trouvé | Cannabis · 2024-04-01 → 2024-04-23 · sevrage ⚠ fin compatible | 3/3 |
| Consommations | Cannabis | 2024-04-23 → (approx) | rechute | trouvé | Cannabis · 2024-04-23 → · rechute | 3/3 |
| Consommations | Alcool | 2024-03 → (approx) | usage | trouvé | Alcool · 2024-03-26 · usage ⚠ « en cours » juste | 3/3 |
| Consommations | Alcool | 2024-06 (month) | intoxication | trouvé | Alcool · 2024-06 · intoxication | 3/3 |
| Consommations | Tabac | 2024-03 → (approx) | usage | trouvé | Tabac · 2024-03-17 · usage ⚠ « en cours » juste | 3/3 |
| Psychopathologie | Trouble panique avec agoraphobie | 2023-07 → (approx) |  | trouvé | Trouble panique avec agoraphobie (probable) · 2023 → | 3/3 |
| Psychopathologie | TDAH (évaluation) | 2024-03-12 → (exact) |  | trouvé | TDAH (en cours d'évaluation) · 2024-03-12 → | 3/3 |
| Somatique | Syndrome d'hyperémèse cannabinoïde | 2024-02-10 → 2024-03-18 (exact) |  | trouvé | Syndrome d'hyperémèse cannabinoïde · 2024-02-10 → 2024-03-18 | 3/3 |
| Médicaments | Hydroxyzine | 2024-03-26 → (exact) |  | trouvé | Hydroxyzine · 2024-03-26 → | 3/3 |
| Médicaments | Halopéridol | 2024-03-17 (exact) |  | trouvé | Halopéridol · 2024-03-17 | 3/3 |
| Prises en charge | Consultation jeunes consommateurs | 2024-02-15 → (exact) |  | trouvé | Suivi CJC (éducatrice spécialisée) · 2024-02-15 → | 3/3 |
| Prises en charge | Psychothérapie (TCC) | 2024-03-12 → (exact) |  | trouvé | Psychothérapie (TCC) · 2024-03-12 → | 3/3 |
| Prises en charge | Suivi psychiatrique | 2024-03-26 → (exact) |  | trouvé | Suivi psychiatrique · 2024-03-26 → | 3/3 |
| Événements de vie | Départ de son père | 2009 (year) |  | manqué |  | 1/3 |
| Événements de vie | Arrêt du BTS | 2024-01 (month) |  | trouvé | Arrêt du BTS (MCO) · 2024-01 | 3/3 |
| Événements de vie | Rupture avec son compagnon | 2024-04 (approx) |  | trouvé | Dispute et séparation · 2024-04 | 3/3 |
| Événements de vie | Emploi saisonnier | 2024-07-01 → 2024-09 (exact) |  | trouvé | Emploi saisonnier en camping · 2024-07-01 → 2024-09 | 3/3 |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Prises en charge · **Passage aux urgences et UHCD** · 2024-03-17 → 2024-03-18 — Nuit en UHCD pour vomissements incoercibles. Hydratation, supplémentation potassique. Arrêt complet du cannabis conseillé.
- Prises en charge · **Bilan neuropsychologique demandé** · 2024-06-18 — Demandé pour explorer un TDAH, délai d'environ 6 mois.

### `cannabis-justice`

Statut au passage `run1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Cannabis | 2018 → 2024-11-08 (approx) | usage | trouvé | Cannabis · 2018 → 2024-11-08 · usage |
| Consommations | Cannabinoïdes de synthèse (PTC) | 2024-11-08 (exact) | intoxication | trouvé | Cannabinoïdes de synthèse · 2024-11-08 · intoxication |
| Consommations | Cannabis | 2024-12 (month) | rechute | trouvé | Cannabis · 2024-12 · rechute |
| Consommations | Cannabis | 2025-02 → (month) | rechute | trouvé | Cannabis · 2025-02 → · rechute |
| Consommations | Alcool | 2024-06 → (approx) | usage | trouvé | Alcool · 2024-06 → · usage |
| Consommations | Tabac | 2024-06 → (approx) | usage | trouvé | Tabac · 2024-06 → · usage |
| Psychopathologie | Épisode psychotique induit (cannabinoïdes de synthèse) | 2024-11-08 → 2024-11-19 (exact) |  | trouvé | Épisode psychotique aigu induit par les cannabinoïdes de synthèse · 2024-11-08 ⚠ fin compatible |
| Psychopathologie | TDAH | 2025-02 → (month) |  | trouvé | TDAH, présentation combinée · 2025-02 → |
| Médicaments | Loxapine | 2024-11-08 (exact) |  | trouvé | Loxapine · 2024-11-08 |
| Médicaments | Rispéridone | 2024-11 → 2025-03-01 (month) |  | trouvé | Rispéridone · 2024-11 → 2025-03-01 |
| Médicaments | Méthylphénidate | 2025-07-01 → (exact) |  | trouvé | Méthylphénidate LP · 2025-07-01 → |
| Prises en charge | Obligation de soins (sursis probatoire) | 2024-05-14 → 2025-11-14 (exact) |  | manqué |  |
| Prises en charge | Consultation jeunes consommateurs | 2024-06-11 → (exact) |  | trouvé | Suivi CJC/CSAPA (obligation de soins) · 2024-06-11 → |
| Prises en charge | Hospitalisation en psychiatrie (soins libres) | 2024-11-08 → 2024-11-19 (exact) |  | trouvé | Hospitalisation en psychiatrie (soins libres) · 2024-11-08 → 2024-11-19 |
| Prises en charge | Bilan neuropsychologique | 2025-02 (month) |  | trouvé | Bilan neuropsychologique · 2025-02 |
| Événements de vie | Conduite sous stupéfiants, refus d'obtempérer | 2024-02 (month) |  | trouvé | Conduite de scooter sous cannabis avec refus d'obtempérer · 2024-02 |
| Événements de vie | Jugement (sursis probatoire) | 2024-05-14 (exact) |  | trouvé | Jugement et sursis probatoire avec obligation de soins · 2024-05-14 → 2025-11-14 ⚠ fin compatible |
| Événements de vie | Arrêt du CAP | 2023 (year) |  | trouvé | Arrêt du CAP · 2023 |
| Événements de vie | Début de l'apprentissage en mécanique | 2025-09-01 (exact) |  | trouvé | Apprentissage en mécanique auto · 2025-09-01 → ⚠ « en cours » juste |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Cannabis** · 2024-12-10 · craving — Craving le soir, fait du vélo pour « tenir ».
- Prises en charge · **Passage aux urgences** · 2024-11-08 → 2024-11-08 — Arrivée à 02:10 amené par les pompiers à la demande de sa mère. Transfert en psychiatrie à 14:30.

### `chemsex-prep`

Statut au passage `run1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Cathinones (3-MMC) | 2021 → 2024-06-10 (approx) | usage | trouvé | 3-MMC · 2021 → 2024-05-18 · usage |
| Consommations | Cathinones (3-MMC) | 2024-07 (month) | rechute | trouvé | 3-MMC · 2024-07 · usage ⚠ mode d'usage juste |
| Consommations | Cathinones (3-MMC) | 2024-10-12 → 2024-10-19 (exact) | rechute | trouvé | 3-MMC · 2024-10-12 → 2024-10-19 · rechute |
| Consommations | Cathinones (3-MMC) | 2025-04-05 (exact) | rechute | trouvé | 3-MMC · 2025-04-05 · usage ⚠ mode d'usage juste |
| Consommations | GHB/GBL | 2021 → 2024-06-10 (approx) | usage | mal daté | GHB/GBL · 2024-01 → 2024-05-18 · usage |
| Consommations | GHB/GBL | 2024-05-18 (exact) | intoxication | trouvé | GHB/GBL · 2024-05-18 · intoxication |
| Consommations | GHB/GBL | 2024-06-10 → 2024-06-17 (exact) | sevrage | trouvé | GHB/GBL · 2024-06-10 → 2024-06-17 · sevrage |
| Consommations | GHB/GBL | 2024-10-12 → 2024-10-19 (exact) | rechute | trouvé | GHB/GBL · 2024-10-12 → 2024-10-19 · rechute |
| Consommations | Alcool | 2024-03 → (approx) | usage | trouvé | Alcool · 2024-03-12 → · usage |
| Psychopathologie | Épisode dépressif (ancien) | 2012 (approx) |  | manqué |  |
| Psychopathologie | Épisode dépressif caractérisé | 2023-12 → 2025-02 (approx) |  | trouvé | Épisode dépressif caractérisé modéré · 2024-03 → 2025-02 |
| Somatique | Coma au GHB, réanimation | 2024-05-18 → 2024-05-19 (exact) |  | trouvé | Coma au GHB/GBL avec réanimation · 2024-05-18 → 2024-05-19 |
| Somatique | Syphilis | 2022 (year) |  | trouvé | Syphilis · 2022 |
| Somatique | Syphilis (recontamination) | 2024-07-09 → 2024-07-25 (exact) |  | trouvé | Recontamination syphilitique · 2024-07-09 → 2024-07-25 |
| Médicaments | PrEP (ténofovir/emtricitabine) | 2019 → (year) |  | trouvé | Ténofovir/emtricitabine (PrEP) · 2019 → |
| Médicaments | Escitalopram | 2024-03-28 → (exact) |  | trouvé | Escitalopram · 2024-03-28 → |
| Médicaments | Diazépam | 2024-06-10 → 2024-06-17 (exact) |  | trouvé | Diazépam · 2024-06-10 → 2024-06-17 |
| Médicaments | Baclofène | 2024-06-10 → 2024-07 (approx) |  | trouvé | Baclofène · 2024-06-10 → 2024-07 |
| Médicaments | Benzathine benzylpénicilline | 2024-07-25 (exact) |  | trouvé | Benzathine benzylpénicilline (Extencilline) · 2024-07-25 |
| Prises en charge | Suivi addictologique (CSAPA) | 2024-03-12 → (exact) |  | trouvé | Suivi psychiatrique en addictologie · 2024-03-12 → |
| Prises en charge | Psychothérapie (psychologue) | 2024-04-16 → (exact) |  | trouvé | Suivi psychologique · 2024-04-16 → |
| Prises en charge | Hospitalisation pour sevrage GHB | 2024-06-10 → 2024-06-17 (exact) |  | trouvé | Hospitalisation pour sevrage GHB/GBL · 2024-06-10 → 2024-06-17 |
| Prises en charge | Suivi CeGIDD (PrEP) | 2019 → (year) |  | trouvé | Suivi CeGIDD (PrEP) · 2019 → |
| Événements de vie | Arrêt de travail | 2024-05-21 → 2024-09-02 (exact) |  | trouvé | Arrêt de travail · 2024-05-21 → 2024-09-01 |
| Événements de vie | Reprise du travail à mi-temps thérapeutique | 2024-09-02 → 2025-02-01 (exact) |  | trouvé | Mi-temps thérapeutique · 2024-09-02 → 2025-02-01 |
| Événements de vie | Séparation | 2024-09 (month) |  | trouvé | Séparation d'avec son compagnon · 2024-09 |
| Événements de vie | Nouvelle relation | 2025-01 → (approx) |  | trouvé | Nouvelle relation · 2025-02 → |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **3-MMC** · 2025-04 · craving — Craving les jours suivant la prise du 05/04. Le patient a appelé sa psychologue.
- Consommations · **Poppers** · 2024-03-12 → · usage — Usage occasionnel.
- Événements de vie · **Couple avec son compagnon** · 2018 → 2024-09 — En couple depuis 6 ans à la date de mars 2024, couple ouvert. Séparation début septembre 2024.

### `crack-rue`

Statut au passage `run1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Crack (cocaïne basée) | 2016 → 2024-03-28 (approx) | usage | trouvé | Crack · 2017 → 2024-03-28 · usage |
| Consommations | Crack (cocaïne basée) | 2024-04 → 2024-12-24 (approx) | usage | trouvé | Crack · 2024-04 → 2024-12-24 · usage |
| Consommations | Crack (cocaïne basée) | 2025-03 (month) | rechute | trouvé | Crack · 2025-03 · rechute |
| Consommations | Alcool | 2023-09 → 2024-03-28 (approx) | usage | trouvé | Alcool · 2023-09 → 2024-03-28 · usage |
| Consommations | Alcool | 2024-03-28 → 2024-04-04 (exact) | sevrage | trouvé | Alcool · 2024-03-28 → 2024-04-04 · sevrage |
| Consommations | Alcool | 2024-04 → (approx) | usage | trouvé | Alcool · 2024-04 → 2024-06-03 · usage ⚠ fin compatible, « en cours » juste |
| Consommations | Cannabis | 2023-09 (approx) | usage | trouvé | Cannabis · 2023-09-14 · usage |
| Consommations | Tabac | 2023-09 → (approx) | usage | trouvé | Tabac · 2023-09-14 → · usage |
| Psychopathologie | Trouble de stress post-traumatique (complexe) | 2023-09 → (approx) |  | trouvé | TSPT complexe · 2023-09-14 → |
| Psychopathologie | Idées de mort passives | 2024-02 (month) |  | trouvé | Idées de mort passives · 2024-02-20 |
| Somatique | Brûlures des doigts et des lèvres | 2023-09 (approx) |  | trouvé | Brûlures superficielles des doigts et des lèvres · 2023-09-06 |
| Somatique | Pneumopathie | 2024-03-28 → 2024-04-04 (exact) |  | trouvé | Pneumopathie · 2024-03-28 → 2024-04-09 ⚠ fin compatible |
| Médicaments | Vaccin hépatite B | 2023-10-03 (exact) |  | trouvé | Vaccin hépatite B · 2023-10-03 |
| Médicaments | Prazosine | 2023-11-21 → (exact) |  | trouvé | Prazosine · 2023-11-21 → |
| Médicaments | Hydroxyzine | 2023-11-21 (exact) |  | trouvé | Hydroxyzine · 2023-11-21 |
| Médicaments | Naloxone (kit) | 2024-02-20 (exact) |  | trouvé | Naloxone · 2024-02-20 |
| Médicaments | Diazépam | 2024-03-28 → 2024-04-04 (exact) |  | trouvé | Diazépam · 2024-03-28 → 2024-04-04 |
| Médicaments | Sertraline | 2024-09-17 → (exact) |  | trouvé | Sertraline · 2024-09-17 → |
| Prises en charge | Accompagnement CAARUD (réduction des risques) | 2023-09-06 → (exact) |  | trouvé | Suivi CAARUD · 2023-09-06 ⚠ « en cours » juste |
| Prises en charge | Suivi psychiatrique (CSAPA) | 2023-09-14 → (exact) |  | trouvé | Suivi psychiatrique · 2023-09-14 → |
| Prises en charge | Accompagnement social | 2023-10-25 → (exact) |  | manqué |  |
| Prises en charge | EMDR (centre de psychotraumatologie) | 2024-12 → (month) |  | trouvé | EMDR au centre de psychotraumatologie · 2024-12 → |
| Événements de vie | Placement en foyer | 2002 (approx) |  | manqué |  |
| Événements de vie | Placement de son fils chez sa grand-mère paternelle | 2021 (year) |  | trouvé | Fils confié à sa grand-mère paternelle · 2021 |
| Événements de vie | Sans domicile | 2022 → 2024-06-03 (year) |  | trouvé | Sans domicile / hébergement précaire · 2022 → 2024-06-03 |
| Événements de vie | Agression sexuelle | 2023-11 (month) |  | trouvé | Agression sexuelle · 2023-11 |
| Événements de vie | Décès de son ex-compagnon | 2024-02-10 (exact) |  | trouvé | Décès de l'ex-compagnon · 2024-02-10 |
| Événements de vie | Entrée en CHRS | 2024-06-03 → 2025-05-26 (exact) |  | trouvé | Hébergement en CHRS · 2024-06-03 → 2025-05-26 |
| Événements de vie | Reprise des visites avec son fils | 2024-06-28 (exact) |  | trouvé | Première visite médiatisée avec son fils · 2024-06-28 |
| Événements de vie | Entrée en résidence sociale | 2025-05-26 (exact) |  | trouvé | Entrée en résidence sociale · 2025-05-26 → ⚠ « en cours » juste |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Alcool** · 2024-10 → · usage — 2-3 bières le soir « en cachette » au CHRS, puis 1-2 bières le soir en janvier 2025. Au 2025-07 : 1-2 bières le week-end.
- Psychopathologie · **Anxiété majorée** · 2025-03-25 — Anxiété importante après la convocation au tribunal. Pas d'idées suicidaires.
- Somatique · **Toux grasse** · 2023-09 — Toux grasse depuis 3 semaines au 2023-10-03, sans fièvre, à surveiller.
- Médicaments · **Hydroxyzine** · 2025-03-25 — Reprise si besoin.
- Prises en charge · **Hospitalisation en médecine** · 2024-03-28 → 2024-04-04 — Pour pneumopathie, avec sevrage alcool sous diazépam.
- Événements de vie · **Expulsion du logement** · 2022 — Début de la situation sans domicile.
- Événements de vie · **Séparation d'avec l'ex-compagnon violent** · 2022 — Elle le croise encore régulièrement.
- Événements de vie · **Mise à l'abri hivernale** · 2024-01-08 — Gymnase, places 115. Elle dort mieux.
- Événements de vie · **Convocation au procès de l'agresseur** · 2025-03 — Procès ensuite renvoyé. Déclencheur de la rechute de crack.
- Événements de vie · **Élargissement des droits de visite** · 2025-06 — Visites sans médiatisation un samedi sur deux.

### `jeu-bipolaire`

Statut au passage `run1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Jeu (paris sportifs en ligne) | 2018 → 2024-01-29 (year) | usage | trouvé | Paris sportifs en ligne · 2018 → 2020 · usage ⚠ fin compatible |
| Consommations | Jeu (paris sportifs en ligne) | 2024-06 → 2024-07-05 (month) | rechute | trouvé | Paris sportifs en ligne · 2024-06 → 2024-07-05 · rechute |
| Consommations | Jeu (grattage) | 2025-03 (month) | rechute | trouvé | Jeux de grattage · 2025-03 → 2025-03 · usage ⚠ fin compatible, mode d'usage juste |
| Consommations | Alcool | 2024-01 → (approx) | usage | trouvé | Alcool · 2024-01 → · usage |
| Consommations | Tabac | 2019 (year) | sevrage | manqué |  |
| Psychopathologie | Épisode dépressif | 2010 (year) |  | trouvé | Épisode dépressif · 2010 |
| Psychopathologie | Épisode dépressif | 2016 (year) |  | trouvé | Épisode dépressif · 2016 |
| Psychopathologie | Trouble bipolaire de type II | 2024-02-01 → (exact) |  | trouvé | Trouble bipolaire de type II · 2024-02-01 → |
| Psychopathologie | Épisode hypomaniaque | 2024-06-15 → 2024-07-09 (approx) |  | trouvé | Épisode hypomaniaque · 2024-06 → 2024-07 |
| Psychopathologie | Épisode dépressif caractérisé | 2024-11 → 2025-01 (month) |  | trouvé | Épisode dépressif caractérisé · 2024-11 → 2025-01 |
| Médicaments | Paroxétine | 2016 (year) |  | trouvé | Paroxétine · 2016 → 2016 ⚠ fin compatible |
| Médicaments | Lithium | 2024-03-05 → (exact) |  | trouvé | Lithium · 2024-03-05 → |
| Médicaments | Quétiapine | 2024-06-25 → 2025-05 (exact) |  | trouvé | Quétiapine · 2024-06-25 → 2025-05 |
| Médicaments | Lamotrigine | 2024-11-26 → (exact) |  | trouvé | Lamotrigine · 2024-11-26 → |
| Prises en charge | Suivi addictologique (CSAPA) | 2024-01-18 → (exact) |  | manqué |  |
| Prises en charge | Interdiction volontaire de jeux (ANJ) | 2024-01-29 → (exact) |  | trouvé | Interdiction volontaire de jeux (ANJ) · 2024-01-29 → |
| Prises en charge | Psychothérapie (TCC jeu) | 2024-04-16 → (exact) |  | trouvé | TCC pour le jeu · 2024-04-16 → |
| Prises en charge | Accompagnement social (surendettement) | 2024-02 (approx) |  | trouvé | Accompagnement social (surendettement) · 2024-02 → 2024-10-15 ⚠ fin compatible |
| Prises en charge | Thérapie de couple | 2024-08 (month) |  | trouvé | Thérapie de couple · 2024-08 → ⚠ « en cours » juste |
| Événements de vie | Découverte des dettes par son épouse | 2023-12 (month) |  | trouvé | Découverte de crédits à l'insu de l'épouse · 2023-12 |
| Événements de vie | Arrêt de travail | 2024-06-25 → 2024-07-15 (exact) |  | trouvé | Arrêt de travail · 2024-06-25 → 2024-07-15 |
| Événements de vie | Plan de surendettement | 2024-10-08 (exact) |  | trouvé | Plan de surendettement accepté · 2024-10-08 → ⚠ « en cours » juste |
| Événements de vie | Arrêt de travail | 2024-11-26 → 2024-12 (exact) |  | trouvé | Arrêt de travail · 2024-11-26 ⚠ fin compatible |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Paris sportifs en ligne** · 2020 → 2024-01-29 · usage — Perte de contrôle datée par le patient 'au confinement'; paris quotidiens depuis 2022 environ, mises jusqu'à 300 euros/jour, poursuite des pertes, environ 38 000 euros de dettes selon lui (45 200 euros retenus ensuite).
- Consommations · **Paris sportifs en ligne** · 2025-01-14 · craving — Envies pendant la Ligue des champions, sans parier ('je regarde sans parier, c'est nouveau').
- Consommations · **Paris sportifs en ligne** · 2025-07-01 · craving — Craving rare, surtout les soirs de match, géré en éteignant le téléphone. Pas de pari depuis 2024 (pas de jeu depuis mars 2025 selon le suivi).
- Consommations · **Nicotine (vapotage)** · 2019 → · usage — Vapote depuis 2019, ancien fumeur (15 paquets-années); non réévalué ensuite.
- Psychopathologie · **Épisode hypomaniaque** · 2016 — Période de 'pleine forme' sous paroxétine, très peu de sommeil, dépenses et paris accrus, relue rétrospectivement avec l'épouse.
- Prises en charge · **Suivi psychiatrique** · 2024-01-18 → — Premier entretien orienté par le MG; suivi régulier avec psychoéducation et plan de crise écrit avec l'épouse en juillet 2025.

### `methadone-schizophrenie`

Statut au passage `run1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Héroïne | 2003 → 2009 (approx) | usage | trouvé | Héroïne · 2003 → 2009 · usage |
| Consommations | Héroïne | 2023-05 (month) | rechute | trouvé | Héroïne · 2023-05 · rechute |
| Consommations | Cannabis | 2023-02 → (approx) | usage | trouvé | Cannabis · 2023-02-14 → · usage |
| Consommations | Tabac | 2023-02 → (approx) | usage | trouvé | Tabac · 2023-02-14 → · usage |
| Psychopathologie | Schizophrénie paranoïde | 2005 → (approx) |  | trouvé | Schizophrénie paranoïde · 2006 → |
| Psychopathologie | Décompensation délirante | 2024-09 → 2024-10-25 (approx) |  | trouvé | Décompensation délirante (persécution) · 2024-09-14 → 2024-11-05 |
| Somatique | Hépatite C | 2023-02 → 2024-06-11 (approx) |  | trouvé | Hépatite C chronique · 2023-02-14 → 2024-06-11 |
| Somatique | Allongement du QTc | 2025-01-09 → 2025-03-11 (exact) |  | trouvé | Allongement du QTc · 2025-01-09 → 2025-03-11 |
| Médicaments | Méthadone sirop | 2010 → 2025-07-15 (approx) |  | trouvé | Méthadone · 2010 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Méthadone gélules | 2025-07-15 → (exact) |  | manqué |  |
| Médicaments | Palipéridone LP (injection mensuelle) | 2023-02 → 2024-08-06 (approx) |  | trouvé | Palipéridone LP · 2023-02-14 → 2024-08-06 |
| Médicaments | Aripiprazole LP (injection mensuelle) | 2024-10 → (approx) |  | trouvé | Aripiprazole LP · 2024 → |
| Médicaments | Glécaprévir/pibrentasvir | 2024-01-08 → 2024-03-04 (exact) |  | trouvé | Glécaprévir/pibrentasvir · 2024-01-08 → 2024-03-04 |
| Médicaments | Hydroxyzine | 2024-11 → 2025-01-14 (approx) |  | trouvé | Hydroxyzine · 2025-01-14 ⚠ fin compatible |
| Prises en charge | Suivi CSAPA (TSO) | 2010 → (approx) |  | trouvé | Suivi CSAPA (méthadone) · 2010 → |
| Prises en charge | Suivi CMP | 2023-02 → (approx) |  | trouvé | Suivi CMP · 2023-02-14 → |
| Prises en charge | Hospitalisation sous contrainte (SDT) | 2024-09-14 → 2024-10-25 (exact) |  | trouvé | Hospitalisation en psychiatrie sous contrainte · 2024-09-14 → 2024-10-25 |
| Prises en charge | Curatelle renforcée | 2018 → (year) |  | autre piste | Curatelle renforcée (UDAF) · 2018 → |
| Événements de vie | Entrée de sa mère en EHPAD | 2025-04 (month) |  | trouvé | Entrée de la mère en EHPAD · 2025-04 |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Héroïne** · 2023-06 → 2023-09-19 · craving — Manque et craving en fin de journée depuis plusieurs semaines (bâillements, crampes, anxiété), malgré la méthadone. Disparus après passage à 100 mg.
- Consommations · **Cannabis** · 2024-09 · usage — Consommation augmentée (« ++ ») ces dernières semaines avant l'hospitalisation. Le patient attribue sa décompensation à un excès de cannabis.
- Consommations · **Alcool** · 2023-02-14 · usage — Consommation rare ; le patient dit ne pas boire d'alcool (mars 2023).
- Psychopathologie · **Tristesse réactionnelle** · 2025-05-13 — Tristesse et sentiment d'être « plus seul » après l'entrée de sa mère en EHPAD. Pas de recrudescence délirante, sommeil correct.
- Prises en charge · **Programme de soins** · 2024-10-25 → — Programme de soins en psychiatrie après la sortie d'hospitalisation.
- Événements de vie · **Logement en appartement associatif** · 2023-02-14 → — Vit seul, sa mère passait tous les jours. Date d'entrée dans le logement inconnue.

### `opiaces-tso`

Statut au passage `run1`, et nombre de passages où l'événement est trouvé (sur 3).

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle | Trouvé |
|---|---|---|---|---|---|---|
| Consommations | Cannabis | 2002 → (year) | usage | trouvé | Cannabis · 2002 → · usage | 1/3 |
| Consommations | Héroïne | 2006 → 2012 (approx) | usage | trouvé | Héroïne · 2006 · usage ⚠ fin compatible | 3/3 |
| Consommations | Héroïne | 2022-12 → 2023-02-18 (month) | rechute | trouvé | Héroïne · 2022-12 → 2023-02-18 · rechute | 3/3 |
| Consommations | Héroïne | 2023-02-18 (exact) | intoxication | trouvé | Héroïne · 2023-02-18 · intoxication | 2/3 |
| Consommations | Cocaïne | 2023-01 → 2023-09 (approx) | usage | trouvé | Cocaïne · 2023-01 → 2023-05 · usage | 3/3 |
| Consommations | Cocaïne | 2023-09 → 2023-10 (month) | rechute | trouvé | Cocaïne · 2023-09 → 2023-10 · rechute | 3/3 |
| Consommations | Benzodiazépines (hors prescription) | 2023-02-18 (exact) | usage | trouvé | Benzodiazépines (clonazépam) · 2023-02-18 · intoxication ⚠ mode d'usage juste | 3/3 |
| Consommations | Tabac | 2023-01 → (approx) | usage | trouvé | Tabac · 2023-01-12 → · usage | 3/3 |
| Psychopathologie | TDAH (enfance) | 1997 (approx) |  | manqué |  | 0/3 |
| Somatique | Hépatite C | 2019 → 2019 (year) |  | trouvé | Hépatite C · 2019 ⚠ fin compatible | 3/3 |
| Somatique | Overdose, réanimation | 2023-02-18 → 2023-02-19 (exact) |  | trouvé | Overdose opioïdes · 2023-02-18 → 2023-02-19 | 3/3 |
| Médicaments | Méthadone sirop | 2012 → 2024-01-09 (year) |  | trouvé | Méthadone · 2012 → ⚠ fin compatible, « en cours » juste | 3/3 |
| Médicaments | Méthadone gélules | 2024-01-09 → (exact) |  | manqué |  | 1/3 |
| Médicaments | Naloxone (kit) | 2023-02-20 (exact) |  | trouvé | Naloxone · 2023-02-20 | 3/3 |
| Médicaments | Sofosbuvir/velpatasvir | 2019 → 2019 (year) |  | trouvé | Sofosbuvir/velpatasvir · 2019 ⚠ fin compatible | 3/3 |
| Médicaments | Méthylphénidate | 1997 (approx) |  | manqué |  | 0/3 |
| Prises en charge | Suivi CSAPA (TSO) | 2012 → (year) |  | trouvé | Suivi CSAPA · 2012 → | 2/3 |
| Prises en charge | Délivrance quotidienne au CSAPA | 2023-02-22 → 2023-05-02 (exact) |  | trouvé | Délivrance quotidienne au CSAPA · 2023-02-22 → 2023-04-30 | 3/3 |
| Prises en charge | Suivi éducatif | 2023-03-07 → (exact) |  | mal daté | Suivi éducatif rapproché · 2023-02-22 → | 2/3 |
| Prises en charge | Réduction des risques crack | 2023-10-03 (exact) |  | trouvé | Programme de réduction des risques crack · 2023-10-03 | 3/3 |
| Prises en charge | Accompagnement social | 2023-03-28 → (exact) |  | manqué |  | 0/3 |
| Événements de vie | Placements en foyer | 2002 (approx) |  | manqué |  | 0/3 |
| Événements de vie | Incarcération | 2014 → 2015 (year) |  | trouvé | Incarcération · 2014 → 2015 | 3/3 |
| Événements de vie | Suspension du permis | 2019 (year) |  | trouvé | Permis B suspendu · 2019 → ⚠ « en cours » juste | 2/3 |
| Événements de vie | Naissance de sa fille | 2020-03 (approx) |  | trouvé | Naissance de la fille · 2020-03 | 3/3 |
| Événements de vie | Décès de son père | 2021-08 (month) |  | trouvé | Décès du père · 2021-08 | 3/3 |
| Événements de vie | Information préoccupante (PMI) | 2023-11-08 (exact) |  | trouvé | Information préoccupante (PMI) · 2023-11-08 | 3/3 |
| Événements de vie | Mesure d'AEMO | 2024-01 → (month) |  | trouvé | Mesure d'AEMO · 2024-01 → | 3/3 |
| Événements de vie | Chantier d'insertion | 2024-01-22 → (exact) |  | trouvé | Chantier d'insertion (espaces verts) · 2024-01-22 → | 3/3 |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Héroïne** · 2009 · usage — Passage à la voie intraveineuse (dès 2009 selon o2, vers 20 ans selon o1).
- Consommations · **Opioïdes** · 2023-10-03 · sevrage — Signes de manque en fin de journée (bâillements, douleurs) sous méthadone 70 mg/j, dose jugée probablement insuffisante. Disparition des signes à 80 mg/j fin novembre.
- Psychopathologie · **Hypothèse de trouble de la personnalité antisociale** · 2022-03-14 — Évoquée par l'interne le 14/03/2022. Le psychiatre le 22/02/2023 relève l'absence d'argument franc et nuance cette hypothèse.
- Psychopathologie · **Impulsivité et intolérance à la frustration** · 2023-02-22 — Pas de trouble de l'humeur caractérisé ni d'idées suicidaires. Antécédent de TDAH dans l'enfance, non réévalué à l'âge adulte.
- Prises en charge · **Délivrance hebdomadaire en pharmacie** · 2021 → 2023-02-22 — Délivrance de méthadone à la pharmacie du Marché, jusqu'à la délivrance quotidienne décidée après l'overdose.
- Prises en charge · **Délivrance hebdomadaire en pharmacie** · 2023-05-02 → — Reprise de la délivrance hebdomadaire en pharmacie depuis le 02/05/2023.
- Prises en charge · **Hospitalisation en réanimation** · 2023-02-18 → 2023-02-19 — Hospitalisation de 24 h après overdose, sortie contre avis médical.
- Prises en charge · **Suivi psychiatrique** · 2023-02-22 → — Consultations les 22/02, 15/05, 03/10 et 30/11/2023.
- Événements de vie · **Tensions de couple** · 2023-09-26 — La compagne menace de partir avec la petite. Tensions de couple déjà évoquées en février 2023.
- Événements de vie · **Difficultés financières (dette de loyer)** · 2023-03-28 → — Dette de loyer de 1 800 euros, ressources RSA couple et APL. Dossier FSL en cours.

### `tabac-infarctus`

Statut au passage `run1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Tabac | 1986 → 2024-10-15 (approx) | usage | trouvé | Tabac · 1986 → 2024-09 · usage |
| Consommations | Tabac | 2024-10-15 (exact) | sevrage | trouvé | Tabac · 2024-10-15 → 2025-01-06 · sevrage ⚠ fin compatible |
| Consommations | Tabac | 2025-01-06 → 2025-04-01 (exact) | rechute | trouvé | Tabac · 2025-01-06 → 2025-04-01 · rechute |
| Consommations | Cannabis | 1990 → 1997 (approx) | usage | trouvé | Cannabis · 1990 → 1997 · usage |
| Consommations | Alcool | 2024-10 → (approx) | usage | trouvé | Alcool · 2024-10-10 → · usage |
| Psychopathologie | Trouble de l'adaptation anxio-dépressif | 2025-01 → 2025-06 (approx) |  | trouvé | Trouble de l'adaptation avec anxiété et humeur dépressive · 2024-10-10 → 2025-06-24 |
| Somatique | Infarctus du myocarde | 2024-09-03 (exact) |  | trouvé | Infarctus du myocarde · 2024-09-03 |
| Somatique | Prise de poids après l'arrêt du tabac | 2024-11 → 2025-09 (approx) |  | trouvé | Prise de poids · 2024-10 → 2025-09 |
| Médicaments | Varénicline | 2024-10-10 → 2024-11-12 (exact) |  | trouvé | Varénicline · 2024-10 → 2024-11-12 |
| Médicaments | Substituts nicotiniques | 2024-11-12 → 2025-04 (approx) |  | trouvé | Patch nicotinique 21 mg · 2024-11-19 → 2025-01-14 |
| Médicaments | Vapoteuse (cigarette électronique) | 2025-01-14 → (exact) |  | manqué |  |
| Prises en charge | Consultation de tabacologie | 2024-10-08 → (exact) |  | trouvé | Suivi en tabacologie · 2024-10-08 → |
| Prises en charge | Suivi psychiatrique | 2024-10-10 → 2025-06-24 (exact) |  | trouvé | Suivi psychiatrique · 2024-10-10 → 2025-06-24 |
| Prises en charge | Psychothérapie (TCC) | 2025-03 → 2025-06 (approx) |  | trouvé | TCC (anxiété) · 2025-03-11 ⚠ fin compatible |
| Prises en charge | Réadaptation cardiaque | 2024-09 → 2024-10 (approx) |  | manqué |  |
| Événements de vie | Reprise du travail | 2025-01-06 (exact) |  | trouvé | Reprise du travail et conflit avec la responsable · 2025-01-06 |

En plus (passage `run1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Tabac** · 2024-09 → 2024-10-15 · rechute — Reprise au retour à domicile, 10 cig/j le 08/10. Fagerström 8, CO 32 ppm. La patiente dit d'abord ne plus fumer, puis reconnaît les cigarettes du soir.
- Consommations · **Tabac** · 2024-10-22 · craving — Craving surtout après le café et en voiture.
- Consommations · **Tabac** · 2025-04-01 → · sevrage — Abstinence depuis le 01/04/2025, CO 2 ppm, confirmée à 6 mois le 30/09/2025.
- Consommations · **Nicotine (vapoteuse)** · 2025-02 → · usage — Vapoteuse proposée le 14/01/2025 et utilisée le 04/02 ; 12 mg/mL, puis 6 mg/mL en juin, puis 3 mg/mL en septembre. Projet d'arrêt d'ici la fin d'année 2025.
- Somatique · **Nausées sous varénicline** · 2024-10-22 → 2024-11-12 — Nausées matinales persistantes, cauchemars « très réalistes » et sommeil agité. Varénicline arrêtée par la patiente.
- Médicaments · **Gommes nicotiniques 2 mg** · 2024-11-19 — Prescrites en relais de la varénicline avec le patch. Date d'arrêt non précisée.
- Médicaments · **Patch nicotinique 21 mg** · 2025-01-14 → 2025-04-15 — Reprise proposée avec la vapoteuse. Poursuite du patch le 04/02. Patch arrêté le 15/04/2025 au plus tard.
- Prises en charge · **Orientation diététicienne** · 2025-04-15 — Orientation pour la prise de poids.

