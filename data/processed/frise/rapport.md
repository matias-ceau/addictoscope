# Frise des dossiers fictifs, notée contre `verite.json`

- Modèle : anthropic/claude-sonnet-5.5 ; 3 passage(s) par dossier ; coût total 1.27 $.
- Dates des passages : 2026-10-31 → 2026-10-31.
- Chemin de l'application : couche texte → détections automatiques acceptées telles quelles (à la place de la relecture humaine) → masquage → vérification → images des pages masquées → découpage → frise.
- Tolérance sur les dates selon la certitude attendue : exacte ±3 j, mois ±15 j, année : l'année, approximative ±1 an.
- « Trouvé » = même piste, même libellé (à la formulation près), début compatible. La précision est une borne basse : un événement « en plus » peut être vrai et absent de la vérité.

Les nombres donnent la moyenne des passages, puis (min–max).

## Synthèse

| Dossier | Attendus | Trouvés | Mal datés | Autre piste | Manqués | Produits | Rappel | Précision (borne basse) | Observations rendues / attendues |
|---|---|---|---|---|---|---|---|---|---|
| `alcool-depression` | 31 | 29 (29–29) | 0 (0–1) | 1 (0–1) | 1 (1–1) | 35 (34–36) | 94 (94–94) % | 82 (81–85) % | 19 (19–19)/19 |
| `cannabis-jeune` | 19 | 17 (17–18) | 0 (0–0) | 0 (0–0) | 2 (1–2) | 20 (19–20) | 91 (89–95) % | 88 (85–90) % | 11 (11–11)/11 |
| `opiaces-tso` | 29 | 22 (21–23) | 1 (1–2) | 0 (0–0) | 5 (4–7) | 33 (30–34) | 77 (72–79) % | 68 (68–70) % | 15 (15–15)/15 |
| **Total** | 79 | 69 (68–69) | | | | 88 (84–90) | 87 (86–87) % | 78 (77–81) % | |

## Exactitude des événements trouvés

| Contrôle | `alcool-depression` | `cannabis-jeune` | `opiaces-tso` | Total |
|---|---|---|---|---|
| début aussi précis | 100 % | 92 % | 100 % | 98 % (202/206) |
| fin compatible | 75 % | 58 % | 63 % | 67 % (47/70) |
| « en cours » juste | 86 % | 96 % | 93 % | 91 % (187/206) |
| mode d'usage juste | 88 % | 100 % | 86 % | 91 % (58/64) |
| au moins une source attendue | 100 % | 100 % | 100 % | 100 % (206/206) |

## Rappel par piste (tous dossiers, tous passages)

| Piste | Trouvés / attendus | Rappel |
|---|---|---|
| Consommations | 64/75 | 85 % |
| Psychopathologie | 14/18 | 78 % |
| Somatique | 15/15 | 100 % |
| Médicaments | 37/42 | 88 % |
| Prises en charge | 31/36 | 86 % |
| Événements de vie | 45/51 | 88 % |

## Validation par le code

Événements rendus par le modèle, puis écartés ou fusionnés par `assembleTimeline` (`web/src/notebook/timeline.ts`).

| Passage | Dossier | Rendus | Piste inconnue | Date illisible | Sans source connue | Fusionnés (doublons) | Gardés |
|---|---|---|---|---|---|---|---|
| run1 | `alcool-depression` | 36 | 0 | 0 | 0 | 0 | 36 |
| run2 | `alcool-depression` | 34 | 0 | 0 | 0 | 0 | 34 |
| run3 | `alcool-depression` | 36 | 0 | 0 | 0 | 0 | 36 |
| run1 | `cannabis-jeune` | 19 | 0 | 0 | 0 | 0 | 19 |
| run2 | `cannabis-jeune` | 20 | 0 | 0 | 0 | 0 | 20 |
| run3 | `cannabis-jeune` | 20 | 0 | 0 | 0 | 0 | 20 |
| run1 | `opiaces-tso` | 34 | 0 | 0 | 0 | 0 | 34 |
| run2 | `opiaces-tso` | 30 | 0 | 0 | 0 | 0 | 30 |
| run3 | `opiaces-tso` | 34 | 0 | 0 | 0 | 0 | 34 |

## Découpage en observations

| Passage | Document | Attendues | Rendues | Dates justes |
|---|---|---|---|---|
| run1 | `alcool-depression/courrier.pdf` | 1 | 1 | 0/0 |
| run1 | `alcool-depression/historique.pdf` | 18 | 18 | 18/18 |
| run2 | `alcool-depression/courrier.pdf` | 1 | 1 | 0/0 |
| run2 | `alcool-depression/historique.pdf` | 18 | 18 | 18/18 |
| run3 | `alcool-depression/courrier.pdf` | 1 | 1 | 0/0 |
| run3 | `alcool-depression/historique.pdf` | 18 | 18 | 18/18 |
| run1 | `cannabis-jeune/historique.pdf` | 10 | 10 | 10/10 |
| run1 | `cannabis-jeune/urgences.pdf` | 1 | 1 | 0/0 |
| run2 | `cannabis-jeune/historique.pdf` | 10 | 10 | 10/10 |
| run2 | `cannabis-jeune/urgences.pdf` | 1 | 1 | 0/0 |
| run3 | `cannabis-jeune/historique.pdf` | 10 | 10 | 10/10 |
| run3 | `cannabis-jeune/urgences.pdf` | 1 | 1 | 0/0 |
| run1 | `opiaces-tso/historique.pdf` | 15 | 15 | 15/15 |
| run2 | `opiaces-tso/historique.pdf` | 15 | 15 | 15/15 |
| run3 | `opiaces-tso/historique.pdf` | 15 | 15 | 15/15 |

## Stabilité d'un passage à l'autre

| Dossier | Trouvés à chaque passage | Parfois | Jamais |
|---|---|---|---|
| `alcool-depression` | 28 | 2 | 1 |
| `cannabis-jeune` | 16 | 3 | 0 |
| `opiaces-tso` | 19 | 6 | 4 |

## Détail par dossier

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

