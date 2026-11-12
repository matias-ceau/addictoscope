# Frise des dossiers fictifs longs, notée contre `verite.json`

- Demandes de l'application (anthropic/claude-sonnet-5.5) écrites dans des fichiers et répondues par des sous-agents, une demande par sous-agent, sans rien d'autre sous les yeux ; 1 passage(s) par dossier ; aucun appel payant.
- Dates des passages : 2026-11-12 → 2026-11-12.
- Chemin de l'application : couche texte → détections automatiques acceptées telles quelles → masquage → vérification → identifiants restés lisibles masqués à la main (à la place de la relecture humaine, comptés plus bas) → découpage par règles quand la mise en page est reconnue, par le modèle sinon → frise.
- Tolérance sur les dates selon la certitude attendue : exacte ±3 j, mois ±15 j, année : l'année, approximative ±1 an.
- « Trouvé » = même piste, même libellé (à la formulation près), début compatible. La précision est une borne basse : un événement « en plus » peut être vrai et absent de la vérité.
- Sur une piste de consommation, une molécule opioïde vaut pour sa classe (« Oxycodone » attendu, « Opioïdes » rendu) ; jamais sur une piste de médicament.
- Les frises lues en plusieurs lots sont regroupées par une demande de plus (sans texte d'observation) : les tableaux notent la frise regroupée, la section « Regroupement des doublons » la compare à la frise telle que lue. Une piste regroupée répond à tous les intitulés sous lesquels elle a été lue.

## Synthèse

| Dossier | Attendus | Trouvés | Mal datés | Autre piste | Manqués | Produits | Rappel | Précision (borne basse) | Observations rendues / attendues |
|---|---|---|---|---|---|---|---|---|---|
| `alcool-rechutes` | 98 | 84 | 4 | 2 | 8 | 152 | 86 % | 55 % | 76/76 |
| `antalgiques-douleur` | 84 | 77 | 2 | 0 | 5 | 130 | 92 % | 59 % | 75/75 |
| `cannabis-psychose` | 71 | 69 | 2 | 0 | 0 | 145 | 97 % | 48 % | 74/74 |
| `cocaine-cadre` | 85 | 69 | 4 | 1 | 11 | 130 | 81 % | 53 % | 76/76 |
| `opiaces-parcours` | 80 | 73 | 1 | 1 | 5 | 159 | 91 % | 46 % | 75/75 |
| `polyconso-precarite` | 114 | 101 | 3 | 2 | 8 | 162 | 89 % | 62 % | 75/75 |
| **Total** | 532 | 473 | | | | 878 | 89 % | 54 % | |

## Regroupement des doublons

Les lots sont lus indépendamment et le dossier raconte lui-même plusieurs fois le passé : le même fait revient sous des intitulés et des dates qui varient. Une demande de plus montre au modèle les pistes et les événements trouvés, sans aucun texte d'observation, et lui demande lesquels désignent la même chose ; le code fusionne après contrôle (`web/src/notebook/consolidate.ts`). Chaque case : frise lue → frise regroupée.

| Passage | Dossier | Lots | Pistes attendues | Pistes | Événements | Trouvés | dont la date est sous la barre | Précision (borne basse) | Fin compatible | « En cours » juste | Dates discordantes signalées | Coût estimé de la demande |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| regroupe2 | `alcool-rechutes` | 4 | 64 | 123 → 95 | 209 → 152 | 84 → 84/98 | 0 | 40 % → 55 % | 36/58 → 38/63 | 69/84 → 74/84 | 9 | 0.05 $ |
| regroupe2 | `antalgiques-douleur` | 4 | 73 | 136 → 106 | 197 → 130 | 77 → 77/84 | 0 | 39 % → 59 % | 33/49 → 34/49 | 72/77 → 72/77 | 10 | 0.06 $ |
| regroupe2 | `cannabis-psychose` | 4 | 58 | 152 → 105 | 198 → 145 | 70 → 69/71 | 1 | 35 % → 48 % | 46/58 → 49/58 | 62/70 → 63/69 | 9 | 0.05 $ |
| regroupe2 | `cocaine-cadre` | 4 | 59 | 102 → 84 | 169 → 130 | 73 → 69/85 | 2 | 43 % → 53 % | 25/51 → 27/50 | 58/73 → 58/69 | 11 | 0.04 $ |
| regroupe2 | `opiaces-parcours` | 4 | 70 | 146 → 112 | 213 → 159 | 73 → 73/80 | 0 | 34 % → 46 % | 39/58 → 40/58 | 64/73 → 65/73 | 8 | 0.06 $ |
| regroupe2 | `polyconso-precarite` | 4 | 80 | 163 → 114 | 243 → 162 | 105 → 101/114 | 1 | 43 % → 62 % | 43/88 → 44/89 | 89/105 → 90/101 | 12 | 0.07 $ |
| **Total** | | | 404 | 822 → 616 | 1229 → 878 | 482 → 473/532 (91 % → 89 %) | 4 | 39 % → 54 % | 222/362 → 232/367 | 414/482 → 422/473 | 59 | 0.34 $ |

« Dont la date est sous la barre » : événements attendus qui ne sont plus « trouvés » parce que la barre regroupée commence à une autre date (le début d'un trouble et son diagnostic des années plus tard, par exemple), mais dont la date attendue figure parmi les mentions regroupées, affichées au survol. Les autres pertes : deux faits proches fusionnés à tort (une séparation et le divorce qui la suit), et quelques appariements qui n'étaient justes que par chance dans la frise lue.

## Rappel selon l'origine de l'événement

Un dossier long raconte le passé deux fois : à l'observation d'entrée, puis au fil du suivi, où des éléments du passé ne sont dits ou retrouvés que tard.

| Origine | `alcool-rechutes` | `antalgiques-douleur` | `cannabis-psychose` | `cocaine-cadre` | `opiaces-parcours` | `polyconso-precarite` | Total |
|---|---|---|---|---|---|---|---|
| Rapporté à l'entrée (antécédents) | 19/19 | 22/24 | 13/13 | 13/15 | 24/24 | 23/24 | 114/119 (96 %) |
| Vécu pendant le suivi | 57/69 | 43/47 | 46/48 | 47/56 | 37/44 | 69/80 | 299/344 (87 %) |
| Révélé tard (passé appris en cours de suivi) | 8/10 | 12/13 | 10/10 | 9/14 | 12/12 | 9/10 | 60/69 (87 %) |

## Volume, relecture simulée et coût

Coût estimé d'appels payants équivalents : caractères échangés ÷ 3 par jeton de demande (valeur usuelle pour du français) et ÷ 1.47 par jeton de réponse (mesuré sur les passages payants des dossiers courts), aux prix facturés lors de ces passages. Une estimation, pas une facture.

| Passage | Dossier | Pages | Observations | Découpage | Identifiants laissés par les règles (masqués à la main) | Demandes | Caractères envoyés | Caractères reçus | Coût estimé |
|---|---|---|---|---|---|---|---|---|---|
| regroupe2 | `alcool-rechutes` | 22 | 76 | courrier : modèle, historique : règles | 0 | 6 | 133715 | 68055 | 0.55 $ |
| regroupe2 | `antalgiques-douleur` | 25 | 75 | courrier : modèle, historique : règles | 0 | 6 | 139462 | 69632 | 0.57 $ |
| regroupe2 | `cannabis-psychose` | 26 | 74 | historique : règles | 0 | 5 | 134065 | 64988 | 0.53 $ |
| regroupe2 | `cocaine-cadre` | 23 | 76 | historique : règles, urgences : modèle | 1 | 6 | 140154 | 59242 | 0.50 $ |
| regroupe2 | `opiaces-parcours` | 26 | 75 | historique : règles | 0 | 5 | 133741 | 68491 | 0.56 $ |
| regroupe2 | `polyconso-precarite` | 21 | 75 | historique : règles | 0 | 5 | 138063 | 81783 | 0.65 $ |
| **Total** | | 143 | 451 | | 1 | 33 | 819200 | 412191 | 3.35 $ (0.56 $ par dossier) |

## Exactitude des événements trouvés

| Contrôle | `alcool-rechutes` | `antalgiques-douleur` | `cannabis-psychose` | `cocaine-cadre` | `opiaces-parcours` | `polyconso-precarite` | Total |
|---|---|---|---|---|---|---|---|
| début aussi précis | 95 % | 95 % | 91 % | 99 % | 88 % | 98 % | 95 % (447/473) |
| fin compatible | 60 % | 69 % | 84 % | 54 % | 69 % | 49 % | 63 % (232/367) |
| « en cours » juste | 88 % | 94 % | 91 % | 84 % | 89 % | 89 % | 89 % (422/473) |
| mode d'usage juste | 96 % | 100 % | 100 % | 80 % | 94 % | 92 % | 93 % (116/125) |
| au moins une source attendue | 98 % | 100 % | 100 % | 96 % | 99 % | 100 % | 99 % (467/473) |

## Rappel par piste (tous dossiers, tous passages)

| Piste | Trouvés / attendus | Rappel |
|---|---|---|
| Usages et comportements | 125/140 | 89 % |
| Psychopathologie | 29/31 | 94 % |
| Somatique | 35/39 | 90 % |
| Médicaments | 82/85 | 96 % |
| Prises en charge | 68/74 | 92 % |
| Événements de vie | 134/163 | 82 % |

## Validation par le code

Événements rendus par le modèle, puis écartés ou fusionnés par `assembleTimeline` (`web/src/notebook/timeline.ts`), avant tout regroupement. Un événement sans début dans le texte est gardé s'il a une fin ou s'il est en cours : il est placé à la première observation datée qui le mentionne, et signalé « début non précisé ».

| Passage | Dossier | Rendus | Piste inconnue | Ni date ni âge | Sans source connue | Fusionnés (même événement lu dans deux lots) | Gardés | dont datés par l'âge | dont placés à la première mention |
|---|---|---|---|---|---|---|---|---|---|
| regroupe2 | `alcool-rechutes` | 214 | 0 | 4 | 0 | 1 | 209 | 20 | 11 |
| regroupe2 | `antalgiques-douleur` | 206 | 0 | 4 | 0 | 5 | 197 | 5 | 22 |
| regroupe2 | `cannabis-psychose` | 210 | 0 | 5 | 0 | 7 | 198 | 14 | 3 |
| regroupe2 | `cocaine-cadre` | 178 | 0 | 4 | 0 | 5 | 169 | 17 | 8 |
| regroupe2 | `opiaces-parcours` | 224 | 0 | 3 | 0 | 8 | 213 | 19 | 13 |
| regroupe2 | `polyconso-precarite` | 261 | 0 | 4 | 0 | 14 | 243 | 8 | 13 |

## Découpage en observations

| Passage | Document | Attendues | Rendues | Dates justes |
|---|---|---|---|---|
| regroupe2 | `alcool-rechutes/courrier.pdf` | 1 | 1 | 0/0 |
| regroupe2 | `alcool-rechutes/historique.pdf` | 75 | 75 | 75/75 |
| regroupe2 | `antalgiques-douleur/courrier.pdf` | 1 | 1 | 0/0 |
| regroupe2 | `antalgiques-douleur/historique.pdf` | 74 | 74 | 74/74 |
| regroupe2 | `cannabis-psychose/historique.pdf` | 74 | 74 | 74/74 |
| regroupe2 | `cocaine-cadre/historique.pdf` | 75 | 75 | 75/75 |
| regroupe2 | `cocaine-cadre/urgences.pdf` | 1 | 1 | 0/0 |
| regroupe2 | `opiaces-parcours/historique.pdf` | 75 | 75 | 75/75 |
| regroupe2 | `polyconso-precarite/historique.pdf` | 75 | 75 | 75/75 |

## Détail par dossier

### `alcool-rechutes`

Statut au passage `regroupe2`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Usages et comportements | Alcool | 1987 → 1992 (approx) | usage | trouvé | Alcool · 1986 → 2025-04 · usage ⚠ fin compatible |
| Usages et comportements | Alcool | 1992 → 2003 (approx) | usage | trouvé | Alcool · 1992 · usage ⚠ fin compatible |
| Usages et comportements | Alcool | 2003 → 2011-03 (approx) | usage | trouvé | Alcool · 2002 → 2004 · usage ⚠ fin compatible |
| Usages et comportements | Alcool | 2011-03 (month) | sevrage | manqué |  |
| Usages et comportements | Alcool | 2014 (year) | sevrage | trouvé | Alcool · 2014 · sevrage |
| Usages et comportements | Alcool | 2016 (year) | sevrage | trouvé | Alcool · 2016 · sevrage |
| Usages et comportements | Alcool | 2017 → 2019-06-17 (year) | rechute | trouvé | Alcool · 2017 → 2019-06-17 · rechute |
| Usages et comportements | Alcool | 2019-06-17 → 2019-06-28 (exact) | sevrage | trouvé | Alcool · 2019-06-17 → 2019-06-28 · sevrage |
| Usages et comportements | Alcool | 2019-12-24 → 2020-05 (exact) | rechute | trouvé | Alcool · 2019-12-24 → 2021-03-26 · rechute ⚠ fin compatible |
| Usages et comportements | Alcool | 2020-05 → 2020-09-15 (month) | usage | mal daté | Alcool · 2020-06-23 → 2020-09-15 · usage |
| Usages et comportements | Alcool | 2020-09-15 → 2021-01 (exact) | usage | trouvé | Alcool · 2020-09-15 → 2021-01-05 · usage |
| Usages et comportements | Alcool | 2021-01 → 2021-03-26 (month) | usage | trouvé | Alcool · 2021-01 → 2021-03-26 · usage |
| Usages et comportements | Alcool | 2021-03-26 → 2021-03-28 (exact) | sevrage | trouvé | Alcool · 2021-03-26 → 2021-03-28 · sevrage |
| Usages et comportements | Alcool | 2021-04-06 → 2021-04-19 (exact) | sevrage | trouvé | Alcool · 2021 · sevrage ⚠ fin compatible, au moins une source attendue |
| Usages et comportements | Alcool | 2022-08-13 → 2022-11-12 (exact) | rechute | trouvé | Alcool · 2022-08-13 → 2022-11-12 · rechute |
| Usages et comportements | Alcool | 2022-11-12 → 2023-01-17 (exact) | usage | trouvé | Alcool · 2022-11-12 → 2023-01-17 · rechute ⚠ mode d'usage juste |
| Usages et comportements | Alcool | 2023-01-17 (exact) | sevrage | trouvé | Alcool · 2023 · sevrage ⚠ au moins une source attendue |
| Usages et comportements | Alcool | 2023-04 → 2023-12-04 (month) | rechute | trouvé | Alcool · 2023-04 → 2023-11-28 · rechute |
| Usages et comportements | Alcool | 2023-12-04 → 2023-12-13 (exact) | sevrage | autre piste | Sevrage ambulatoire de l'alcool · 2023-12-04 → 2023-12-13 |
| Usages et comportements | Alcool | 2025-03-14 → 2025-04-11 (exact) | rechute | trouvé | Alcool · 2025-03-14 → 2025-04-11 · rechute |
| Usages et comportements | Alcool | 2025-04-11 → 2025-04-19 (exact) | sevrage | trouvé | Alcool · 2025 · sevrage ⚠ fin compatible |
| Usages et comportements | Tabac | 1986 → 2024-01-29 (approx) | usage | trouvé | Tabac · 1986 → 2024-01-29 · usage |
| Usages et comportements | Tabac | 2024-01-29 (exact) | sevrage | manqué |  |
| Usages et comportements | Tabac | 2024-04 → (month) | rechute | trouvé | Tabac · 2024-04 → · rechute |
| Usages et comportements | Cannabis | 1991 (approx) | usage | trouvé | Cannabis · 1990 → 1992 · usage ⚠ fin compatible |
| Usages et comportements | Cocaïne | 2005 → 2008 (approx) | usage | trouvé | Cocaïne · 2005 → 2008 · usage |
| Usages et comportements | Benzodiazépines | 2022-07 → 2023-03-21 (approx) | usage | trouvé | Benzodiazépines · 2022 → 2023-03-21 · usage |
| Médicaments | Paroxétine | 2016 → 2017 (approx) |  | trouvé | Paroxétine · 2016 → 2017 |
| Médicaments | Thiamine | 2019-05-14 → 2019-09-17 (exact) |  | trouvé | Thiamine · 2019-05-14 → 2019-09-17 |
| Médicaments | Oxazépam | 2019-06-17 → 2019-06-26 (exact) |  | trouvé | Oxazépam · 2019-06-17 → 2019-06-26 |
| Médicaments | Acamprosate | 2019-06-28 → 2019-12 (exact) |  | trouvé | Acamprosate · 2019-06-28 → 2019-12 |
| Médicaments | Thiamine | 2020-01-09 (exact) |  | trouvé | Thiamine · 2020-01-09 → ⚠ « en cours » juste |
| Médicaments | Baclofène | 2020-02-04 → 2021-05 (exact) |  | trouvé | Baclofène · 2020-02-04 → 2021-05 |
| Médicaments | Escitalopram | 2020-05-12 → 2022-05 (exact) |  | trouvé | Escitalopram · 2020-05-12 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Oxazépam | 2021-03-28 → 2021-04-16 (exact) |  | trouvé | Oxazépam · 2021-03-28 → 2021-04-16 |
| Médicaments | Acamprosate | 2021-04 → 2022-08 (month) |  | trouvé | Acamprosate · 2021-04 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Bromazépam | 2021-09 → 2023-03-21 (month) |  | trouvé | Bromazépam · 2021-09 → 2023-03-21 |
| Médicaments | Nalméfène | 2022-09-20 → 2022-11-29 (exact) |  | trouvé | Nalméfène · 2022-09-20 → 2022-11-29 |
| Médicaments | Thiamine | 2022-11-29 (exact) |  | trouvé | Thiamine · 2022-11-29 |
| Médicaments | Venlafaxine | 2022-11-29 → (exact) |  | trouvé | Venlafaxine · 2022-11-29 → |
| Médicaments | Diazépam | 2023-01 → 2023-02 (month) |  | trouvé | Diazépam · 2023-01-17 → 2023-02-09 |
| Médicaments | Disulfirame | 2023-02-14 → 2023-04 (exact) |  | trouvé | Disulfirame · 2023-02-14 → 2023-11-28 ⚠ fin compatible |
| Médicaments | Diazépam | 2023-03-21 → 2023-12-13 (exact) |  | trouvé | Diazépam · 2023-03-21 → 2023-12-13 |
| Médicaments | Naltrexone | 2023-12-14 → 2025-02 (exact) |  | trouvé | Naltrexone · 2023-12-14 → 2025-02 |
| Médicaments | Varénicline | 2024-01-15 → 2024-04 (exact) |  | trouvé | Varénicline · 2024-01-15 → 2024-05 |
| Médicaments | Diazépam | 2025-04-11 → 2025-04-19 (exact) |  | trouvé | Diazépam · 2025-04-11 → 2025-04-19 |
| Médicaments | Naltrexone | 2025-04-22 → 2026-03-10 (exact) |  | trouvé | Naltrexone · 2025-04-22 → 2026-03-10 |
| Médicaments | Substituts nicotiniques | 2026-10-06 → (exact) |  | trouvé | Substituts nicotiniques · 2026-10-06 → |
| Psychopathologie | Épisode dépressif | 2009 (year) |  | trouvé | Épisode dépressif caractérisé · 2009 → 2009 ⚠ fin compatible |
| Psychopathologie | Tentative de suicide | 2009-09 (month) |  | trouvé | Tentative de suicide · 2009-09 → 2009 ⚠ fin compatible |
| Psychopathologie | Épisode dépressif | 2016 → 2017 (approx) |  | trouvé | Épisode dépressif caractérisé · 2016 → 2017 |
| Psychopathologie | Épisode dépressif caractérisé | 2020-04 → 2021-06 (month) |  | trouvé | Épisode dépressif caractérisé · 2020-04 → 2021-06 |
| Psychopathologie | Épisode dépressif caractérisé sévère | 2022-11 → 2023-08 (approx) |  | trouvé | Épisode dépressif caractérisé · 2022-11 → 2023-03 |
| Psychopathologie | Crise suicidaire | 2023-01 → 2023-01-17 (month) |  | trouvé | Crise suicidaire · 2023-01-17 → 2023-01-17 |
| Somatique | Hépatopathie alcoolique | 2019-06 → (month) |  | autre piste | Alcool · 2019-06-28 → 2019-12-24 |
| Somatique | Fracture du calcanéum gauche | 2019-10-15 (exact) |  | trouvé | Fracture du calcanéum gauche · 2019-10-15 → 2020-01 ⚠ fin compatible |
| Somatique | Crise convulsive de sevrage | 2021-03-28 (exact) |  | trouvé | Crise convulsive de sevrage · 2021-03-28 → 2021-03 ⚠ fin compatible |
| Prises en charge | Hospitalisation pour sevrage | 2011-03 (month) |  | trouvé | Sevrage hospitalier · 2011-03 → 2011 ⚠ fin compatible |
| Prises en charge | Hospitalisation pour sevrage | 2016 (year) |  | trouvé | Sevrage hospitalier · 2016 → 2016 ⚠ fin compatible |
| Prises en charge | Suivi en CSAPA | 2019-05-07 → (exact) |  | trouvé | Suivi CSAPA · 2019-05-07 → |
| Prises en charge | Accompagnement social | 2019-05-28 (exact) |  | trouvé | Suivi social (assistante sociale) · 2019-05-28 → ⚠ « en cours » juste |
| Prises en charge | Hospitalisation pour sevrage | 2019-06-17 → 2019-06-28 (exact) |  | trouvé | Sevrage hospitalier · 2019-06-17 → 2019-06-28 |
| Prises en charge | Psychothérapie | 2020-06-09 → 2023-01 (approx) |  | trouvé | Psychothérapie (psychologue) · 2020-06-09 → ⚠ fin compatible, « en cours » juste |
| Prises en charge | Hospitalisation pour sevrage | 2021-04-06 → 2021-04-19 (exact) |  | trouvé | Sevrage hospitalier · 2021-04-06 → 2021-04-19 |
| Prises en charge | SSR addictologique | 2021-05-10 → 2021-06-11 (exact) |  | trouvé | SSR addictologique (Cadillac) · 2021-05-10 → 2021-06-11 |
| Prises en charge | Groupe de prévention de la rechute | 2021-06-22 (exact) |  | trouvé | Groupe de prévention de la rechute du CSAPA · 2021-06-22 → ⚠ « en cours » juste |
| Prises en charge | Suivi éducatif | 2022-03-08 (exact) |  | trouvé | Accompagnement éducatif et projet professionnel · 2022-03-08 → ⚠ « en cours » juste |
| Prises en charge | Hospitalisation en psychiatrie | 2023-01-17 → 2023-02-09 (exact) |  | trouvé | Hospitalisation en psychiatrie · 2023-01-17 → 2023-02-09 |
| Prises en charge | Psychothérapie | 2025-06-17 → (exact) |  | trouvé | Psychothérapie (psychologue) · 2025-06-17 ⚠ « en cours » juste |
| Événements de vie | Violences paternelles subies | 1981 → 1989 (approx) |  | trouvé | Violences paternelles dans l'enfance · 1981 → 1989 |
| Événements de vie | Apprentissage, CAP de maçon | 1989 (approx) |  | trouvé | Apprentissage CAP de maçon · 1989 |
| Événements de vie | Service militaire | 1992 (approx) |  | trouvé | Service militaire · 1992 |
| Événements de vie | Emploi dans une entreprise de maçonnerie | 1993 → 2021-06-08 (approx) |  | trouvé | Emploi dans une entreprise de maçonnerie · 1993 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Mariage | 1999 → 2020-01-03 (year) |  | trouvé | Mariage · 1999 ⚠ fin compatible |
| Événements de vie | Naissance de son fils Kevin | 2001 (approx) |  | trouvé | Naissance du fils aîné · 2001 |
| Événements de vie | Naissance de sa fille Manon | 2006 (approx) |  | trouvé | Naissance de la fille · 2006 |
| Événements de vie | Contrôle routier sous alcool | 2018-12-22 (exact) |  | trouvé | Contrôle d'alcoolémie et annulation du permis · 2018-12-22 |
| Événements de vie | Annulation du permis, obligation de soins | 2019-03-19 (exact) |  | trouvé | Contrôle d'alcoolémie et annulation du permis · 2019-03-19 → 2019-03 ⚠ fin compatible |
| Événements de vie | Reprise du travail | 2019-07-08 (exact) |  | mal daté | Arrêt de travail pour le sevrage · 2019-06-17 → 2019-07-07 |
| Événements de vie | Conduite sans permis | 2019 → 2020-02 (year) |  | trouvé | Conduite sans permis · 2019 → 2020-02 |
| Événements de vie | Accident du travail, arrêt de travail | 2019-10-15 → 2021-06-08 (exact) |  | trouvé | Arrêt de travail (accident du travail) · 2019-10-15 → 2021-06-08 |
| Événements de vie | Séparation | 2020-01-03 (exact) |  | trouvé | Séparation conjugale · 2020-01-03 |
| Événements de vie | Contrôle au volant sans permis | 2020-02 (month) |  | manqué |  |
| Événements de vie | Logement : T2 à Langon | 2020-02-01 → 2023-09 (exact) |  | trouvé | Emménagement dans un T2 à Langon · 2020-02-01 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Jugement du JAF | 2020-06-16 (exact) |  | trouvé | Jugement du JAF · 2020-06-16 |
| Événements de vie | Vente de la maison de Toulenne | 2021-05 (month) |  | mal daté | Vente de la maison de Toulenne · 2021-03 → 2021-05 |
| Événements de vie | Licenciement pour inaptitude | 2021-06-08 (exact) |  | trouvé | Licenciement pour inaptitude · 2021-06-08 → 2021-06-08 ⚠ fin compatible |
| Événements de vie | Condamnation pour conduite sans permis | 2021-07-06 (exact) |  | manqué |  |
| Événements de vie | Divorce | 2021-10-05 (exact) |  | trouvé | Divorce · 2021-10-05 → 2021 ⚠ fin compatible |
| Événements de vie | RQTH | 2021 (year) |  | manqué |  |
| Événements de vie | Surendettement | 2021-11-18 (exact) |  | mal daté | Difficultés financières, surendettement · 2020-12 → |
| Événements de vie | Décès de son père | 2022-11-12 (exact) |  | trouvé | Décès du père · 2022-11-12 → 2022-11-12 ⚠ fin compatible |
| Événements de vie | Relation avec Patricia | 2022-11 → (month) |  | manqué |  |
| Événements de vie | Vie commune à Saint-Macaire | 2023-09 → (month) |  | manqué |  |
| Événements de vie | Permis de conduire récupéré | 2024-06-12 (exact) |  | manqué |  |
| Événements de vie | Naissance de sa petite-fille Lina | 2025-01-21 (exact) |  | trouvé | Naissance de la petite-fille · 2025-01-21 → 2025-01-21 ⚠ fin compatible |
| Événements de vie | Formation de métreur (AFPA) | 2025-09-08 → 2026-06-05 (exact) |  | trouvé | Formation de métreur (AFPA Bordeaux) · 2025-09-08 → 2026-06-05 |
| Événements de vie | CDD de métreur | 2026-09-01 → (exact) |  | trouvé | CDD de métreur · 2026-09-01 → |

En plus (passage `regroupe2`), à relire : vrai mais absent de la vérité, ou erreur.

- Usages et comportements · **Alcool** · 1985 · usage — Premier verre à 12 ans, le père lui faisait goûter son vin à table ; premières consommations à l'adolescence
- Usages et comportements · **Alcool** · 1988 → 1989 · intoxication — Ivresses du samedi soir avec les copains vers 15-16 ans (bière, vin, panaché)
- Prises en charge · **Sevrage ambulatoire de l'alcool** · 2014 → 2014 — Sevrage à la maison, tenu trois semaines
- Usages et comportements · **Alcool** · 2016 → 2017 — Abstinence d'un an à peu près après le sevrage hospitalier
- Usages et comportements · **Alcool** · 2019-11-26 · craving — Craving en hausse l'après-midi pendant l'arrêt de travail
- Usages et comportements · **Jeux d'argent** · 2019-05-14 · usage — Grattage de temps en temps, sans difficulté rapportée
- Psychopathologie · **Tristesse réactionnelle** · 2020-01-09 — Tristesse, honte, sentiment d'échec après la séparation ; pas de critère d'épisode dépressif caractérisé
- Psychopathologie · **Idées suicidaires passives** · 2020-05-12 — Idées noires passives sans projet ni scénario
- Somatique · **HTA non traitée** · 2019-05-14 → — TA élevée chez le médecin traitant, pas de traitement ; TA 158/97 à l'entrée
- Somatique · **Lombalgies chroniques** · 2019-05-14 → — Lombalgies chroniques liées au métier
- Somatique · **Appendicectomie** · 1979 → 1984 — Appendicectomie dans l'enfance
- Somatique · **Stéatose hépatique** · 2019-06-21 — Échographie : foie augmenté de volume, stéatose diffuse, sans dysmorphie ni ascite
- Médicaments · **Paracétamol** · 2019-10-22 — Seul traitement pris après la fracture
- Prises en charge · **Groupe de parole et éducation thérapeutique** · 2019-06-21 → 2019-06-28 — Groupe de parole et atelier « l'alcool et le foie » pendant le séjour
- Prises en charge · **Orientation vers la psychologue du CSAPA** · 2020-05-12 — Orientation prévue dès la fin du confinement
- Événements de vie · **Naissance à Toulenne** · 1973 — Né en 1973, deuxième de deux garçons, enfance à la campagne décrite sans particularité
- Événements de vie · **Chef d'équipe** · 2009 → — Chef d'équipe depuis une dizaine d'années
- Événements de vie · **Dirigeant bénévole d'un club de football** · 2017 — Arrêté en 2017 « à cause de la buvette »
- Événements de vie · **Ultimatum de l'épouse** · 2019-05-07 — Sa femme lui a posé un ultimatum ; le couple « va mal depuis un moment »
- Événements de vie · **Accident du travail** · 2019-10-15 — Chute d'un échafaudage sur un chantier à Saint-Macaire, il affirme ne rien avoir bu
- Événements de vie · **Tensions conjugales** · 2019-11-26 — Disputes presque tous les soirs ; entretiens de couple refusés par l'épouse
- Événements de vie · **Hébergement chez son frère** · 2020-01-03 → 2020-02-01 — Dort chez son frère à Langon
- Événements de vie · **Procédure devant le juge aux affaires familiales** · 2020-03 → — L'épouse a saisi le JAF, audience prévue au printemps ; il souhaite un week-end sur deux
- Événements de vie · **Isolement pendant le confinement** · 2020-03 — Seul dans l'appartement, avec les bières ; a repensé à la nuit de 2009
- Usages et comportements · **Alcool** · 2021-03-28 → 2021-04-06 · usage — Reprise de bière après la crise « pour ne pas refaire une crise » ; 8 à 10 bières/j, dernière prise le matin de l'entrée
- Usages et comportements · **Alcool** · 2021-05-04 → 2021-05-04 · craving — Craving modéré
- Usages et comportements · **Alcool** · 2021-04 → — Abstinence depuis le sevrage (indiquée « depuis mi-avril » le 04/05, « depuis fin mars » les 22/06 et 12/10) ; « toujours rien bu » au 18/01/2022 ; GGT 96, CDT normale en octobre 2021
- Psychopathologie · **Anxiété** · 2021-06 → — Anxiété importante depuis le licenciement (argent, avenir)
- Somatique · **Hépatopathie alcoolique avec fibrose F3** · 2020-11-10 → — Fibroscan 13,2 kPa le 10/11/2020 (F3), contrôle 13,8 kPa le 14/04/2021 ; hépatologie 05/10/2021 sans hypertension portale ; échographie semestrielle ; ASAT/ALAT élevées dès 09/2020
- Médicaments · **Thiamine** · 2020-06-23 → — Thiamine 250 mg/j, 500 mg x 2 IV pendant le sevrage
- Prises en charge · **Suivi social (assistante sociale)** · 2021-03-09 → — Démarches : RQTH, surendettement, emploi, justice
- Prises en charge · **Consommation contrôlée (objectif de réduction)** · 2020-09-15 → 2021-02-02 — Essai accepté : 3 UIA/j maximum, 2 jours sans alcool par semaine, carnet ; échec, abandonné, objectif d'abstinence
- Événements de vie · **Départ en apprentissage** · 1988 → 1989 — À 15-16 ans
- Événements de vie · **Dettes et difficultés conjugales** · 2009 — Dettes après l'achat de la maison, épouse qui parlait déjà de partir, insomnie
- Événements de vie · **Hébergement chez son frère** · 2021-03-28 → 2021-04-19 — Hébergé après la crise convulsive jusqu'à la sortie du sevrage
- Événements de vie · **Visite de pré-reprise, inaptitude probable** · 2021-02-24 → 2021-02-24 — Inaptitude au poste de chef d'équipe maçon très probable, pas de poste adapté
- Événements de vie · **Inscription à Pôle emploi** · 2021-06 → — Allocation de retour à l'emploi environ 1 300 €
- Événements de vie · **Reconnaissance de la qualité de travailleur handicapé** · 2021-05 → 2021-11 — Dossier MDPH déposé en mai 2021, RQTH accordée
- Événements de vie · **Hospitalisation du père (foie)** · 2021-09 — Visite à l'hôpital, père ayant des problèmes de foie
- Usages et comportements · **Alcool** · 1989 · usage — Premières consommations vers 16 ans.
- Usages et comportements · **Alcool** · 2020-09 → 2021-01 · usage — Essai de consommation contrôlée, échec.
- Médicaments · **Escitalopram** · 2022-04-05 → 2022-05 — Déjà en cours le 05/04/2022 ; diminué à 10 mg à sa demande ; arrêté par lui-même début mai après 3 semaines à 10 mg.
- Médicaments · **Acamprosate** · 2022-04-05 → 2022-08 — En cours le 05/04/2022 (2-2-2) ; arrêté par lui à la mi-août 2022.
- Prises en charge · **Obligation de soins** · 2019 — Obligation de soins après l'annulation du permis.
- Prises en charge · **Groupe de prévention de la rechute du CSAPA** · 2022-04-05 — Un an d'abstinence fêté avec le groupe.
- Prises en charge · **Psychothérapie (psychologue)** · 2023-02-14 — Psychologue à reprendre ; reprise des entretiens avec Mme [SOIGNANT_11] prévue en avril 2025.
- Prises en charge · **Consultation tabac** · 2024-01-15 → 2024-01-15 — Consultation tabac après la demande d'arrêt.
- Prises en charge · **Sevrage ambulatoire de l'alcool** · 2025-04-11 → 2025-04-19 — Sevrage ambulatoire avec passages IDE quotidiens les 3 premiers jours ; sans complication.
- Événements de vie · **Dispute avec [PERSONNE_2]** · 2008 → 2008 — Grosse dispute à la naissance de la petite ou juste après, qui a mis fin à la cocaïne.
- Événements de vie · **Hospitalisation du père (foie)** · 2022-06 → 2022-11-12 — Père hospitalisé régulièrement puis en fin de vie ; le patient s'en occupe avec sa mère.
- Événements de vie · **Retrouvailles avec [PROCHE_3]** · 2022-11 → — Amie d'enfance retrouvée aux obsèques ; appelle tous les jours ; l'accompagne à l'admission en psychiatrie, devenue sa compagne.
- Événements de vie · **Installation chez [PROCHE_3]** · 2023-09 → — Emménage chez sa compagne à Saint-Macaire début septembre 2023, appartement de Langon rendu.
- Événements de vie · **Plan de surendettement** · 2024-05-14 → 2027 — Plan en cours, mensualité 180 €, fin prévue en 2027.
- Usages et comportements · **Alcool** · 2025-04-11 → — Abstinent depuis le 11/04/2025 (18 mois au 06/10/2026), sans traitement anticraving depuis mars 2026; GGT 32 en mars 2026.
- Usages et comportements · **Tabac** · 2025-09 → · usage — 10 cigarettes par jour (début non précisé, première mention en 09/2025); demande des substituts pour un prochain mois sans tabac.
- Psychopathologie · **Trouble dépressif récurrent** · 2025-11-18 → — Antécédent non daté; thymie stable depuis 3 ans en octobre 2026, sous venlafaxine.
- Prises en charge · **Interruption du suivi** · 2023 → 2025-06 — Deux ans d'interruption du suivi avant la reprise en juin 2025.
- Prises en charge · **Suivi CSAPA** · 2025-09-16 → — Consultations psychiatre addictologue et interne; consultations espacées tous les 3 mois avec IDE à la demande, RDV janvier 2027.
- Prises en charge · **Plan de prévention de la rechute** · 2026-03-10 — Plan écrit : dates anniversaires, signaux d'alerte, personnes à appeler.
- Événements de vie · **Père buvant de l'alcool** · 1979 → 1984 — Le père fêtait ses anniversaires en buvant; lien établi avec les rechutes.
- Événements de vie · **Stage en cabinet d'économistes de la construction** · 2025-09-16 → 2026-05 — Stage à Langon jusqu'en mai 2026, au printemps.
- Événements de vie · **Vie de couple stable** · 2025-11-18 → — Vie de couple stable (début non précisé, mention en 11/2025).

### `antalgiques-douleur`

Statut au passage `regroupe2`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Usages et comportements | Oxycodone | 2015-06 → 2016-12 (month) | usage | trouvé | Opioïdes · 2015-06 → 2019-06 · usage ⚠ fin compatible |
| Usages et comportements | Oxycodone | 2017 → 2019-06-03 (approx) | usage | trouvé | Opioïdes (oxycodone) · 2018-09 → 2019-06-03 · usage |
| Usages et comportements | Oxycodone | 2018-11 (month) | intoxication | trouvé | Opioïdes · 2018-11 → 2018 · intoxication ⚠ fin compatible |
| Usages et comportements | Oxycodone | 2019-06-03 → 2019-06-14 (exact) | sevrage | trouvé | Opioïdes (oxycodone) · 2019-06-04 → 2019-06-09 · sevrage ⚠ fin compatible |
| Usages et comportements | Oxycodone | 2020-09 → 2020-09-18 (month) | rechute | trouvé | Opioïdes · 2020-09 → 2020-09-18 · rechute |
| Usages et comportements | Héroïne | 2018-07 → 2018-08 (month) | usage | trouvé | Héroïne · 2018-07 → 2018-08 · usage |
| Usages et comportements | Prégabaline | 2019 → 2021-09-14 (approx) | usage | trouvé | Prégabaline · 2019 → 2021 · usage |
| Usages et comportements | Alcool | 1994 → 1999-03 (approx) | usage | trouvé | Alcool · 1994 → 1999-03 · usage |
| Usages et comportements | Alcool | 1999-03 (month) | sevrage | trouvé | Alcool · 1999-03 → 1999 · sevrage ⚠ fin compatible |
| Usages et comportements | Alcool | 2022-04 → 2022-05-21 (month) | rechute | trouvé | Alcool · 2022-04 → 2022-05-21 · rechute |
| Usages et comportements | Alcool | 2022-07 → 2022-09-12 (approx) | rechute | trouvé | Alcool · 2022-07 → 2022-09-12 · rechute |
| Usages et comportements | Alcool | 2022-09-12 → 2022-09-23 (exact) | sevrage | trouvé | Alcool · 2022-09-12 → 2022-09-23 · sevrage |
| Usages et comportements | Alcool | 2023-12-23 → 2024-01-06 (exact) | rechute | trouvé | Alcool · 2023-12-23 → 2024-01-06 · rechute |
| Usages et comportements | Tabac | 1975 → (approx) | usage | trouvé | Tabac · 1973 → · usage |
| Usages et comportements | Méthadone | 2021-12-10 → 2021-12-11 (exact) | sevrage | trouvé | Opioïdes · 2021-12-10 → 2021-12-11 · sevrage |
| Usages et comportements | Méthadone | 2022-05-21 (exact) | intoxication | trouvé | Opioïdes · 2022-05-21 → 2022-05-24 · intoxication ⚠ fin compatible |
| Médicaments | Tramadol | 2013-10 → 2015-06 (month) |  | trouvé | Tramadol · 2013-10 → 2015-06 |
| Médicaments | Oxycodone | 2015-06 → 2019-06-09 (month) |  | trouvé | Oxycodone · 2015-06 → 2019-06 |
| Médicaments | Oxycodone (second prescripteur) | 2017 → 2019-03 (approx) |  | trouvé | Oxycodone (2e prescripteur) · 2017 → 2019-03 |
| Médicaments | Fentanyl transdermique | 2017-02 → 2018-10 (month) |  | trouvé | Fentanyl transdermique · 2017-02 → 2018-10 |
| Médicaments | Prégabaline | 2016-03 → 2023-02-06 (month) |  | trouvé | Prégabaline · 2016-03 → 2023-02-06 |
| Médicaments | Alprazolam | 2013 → 2019-06-03 (approx) |  | trouvé | Alprazolam · 2014 → 2019-06-03 |
| Médicaments | Oxazépam | 2019-06-03 → (exact) |  | trouvé | Oxazépam · 2019-06-04 → |
| Médicaments | Méthadone | 2019-06-04 → (exact) |  | trouvé | Méthadone · 2019-06-04 → |
| Médicaments | Tiotropium | 2020-11 (approx) |  | trouvé | Tiotropium · 2020-11 → ⚠ « en cours » juste |
| Médicaments | Pression positive continue (PPC) | 2020-11-05 → 2023 (approx) |  | manqué |  |
| Médicaments | Pression positive continue (PPC) | 2025-09-02 → (exact) |  | manqué |  |
| Médicaments | Duloxétine | 2022-05-31 → 2024-12-17 (exact) |  | trouvé | Duloxétine · 2022-05-31 → 2024-12-17 |
| Médicaments | Naloxone (kit) | 2022-05-31 → (exact) |  | trouvé | Naloxone · 2022-05-31 → |
| Médicaments | Thiamine | 2022-09-12 (exact) |  | trouvé | Thiamine · 2022-09 |
| Médicaments | Substituts nicotiniques | 2025-09-16 → 2025-10 (approx) |  | trouvé | Substituts nicotiniques (patch 21 mg + gommes) · 2025-09-16 → 2025-10 |
| Psychopathologie | Idées suicidaires | 1994 → 1999 (approx) |  | mal daté | Idées suicidaires passées · 1990 → 1999 |
| Psychopathologie | Deuil traumatique (fils) | 1994-08 → (month) |  | trouvé | Deuil non élaboré du fils · 1994-08 → |
| Psychopathologie | Épisode dépressif caractérisé | 2022-03 → 2024-12 (approx) |  | trouvé | Épisode dépressif caractérisé · 2022-05 → 2024 |
| Somatique | Fracture de L1 (chute d'un échafaudage) | 2013-10-14 (exact) |  | trouvé | Fracture de L1 et arthrodèse · 2013-10-14 |
| Somatique | Arthrodèse T12-L2 | 2013-10-16 (exact) |  | manqué |  |
| Somatique | Reprise chirurgicale (pseudarthrose, extension à L3) | 2015-06-09 (exact) |  | trouvé | Reprise chirurgicale (pseudarthrose) · 2015-06-09 |
| Somatique | Lombalgies chroniques et radiculalgie droite | 2013-10 → (month) |  | trouvé | Lombalgies chroniques et radiculalgie L5 droite · 2013-10 → |
| Somatique | Chutes à domicile | 2021-06 → 2021-08 (approx) |  | trouvé | Somnolence et chutes à domicile · 2021-06 → 2021-08 |
| Somatique | Syndrome d'apnées obstructives du sommeil sévère | 2020-10-13 → (exact) |  | trouvé | Syndrome d'apnées du sommeil sévère · 2020-10-13 → |
| Somatique | BPCO | 2020-11 → (approx) |  | trouvé | BPCO · 2020-11 → |
| Somatique | Exacerbation de BPCO hospitalisée | 2021-12-08 → 2021-12-17 (exact) |  | trouvé | Exacerbation de BPCO (hospitalisation en pneumologie) · 2021-12-08 → 2021-12-17 |
| Somatique | Pneumopathie d'inhalation (réanimation) | 2022-05-21 → 2022-05-24 (exact) |  | trouvé | Surdosage avec détresse respiratoire et pneumopathie d'inhalation · 2022-05-21 → 2022-05-24 |
| Somatique | Allongement du QTc | 2023-04-11 (exact) |  | mal daté | QTc allongé sous méthadone · 2022-05 → 2024-07 |
| Somatique | Chute dans l'escalier | 2024-01 (approx) |  | trouvé | Chute dans l'escalier · 2024-01 |
| Somatique | Bronchite | 2026-01 (approx) |  | trouvé | Bronchite · 2026-01-13 |
| Somatique | Exacerbation de BPCO | 2026-02 (month) |  | trouvé | Exacerbation de BPCO · 2026-02 |
| Prises en charge | Hospitalisation pour sevrage d'alcool (clinique des Pins) | 1999-03 (month) |  | trouvé | Sevrage alcool hospitalier · 1999-03 → 1999-03 ⚠ fin compatible |
| Prises en charge | Centre de la douleur (CETD) | 2014-04-03 (exact) |  | trouvé | Suivi au centre de la douleur (CETD) · 2014-04-03 → ⚠ « en cours » juste |
| Prises en charge | Suivi addictologique (CSAPA) | 2019-04-15 → (exact) |  | trouvé | Suivi CSAPA · 2019-04-15 → |
| Prises en charge | Accompagnement social | 2019-04-25 → 2024-09-10 (exact) |  | trouvé | Suivi social · 2019-04-25 → 2020-02-25 ⚠ fin compatible |
| Prises en charge | Hospitalisation dans l'unité d'addictologie (rotation vers la méthadone) | 2019-06-03 → 2019-06-14 (exact) |  | trouvé | Hospitalisation d'addictologie · 2019-06-03 → 2019-06-14 |
| Prises en charge | Protocole de soins CPAM | 2020-01 (month) |  | manqué |  |
| Prises en charge | Accompagnement éducatif | 2020-01-21 → 2025-06-03 (approx) |  | trouvé | Accompagnement éducatif · 2020-02 → ⚠ fin compatible, « en cours » juste |
| Prises en charge | Psychothérapie (psychologue) | 2021-04-13 → 2025-07-01 (exact) |  | trouvé | Suivi psychologique · 2021-04-13 → 2025-07-01 |
| Prises en charge | Réanimation (surdose) | 2022-05-21 → 2022-05-24 (exact) |  | trouvé | Réanimation · 2022-05-21 → 2022-05-24 |
| Prises en charge | Hospitalisation dans l'unité d'addictologie (après la surdose) | 2022-05-24 → 2022-06-03 (exact) |  | trouvé | Hospitalisation en unité d'addictologie · 2022-05-24 → 2022-06-03 |
| Prises en charge | Passages IDE à domicile | 2022-06-07 → 2022-09-27 (approx) |  | trouvé | IDE à domicile · 2022-06 → 2022-07 |
| Prises en charge | Réadaptation respiratoire | 2026-05 → 2026-07 (approx) |  | trouvé | Réadaptation respiratoire · 2026-05 → 2026-07 |
| Événements de vie | CAP de maçon | 1977 (approx) |  | trouvé | CAP de maçon · 1976 → 1978 ⚠ fin compatible |
| Événements de vie | Maçon puis chef de chantier (entreprise de Lormont) | 1977 → 2013-10-14 (approx) |  | trouvé | Emploi : maçon puis chef de chantier · 1977 → 2013-10 |
| Événements de vie | Service militaire | 1980 (year) |  | trouvé | Service militaire à Pau · 1980 → 1980 ⚠ fin compatible |
| Événements de vie | Mariage | 1984 (year) |  | trouvé | Mariage · 1984 → 1984 ⚠ fin compatible |
| Événements de vie | Naissance de sa fille Séverine | 1986 (approx) |  | trouvé | Naissance de la fille · 1986 → 1986 ⚠ fin compatible |
| Événements de vie | Naissance de son fils Damien | 1990 (year) |  | trouvé | Naissance du fils · 1990 |
| Événements de vie | Décès de son fils Damien (noyade) | 1994-08 (month) |  | trouvé | Décès du fils par noyade · 1994-08 |
| Événements de vie | Suspension de permis (conduite en état d'ivresse) | 1998 (year) |  | trouvé | Suspension de permis pour conduite en état d'ivresse · 1998 |
| Événements de vie | Accident du travail, arrêt de travail | 2013-10-14 → 2016-03-31 (exact) |  | trouvé | Accident du travail (chute d'échafaudage) · 2013-10-14 → 2014 ⚠ fin compatible |
| Événements de vie | Invalidité catégorie 2 et licenciement pour inaptitude | 2016 → 2023-03-01 (year) |  | trouvé | Invalidité · 2016 → 2023-03-01 |
| Événements de vie | Litige avec la CPAM (taux d'IPP) | 2017 → 2020-02-14 (year) |  | trouvé | Litige CPAM sur le taux d'IPP · 2017 → 2020-02-14 |
| Événements de vie | Falsification d'ordonnances | 2018-07 → 2019-01 (approx) |  | trouvé | Ordonnances falsifiées · 2018-07 → 2019-01 |
| Événements de vie | Signalement par la pharmacie (ordonnance falsifiée) | 2019-01 (month) |  | manqué |  |
| Événements de vie | Convocation au commissariat | 2019-02 (month) |  | trouvé | Convocation au commissariat · 2019-02 → 2019-02 ⚠ fin compatible |
| Événements de vie | Rappel à la loi | 2019-03 (month) |  | trouvé | Rappel à la loi · 2019-03 → 2019-03 ⚠ fin compatible |
| Événements de vie | Contrôle du service médical de la CPAM | 2019-11 → 2020-01-21 (approx) |  | trouvé | Contrôle de la CPAM sur les prescriptions · 2019-11 → 2020-01 |
| Événements de vie | Cancer du pancréas de son épouse | 2021-08 → 2022-03-12 (month) |  | trouvé | Cancer du pancréas métastatique de l'épouse · 2021-08 → 2022-03-12 |
| Événements de vie | Décès de son épouse | 2022-03-12 (exact) |  | trouvé | Décès de l'épouse · 2022-03-12 |
| Événements de vie | Visite sur la tombe de son fils | 2022-08 (month) |  | trouvé | Visite sur la tombe du fils avec sa fille · 2022-08 |
| Événements de vie | Retraite | 2023-03-01 (exact) |  | trouvé | Retraite · 2023-03-01 → ⚠ « en cours » juste |
| Événements de vie | Aide à domicile | 2023-06 → (approx) |  | trouvé | Aide à domicile · 2023-06 → |
| Événements de vie | Vente de la maison de Cenon | 2024-06 (month) |  | trouvé | Vente de la maison de Cenon · 2024-06 |
| Événements de vie | Déménagement à Libourne près de sa fille | 2024-09-01 (exact) |  | trouvé | Installation à Libourne près de sa fille · 2024-09-01 → ⚠ « en cours » juste |
| Événements de vie | Bénévolat (atelier de réparation de vélos) | 2025-06 → (approx) |  | trouvé | Bénévolat à l'atelier de réparation de vélos · 2025-06 → |
| Événements de vie | Naissance de son petit-fils Noé | 2025-10-14 (exact) |  | trouvé | Naissance du petit-fils · 2025-10 |

En plus (passage `regroupe2`), à relire : vrai mais absent de la vérité, ou erreur.

- Usages et comportements · **Opioïdes (tramadol)** · 2014 → 2016 · usage — Tramadol après la première opération, jusqu'à 8 par jour pendant un an ou deux
- Usages et comportements · **Opioïdes (fentanyl)** · 2016 → 2016 · usage — Patchs de fentanyl pendant 6 mois en 2016, arrêtés (se décollaient)
- Usages et comportements · **Opioïdes (oxycodone)** · 2015 → 2019-06-09 · usage — TUO sur oxycodone, jusqu'à 300 mg/j, deux prescripteurs, ordonnances falsifiées ; antalgiques liés à la douleur après l'accident ; honte de ces ordonnances.
- Usages et comportements · **Opioïdes (oxycodone)** · 2019-03 → 2019-06-03 · sevrage — Après le rappel à la loi, prétend avoir tout réduit ; manques fréquents depuis mars ; boîte réclamée avec 3 jours d'avance en mai, refusée
- Usages et comportements · **Tabac** · 1986 → 1986 · sevrage — Arrêt de 3 mois à la naissance de sa fille
- Usages et comportements · **Alcool** · 2019-04-18 → · usage — Un verre de vin au repas, pas tous les jours ; AUDIT-C à 2 ; pas de problème d'alcool
- Médicaments · **Amlodipine** · 2019-04-18 → — HTA traitée par amlodipine 5 mg
- Somatique · **Fracture lombaire et douleur chronique** · 2014 → — Chute d'un échafaudage (fracture d'une vertèbre lombaire, arthrodèse), reprise chirurgicale un an ou deux plus tard ; douleur lombaire permanente et radiculalgie droite (6-7/10) ; un interne la date de fin 2013
- Somatique · **Hypertension artérielle** · 2019-04-18 → — HTA traitée par amlodipine
- Somatique · **Toux chronique / suspicion de BPCO** · 2019-04-15 → — Toux chronique non explorée, crachats matinaux, essoufflement à un étage, SpO2 93 %
- Somatique · **Suspicion de syndrome d'apnées du sommeil** · 2019-04 → — Ronflements forts, somnolence diurne, désaturations nocturnes à 86-88 % en juin 2019 ; polygraphie demandée mais non faite en septembre
- Psychopathologie · **Humeur abaissée après l'accident** · 2014 → — « Un coup de moins bien » après l'accident, jamais de suivi psy ; thymie légèrement abaissée en 2019, pas d'idées suicidaires
- Événements de vie · **Père alcoolique** · 1967 → 1972 — Père qui buvait, parfois violent en paroles, jamais de soins ; oncle maternel mort de la boisson
- Événements de vie · **Naissance et enfance à Cenon** · 1967 → 1972 — Né et élevé à Cenon, deuxième de deux enfants, mère décédée, sœur cadette à Bayonne
- Événements de vie · **Chef de chantier** · 1997 → 1999 — Devient chef de chantier vers 37 ans
- Événements de vie · **Emploi : chef de chantier** · 2013-10 — Chef de chantier ; perte du statut et du réseau de collègues après l'accident du travail (« les gars qui m'appelaient chef »). Début non daté.
- Événements de vie · **Consolidation et mise en invalidité** · 2016-03-31 → — Consolidation fixée au 31/03/2016, mise en invalidité dans la foulée.
- Événements de vie · **Confinement (COVID)** · 2020-03 → 2020-06 — Plus de pétanque ni de sorties, prise de poids ; reste à la maison avec sa femme.
- Événements de vie · **Restriction de la conduite automobile** · 2020-06-16 → — Conduite déconseillée en attendant la polygraphie (endormissement au feu rouge) ; en 11/2020 ne conduit plus que le matin ; renonce au permis poids lourd en 06/2021.
- Événements de vie · **Vit seul depuis le décès de l'épouse** · 2022-03 → — Seul dans la maison, la fille passe le week-end ; tout lui rappelle son épouse.
- Usages et comportements · **Alcool** · 1999 → 2022-03 · usage — Abstinence d'alcool fort déclarée depuis 1999, « un verre de vin de temps en temps » ; GGT 38 (01/2021) puis 36 (09/2021) ; note au dossier : TUAL ancien sévère en rémission prolongée.
- Usages et comportements · **Alcool** · 2022-05-21 · intoxication — Alcoolémie 1,6 g/L à l'admission en réanimation, vin pris avec le repas.
- Usages et comportements · **Opioïdes** · 2020-03 → 2020-06 · craving — Envie d'oxycodone pendant le confinement sans prise ; urines du 09/06 oxycodone négatives.
- Médicaments · **Corticoïdes et antibiotiques** · 2021-12-08 — Pour l'exacerbation de BPCO ; encore en cours à la sortie (17/12/2021).
- Psychopathologie · **Humeur dépressive** · 2021-09 → — Effondré à l'annonce du cancer de l'épouse (09/2021), thymie basse, pleurs, sommeil 4 h (11/2021) ; après le décès sommeil haché, anorexie, ruminations ; antidépresseur refusé en 04/2022.
- Somatique · **Somnolence diurne** · 2020-06-16 → 2020-11-17 — Somnolence dans la journée, endormissement au feu rouge ; moins marquée sous appareillage.
- Somatique · **Toux et dyspnée majorées** · 2021-10-26 — Depuis 2 semaines au 09/11/2021.
- Prises en charge · **Rééducation, TENS et groupe douleur et mouvement** · 2020-06 — Proposés à plusieurs reprises (kiné relancée 09/2020), peu suivis.
- Prises en charge · **Entretien motivationnel tabac** · 2020-11-17 — Pas prêt, à réévaluer.
- Prises en charge · **Entretien social (permis de conduire)** · 2021-06-22 — Information sur méthadone et conduite ; renonce au poids lourd.
- Prises en charge · **Sevrage ambulatoire de l'alcool** · 2022-09-12 → 2022-09-27 — Oxazépam majoré à 60 mg/j puis décroissance, thiamine, passages IDE à J1, J3, J7 et dernier passage le 27/09 ; fille présente chaque soir.
- Usages et comportements · **Alcool** · 2022-11-08 · craving — Pensées d'alcool le soir (« le soir, toujours ») mais pas de reprise.
- Usages et comportements · **Alcool** · 2023-11-07 · craving — Envie de « boire un coup pour tenir » à l'approche des fêtes, sans passage à l'acte.
- Psychopathologie · **Idées de mort passives** · 2022-05-31 → 2022-07-05 — Idées de mort passives sans scénario ; plus d'idées suicidaires le 05/07/2022 ; plus d'idées de mort en avril 2023.
- Prises en charge · **Hospitalisation en pneumologie** · 2021-12 — Exacerbation de BPCO, méthadone omise.
- Prises en charge · **Accompagnement éducatif** · 2022-06 → 2022-12 — Accompagnement éducatif pour structurer les journées.
- Prises en charge · **Suivi social** · 2023-03-14 → 2024-09-10 — Assistante sociale : retraite, aide à domicile, déménagement ; suivi social terminé le 10/09/2024.
- Événements de vie · **Second prescripteur à Lormont** · 2017 → 2019 — Nomadisme médical avec second prescripteur et ordonnances falsifiées en 2018-2019.
- Événements de vie · **Isolement social** · 2023-03 — Vit seul, sort peu hors pétanque du jeudi, dimanche chez sa fille.
- Événements de vie · **Projet de bébé de la fille** · 2024-03 → — Fille en parcours de PMA ; petit-enfant à venir.
- Événements de vie · **Reprise du travail** · 2015 — Reprise du travail en 2015 après arthrodèse.
- Événements de vie · **Logement à Cenon** · 2024-09 — Vivait à Cenon ; y avait perdu sa « vie de quartier » depuis l'accident. Fin à l'installation à Libourne.
- Événements de vie · **Pétanque** · 2025-04 → — Pétanque deux fois par semaine ; nommé « responsable du terrain » par le club (06/2025).
- Usages et comportements · **Alcool** · 2022 → 2024-01-06 · rechute — Reprise de l'alcool en 2022 pendant l'épisode dépressif, rechute en 2023 ; abstinent depuis le 06/01/2024 (éthylotest 0 ; pas d'alcool jusqu'en 10/2026, même à la naissance du petit-fils).
- Médicaments · **Méthadone 40 + 20 mg (rupture de stock des gélules 60 mg)** · 2026-09-15 — Délivrance provisoire (environ 48 h) de gélules 40 + 20 mg, dose identique, par la pharmacie ; patient informé.
- Médicaments · **Oxazépam** · 2025-04-15 → — 30 mg, réduction à 20 mg/j acceptée le 15/04/2025 (20 mg depuis mai 2025) ; 20 mg encore en 10/2026.
- Médicaments · **Paracétamol** · 2025-04-15 → — Seul antalgique demandé (aucune demande d'antalgique en dehors du paracétamol).
- Médicaments · **Antibiotique et corticoïdes** · 2026-02 — Antibiotique et corticoïdes pendant 5 jours pour l'exacerbation de BPCO.
- Somatique · **PPC (SAOS) première période** · 2023 — Ventilation PPC abandonnée en 2023, à relancer.
- Somatique · **PPC (SAOS) reprise** · 2025-09 → — Reprise avec un masque narinaire mieux toléré, 5 à 6 heures par nuit, moins de somnolence ; utilisée toutes les nuits en 10/2026.
- Prises en charge · **Accompagnement éducatif** · 2025-06-03 → 2025-06-03 — Entretien éducatif à Libourne ; clôture le 03/06/2025, rendez-vous à sa demande.

### `cannabis-psychose`

Statut au passage `regroupe2`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Usages et comportements | Cannabis | 2014 → 2017 (approx) | usage | trouvé | Cannabis · 2016 → 2017 · usage |
| Usages et comportements | Cannabis | 2017 → 2019-09 (approx) | usage | trouvé | Cannabis · 2017 → 2019-09 · usage |
| Usages et comportements | Cannabis | 2019-09 → 2020-08-24 (month) | usage | trouvé | Cannabis · 2019-09 → 2020-08-24 · usage |
| Usages et comportements | Cannabis | 2019-12 → 2019-12 (month) | sevrage | trouvé | Cannabis · 2019-12 → 2019-12 · sevrage |
| Usages et comportements | Cannabis | 2017-06 → 2017-06 (month) | intoxication | trouvé | Cannabis · 2017-06 → 2017-06 · intoxication |
| Usages et comportements | Cannabis | 2020-08-24 → 2020-09 (approx) | sevrage | trouvé | Cannabis · 2020-08-24 → 2021-01 · sevrage |
| Usages et comportements | Cannabis | 2021-01 → 2022-05 (month) | rechute | trouvé | Cannabis · 2021-01 → · rechute ⚠ fin compatible, « en cours » juste |
| Usages et comportements | Cannabis | 2022-06 → 2022-10-28 (month) | rechute | trouvé | Cannabis · 2022-06 → 2022-10-28 · rechute |
| Usages et comportements | Cannabis | 2022-10-28 → 2022-11 (approx) | sevrage | trouvé | Cannabis · 2022-10-28 → 2022-11-10 · sevrage |
| Usages et comportements | Cannabis | 2023-07-21 → 2023-08-06 (exact) | rechute | trouvé | Cannabis · 2023-07-21 → 2023-08-06 · rechute |
| Usages et comportements | Cannabis | 2026-02-15 → 2026-02-15 (exact) | rechute | trouvé | Cannabis · 2026-02-15 · rechute ⚠ fin compatible |
| Usages et comportements | Cannabinoïdes de synthèse | 2019-09 → 2020-02 (month) | usage | trouvé | Cannabinoïdes de synthèse · 2019-09 → 2020-02 · usage |
| Usages et comportements | Tabac | 2015 → 2025-04-15 (approx) | usage | trouvé | Tabac · 2015 → · usage ⚠ fin compatible, « en cours » juste |
| Usages et comportements | Alcool | 2016 (approx) | usage | trouvé | Alcool · 2016 → · usage ⚠ « en cours » juste |
| Usages et comportements | Protoxyde d'azote | 2019-09 → 2020 (approx) | usage | trouvé | Protoxyde d'azote · 2019-09 · usage ⚠ fin compatible |
| Usages et comportements | Protoxyde d'azote | 2021-05 → 2021-09-05 (month) | usage | trouvé | Protoxyde d'azote · 2021-05 → 2021-09-05 · usage |
| Usages et comportements | Protoxyde d'azote | 2022-06 → 2023-03 (approx) | usage | trouvé | Protoxyde d'azote · 2022 → 2023-03 · usage |
| Usages et comportements | Kétamine | 2022-06 → 2023-03 (approx) | usage | trouvé | Kétamine · 2022 → 2023-03 · usage |
| Médicaments | Hydroxyzine | 2020-04-21 → 2020-08 (month) |  | trouvé | Hydroxyzine · 2020-04-21 → 2020-08 |
| Médicaments | Diazépam | 2020-08-24 → 2020-09 (approx) |  | trouvé | Diazépam · 2020-08-24 → 2020-09 |
| Médicaments | Rispéridone | 2020-08 → 2020-11-10 (month) |  | trouvé | Rispéridone · 2020-08-24 → 2020-11-10 |
| Médicaments | Aripiprazole | 2020-11-10 → 2021-03-29 (exact) |  | trouvé | Aripiprazole oral · 2020-11-10 → 2021-03 |
| Médicaments | Aripiprazole LP | 2021-03-15 → 2022-05-16 (exact) |  | trouvé | Aripiprazole LP · 2021-03 → 2022-05 |
| Médicaments | Cyanocobalamine | 2021-09-07 → 2021-11 (month) |  | trouvé | Cyanocobalamine IM · 2021-09 → 2021-11 |
| Médicaments | Loxapine | 2022-10 → 2022-12 (approx) |  | trouvé | Loxapine · 2022-10-28 → 2022-12 |
| Médicaments | Palipéridone LP | 2022-11-04 → (exact) |  | trouvé | Palipéridone · 2022-11-04 → |
| Médicaments | Sertraline | 2023-03-14 → 2024-03 (month) |  | trouvé | Sertraline · 2023-03 → 2024-03-12 |
| Médicaments | Hydroxyzine | 2026-02-24 → 2026-03 (approx) |  | trouvé | Hydroxyzine · 2026-02-24 → 2026-03-10 |
| Psychopathologie | Scarifications | 2013 → 2013 (approx) |  | trouvé | Scarifications · 2013 → 2014 |
| Psychopathologie | Prodromes psychotiques | 2018 → 2019 (approx) |  | trouvé | Prodromes psychotiques · 2018 → 2019 |
| Psychopathologie | Anxiété et idées de référence sous cannabis | 2019 → 2020-07 (approx) |  | trouvé | Anxiete massive et idees de reference · 2019-09 → 2020-02 |
| Psychopathologie | Premier épisode psychotique | 2020-06 → 2020-10 (approx) |  | trouvé | Premier épisode psychotique · 2020-07 → 2020-10-06 |
| Psychopathologie | Schizophrénie paranoïde | 2020-06 → (approx) |  | mal daté | Schizophrenie paranoide · 2022-12-20 → |
| Psychopathologie | Rechute psychotique | 2022-09 → 2022-12 (month) |  | trouvé | Rechute psychotique · 2022-09 → 2022-12-20 |
| Psychopathologie | Épisode dépressif caractérisé post-psychotique | 2023-02 → 2023-10 (approx) |  | trouvé | Épisode dépressif caractérisé post-psychotique · 2023-02 → 2024-03 |
| Somatique | Fracture de la clavicule gauche (accident de scooter sous cannabis) | 2018 → 2018 (approx) |  | trouvé | Fracture de la clavicule · 2018 → 2018 |
| Somatique | Effets indésirables de la rispéridone | 2020-09 → 2021-01 (approx) |  | trouvé | Effets indesirables de la rispéridone (prise de poids, hyperprolactinemie, dysfonction erectile) · 2020-08 → 2020-11 |
| Somatique | Neuropathie au protoxyde d'azote (carence en B12) | 2021-08 → 2021-11 (month) |  | trouvé | Neuropathie liée au protoxyde d'azote · 2021-08 → 2021 |
| Prises en charge | Suivi addictologique (CSAPA) | 2020-03-02 → (exact) |  | trouvé | Suivi CSAPA · 2020-03-02 → |
| Prises en charge | Hospitalisation en psychiatrie (SDT), pavillon Les Iris | 2020-08-24 → 2020-10-06 (exact) |  | trouvé | Hospitalisation en soins à la demande d'un tiers · 2020-08-24 → 2020-10-06 |
| Prises en charge | Programme de soins | 2020-10-06 → 2021-02-05 (exact) |  | trouvé | Programme de soins · 2020-10-06 → 2021-02-05 |
| Prises en charge | Suivi CMP | 2020-10-20 → (exact) |  | trouvé | Suivi CMP · 2020-10-20 → |
| Prises en charge | Accompagnement social | 2020-11-17 (exact) |  | trouvé | Suivi social · 2020-11-17 → ⚠ « en cours » juste |
| Prises en charge | Psychothérapie | 2021-02-23 → (exact) |  | trouvé | Psychothérapie avec la psychologue · 2021-02-23 → |
| Prises en charge | Consultation neurologique (EMG) | 2021-09-20 → 2021-09-20 (exact) |  | trouvé | Consultation neurologique (EMG) · 2021-09-20 → 2021-09-20 |
| Prises en charge | Accompagnement éducatif | 2022-03-15 → (exact) |  | trouvé | Suivi éducatif · 2022-03-15 → |
| Prises en charge | Hospitalisation en psychiatrie (SPI), pavillon Les Iris | 2022-10-28 → 2022-12-20 (exact) |  | trouvé | Hospitalisation en soins pour peril imminent (pavillon) · 2022-10-28 → 2022-12-20 |
| Prises en charge | Accompagnement budgétaire | 2023-05 → 2024-09 (approx) |  | trouvé | Accompagnement budgétaire · 2023-05 → 2024-09 |
| Prises en charge | Bilan psychologique | 2023-06-06 → 2023-06-27 (exact) |  | trouvé | Bilan psychologique · 2023-06-06 → 2023-06-27 |
| Prises en charge | Psychoéducation au CMP | 2023-09-19 → 2023-12 (month) |  | trouvé | Psychoéducation du CMP · 2023-09-19 → 2023-12 |
| Prises en charge | Groupe d'entraide mutuelle (GEM) | 2024-04 → (month) |  | trouvé | GEM · 2024-04 → |
| Événements de vie | Harcèlement scolaire | 2012 → 2014 (approx) |  | trouvé | Harcelement scolaire au college · 2012 → 2014 |
| Événements de vie | Saison de cueillette | 2018 → 2018 (year) |  | trouvé | Cueillette de myrtilles · 2018 ⚠ fin compatible |
| Événements de vie | Baccalauréat STMG | 2019-06 → 2019-06 (month) |  | trouvé | Bac de justesse · 2019-06 → 2019 |
| Événements de vie | Licence STAPS (abandon) | 2019-09 → 2020-01 (month) |  | trouvé | Études à la fac · 2019-09 → 2020-09 ⚠ fin compatible |
| Événements de vie | Studio étudiant à Bordeaux | 2019-09 → 2020-06 (month) |  | trouvé | Studio à Bordeaux · 2019-09 → 2020-06 |
| Événements de vie | Garde à vue pour revente de cannabis | 2019-11 → 2019-11 (month) |  | trouvé | Garde à vue pour revente · 2019-11 → 2019-11 |
| Événements de vie | Composition pénale (stage de sensibilisation aux dangers des stupéfiants) | 2020-02 → 2020-02 (month) |  | trouvé | Composition penale : stage de sensibilisation et amende · 2020-02 → 2020-02 |
| Événements de vie | Hébergé chez ses parents (Cestas) | 2020-03-16 → 2025-09-01 (exact) |  | trouvé | Retour chez les parents à Cestas · 2020-03-16 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Service civique (médiathèque de Cestas) | 2021-10-04 → 2022-04-30 (exact) |  | trouvé | Service civique a la mediatheque · 2021-10-04 → 2022-04-30 |
| Événements de vie | Violence envers son père | 2022-10-27 → 2022-10-27 (exact) |  | mal daté | Conflits avec le père · 2022-01 |
| Événements de vie | Curatelle demandée par les parents | 2022-12-06 → 2023-10-10 (exact) |  | trouvé | Curatelle demandée par les parents · 2022 → 2023-10 |
| Événements de vie | AAH | 2023-09 (month) |  | trouvé | AAH · 2023-09 → ⚠ « en cours » juste |
| Événements de vie | Stage découverte chez un paysagiste | 2024-04 → 2024-04 (month) |  | trouvé | Stage découverte en espaces verts · 2024-04 → 2024-04 |
| Événements de vie | RQTH | 2024-07 (month) |  | trouvé | RQTH · 2024-07 → 2024-07 ⚠ fin compatible |
| Événements de vie | CAPa jardinier-paysagiste en alternance | 2024-09-02 → 2026-08-31 (exact) |  | trouvé | CAPa jardinier-paysagiste en alternance · 2024-09-02 → 2026-08-31 |
| Événements de vie | Couple avec Naïs | 2025-02 → 2026-02-14 (month) |  | trouvé | Relation de couple · 2025-02 → 2026-02-14 |
| Événements de vie | Studio à Pessac | 2025-09-01 → (exact) |  | trouvé | Logement autonome à Pessac · 2025-09-01 → |
| Événements de vie | Permis de conduire | 2025-10-06 → 2025-10-06 (exact) |  | trouvé | Permis B obtenu · 2025-10-06 → 2025-10-06 |
| Événements de vie | Diplôme du CAPa | 2026-07-03 → 2026-07-03 (exact) |  | trouvé | Diplôme CAPa obtenu · 2026-07-03 ⚠ fin compatible |
| Événements de vie | Emploi : ouvrier paysagiste (CDD de 6 mois) | 2026-09-01 → (exact) |  | trouvé | CDD ouvrier paysagiste · 2026-09-01 → |

En plus (passage `regroupe2`), à relire : vrai mais absent de la vérité, ou erreur.

- Usages et comportements · **Jeux vidéo** · 2020-03-09 → · usage — Plusieurs heures par jour ("c'est ce que je fais quand je fume") ; nuits sur des jeux en ligne pendant et après le confinement
- Psychopathologie · **Anxiété, sommeil décalé et isolement** · 2019-09 → — Depuis quelques mois avant l'entrée : anxiété, endormissement vers 5h, isolement, ne voit plus ses amis ; thymie plate puis aboulie, ennui
- Psychopathologie · **Idées de référence et méfiance** · 2020-03 → 2020-08-24 — Impression qu'on le regarde dans le tram, critiquée ; émoussement affectif ; puis méfiance ("les voisins savent des trucs"), à surveiller
- Psychopathologie · **Attaque de panique** · 2017-06 → 2017 — Tachycardie, sensation de mort imminente, déréalisation ; passage aux urgences pédiatriques à 16 ans, non suivi
- Somatique · **Perte de poids** · 2019-09 → 2020-03 — Perte de 4 kg depuis septembre selon la mère, appétit irrégulier
- Somatique · **Akathisie probable** · 2020-09-22 — Raideur et agitation des jambes sous rispéridone 6 mg
- Somatique · **Prise de poids sous antipsychotique** · 2020-10 → 2021-01 — 64 kg à 72 puis 74 kg ; stable en janvier
- Somatique · **Dysfonction érectile et hyperprolactinémie** · 2020-10 → 2021-01 — Prolactine 68 ng/mL en novembre, 18 sous aripiprazole en janvier
- Médicaments · **Aripiprazole LP** · 2021-03-15 → 2022-01-10 — 400 mg, première injection au CMP, injections mensuelles
- Prises en charge · **Passage aux urgences pédiatriques** · 2017-06 — Surveillance de 4h, conseil de consultation non suivi
- Événements de vie · **Naissance à Arcachon** · 2001 — Enfance à Cestas, père technicien aéronautique, mère secrétaire médicale, une sœur plus jeune
- Événements de vie · **Arrêt du football en club** · 2017 → 2018 — Football en club arrêté en première
- Événements de vie · **Conflits avec le père** · 2020-03 → 2020-10 — Relations tendues, disputes pendant le confinement, "en pause" en octobre
- Événements de vie · **Menace d'un voisin avec un couteau** · 2020-08-24 — Conduit aux urgences par les pompiers
- Événements de vie · **Inscription à la mission locale de Cestas** · 2020-11-17 — Acceptée "pour plus tard"
- Usages et comportements · **Cannabis** · 2014 → 2022-10-28 · usage — Premier joint a 13 ans en 4e (skatepark), occasionnel au college, quotidien des 16 ans (resine), cannabis au lycee 'pour tenir en classe' ; trouble de l'usage severe ; aucun depuis le 28/10/2022
- Usages et comportements · **Cannabis** · 2019 → 2020-03 · usage — Herbe tres dosee a partir de la fac (2019), jusqu'a 10 joints/j a l'entree au CSAPA
- Usages et comportements · **Cannabis** · 2021-04 → 2022-05 · usage — 1-2 joints le soir, parfois 2/j ; refuse l'arret total ; objectif de reduction
- Usages et comportements · **Alcool** · 2022-01-18 → 2022-01-18 · usage — Alcool festif
- Usages et comportements · **Alcool** · 2022-04-12 → 2022-04-12 · intoxication — Soiree d'anniversaire, ivresse sans consequence
- Usages et comportements · **Alcool** · 2022-06 → 2022-10 · usage — Dit ne prendre en free party 'que de l'alcool et du shit'
- Usages et comportements · **Substances non precisees (free party)** · 2022-06 → 2022-10 · usage — 'Des trucs en free party' selon la mere, sans precision ; ketamine non recherchee
- Usages et comportements · **Tabac** · 2021-06 → · usage — 20 cig/j en juin 2021, 18 en novembre 2021, 25 en juillet 2022, 20 en janvier 2023 ; arret propose, pas pret
- Psychopathologie · **Harcelement scolaire (impact)** · 2012 → 2014 — Harcelement en 6e-5e par un groupe de garcons : surnoms, bousculades, sac jete dans les toilettes, video diffusee en 5e ; jamais dit aux parents
- Psychopathologie · **Impression qu'on parlait de lui dans son dos** · 2016 → 2018 — Au lycee, relie lui-meme aux moqueries du college ; 'arrete de penser au college' en seconde
- Événements de vie · **Revente de cannabis aux amis de la promo** · 2019-11 → 2019-11 — Pour payer sa consommation
- Prises en charge · **Bilan social** · 2020-11 → 2020-11 — Bilan social fait en novembre 2020
- Médicaments · **Aripiprazole LP** · 2022-01-10 → 2022-05-16 — Mensuel (CMP) ; derniere injection le 16/05/2022 ; demande d'arret ('je suis gueri'), injection du 13/06 manquee
- Somatique · **Prise de poids sous antipsychotique** · 2021-11 — 77 kg en novembre 2021, 78 kg en janvier 2022, 79 kg en avril 2022 ; fatigue diurne
- Événements de vie · **Isolement social, ennui** · 2021-05 — Plus d'amis 'a part ceux qui fument', s'ennuie a Cestas
- Psychopathologie · **Honte et crainte de la maladie** · 2020-08 → 2021-05 — Honte autour de l'episode de l'ete ; pense que 'c'etait la beuh'
- Psychopathologie · **Symptômes négatifs** · 2021-11 → — Se plaint de 'ne plus rien ressentir' ; retrait social ; persistants entre les episodes selon le CR hospitalier
- Prises en charge · **Absence aux rendez-vous CSAPA** · 2022-06 → 2022-09-20 — RDV de juin, juillet, 26/07, 30/08 et 20/09 non honores
- Médicaments · **Aripiprazole oral 10 mg (propose)** · 2022-07-05 → 2022-07-05 — Ordonnance remise, observance incertaine ; selon la mere jamais pris
- Événements de vie · **Difficultes financieres et sans ressources** · 2022-04 → — Sans ressources depuis la fin du service civique ; dettes (forfait telephone ~400 euros, decouvert, emprunt a sa soeur) ; demande de curatelle des parents refusee par le patient ; pistes MDPH, CSS
- Événements de vie · **Hebergement chez les parents** · 2022-12-06 → — Heberge chez ses parents ; contrat ecrit avec le pere apres la sortie (pas de cannabis, traitement, horaires) ; foyer jeunes travailleurs et residence accueil evoques
- Prises en charge · **Entretien social** · 2022-12-06 → 2022-12-06 — Avec les parents puis le patient par telephone ; MDPH, complementaire sante solidaire
- Prises en charge · **Mission locale** · 2022-05 → 2022-05 — Inscription reactivee, RDV pris
- Événements de vie · **Suppression des reseaux sociaux** · 2022-12 — Pour 'couper avec l'organisation'
- Psychopathologie · **Premier épisode psychotique** · 2020 → 2020 — Hospitalisation sous contrainte en septembre 2020, diagnostic initial de trouble psychotique induit
- Psychopathologie · **Trouble psychotique induit (diagnostic initial)** · 2020 → 2023-02 — Diagnostic retenu en 2020, jugé plus pertinent en février 2023, encore présent dans le dossier social et MDPH
- Psychopathologie · **Schizophrenie paranoide** · 2023-02 → — Diagnostic retenu en février 2023 (prodromes, antécédent familial, symptômes négatifs)
- Psychopathologie · **Voix et méfiance** · 2023-05 → 2023-08 — Voix le soir depuis fin mai, recrudescence pendant la rechute de cannabis, moins présentes après l'arrêt; ensuite voix résiduelles rares
- Psychopathologie · **Troubles cognitifs** · 2023-06 → 2023-06 — Bilan psychologique : ralentissement, mémoire de travail abaissée, planification fragile, anhédonie sociale
- Événements de vie · **Accident de scooter sous cannabis** · 2018 → 2018 — À 17 ans, chute seule en rentrant d'une soirée 'défoncé', fracture de la clavicule gauche, caché aux parents
- Usages et comportements · **Cannabis** · 2022-10 → 2023-07 · craving — TUC sévère abstinent depuis octobre 2022, craving modéré le soir en mars 2023
- Usages et comportements · **Cannabis** · 2023-08-06 → — Abstinence depuis le 06/08/2023, urines négatives, pensées sans passage à l'acte en 2024
- Usages et comportements · **Alcool** · 2023-08 → · usage — 2-3 bières en festival, puis quelques bières le samedi, pas d'alcool fort
- Usages et comportements · **Tabac** · 2023-03 → 2025-04-15 · usage — 20 cigarettes/j, tabacologie refusée en janvier 2024, arrêt le 15/04/2025
- Usages et comportements · **Vapotage nicotinique** · 2025-04-15 → · usage — Passage à la vapoteuse 12 mg/mL, plus aucune cigarette, CO 3 ppm
- Somatique · **Prise de poids** · 2023-11 → — 82 kg, tour de taille 98 cm, glycémie à jeun 0,98; 84 kg en 2024-2025, bilan métabolique prévu
- Médicaments · **Aripiprazole** · 2020 → 2022-05 — Oral puis LP 400 puis 300 mg, arrêté par le patient en mai 2022
- Prises en charge · **Entretien familial** · 2023-02-07 → 2023-02-07 — Entretien avec les deux parents, orientation vers le programme pour les familles du CMP
- Prises en charge · **Programme pour les familles du CMP** · 2023 — Les parents ont suivi le programme en 2023
- Prises en charge · **Psychothérapie avec la psychologue** · 2023-04 → — Reprise après l'hospitalisation, honte, image de soi; séances mensuelles depuis mars 2025
- Prises en charge · **Suivi éducatif** · 2023-05 — Reprise du suivi par l'éducateur spécialisé, projet d'insertion
- Prises en charge · **Plan de prévention de la rechute** · 2025-01 → 2025-01 — Écrit et partagé avec le CMP
- Événements de vie · **Dossier MDPH et complémentaire santé solidaire** · 2023-03-28 → 2023-03-28 — Dossier MDPH déposé, complémentaire santé solidaire accordée
- Événements de vie · **Hébergé chez ses parents** · 2024-09 → — Toujours hébergé chez ses parents, envisage un logement autonome
- Événements de vie · **Inscription à l'auto-école** · 2025-05 → 2025-05 — Projet de permis de conduire
- Usages et comportements · **Cannabis** · 2017 → 2023-08 · usage — Cannabis quotidien dès 16 ans ; TUC sévère ; dernier usage en août 2023
- Usages et comportements · **Kétamine** · 2022-10 → 2022-10 · rechute — Reprise massive avec le cannabis avant la rechute
- Psychopathologie · **Symptômes négatifs** · 2023 — Plus marqués en 2023, nettement moindres en 2026
- Usages et comportements · **Tabac** · 2025-04 · sevrage — Arrêt du tabac en avril 2025
- Médicaments · **Palipéridone** · 2025-07-01 → — Traitement en cours dès la première observation de cette période (début antérieur non précisé) ; injections 01/07, 30/09/2025, 29/09/2026 au CMP
- Événements de vie · **Rupture avec [PERSONNE_1]** · 2026-02-14 — Le jour de son anniversaire
- Psychopathologie · **Détresse réactionnelle à la rupture** · 2026-02-14 → 2026-03-17 — Tristesse, ruminations, sommeil perturbé, pas d'idée suicidaire ; amélioration en mars
- Événements de vie · **Achat d'une voiture d'occasion** · 2025-10 — Avec l'aide de son père
- Événements de vie · **RQTH** · 2025-07 → — Mentionnée ; discussion sur son usage en emploi
- Prises en charge · **Mission locale (emploi)** · 2025-06 — Relais pour l'emploi après le CAPa
- Prises en charge · **Suivi éducatif** · 2026-09-15 → — Fin prévue de l'accompagnement si le CDD se passe bien
- Prises en charge · **Suivi CMP** · 2025-07 → — Suivi de la schizophrénie, injections au CMP
- Somatique · **LDL élevé** · 2025-02 → — LDL 1,48 en février 2025, 1,62 en décembre 2025 ; mesures hygiéno-diététiques
- Psychopathologie · **Fatigue matinale et ralentissement** · 2025-11-18 → — Possible effet du traitement

### `cocaine-cadre`

Statut au passage `regroupe2`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Usages et comportements | Cocaïne | 2004 → 2014 (approx) | usage | trouvé | Cocaïne · 2004 → 2014 · usage |
| Usages et comportements | Cocaïne | 2014 → 2021-01-28 (approx) | usage | trouvé | Cocaïne · 2014 → 2021-01-28 · usage |
| Usages et comportements | Cocaïne | 2015 → 2016 (year) | sevrage | trouvé | Cocaïne · 2015 → 2016 · sevrage |
| Usages et comportements | Cocaïne | 2016 (approx) | rechute | trouvé | Cocaïne · 2014 → 2023-04 · usage ⚠ fin compatible, mode d'usage juste, au moins une source attendue |
| Usages et comportements | Cocaïne fumée (base) | 2019-03 → 2019-06 (approx) | usage | trouvé | Cocaïne fumée (base) · 2019-03 → 2019-06 · usage |
| Usages et comportements | Cocaïne | 2021-01-28 (exact) | sevrage | trouvé | Cocaïne · 2021-01-28 → 2021-08-15 · sevrage ⚠ fin compatible |
| Usages et comportements | Cocaïne | 2021-08 → 2022-04 (approx) | rechute | trouvé | Cocaïne · 2021-08-15 → 2022-04 · rechute |
| Usages et comportements | Cocaïne | 2022-04 → 2022-12-10 (month) | rechute | trouvé | Cocaïne · 2022-04 → 2022-12-10 · rechute |
| Usages et comportements | Cocaïne | 2023-01 → 2023-04-08 (month) | rechute | trouvé | Cocaïne · 2023-01 → 2023-04-09 · rechute |
| Usages et comportements | Cocaïne | 2023-04-08 (exact) | intoxication | trouvé | Cocaïne · 2023-04-08 · intoxication |
| Usages et comportements | Cocaïne | 2024-12-21 (exact) | rechute | trouvé | Cocaïne · 2024-12-21 · rechute |
| Usages et comportements | Alcool | 1994 → 2018 (approx) | usage | trouvé | Alcool · 1994 · intoxication ⚠ fin compatible, mode d'usage juste |
| Usages et comportements | Alcool | 2018 → 2021-01 (approx) | usage | trouvé | Alcool · 2018 → 2021-01 · usage |
| Usages et comportements | Alcool | 2021-01 → 2022-04 (approx) | usage | trouvé | Alcool · 2021-02 → 2021-08 · usage |
| Usages et comportements | Alcool | 2022-04 → 2023-04-11 (month) | usage | trouvé | Alcool · 2022-04 → · rechute ⚠ fin compatible, « en cours » juste, mode d'usage juste |
| Usages et comportements | Alcool | 2023-04-08 (exact) | intoxication | trouvé | Alcool · 2023-04-08 · intoxication |
| Usages et comportements | Alcool | 2023-04-11 → 2023-04-21 (exact) | sevrage | trouvé | Alcool · 2023-04-11 → 2023-04-21 · sevrage |
| Usages et comportements | Alcool | 2023-05 → 2025-02 (approx) | usage | trouvé | Alcool · 2023-04 → 2025-02 · usage |
| Usages et comportements | Alcool | 2025-02 → 2025-05 (month) | usage | trouvé | Alcool · 2025-02 → · usage ⚠ fin compatible, « en cours » juste |
| Usages et comportements | Alcool | 2025-05 → (approx) | usage | trouvé | Alcool · 2025-02 → · rechute ⚠ mode d'usage juste |
| Usages et comportements | Alcool | 2026-07-20 (approx) | intoxication | trouvé | Alcool · 2026-07-20 · usage ⚠ mode d'usage juste |
| Usages et comportements | Tabac | 1995 → 2023-04 (approx) | usage | trouvé | Tabac · 1995 → 2026-02-20 · usage ⚠ fin compatible |
| Usages et comportements | Tabac | 2023-04 → 2026-01-20 (month) | usage | trouvé | Tabac · 2023-04-09 → · usage ⚠ fin compatible, « en cours » juste |
| Usages et comportements | Tabac | 2026-01-20 → 2026-01-22 (approx) | sevrage | manqué |  |
| Usages et comportements | Tabac | 2026-01-22 → 2026-02-20 (exact) | rechute | trouvé | Tabac · 2026-01-22 → 2026-01-22 · rechute ⚠ fin compatible |
| Usages et comportements | Tabac | 2026-02-20 (exact) | sevrage | trouvé | Tabac · 2026-02-20 → · sevrage ⚠ « en cours » juste |
| Usages et comportements | Cannabis | 1995 → 1999 (approx) | usage | mal daté | Cannabis · 1991 → 1999 · usage |
| Usages et comportements | Jeu (paris sportifs en ligne) | 2017 → 2020-03 (year) | usage | manqué |  |
| Usages et comportements | Jeu (paris sportifs en ligne) | 2020-03 → 2023-01 (approx) | usage | manqué |  |
| Usages et comportements | Jeu (paris sportifs en ligne) | 2025-11 (month) | rechute | manqué |  |
| Psychopathologie | Épisode dépressif | 2016 (year) |  | trouvé | Épisode dépressif réactionnel · 2016 → 2016 ⚠ fin compatible |
| Psychopathologie | Épisode dépressif caractérisé | 2023-01 → 2023-11 (month) |  | trouvé | Épisode dépressif caractérisé · 2023-01 → 2023-11 |
| Psychopathologie | Crise suicidaire | 2023-04-08 → 2023-04-10 (exact) |  | trouvé | Crise suicidaire · 2023-04 → 2023-04 ⚠ au moins une source attendue |
| Psychopathologie | TDAH de l'adulte, présentation combinée | 2024-01-09 → (exact) |  | trouvé | TDAH · 2024-01-09 → |
| Somatique | Appendicectomie | 1991 (approx) |  | trouvé | Appendicectomie · 1991 |
| Somatique | Douleur thoracique sous cocaïne | 2017 (year) |  | trouvé | Douleur thoracique sous cocaïne · 2017 |
| Somatique | Perforation de la cloison nasale | 2022-04 → 2023 (approx) |  | trouvé | Perforation de la cloison nasale · 2022-06-20 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Paroxétine | 2016 (year) |  | trouvé | Paroxétine · 2016 → 2016 ⚠ fin compatible |
| Médicaments | Escitalopram | 2023-03-07 → 2023-03 (exact) |  | trouvé | Escitalopram · 2023-03-07 → 2023-03-25 |
| Médicaments | Escitalopram | 2023-04-18 → 2025-03 (exact) |  | trouvé | Escitalopram · 2023-04-18 → 2025-03 |
| Médicaments | Oxazépam | 2023-04-09 → 2023-04-21 (exact) |  | trouvé | Oxazépam · 2023-04-09 → 2023-04-21 |
| Médicaments | Substituts nicotiniques | 2023-04 → 2023-06 (month) |  | trouvé | Substitut nicotinique (patch) · 2023-04 → 2023 |
| Médicaments | Méthylphénidate LP | 2024-03-05 → (exact) |  | trouvé | Méthylphénidate LP · 2024-03-05 → |
| Médicaments | Naltrexone | 2025-03-25 → 2025-08 (exact) |  | mal daté | Naltrexone · 2025-02 → 2025-08 |
| Médicaments | Varénicline | 2026-01-13 → 2026-01 (exact) |  | trouvé | Varénicline · 2026-01-13 → 2026-01-17 |
| Médicaments | Varénicline | 2026-02-17 → 2026-04 (approx) |  | trouvé | Varénicline · 2026-02-17 → 2026-04 |
| Prises en charge | Suivi addictologique libéral (Dr ESTRABAUD) | 2015 (year) |  | trouvé | Suivi addictologique libéral · 2015 → 2015 ⚠ fin compatible |
| Prises en charge | Suivi addictologique (CSAPA) | 2021-01-12 → (exact) |  | mal daté | Suivi CSAPA · 2021-01-18 → |
| Prises en charge | Psychothérapie | 2021-02-16 → (exact) |  | trouvé | Suivi psychologique · 2021-02-16 → |
| Prises en charge | Groupe de prévention de la rechute | 2022-01 → 2022-06 (month) |  | trouvé | Groupe de prévention de la rechute · 2022-01-18 → 2022-06-14 |
| Prises en charge | Accompagnement social (dettes, surendettement) | 2023-01-31 → 2026-06-23 (exact) |  | trouvé | Suivi social · 2023-01-31 → 2026-06-23 |
| Prises en charge | Passage aux urgences (UHCD) | 2023-04-09 → 2023-04-10 (exact) |  | trouvé | Passage aux urgences (UHCD) · 2023-04-09 → 2023-04-10 |
| Prises en charge | Hospitalisation en addictologie | 2023-04-11 → 2023-04-27 (exact) |  | trouvé | Hospitalisation en addictologie · 2023-04-11 → 2023-04-27 |
| Prises en charge | Interdiction volontaire de jeux (ANJ) | 2023-05-02 → (exact) |  | manqué |  |
| Prises en charge | Thérapie de couple (libéral) | 2023-09 (month) |  | trouvé | Thérapie de couple · 2023-09 → ⚠ « en cours » juste |
| Prises en charge | Consultation de tabacologie | 2026-01-13 (exact) |  | trouvé | Consultations de tabacologie IDE · 2026-01-13 → ⚠ « en cours » juste |
| Événements de vie | Séparation des parents | 1993 (approx) |  | trouvé | Séparation des parents · 1993 |
| Événements de vie | Jeu pathologique du père, saisie de la maison familiale | 1993 (approx) |  | mal daté | Père joueur pathologique · 1985 → 1990 |
| Événements de vie | Redoublement de la 5e | 1992 (approx) |  | trouvé | Redoublement de la 5e · 1991 → 1996 ⚠ fin compatible |
| Événements de vie | Exclusion temporaire du collège | 1993 (approx) |  | manqué |  |
| Événements de vie | Entrée chez Médivia (matériel médical) | 2006 (year) |  | manqué |  |
| Événements de vie | Mariage | 2009 (year) |  | trouvé | Mariage · 2009 → 2009 ⚠ fin compatible |
| Événements de vie | Naissance de Victor | 2011 (approx) |  | trouvé | Naissance du premier enfant · 2011 → 2011 ⚠ fin compatible |
| Événements de vie | Naissance de Capucine | 2014 (approx) |  | trouvé | Naissance du second enfant · 2014 → 2014 ⚠ fin compatible |
| Événements de vie | Promotion cadre (responsable grands comptes) | 2014 (approx) |  | trouvé | Promotion comme cadre · 2014 → 2014 ⚠ fin compatible |
| Événements de vie | Crédits renouvelables cachés | 2019 (year) |  | manqué |  |
| Événements de vie | Accident de voiture sous cocaïne | 2020-11 (month) |  | trouvé | Accident de voiture sous cocaïne · 2020-11 |
| Événements de vie | Avertissement professionnel | 2020-12 (month) |  | trouvé | Avertissement de l'employeur · 2020-12 → 2020-12 ⚠ fin compatible |
| Événements de vie | Ultimatum de l'épouse | 2020-12 (month) |  | trouvé | Ultimatum de l'épouse · 2020-12 → 2020-12 ⚠ fin compatible |
| Événements de vie | Entretien préalable à licenciement | 2022-09-29 (exact) |  | manqué |  |
| Événements de vie | Arrêt de travail | 2022-10-04 → 2022-10 (exact) |  | trouvé | Arrêt de travail · 2022-10-04 → 2022-10-19 |
| Événements de vie | Licenciement | 2022-11-21 (exact) |  | trouvé | Licenciement · 2022-11-21 |
| Événements de vie | Chômage (ARE) | 2022-11 → 2025-09-01 (approx) |  | trouvé | Chômage · 2022-11-21 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Suspension du permis de conduire | 2022-12-10 → 2023-07 (exact) |  | trouvé | Suspension du permis de conduire · 2022-12-10 → 2023-07 |
| Événements de vie | Découverte du jeu et des dettes par l'épouse | 2023-01 (month) |  | trouvé | Révélation du jeu par l'épouse · 2023-01 → 2023-01 ⚠ fin compatible, au moins une source attendue |
| Événements de vie | Séparation du couple | 2023-01-20 → 2024-01-06 (exact) |  | trouvé | Séparation conjugale · 2023-01-20 → 2024-01-06 |
| Événements de vie | Hébergement chez sa sœur | 2023-01-20 → 2023-03-01 (exact) |  | trouvé | Hébergement chez sa sœur · 2023-01-20 → 2023-03-01 |
| Événements de vie | Studio à Mérignac | 2023-03-01 → 2024-01-06 (exact) |  | trouvé | Logement en studio · 2023-03-01 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Dossier de surendettement | 2023-06-08 → 2024-03 (exact) |  | trouvé | Surendettement · 2023-06-08 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Reprise de la vie commune | 2024-01-06 (exact) |  | manqué |  |
| Événements de vie | Plan de surendettement (mesures imposées) | 2024-03 → (month) |  | manqué |  |
| Événements de vie | Formation de remise à niveau en gestion commerciale | 2024-04 (approx) |  | trouvé | Formation de remise à niveau en gestion commerciale · 2024-04 → ⚠ « en cours » juste |
| Événements de vie | Nouvel emploi | 2025-09-01 → (exact) |  | trouvé | Emploi de commercial sédentaire (CDI) · 2025-09-01 → |
| Événements de vie | Cancer du poumon de son père | 2026-03 (approx) |  | autre piste | Père : cancer du poumon métastatique · 2026-02 → 2026-07-16 |
| Événements de vie | Décès de son père | 2026-07-16 (exact) |  | trouvé | Décès du père · 2026-07-16 |

En plus (passage `regroupe2`), à relire : vrai mais absent de la vérité, ou erreur.

- Usages et comportements · **Cocaïne** · 2021-02 → 2021-03 · craving — Craving important le soir et en voiture, en diminution en mars (jeudi soir)
- Usages et comportements · **Cocaïne** · 2022-03 → 2022-03 · craving — Pensée d'une « petite trace » avant une réunion, sans passage à l'acte
- Usages et comportements · **Alcool** · 2021-08 → 2022-04 · intoxication — Binge les soirs de cocaïne (jusqu'à 8-10 verres), sinon 1-2 verres
- Usages et comportements · **Jeux d'argent** · 2021-01 → 2021-01 · usage — « Je ne joue pas, à part un loto de temps en temps »
- Usages et comportements · **Jeux d'argent** · 2022-02 · usage — Pronostics entre collègues, jeu non exploré en détail ; se ferme quand il est question de dettes en groupe
- Usages et comportements · **Écrans** · 2022-02 → · usage — Beaucoup de temps sur son téléphone le soir (matchs, résultats, vidéos) pour combler un sentiment de vide
- Psychopathologie · **Difficultés d'attention et impulsivité (TDAH à évaluer)** · 1985 → — Hyperactivité, impulsivité, besoin de remplir chaque minute déjà enfant, concentration difficile « depuis toujours » masquée par la cocaïne ; pas d'évaluation formelle
- Psychopathologie · **Coups de mou et descentes tristes** · 2021-01-18 → — Périodes de « coup de mou » et descentes tristes après les week-ends de consommation ; thymie stable, pas d'idées suicidaires
- Somatique · **Troubles du sommeil** · 2021-01 → — Sommeil de 3 à 5 heures par nuit, perturbé au sevrage puis 6 h en mars, de nouveau 4-5 h
- Somatique · **Tension artérielle élevée** · 2021-01 → — TA 142/88 à l'entrée, 138/86 en septembre 2021, 136/84 en février 2022
- Somatique · **Épistaxis et croûtes nasales** · 2022-04 → — Épistaxis répétées depuis quelques semaines, consultation ORL demandée
- Prises en charge · **Bilan biologique, ECG et urines** · 2021-01-26 → 2021-01-26 — Prise de sang, ECG, urines positives à la cocaïne, AUDIT 17
- Prises en charge · **Consultation ORL demandée** · 2022-05 → 2022-05 — Consultation ORL demandée pour les épistaxis ; arrêt de travail proposé et refusé
- Événements de vie · **Scolarité (bac puis BTS commercial)** · 1991 → 1996 — Scolarité correcte, bac puis BTS commercial
- Événements de vie · **Emploi : entrée dans l'entreprise actuelle** · 2006 → 2006 — Commercial dans plusieurs entreprises puis entrée en 2006 dans l'entreprise actuelle
- Événements de vie · **Remarque du manager devant l'équipe** · 2021-06 → 2021-06 — Trimestre « raté », remarque du manager devant l'équipe, effondrement
- Événements de vie · **Révélation de la rechute à l'épouse** · 2021-10 → 2021-10 — Informe son épouse de la rechute de l'été, qui reste
- Événements de vie · **Reprise de la course à pied** · 2021-03 — Course à pied deux fois par semaine « pour remplacer »
- Événements de vie · **Réorganisation de l'entreprise** · 2022-03 → — Réorganisation annoncée, nouveau directeur régional, peur d'être mis au placard
- Usages et comportements · **Cocaïne** · 2009 → 2023-04-09 · usage — Consommation de cocaïne depuis l'âge de 30 ans selon le patient, quasi quotidienne début 2023 ; trouble d'usage sévère
- Usages et comportements · **Cocaïne** · 2022-12-10 → 2022-12-20 · sevrage — Abstinence de 10 jours déclarée après le contrôle routier
- Usages et comportements · **Cocaïne** · 2023-04-11 → 2023-04-27 · craving — Craving intense les premiers jours d'hospitalisation, en nette baisse à la sortie
- Usages et comportements · **Cocaïne** · 2023-04-09 → · sevrage — Abstinence de cocaïne depuis le 09/04/2023 à la sortie d'hospitalisation
- Usages et comportements · **Alcool** · 2022-06 → 2023-04-10 · usage — Alcool quotidien : 5-6 verres/j en octobre, 4-6 en janvier, 3-5 en mars, whisky tous les soirs en avril ; réduit à 2-3 verres après le 10/12/2022
- Usages et comportements · **Jeux d'argent** · 2017 → 2023-01 · usage — Paris sportifs en ligne depuis 2017, d'abord sur le foot avec des collègues (pronostics, « petits billets ») ; chasse aux pertes, mensonges, emprunts ; dettes cachées ; perte estimée à plus de 60 000 euros ; révélé en janvier 2023
- Usages et comportements · **Jeux d'argent** · 2020-03 → 2023-01 · usage — Augmentation nette au premier confinement : tous sports, paris en direct, plusieurs comptes, la nuit, mises de 200 à 500 euros
- Usages et comportements · **Jeux d'argent** · 2023-01 → · sevrage — Plus de pari depuis fin janvier selon lui, interdiction volontaire de jeux (ANJ) en cours ; paris « dans la tête » en avril
- Psychopathologie · **Idées suicidaires** · 2023-01-24 → 2023-04-27 — Idées de mort passives en janvier-mars, puis crise suicidaire avec scénario (pont d'Aquitaine) le 09/04/2023 ; plus d'idée suicidaire à la sortie, plan de sécurité
- Psychopathologie · **Crise suicidaire** · 2023-04-09 — Messages d'adieu à sa sœur, scénario précis, pas de passage à l'acte grâce à l'appel de la sœur
- Somatique · **Amaigrissement** · 2022-06 → 2022-09 — Perte de 5 kg depuis juin d'après la balance du service, fatigue
- Prises en charge · **Médecin traitant** · 2008 → — Suivi par le médecin traitant depuis 2008
- Prises en charge · **Entretiens éducateur spécialisé** · 2022-06-14 → — Entretien individuel mensuel proposé et accepté, en plus du suivi médical
- Prises en charge · **Suivi psychologique** · 2023-02-14 → — Entretien psychologique du 14/02/2023, psychologue déjà en place en janvier ; hebdomadaire pendant un mois après la sortie
- Événements de vie · **Difficultés professionnelles** · 2022-06 → 2022-11-21 — Travail compliqué, objectifs non atteints, absences, retards, convocation puis entretien préalable à licenciement le 29/09/2022
- Événements de vie · **Endettement** · 2019 → — Crédits renouvelables depuis 2019 à l'insu de l'épouse, prêt personnel de 2021, découvert ; environ 38 000 € recensés hors crédit immobilier, découverts en janvier 2023
- Événements de vie · **Interdiction volontaire de jeux (ANJ)** · 2023-01-31 → — Demande d'interdiction volontaire de jeux remplie le 31/01, en cours d'instruction en mars
- Événements de vie · **Projet de vente de la maison** · 2023-04-08 — Appel difficile avec l'épouse au sujet de la vente de la maison le soir de l'intoxication
- Usages et comportements · **Cocaïne** · 2019-03 → 2019-05 · usage — Cocaïne fumée quelques week-ends au printemps 2019.
- Usages et comportements · **Cocaïne** · 2022-04 → 2023-04 · usage — Nouvelle escalade d'avril 2022 à avril 2023, avec perforation septale en 06/2022.
- Usages et comportements · **Cocaïne** · 2024-12-22 → 2024-12-28 · craving — Craving fort pendant une semaine après la rechute.
- Usages et comportements · **Jeux d'argent** · 2024-12-22 · craving — Envie de parier sur le match du lendemain, sans passage à l'acte, pour la première fois depuis longtemps.
- Usages et comportements · **Tabac** · 2023-07-11 → · usage — Tabac : 5-8 cig/j (07/2023), 8 cig/j (11/2023), 8-10 cig/j (03/2025).
- Prises en charge · **Évaluation TDAH** · 2023-11-28 → 2024-01-09 — Évaluation avec l'interne : ASRS, DIVA 2.0, hétéro-anamnèse maternelle, bulletins scolaires.
- Somatique · **Élévation des GGT** · 2025-03 → — GGT 64 (31 un an avant), CDT limite.
- Événements de vie · **Difficultés scolaires** · 1985 → 1996 — Enfant agité, souvent puni, mots des enseignants dès le CP ; scolarité sauvée au lycée par le sport.
- Événements de vie · **Renvoi temporaire en 4e** · 1991 → 1996 — Renvoi de 3 jours en 4e pour une bagarre.
- Événements de vie · **Père : éloignement** · 2023-09-12 → — Père malade et loin ; pas revu depuis plusieurs années, ne souhaite pas le revoir.
- Usages et comportements · **Cocaïne** · 2021-02 → 2023-04 · usage — Trouble de l'usage de cocaïne sévère, travaillé en psychothérapie les deux premières années du suivi ; abstinent depuis 04/2023.
- Usages et comportements · **Cocaïne** · 2026-07-20 · craving — « Envie énorme » le soir des obsèques de son père ; appelle sa sœur et reste avec elle, pas de reprise.
- Usages et comportements · **Jeux d'argent** · 2022 → 2022 · usage — Paris sportifs : il « jouait déjà tous les soirs » à l'époque du groupe de 2022, pariant parfois pendant les pauses ; non dit à l'époque.
- Usages et comportements · **Jeux d'argent** · 2025-11 → 2025-11 · rechute — Rechute brève : paris sur le foot environ 10 jours sur un site étranger non couvert par l'interdiction ANJ (publicité sur un réseau social), perte de 600 € ; arrêt seul après une nuit à « se refaire », dit à son épouse puis spontanément à l'équipe. Pas de jeu depuis, jeu en rémission.
- Psychopathologie · **Deuil du père** · 2026-07-16 → — Tristesse « mais pas comme en 2023 », pas d'idée suicidaire ; 09/2026 : pas de symptôme dépressif caractérisé, sommeil correct.
- Somatique · **Insomnie d'endormissement** · 2026-01 → 2026-09 — Insomnie d'endormissement « depuis l'hiver » (03/2026) ; sommeil correct en 09/2026.
- Somatique · **Baisse d'appétit et perte de poids** · 2025-09 → 2026-09 — Appétit diminué le midi (09/2025), 74 kg en 12/2025 (-3 kg depuis l'été), 72 kg en 03/2026 (79 kg en 2024), remonté à 75 kg en 09/2026.
- Prises en charge · **Blocage des sites de jeux** · 2025-12-16 → — Logiciel de blocage des sites de jeux et de paris installé avec l'éducateur sur téléphone, ordinateur et tablette familiale, code gardé par l'épouse ; notifications sportives désactivées ; toujours actif en 09/2026.
- Événements de vie · **Recherche d'emploi** · 2025-05 → 2025-09-01 — Deux entretiens d'embauche en mai 2025 (un en seconde étape), RDV manqué pour un entretien à Libourne en juin, promesse d'embauche en juillet.

### `opiaces-parcours`

Statut au passage `regroupe2`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Usages et comportements | Héroïne | 2005 → 2007 (approx) | usage | trouvé | Opioïdes · 2005 → 2007 · usage |
| Usages et comportements | Héroïne | 2007 → 2015 (approx) | usage | trouvé | Opioïdes · 2007 → 2015 · usage |
| Usages et comportements | Héroïne | 2011 → 2011 (approx) | sevrage | trouvé | Opioïdes (sevrage hospitalier) · 2011 → 2011 · sevrage |
| Usages et comportements | Héroïne | 2011 (approx) | rechute | trouvé | Opioïdes · 2011 → 2011 · rechute ⚠ fin compatible |
| Usages et comportements | Héroïne | 2012 → 2017-03 (approx) | usage | trouvé | Opioïdes · 2012 → 2017-03-06 · usage |
| Usages et comportements | Héroïne | 2018-02-10 → 2018-03-15 (approx) | rechute | trouvé | Héroïne · 2018-02 → 2018-03 · rechute |
| Usages et comportements | Héroïne | 2020-11-16 → 2021-01-03 (exact) | rechute | trouvé | Héroïne · 2020-11-16 → 2021-01-03 · rechute |
| Usages et comportements | Héroïne | 2020-11-20 (exact) | intoxication | trouvé | Opioïdes (surdose) · 2020-11-20 · intoxication |
| Usages et comportements | Buprénorphine de rue | 2010 → 2012 (approx) | usage | trouvé | Opioïdes · 2010 → 2012 · usage |
| Usages et comportements | Cocaïne | 2007 → 2012 (approx) | usage | trouvé | Cocaïne · 2007 → 2012 · usage |
| Usages et comportements | Cocaïne basée (crack) | 2015 → 2017-06-10 (approx) | usage | trouvé | Crack · 2015 → 2017-06 · usage |
| Usages et comportements | Benzodiazépines de rue (Rivotril) | 2014 → 2018-03 (approx) | usage | trouvé | Benzodiazépines · 2014 → 2017-03-13 · usage |
| Usages et comportements | Benzodiazépines de rue (Rivotril) | 2020-11-20 (exact) | rechute | trouvé | Rivotril · 2020-11-20 → 2020-11-20 · intoxication ⚠ fin compatible, mode d'usage juste |
| Usages et comportements | Alcool | 2023-12 → 2024-04-10 (month) | usage | trouvé | Alcool · 2023-12 → 2024-04-10 · usage |
| Usages et comportements | Tabac | 2001 → (approx) | usage | trouvé | Tabac · 2003 → · usage |
| Usages et comportements | Cannabis | 2002 → 2019-05 (approx) | usage | trouvé | Cannabis · 2002 → · usage ⚠ fin compatible, « en cours » juste |
| Usages et comportements | Cannabis | 2020-02 → 2025-05 (approx) | usage | trouvé | Cannabis · 2020-02 → · usage ⚠ fin compatible, « en cours » juste |
| Médicaments | Buprénorphine (en détention) | 2010-01 → 2010-05 (approx) |  | trouvé | Buprénorphine · 2010 → 2010 |
| Médicaments | Buprénorphine haut dosage | 2012 → 2017-03-05 (approx) |  | trouvé | Buprénorphine haut dosage · 2012 → 2017-03-05 |
| Médicaments | Méthadone | 2017-03-06 → (exact) |  | trouvé | Méthadone · 2017-03-06 → |
| Médicaments | Zopiclone | 2017-07-04 → 2018-02-27 (exact) |  | trouvé | Zopiclone · 2017-07-04 → 2018-02-27 |
| Médicaments | Escitalopram | 2017-10-17 → 2021-09-28 (exact) |  | trouvé | Escitalopram · 2017 → 2021 ⚠ au moins une source attendue |
| Médicaments | Amoxicilline-acide clavulanique | 2018-02-20 → 2018-02-27 (approx) |  | trouvé | Amoxicilline-acide clavulanique · 2018-02-20 → 2018-02-27 |
| Médicaments | Naloxone (kit nasal) | 2018-03-06 → (exact) |  | trouvé | Naloxone · 2018-03-06 → 2018-03-06 ⚠ fin compatible, « en cours » juste |
| Médicaments | Sofosbuvir/velpatasvir | 2018-10-08 → 2018-12-30 (exact) |  | trouvé | Sofosbuvir/velpatasvir · 2018-10-08 → 2018-12-30 |
| Médicaments | Implant contraceptif | 2020-01-09 → (exact) |  | trouvé | Implant contraceptif · 2020-01-09 → |
| Médicaments | Prazosine | 2021-04-13 → 2023-04-18 (exact) |  | trouvé | Prazosine · 2021-04-13 → 2023-04-18 |
| Médicaments | Sertraline | 2021-09-28 → (exact) |  | trouvé | Sertraline · 2021-09-28 → |
| Médicaments | Oxazépam | 2022-03-15 → 2023-02-06 (exact) |  | trouvé | Oxazépam · 2022-03-15 → 2023-02-06 |
| Médicaments | Substituts nicotiniques | 2025-02-18 → 2026-05 (month) |  | trouvé | Patch nicotinique · 2025-02 → 2026-05 |
| Psychopathologie | Scarifications | 2002 → 2003-02 (approx) |  | trouvé | Scarifications · 2003-02 ⚠ fin compatible |
| Psychopathologie | Tentative de suicide | 2003-02 → 2003-02 (month) |  | trouvé | Intoxication médicamenteuse volontaire · 2003-02 → 2003-02 |
| Psychopathologie | Trouble de l'adaptation avec humeur dépressive | 2003-02 → 2003-03 (month) |  | trouvé | Trouble de l'adaptation avec humeur dépressive · 2003-02 → 2003-03 |
| Psychopathologie | Trouble de stress post-traumatique | 2017-06 → 2025 (approx) |  | trouvé | Trouble de stress post-traumatique · 2017-06-10 → ⚠ fin compatible, « en cours » juste |
| Psychopathologie | Épisode dépressif caractérisé | 2020-11 → 2021-09 (approx) |  | trouvé | Épisode dépressif caractérisé · 2020-11 → 2021-09 |
| Psychopathologie | Idées suicidaires (passage aux urgences) | 2021-02-08 (exact) |  | trouvé | Idées suicidaires · 2021-02-08 |
| Somatique | Hépatite C | 2013 → 2019-03-26 (year) |  | trouvé | Hépatite C · 2013 → 2019-03 |
| Somatique | Abcès du bras droit | 2009 (approx) |  | trouvé | Abcès du bras droit · 2009 → 2009 ⚠ fin compatible |
| Somatique | Abcès de l'avant-bras gauche | 2018-02-20 → 2018-04 (approx) |  | trouvé | Abcès de l'avant-bras · 2018-02-20 → 2018-04 |
| Somatique | Mauvais état dentaire, soins à la PASS | 2017 → 2023 (approx) |  | trouvé | Mauvais état dentaire · 2017-02 → ⚠ fin compatible, « en cours » juste |
| Somatique | Fausse couche spontanée | 2011 (approx) |  | trouvé | Fausse couche · 2011 → 2011 ⚠ fin compatible |
| Somatique | Grossesse | 2018-12-28 → 2019-10-04 (exact) |  | trouvé | Grossesse · 2018-12 → 2019-10 |
| Somatique | Syndrome de sevrage néonatal (Lina) | 2019-10-06 → 2019-10-19 (exact) |  | autre piste | Syndrome de sevrage néonatal de la fille · 2019-10 → 2019-10-19 |
| Somatique | Allongement du QT | 2021-09-21 → 2021-11-23 (exact) |  | trouvé | Allongement du QT · 2021-09 → 2021-11 |
| Prises en charge | Hospitalisation en psychiatrie pour adolescents | 2003-02-10 → 2003-03-28 (exact) |  | trouvé | Hospitalisation en pédopsychiatrie · 2003-02-10 → 2003-03-28 |
| Prises en charge | Suivi en CMP adolescents | 2003-03-28 (approx) |  | trouvé | Suivi CMP adolescents · 2003-03 |
| Prises en charge | Sevrage hospitalier (clinique) | 2011 → 2011 (approx) |  | trouvé | Sevrage hospitalier (Libourne) · 2011 → 2011 |
| Prises en charge | Suivi addictologique (CSAPA) | 2017-02-20 → (exact) |  | trouvé | CSAPA · 2017-02-20 → |
| Prises en charge | Accompagnement social (CSAPA) | 2017-04-18 (exact) |  | trouvé | Suivi social · 2017-04-18 → ⚠ « en cours » juste |
| Prises en charge | Psychothérapie (psychologue du CSAPA) | 2017-11-07 → 2023-03 (approx) |  | trouvé | Suivi psychologique · 2017-11-07 → ⚠ fin compatible, « en cours » juste |
| Prises en charge | EMDR | 2021-05 → 2023-03 (month) |  | trouvé | EMDR · 2021-05 → 2023-03 |
| Prises en charge | Hospitalisation en réanimation | 2020-11-20 → 2020-11-21 (exact) |  | manqué |  |
| Prises en charge | Accompagnement éducatif (CSAPA) | 2021-06-08 (exact) |  | trouvé | Entretien éducatif · 2021-06-08 |
| Événements de vie | Placement en famille d'accueil (ASE) | 1994 → 2005 (approx) |  | trouvé | Placement en famille d'accueil · 1994 → 2005 |
| Événements de vie | Arrêt de la scolarité | 2003 (approx) |  | trouvé | Arrêt de la scolarité · 2003 |
| Événements de vie | Décès de la grand-mère maternelle | 2004 (approx) |  | trouvé | Décès de la grand-mère maternelle · 2004 |
| Événements de vie | Installation en Gironde | 2006 (approx) |  | trouvé | Départ de Dordogne, arrivée en Gironde · 2006 → 2006 ⚠ fin compatible |
| Événements de vie | Emploi d'aide à domicile | 2006 → 2009 (year) |  | trouvé | Emploi d'aide à domicile · 2006 → 2009 |
| Événements de vie | Incarcération | 2010-01 → 2010-05 (month) |  | trouvé | Incarcération · 2010-01 → 2010-05 |
| Événements de vie | Couple avec M. GARRABOS | 2012 → 2017-06-10 (year) |  | trouvé | Couple avec M. [PERSONNE_5] · 2012 → 2017-06-10 |
| Événements de vie | Violences conjugales | 2013 → 2017-06-10 (year) |  | trouvé | Violences conjugales · 2013 → 2017-06-10 |
| Événements de vie | Emploi d'aide à domicile | 2013 → 2014 (year) |  | trouvé | Emploi d'aide à domicile · 2013 → 2014 |
| Événements de vie | RSA | 2014 → 2022-09-01 (year) |  | trouvé | RSA · 2014 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Naissance d'Enzo | 2014-08-17 (exact) |  | trouvé | Naissance du fils · 2014-08 → 2014 ⚠ fin compatible |
| Événements de vie | Placement d'Enzo (ASE) | 2015-11 → 2022-07-01 (month) |  | trouvé | Placement du fils · 2015-11 → 2022-07-01 |
| Événements de vie | Séparation, départ du domicile conjugal | 2017-06-10 (exact) |  | manqué |  |
| Événements de vie | Hébergement d'urgence (115) | 2017-06-13 → 2017-09-18 (exact) |  | trouvé | Hébergement d'urgence (115) · 2017-06-10 → 2017-09-18 |
| Événements de vie | CHRS | 2017-09-18 → 2019-06-30 (exact) |  | trouvé | CHRS · 2017-09-18 → 2019-06-30 |
| Événements de vie | Condamnation de l'ex-conjoint | 2018-02-08 (exact) |  | trouvé | Condamnation de l'ex-conjoint · 2018-02-08 → 2018-02-08 ⚠ fin compatible |
| Événements de vie | Couple avec M. LESTRADE | 2018-05 → (month) |  | trouvé | Couple avec M. [PERSONNE_3] · 2018-05 → |
| Événements de vie | Logement autonome (Cenon) | 2019-07-01 → (exact) |  | trouvé | Logement social à Cenon · 2019-07-01 → |
| Événements de vie | Naissance de Lina | 2019-10-04 (exact) |  | trouvé | Naissance de la fille · 2019-10 → 2019 ⚠ fin compatible |
| Événements de vie | AEMO pour Lina | 2019-11-13 → 2021-11 (month) |  | trouvé | AEMO · 2019-11-13 → 2021-11 |
| Événements de vie | Hébergement d'Enzo un week-end sur deux | 2020-09 → 2021-09 (month) |  | manqué |  |
| Événements de vie | Décès du frère (surdose) | 2020-11-14 (exact) |  | trouvé | Décès du frère · 2020-11-14 → 2020-11-14 ⚠ fin compatible |
| Événements de vie | Enzo une semaine sur deux au domicile | 2021-09 → 2022-07-01 (month) |  | manqué |  |
| Événements de vie | Retour d'Enzo au domicile (mainlevée du placement) | 2022-07-01 (exact) |  | manqué |  |
| Événements de vie | Emploi d'aide à domicile (CDI) | 2022-09-01 → (exact) |  | trouvé | Emploi d'aide à domicile · 2022-09-01 → |
| Événements de vie | Reprise de contact avec sa mère | 2025-04 (month) |  | trouvé | Retrouvailles avec la mère · 2025-04 → 2025-04 ⚠ fin compatible |
| Événements de vie | Permis de conduire | 2026-06-12 (exact) |  | mal daté | Permis de conduire · 2025-06 → 2026-06-12 |

En plus (passage `regroupe2`), à relire : vrai mais absent de la vérité, ou erreur.

- Usages et comportements · **Opioïdes** · 2009 → 2009 · usage — Période la plus lourde vers 2009 : jusqu'à 1 g/j, vols et petits deals, nuits dehors, manque quotidien, perte de poids
- Usages et comportements · **Opioïdes** · 2017-06-10 → 2017-07-04 · craving — Craving majeur après la séparation (++), modéré le 04/07 ; pas d'héroïne, urines négatives
- Usages et comportements · **Opioïdes** · 2018-02-10 → · rechute — Reprise d'héroïne juste après l'audience, d'abord sniffée puis injectée depuis une semaine, 1 à 2 fois/j ; abcès ; dernière injection il y a 3 jours le 06/03
- Usages et comportements · **Opioïdes** · 2017-03-06 → 2018-02-10 · usage — Pas d'héroïne déclarée sous méthadone, urines négatives (opiacés)
- Usages et comportements · **Cocaïne** · 2017-03 → 2017-03 · usage — Urines du 10/03 positives à la cocaïne ('une soirée chez des amis, une trace') ; nie le crack ; urines du 27/03 négatives
- Usages et comportements · **Benzodiazépines** · 2018-02 → 2018-02 · usage — Rivotril de rue 2 mg certains soirs lors de la reprise d'héroïne
- Usages et comportements · **Alcool** · 2017-02 → 2017-02 · usage — Consommation rare, quelques bières en soirée, pas d'ivresse récente ; pas d'alcool ensuite
- Psychopathologie · **Anxiété** · 2017-02-27 → — Anxiété 'depuis toujours', anxiété au premier plan à l'examen
- Psychopathologie · **Trouble du sommeil et cauchemars** · 2017-02-27 → 2017-02 — Sommeil mauvais (endormissement après 2 h, réveils), cauchemars 'de temps en temps'
- Psychopathologie · **Trouble du sommeil et cauchemars** · 2017-03 → — Réveils à 3 h, puis 3-4 h de sommeil par nuit en hébergement d'urgence ; cauchemars presque toutes les nuits puis 4-5 nuits/semaine
- Psychopathologie · **Épisode dépressif** · 2017-06-20 → — Thymie basse, pleurs, culpabilité, anhédonie partielle ; symptômes dépressifs associés au TSPT ; pas d'idée suicidaire
- Psychopathologie · **Trouble de la personnalité borderline** · 2018-02-27 → 2018-04 — Colère, impulsivité, sentiment de vide, relations 'tout ou rien' ; évoqué, à évaluer ; scarifications niées
- Somatique · **Perte de poids** · 2009 → 2009 — Perte de poids importante vers 2009 ('42 kilos')
- Somatique · **Traumatisme (violences conjugales)** · 2017-06-10 → 2017-06-20 — Coups au visage et aux côtes, ITT 4 jours, ecchymoses en résorption, radio sans fracture
- Médicaments · **Clonidine** · 2011 → 2011 — Sevrage hospitalier sous antalgiques et clonidine
- Médicaments · **Escitalopram** · 2017-10-17 → — Escitalopram 10 mg/j, majoré à 20 mg le 16/01/2018
- Prises en charge · **Délivrance quotidienne de méthadone** · 2017-03-06 → 2017-09-12 — Délivrance quotidienne au CSAPA
- Prises en charge · **Délivrance hebdomadaire de méthadone** · 2017-09-12 → 2018-02-28 — Délivrance hebdomadaire accordée pour stabilité, bien gérée
- Prises en charge · **Délivrance quotidienne de méthadone** · 2018-02-28 → — Retour à la délivrance quotidienne après la reprise d'héroïne ; matériel RDR et naloxone
- Événements de vie · **Enfance avec mère alcoolique** · 1993 → 2004 — Née à Périgueux, élevée par sa mère et sa grand-mère ; 'ma mère buvait' ; père inconnu ; enfance 'pas facile'
- Événements de vie · **Garde à vue** · 2010 → 2010 — Quelques jours de garde à vue vers 2010 pour un vol
- Événements de vie · **Plainte et ITT** · 2017-06-11 → 2017-06-13 — Certificat aux urgences le 11/06 (ITT 4 jours), plainte déposée le 13/06 contre le conjoint
- Événements de vie · **Audience pénale de l'ex-conjoint** · 2018-02 → 2018-02 — Audience en février 2018, sursis pour l'ex-conjoint ; colère de la patiente
- Usages et comportements · **Héroïne** · 2005 → 2007 · usage — Héroïne dès 18 ans
- Usages et comportements · **Héroïne (injectée)** · 2007 → 2015 · usage — Injectée à partir de 20 ans, jusqu'en 2015 (et non 2011 comme dit à l'entrée)
- Usages et comportements · **Héroïne** · 2010-05 → 2010-05 · rechute — Rechute à l'héroïne la première semaine après la sortie de détention
- Usages et comportements · **Buprénorphine (rue)** · 2010-05 → 2012 · usage — BHD de rue débutée après la sortie de détention, avant la prescription en ville
- Usages et comportements · **Buprénorphine (mésusage nasal)** · 2012 → 2017 · usage — BHD prescrite en ville de 2012 à 2017 avec mésusage nasal
- Usages et comportements · **Rivotril** · 2018-03 · usage — Rivotril de rue occasionnel ; plus depuis la rechute de février-mars 2018 (jeté)
- Usages et comportements · **Tabac** · 2018-04 → · usage — 20 cig/j (2018), 15 (02/2019), 10 (03/2019), 8 (07/2019), 12 (02/2020), 20 (04/2020)
- Usages et comportements · **Cannabis** · 2018-09 → 2019-05 · usage — 2 joints le soir, réduction à 1 joint (03/2019), arrêté en mai 2019 « pour le bébé »
- Médicaments · **Buprénorphine** · 2012 → 2017-03 — BHD prescrite en ville de 2012 à 2017
- Médicaments · **Méthadone sirop** · 2017-03-06 → 2018-09-17 — Initiée le 06/03/2017 ; 80 mg stable depuis juin 2017
- Médicaments · **Méthadone gélules** · 2018-09-17 → — Relais gélules 80 mg, délivrance hebdomadaire en pharmacie de ville ; 90 mg fractionnée 45+45 du 16/07/2019 au 26/11/2019 puis retour à 80 mg en une prise
- Médicaments · **Escitalopram** · 2018-01 → — 20 mg depuis janvier 2018, réduit à 10 mg en février 2019 (grossesse), remonté à 20 mg le 24/11/2020
- Somatique · **Soins dentaires** · 2018-06 → — Caries multiples, extractions, PASS dentaire ; presque terminés en 2020, prothèse prévue après l'accouchement
- Somatique · **Surdose d'opioïdes** · 2020-11-20 → 2020-11-21 — Retrouvée inconsciente, naloxone par le SAMU, réanimation au CHU, sortie contre avis
- Psychopathologie · **Idées de mort passives** · 2020-11-24 → 2020-11-24 — Après le décès du frère, nie toute intention
- Prises en charge · **Délivrance hebdomadaire de méthadone** · 2018-04-10 → 2018-09-17 — Reprise de la délivrance hebdomadaire après la rechute
- Prises en charge · **Suivi maternité et PMI** · 2019-02 → — Staff de parentalité (09/07/2019), sage-femme de PMI, TISF proposée, suivi pédiatrique PMI
- Prises en charge · **Délivrance quotidienne de méthadone en pharmacie** · 2020-11-25 → 2021-03-09 — Délivrance quotidienne après la rechute
- Événements de vie · **Placement ASE (adolescence)** · 2003 — « Jeune fille confiée à l'ASE » mentionnée dans le CR de 2003, sans détail ; mère « ne m'a jamais protégée »
- Événements de vie · **Séparation de l'ex-conjoint** · 2017-06 → 2017-06 — Séparation et départ de chez lui
- Événements de vie · **RSA** · 2019-02-12 → — Perçoit le RSA
- Événements de vie · **Première overdose du frère** · 2020 → 2020 — Frère : première overdose l'été dernier, refusait tout traitement
- Événements de vie · **Projet d'emploi d'aide à domicile** · 2020-09-15 → 2020-09-15 — Demande d'extrait de casier judiciaire (B3)
- Usages et comportements · **Héroïne** · 2011 · sevrage — Sevrage de 2011 évoqué (peur du manque)
- Usages et comportements · **Rivotril** · 2018 · usage — Rivotril de rue jusqu'en 2018 ; pas de Rivotril depuis la surdose de 2020
- Usages et comportements · **Benzodiazépines (oxazépam)** · 2022-03-15 → 2023-02-06 · usage — Oxazépam 50 mg 3 cp/j (parfois 4) prescrit par un autre médecin, caché au CSAPA, pour tenir au travail ; renouvellement mensuel dès le 15/03/2022
- Usages et comportements · **Benzodiazépines (oxazépam)** · 2022-11-29 → 2023-02-06 · sevrage — Décroissance de 25 mg tous les 10 jours, dernière prise le 06/02/2023, sevrage sans complication
- Usages et comportements · **Cannabis** · 2021-04 → · usage — 2 joints le soir en 2021, 1 joint le soir ensuite, de temps en temps en septembre 2024
- Usages et comportements · **Tabac** · 2021-04 → · usage — 15 cigarettes par jour, a pensé à demander de l'aide plus tard
- Psychopathologie · **Trouble de stress post-traumatique** · 2021-04 → 2023-03 — Cauchemars quasi quotidiens depuis le décès du frère et scènes de violences ; traité par EMDR terminée en mars 2023, cauchemars rares ensuite
- Psychopathologie · **Anxiété liée au travail** · 2022-11-29 — Angoisses réelles, réveils à 4h, boule au ventre, pas de panique franche
- Somatique · **Prothèse dentaire** · 2023-01 — Prothèse dentaire posée en début d'année 2023
- Somatique · **GGT élevée** · 2024-02 → 2024-05 — GGT 112 en février, 31 le 22/05, 27 en août
- Médicaments · **Escitalopram** · 2020-12 → 2021-09-28 — 20 mg, arrêté à cause de l'allongement du QT
- Médicaments · **Naloxone** · 2020-12-01 → — Kit remis, entourage formé ; à jour en 2022
- Prises en charge · **Suivi psychologique** · 2020-12 → 2023-03 — Suivi hebdomadaire avec la psychologue
- Prises en charge · **Passage aux urgences du CHU** · 2021-02-08 — Idées suicidaires, retour à domicile
- Prises en charge · **Délivrance hebdomadaire de méthadone** · 2021-03-09 → 2022-01 — Délivrance hebdomadaire reprise le 09/03/2021
- Prises en charge · **Délivrance de méthadone tous les 14 jours** · 2022-01 → 2024-09-17 — Délivrance tous les 14 jours en pharmacie
- Prises en charge · **Délivrance de méthadone tous les 28 jours** · 2024-09-17 → — Délivrance tous les 28 jours, stabilité depuis plus de 2 ans hors alcool
- Prises en charge · **Suivi social** · 2022-07-05 → — RDV social tous les 3 mois demandé
- Événements de vie · **Alcoolisme de la mère** · 1993 → 1998 — Mère ne pouvant s'occuper des enfants à cause de l'alcool ; grand-mère venait les dimanches
- Événements de vie · **Fugues** · 1999 → 2004 — Adolescence qui a tout cassé, fugues
- Événements de vie · **Changement de famille d'accueil** · 2002 — Rupture à 15 ans après l'hôpital
- Événements de vie · **Résidence alternée du fils** · 2021-09 → 2022-07 — Une semaine sur deux chez elle à Cenon
- Événements de vie · **Décès du frère** · 2020 — Deuil traumatique
- Événements de vie · **RSA** · 2022-02-15 → 2022-09 — RSA, fin prévue avec l'embauche
- Événements de vie · **Vie en couple à Cenon** · 2022-02-15 → — Vit à Cenon avec M. [PERSONNE_3] et la fille
- Usages et comportements · **Héroïne** · 2005 → 2021-01 · usage — Héroïne sniffée vers 18 ans ; pas d'héroïne depuis janvier 2021 ; TUO sévère en rémission prolongée
- Usages et comportements · **Opioïdes (rechute héroïne)** · 2018 → 2018 · rechute — Rechute d'héroïne en 2018
- Usages et comportements · **Opioïdes (rechute héroïne)** · 2020 → 2021-01 · rechute — Rechute d'héroïne 2020-2021
- Usages et comportements · **Cannabis** · 2025-02 → 2025-05 · usage — 1 joint occasionnel le week-end ; arrêt mai 2025 pour de bon
- Usages et comportements · **Tabac** · 2025-02 → · usage — 15 cig/j en 02/2025 avec demande d'aide, 6 en 10/2025, 5 en 01/2026, 4 en 04/2026, 3 en 09/2026
- Médicaments · **Implant contraceptif** · 2026-01-08 → 2026-01-08 — Changement d'implant le 08/01/2026 par la sage-femme
- Médicaments · **Naloxone** · 2026-02-17 → 2026-02-17 — Kit renouvelé (le précédent périmé)
- Psychopathologie · **Hospitalisation pédopsychiatrique** · 2002 — Hospitalisation en unité pour adolescents à 15 ans (2003)
- Prises en charge · **Entretien psychologique de bilan** · 2025-05-13 → 2025-05-13 — Bilan à la demande de la patiente ; entretien dans un an
- Prises en charge · **Entretien éducatif** · 2025-06-24 → 2025-06-24 — Soutien pour l'enfant exclu de l'école ; RDV CMPP
- Prises en charge · **CMPP (enfant)** · 2025-09 → — Enfant suivi au CMPP depuis septembre 2025, mieux ; poursuite proposée un an
- Événements de vie · **Difficultés scolaires de l'enfant** · 2025-06 → 2025-06 — Exclusion de 2 jours pour bagarre ; difficultés de comportement à l'école
- Événements de vie · **Retrouvailles avec la famille d'accueil** · 2026-07 → 2026-08 — Famille d'accueil revue cet été en Dordogne avec les enfants

### `polyconso-precarite`

Statut au passage `regroupe2`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Usages et comportements | Alcool | 1987 → 2006 (approx) | usage | trouvé | Alcool · 1987 → 2006 · usage |
| Usages et comportements | Alcool | 2006 → 2018-09-10 (approx) | usage | trouvé | Alcool · 2006 → 2025-02 · usage ⚠ fin compatible |
| Usages et comportements | Alcool | 2009 (approx) | sevrage | trouvé | Alcool · 2009 → 2009 · sevrage ⚠ fin compatible |
| Usages et comportements | Alcool | 2016 (year) | sevrage | trouvé | Alcool · 2016 → 2016 · sevrage ⚠ fin compatible |
| Usages et comportements | Alcool | 2016 (year) | rechute | trouvé | Alcool · 2016 → 2016 · rechute ⚠ fin compatible |
| Usages et comportements | Alcool | 2018-02 (month) | sevrage | trouvé | Alcool · 2018-02 → 2018-02 · sevrage ⚠ fin compatible |
| Usages et comportements | Alcool | 2018-09-10 → 2018-09-20 (exact) | sevrage | trouvé | Alcool · 2018-09-10 → 2018-09-20 · sevrage |
| Usages et comportements | Alcool | 2018-10-05 → 2018-11-16 (exact) | rechute | trouvé | Alcool · 2018-10-05 → 2018-10-05 · rechute ⚠ fin compatible |
| Usages et comportements | Alcool | 2018-11-16 → 2018-11-22 (exact) | sevrage | trouvé | Alcool · 2018-11-16 → 2018-11-22 · sevrage |
| Usages et comportements | Alcool | 2018-11-22 → 2019-04 (exact) | rechute | manqué |  |
| Usages et comportements | Alcool | 2019-04 → 2020-01-06 (month) | usage | trouvé | Alcool · 2019-04 → 2019-04 · usage ⚠ fin compatible |
| Usages et comportements | Alcool | 2020-01-06 → 2020-01-21 (approx) | sevrage | trouvé | Alcool · 2020-01-06 → 2020-01-10 · sevrage |
| Usages et comportements | Alcool | 2020-01-21 → 2021-06-07 (month) | rechute | autre piste | Diazépam · 2020-01 → 2020-01-20 |
| Usages et comportements | Alcool | 2021-06-07 → 2021-06-18 (exact) | sevrage | trouvé | Alcool · 2021-06-07 → 2021-06-18 · sevrage |
| Usages et comportements | Alcool | 2021-08 → 2021-08-19 (approx) | rechute | trouvé | Alcool · 2021-08 → 2021-08 · rechute |
| Usages et comportements | Alcool | 2022-02 → 2022-02-19 (approx) | rechute | trouvé | Alcool · 2022-02 → 2022-02 · rechute |
| Usages et comportements | Alcool | 2022-02-19 (exact) | intoxication | manqué |  |
| Usages et comportements | Alcool | 2022-12-24 (exact) | rechute | trouvé | Alcool · 2022-12-24 → 2022-12-24 · rechute ⚠ fin compatible |
| Usages et comportements | Alcool | 2023-01 → 2023-04-17 (month) | rechute | trouvé | Alcool · 2023-01 → 2023-04-17 · rechute |
| Usages et comportements | Alcool | 2024-01 → 2025-01 (month) | usage | trouvé | Alcool · 2024-01 · usage ⚠ fin compatible |
| Usages et comportements | Alcool | 2025-01 → 2025-02-11 (month) | rechute | trouvé | Alcool · 2025-01 → 2025-02-11 · rechute |
| Usages et comportements | Alcool | 2025-02-11 → 2025-02-18 (exact) | sevrage | trouvé | Alcool · 2025-02-11 → 2025-02-18 · sevrage |
| Usages et comportements | Alcool | 2026-03-07 (exact) | rechute | trouvé | Alcool · 2026-03-07 · usage ⚠ mode d'usage juste |
| Usages et comportements | Benzodiazépines | 2019-04 → 2021-06-07 (approx) | usage | trouvé | Benzodiazépines (clonazépam de rue) · 2019-04 → 2021-06-07 · usage |
| Usages et comportements | Benzodiazépines | 2021-06-07 → 2024-02-10 (exact) | sevrage | manqué |  |
| Usages et comportements | Crack | 2019-10 → 2020-03 (approx) | usage | autre piste | Brûlures du crack · 2020-09 → 2021-06 |
| Usages et comportements | Crack | 2020-03 → 2021-06-07 (approx) | usage | trouvé | Crack · 2019-10 → 2021-06-06 · usage |
| Usages et comportements | Crack | 2021-06-07 → 2021-06-18 (exact) | sevrage | trouvé | Crack · 2021-06-07 → 2021-06-11 · craving ⚠ fin compatible, mode d'usage juste |
| Usages et comportements | Crack | 2024-04 → 2024-05-05 (month) | rechute | trouvé | Crack · 2024-04 → 2024-05-05 · rechute |
| Usages et comportements | Tabac | 1987 → 2025-05-13 (approx) | usage | trouvé | Tabac · 1987 → · usage ⚠ fin compatible, « en cours » juste |
| Usages et comportements | Tabac | 2025-05-13 → (exact) | usage | manqué |  |
| Usages et comportements | Cannabis | 1992 (approx) | usage | trouvé | Cannabis · 1991 → 1993 · usage ⚠ fin compatible |
| Médicaments | Alprazolam | 2015 → 2018-09-10 (year) |  | trouvé | Alprazolam · 2015 → 2018-09-10 |
| Médicaments | Alprazolam | 2018-10 → 2019-04 (month) |  | trouvé | Alprazolam · 2018-10 → 2018-11-13 ⚠ fin compatible |
| Médicaments | Paroxétine | 2016 → 2017 (approx) |  | trouvé | Paroxétine · 2016 → 2017 |
| Médicaments | Sertraline | 2018-05-29 → 2019-04 (exact) |  | trouvé | Sertraline · 2018-05-29 → 2019-04 |
| Médicaments | Thiamine | 2018-05-29 → 2023-03 (exact) |  | trouvé | Thiamine · 2018-05-29 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Diazépam | 2018-09-10 → 2018-09-19 (exact) |  | trouvé | Diazépam · 2018-09-10 → 2018-09-19 |
| Médicaments | Baclofène | 2018-09-20 → 2019-04 (exact) |  | trouvé | Baclofène · 2018-09-20 → 2019-04 |
| Médicaments | Diazépam | 2018-11-18 → 2018-11-25 (approx) |  | trouvé | Diazépam · 2018-11-18 → 2018-11-23 |
| Médicaments | Mirtazapine | 2021-02-02 → (exact) |  | trouvé | Mirtazapine · 2021-02-02 → |
| Médicaments | Diazépam | 2021-06-07 → 2024-02-10 (exact) |  | trouvé | Diazépam · 2021-06-07 → 2024-02-10 |
| Médicaments | Acamprosate | 2021-06-18 → 2022-10 (exact) |  | trouvé | Acamprosate · 2021-06-18 → 2022-10 |
| Médicaments | Sofosbuvir/velpatasvir | 2021-10-18 → 2022-01 (exact) |  | trouvé | Sofosbuvir/velpatasvir · 2021-10-18 → 2022-01 |
| Médicaments | Nalméfène | 2024-06-04 → 2025-01 (exact) |  | trouvé | Nalméfène · 2024-06-04 → 2025-01 |
| Médicaments | Diazépam | 2025-02-11 → 2025-02-18 (exact) |  | trouvé | Diazépam · 2025-02-11 → 2025-02-18 |
| Médicaments | Thiamine | 2025-02-11 (exact) |  | trouvé | Thiamine · 2025-02-11 |
| Médicaments | Acamprosate | 2025-02-18 → 2026-10-13 (exact) |  | trouvé | Acamprosate · 2025-02-18 → 2026-10 |
| Médicaments | Substituts nicotiniques | 2025-05-13 → (exact) |  | trouvé | Substituts nicotiniques · 2025-05-13 → |
| Psychopathologie | Tentative de suicide | 2007 (year) |  | trouvé | Intoxication médicamenteuse volontaire · 2007 → 2007 ⚠ fin compatible |
| Psychopathologie | Épisode dépressif | 2016 → 2017 (year) |  | trouvé | Épisode dépressif · 2016 → 2017 |
| Psychopathologie | Épisode dépressif caractérisé | 2017-12 (approx) |  | trouvé | Épisode dépressif · 2018 → 2019 ⚠ fin compatible |
| Psychopathologie | Épisode dépressif caractérisé sévère | 2021-01 → 2022-04 (month) |  | trouvé | Épisode dépressif caractérisé sévère · 2021-01-19 → ⚠ fin compatible, « en cours » juste |
| Psychopathologie | Trouble de stress post-traumatique | 2022-03 → (month) |  | trouvé | Trouble de stress post-traumatique · 2022-03-15 → 2022 ⚠ fin compatible, « en cours » juste |
| Somatique | Appendicectomie | 1984 (approx) |  | trouvé | Appendicectomie · 1984 |
| Somatique | Traumatisme crânien | 2005 (year) |  | trouvé | Traumatisme crânien · 2005 → 2005 ⚠ fin compatible |
| Somatique | Hépatopathie alcoolique | 2018-06 → (month) |  | trouvé | Hépatopathie alcoolique · 2018-06 → 2018-06 ⚠ fin compatible, « en cours » juste |
| Somatique | Crise convulsive de sevrage | 2018-11-18 (exact) |  | trouvé | Crise convulsive de sevrage · 2018-11-18 → 2018-11 ⚠ fin compatible |
| Somatique | Delirium tremens | 2020-01-10 (exact) |  | trouvé | Delirium tremens · 2020-01-10 → 2020-01-13 ⚠ fin compatible |
| Somatique | Hépatite C | 2021-02 → 2022-09 (month) |  | trouvé | Hépatite C · 2021-02 → 2022-09 |
| Somatique | Polyneuropathie sensitive | 2021-06 → (month) |  | trouvé | Neuropathie périphérique · 2021-06-07 → |
| Somatique | Pancréatite aiguë | 2021-08-19 (exact) |  | trouvé | Pancréatite aiguë · 2021-08-19 → 2021-08-27 ⚠ fin compatible |
| Somatique | Fracture bimalléolaire de la cheville gauche | 2022-02-19 (exact) |  | trouvé | Fracture bimalléolaire de la cheville gauche · 2022-02-19 → 2022-10 ⚠ fin compatible |
| Prises en charge | Hospitalisation (réanimation) pour intoxication volontaire | 2007 (year) |  | manqué |  |
| Prises en charge | Hospitalisation pour sevrage (Marmande) | 2009 (approx) |  | trouvé | Hospitalisation de sevrage Marmande · 2009 → 2009 ⚠ fin compatible |
| Prises en charge | Hospitalisation pour sevrage (clinique du Lac) | 2016 (year) |  | trouvé | Clinique du Lac (sevrage) · 2016 → 2016 ⚠ fin compatible |
| Prises en charge | Suivi au CSAPA | 2018-05-22 → (exact) |  | trouvé | Suivi CSAPA · 2018-05-22 → |
| Prises en charge | Accompagnement social | 2018-06-12 → (exact) |  | trouvé | Suivi social (assistante sociale) · 2018-06-12 → 2019-03-19 ⚠ fin compatible, « en cours » juste |
| Prises en charge | Hospitalisation pour sevrage | 2018-09-10 → 2018-09-20 (exact) |  | trouvé | Hospitalisation de sevrage (CH) · 2018-09-10 → 2018-09-20 |
| Prises en charge | Passage aux urgences et UHCD | 2018-11-18 → 2018-11-20 (exact) |  | trouvé | Passage UHCD / ELSA · 2018-11-18 → 2018-11-20 |
| Prises en charge | Fréquentation du CAARUD La Passerelle | 2019-06 (month) |  | trouvé | CAARUD · 2019-06 → ⚠ « en cours » juste |
| Prises en charge | Équipe mobile psychiatrie-précarité | 2019-07-09 (exact) |  | trouvé | Suivi équipe mobile psychiatrie-précarité (EMPP) · 2019-07-09 → 2021-02 ⚠ fin compatible |
| Prises en charge | Suivi éducatif | 2019-09-17 → (exact) |  | mal daté | Suivi éducatif et social · 2025-09-23 → |
| Prises en charge | Hospitalisation (réanimation puis médecine) pour delirium tremens | 2020-01-10 → 2020-01-21 (exact) |  | trouvé | Hospitalisation pour delirium tremens · 2020-01-10 → 2020-01-21 |
| Prises en charge | Hospitalisation pour sevrage | 2021-06-07 → 2021-06-18 (exact) |  | trouvé | Hospitalisation de sevrage (CH) · 2021-06-07 → 2021-06-18 |
| Prises en charge | Hospitalisation pour pancréatite aiguë | 2021-08-19 → 2021-08-27 (exact) |  | trouvé | Hospitalisation pour pancréatite · 2021-08-19 → 2021-08-27 |
| Prises en charge | Psychothérapie | 2021-10-12 → 2025-11-18 (exact) |  | trouvé | Suivi psychologique · 2021-10-12 → 2025-11-18 |
| Prises en charge | Hospitalisation en orthopédie | 2022-02-19 → 2022-02-26 (exact) |  | trouvé | Hospitalisation pour fracture de la cheville · 2022-02-19 → 2022-02-26 |
| Prises en charge | SSR addictologique (clinique fictive des Pins-Gris) | 2023-04-17 → 2023-06-09 (exact) |  | trouvé | SSR addictologique Pins-Gris · 2023-04-17 → 2023-06-09 |
| Prises en charge | EMDR | 2023-07 → 2025-09 (month) |  | trouvé | EMDR · 2023-07 → 2025-09 |
| Prises en charge | Sevrage ambulatoire | 2025-02-11 → 2025-02-18 (exact) |  | trouvé | Passage IDE quotidien (sevrage ambulatoire) · 2025-02-11 → 2025-02-18 |
| Événements de vie | Emploi de secrétaire comptable (Transports fictifs Lamarque) | 1991 → 2014 (year) |  | trouvé | Emploi de secrétaire comptable · 1991 → 2014 |
| Événements de vie | Mariage avec Bruno TOULOUZE | 1994 (year) |  | trouvé | Mariage · 1994 → 2006 ⚠ fin compatible |
| Événements de vie | Naissance de Mélanie | 1995 (approx) |  | trouvé | Naissance de la fille · 1995 → 1996 ⚠ fin compatible |
| Événements de vie | Naissance de Teddy | 1998 (approx) |  | trouvé | Naissance du fils · 1998 → 1998 ⚠ fin compatible |
| Événements de vie | Violences conjugales | 1996 → 2006 (approx) |  | trouvé | Violences conjugales · 1996 → 2006 |
| Événements de vie | Décès du père | 2003 (year) |  | trouvé | Décès du père · 2003 → 2003 ⚠ fin compatible |
| Événements de vie | Séparation | 2006 (year) |  | trouvé | Séparation d'avec le mari · 2006 → 2006 ⚠ fin compatible |
| Événements de vie | Divorce | 2008 (year) |  | trouvé | Divorce · 2008 → 2008 ⚠ fin compatible |
| Événements de vie | Placement des enfants (ASE) | 2009 → 2012 (year) |  | trouvé | Placement des enfants · 2009 → 2012 |
| Événements de vie | Installation à Bègles | 2010 (year) |  | trouvé | Logement HLM à Bègles · 2010 → 2019-04-16 ⚠ fin compatible |
| Événements de vie | Perte de contact avec ses enfants | 2014 (approx) |  | trouvé | Rupture de contact avec les enfants · 2014 → ⚠ « en cours » juste |
| Événements de vie | Licenciement | 2014 (year) |  | trouvé | Licenciement · 2014 → 2014 ⚠ fin compatible |
| Événements de vie | Vie de couple avec Jean-Luc MAUBOURGUET | 2017 → 2021-01-19 (year) |  | trouvé | Vie avec le compagnon · 2017 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Dette locative et commandement de quitter les lieux | 2018-03 (month) |  | mal daté | Dette de loyer · 2017-04 → |
| Événements de vie | Jugement d'expulsion | 2018-12-18 (exact) |  | manqué |  |
| Événements de vie | Expulsion du logement | 2019-04-16 (exact) |  | mal daté | Procédure d'expulsion · 2018-03 → 2019-04-16 |
| Événements de vie | Vie à la rue | 2019-04-16 → 2021-06-18 (exact) |  | trouvé | Sans-abri, tente · 2019 → 2021-06 |
| Événements de vie | Hôtel 115 (confinement) | 2020-03-20 → 2020-06-30 (exact) |  | trouvé | Hébergement à l'hôtel (115, confinement) · 2020-03-20 → 2020-06-30 |
| Événements de vie | Prostitution | 2020 → 2021-01 (approx) |  | trouvé | Prostitution · 2020 → 2021-01-19 |
| Événements de vie | Garde à vue | 2020-08 (month) |  | trouvé | Garde à vue · 2020-08 → 2020-08 ⚠ fin compatible |
| Événements de vie | Décès de son compagnon | 2021-01-19 (exact) |  | trouvé | Décès du compagnon · 2021-01-19 → 2021-01-19 ⚠ fin compatible |
| Événements de vie | Halte de nuit femmes | 2021-01-26 → 2021-06-18 (exact) |  | trouvé | Halte de nuit femmes · 2021-01-26 → 2021-06-07 ⚠ fin compatible |
| Événements de vie | CHRS Le Fanal | 2021-06-18 → 2023-08 (exact) |  | trouvé | CHRS Le Fanal · 2021-06-18 → 2023-08 |
| Événements de vie | Curatelle renforcée | 2022-01-18 → (exact) |  | trouvé | Curatelle renforcée · 2022-01-18 → 2027-01 ⚠ fin compatible, « en cours » juste |
| Événements de vie | Reprise de contact avec sa fille | 2022-12 (month) |  | trouvé | Reprise de contact avec la fille · 2022-12-24 → 2022-12-24 ⚠ fin compatible |
| Événements de vie | Effacement de la dette locative (rétablissement personnel) | 2023-07 (month) |  | manqué |  |
| Événements de vie | Pension de famille Les Ajoncs (Cenon) | 2023-09-01 → (exact) |  | trouvé | Pension de famille Les Ajoncs · 2023-09-01 → |
| Événements de vie | Naissance de son petit-fils Lyam | 2023-10-14 (exact) |  | trouvé | Naissance du petit-fils · 2023-10-14 → 2023-10-14 ⚠ fin compatible |
| Événements de vie | Refus de contact de son fils | 2024-11 (month) |  | trouvé | Refus du fils de la voir · 2024-12 → 2024-12 ⚠ fin compatible |
| Événements de vie | Allocation aux adultes handicapés | 2025-06 → (month) |  | manqué |  |
| Événements de vie | Décès de sa mère | 2025-07-08 (exact) |  | trouvé | Décès de la mère · 2025-07-08 → 2025-07-08 ⚠ fin compatible |
| Événements de vie | Reprise de contact avec son fils | 2025-07-12 (exact) |  | trouvé | Retrouvailles avec le fils · 2025-07-12 → ⚠ « en cours » juste |
| Événements de vie | Bénévolat à l'épicerie solidaire de Cenon | 2026-05 → (month) |  | trouvé | Bénévolat à l'épicerie solidaire de Cenon · 2026-05 → |

En plus (passage `regroupe2`), à relire : vrai mais absent de la vérité, ou erreur.

- Usages et comportements · **Alcool** · 2019-07-09 · usage — Vin en brique, 2 ou 3 litres à deux, à la rue ; alcool inchangé en nov. et déc. 2019
- Médicaments · **Alprazolam** · 2018-11-27 → 2019-04 — Re-prescrit 0,5 mg x3 par le médecin traitant « pour éviter une nouvelle crise » ; perdu lors du déménagement/expulsion
- Médicaments · **Diazépam IV** · 2020-01-10 → 2020-01-13 — Diazépam IV et thiamine en réanimation pour delirium tremens ; pas de BZD prévue à la sortie
- Psychopathologie · **Anxiété** · 2015 → — Angoisse pour laquelle l'alprazolam est prescrit depuis 2015 ; HAD anxiété 14
- Somatique · **Chutes à domicile** · 2018 → 2018 — Chutes à domicile liées à l'alcool, sans fracture
- Somatique · **Toux grasse** · 2019-11-05 — Toux grasse sans fièvre, plus légère le 10/12 ; accompagnement à la PASS
- Somatique · **Plaies infectées des pieds** · 2019-07-09 — Plaies infectées aux deux pieds, soins faits, orientation PASS
- Somatique · **Amaigrissement / dénutrition** · 2019-11-05 → — Perte de 5-6 kg en nov. 2019 ; poids 47 kg et dénutrition en janvier 2020 (58 kg en 2018)
- Événements de vie · **Enfance avec père buveur** · 1978 → 1983 — Enfance à Marmande « avec un père qui buvait », disputes le samedi soir, pas de violence physique
- Événements de vie · **Scolarité** · 1984 → 1990 — Bonne élève jusqu'au collège, lycée professionnel, bac pro de secrétariat en 1990
- Événements de vie · **RSA** · 2015 → — Au RSA depuis 2015 (environ 550 €), sans droits chômage
- Événements de vie · **Enfants partis chez leur père** · 2009 → 2009 — Les enfants partent vivre chez leur père
- Événements de vie · **Hébergement chez un ami à Bordeaux** · 2019-04-16 → 2019-05 — Dort dans le salon d'un ami du compagnon après l'expulsion, « de canapé en canapé »
- Événements de vie · **Sans-abri, tente** · 2019-05 → — Tente quai de Paludate près de la gare Saint-Jean depuis fin mai, puis sous le pont côté Bastide (nov. 2019)
- Usages et comportements · **Alcool** · 2008 → 2008 · usage — Escalade de la consommation liée aux démarches du divorce ('quand il fallait le revoir chez l'avocat')
- Somatique · **Amaigrissement** · 2020-07 → 2021-06 — A maigri (07/2020), perte de poids (09/2020), 49 kg (02/2021), 50 kg (06/2021)
- Somatique · **Plaies des mains et toux** · 2021-02 → 2021-02 — Plaies des mains et toux à l'examen du 02/02/2021
- Somatique · **Mauvais état dentaire** · 2021-06-07 → — Plusieurs extractions à prévoir
- Psychopathologie · **Humeur dépressive** · 2020-02 → 2020-02 — Humeur basse, anhédonie, 'je survis' ; pas d'idées suicidaires
- Psychopathologie · **Idées de mort** · 2021-01-26 → — Sans scénario, critique partielle ; quotidiennes début 02/2021, moins présentes en 11/2021, sans idées suicidaires
- Psychopathologie · **Cauchemars du décès du compagnon** · 2021-01 → — Cauchemars presque quotidiens, réveils en sursaut, vérifie la respiration de sa voisine de chambre
- Médicaments · **Alprazolam** · 2015 → 2019 — Prescrit de 2015 à 2019, remplacé par du clonazépam de rue
- Médicaments · **Thiamine** · 2020-01 → — 250 mg/j sur ordonnance ; 500 mg IV 3 jours à l'entrée de 06/2021, puis 250 mg/j
- Médicaments · **Vitamine B6** · 2021-06-18 → 2021-06-18 — Prescrite à la sortie
- Prises en charge · **Suivi CSAPA** · 2020-02-11 → — Première consultation accompagnée par l'EMPP ; rendez-vous non honorés en 10/2020 et 03/2021
- Prises en charge · **CAARUD** · 2020-07 → 2021-09 — Kits base, matériel de dépistage (TROD) et aide aux papiers ; dernière mention le 21/09/2021
- Prises en charge · **Suivi social (assistante sociale)** · 2021-03-16 → — Reprise du suivi : SIAO, RSA, curatelle, AAH, papiers
- Événements de vie · **Violence de l'ex-mari : poussée dans l'escalier** · 2005 → 2005 — Perte de connaissance, 2 jours à l'hôpital de Marmande ; elle avait dit être tombée
- Événements de vie · **RSA suspendu** · 2019 → 2021 — Suspendu depuis l'été 2019 (pas de déclaration), rétabli à l'été 2021 sur un compte ouvert au CHRS
- Événements de vie · **Retour au squat puis à la tente** · 2020-06-30 → 2021-01-19 — Squat à Bacalan puis tente ; pas de place 115 pour le couple
- Événements de vie · **Perte des papiers d'identité** · 2021-01 → 2021-01 — Perdus dans l'intervention des secours ; refaits avec le CAARUD
- Événements de vie · **Demande de CHRS (SIAO)** · 2021-03-16 → 2021-06-18 — Avis favorable de principe du CHRS Le Fanal, sous réserve du sevrage
- Événements de vie · **Atelier cuisine du CHRS** · 2021-09 → — Participe à l'atelier cuisine, demande à aider à la comptabilité
- Événements de vie · **Demande d'AAH** · 2022-01 → 2022-01 — Dossier MDPH à constituer ; envie de refaire de la comptabilité, même bénévole
- Usages et comportements · **Alcool** · 2008 · usage — Perte de contrôle vers 2008
- Usages et comportements · **Alcool** · 2024-12 → 2024-12 · usage — Boit un peu plus le soir après le refus de son fils
- Usages et comportements · **Alcool** · 2025-02-11 → · usage — Abstinente depuis le 11/02/2025 ; craving fort le soir des obsèques de sa mère, géré
- Psychopathologie · **Difficultés exécutives (MoCA 25/30)** · 2023-06 → 2023-06 — MoCA à 25/30 (fonctions exécutives) au SSR, à recontrôler
- Psychopathologie · **Deuil de la mère** · 2025-07-08 — Tristesse sans épisode dépressif caractérisé
- Somatique · **Soins dentaires et pédicurie** · 2023-09 — RDV dentaire obtenu (C2S), pédicure-podologue pour la neuropathie
- Médicaments · **Thiamine** · 2022-04-05 → 2023-03-14 — Thiamine en 2022-2023 (vitamine B6 associée en avril 2022)
- Prises en charge · **CMP** · 2007 → 2007 — Suivi en CMP quelques mois après l'intoxication de 2007
- Prises en charge · **CAARUD** · 2024-04 → 2024-05 — Retour au CAARUD une fois pour des pipes propres
- Prises en charge · **Suivi tabacologique IDE** · 2025-05-13 → — Suivi mensuel
- Événements de vie · **Surendettement** · 2023-07 → 2023-07 — Effacement de la dette locative (rétablissement personnel)
- Événements de vie · **Demande d'AAH** · 2023-06 → 2025-06 — Dossier déposé en juin 2023 ; AAH accordée à compter de juin 2025 (taux 50-79 %)
- Événements de vie · **Mère hospitalisée** · 2025-04 → 2025-07-08 — Insuffisance cardiaque, hospitalisée à Marmande ; retrouve sa sœur
- Événements de vie · **AAH** · 2025-06 → — AAH accordée par la MDPH à compter de juin 2025, en remplacement du RSA ; rappel versé en août
- Événements de vie · **RSA** · 2025-06 — RSA remplacé par l'AAH à compter de juin 2025
- Événements de vie · **Succession de la mère (maison de Marmande)** · 2025-09 → — Maison à Marmande en indivision avec sa sœur, pas de décision
- Événements de vie · **Retrouve la tombe de [PERSONNE_1]** · 2026-01-19 — Le 19/01 passé avec [PROCHE_3] et le petit au cimetière de Bordeaux, tombe enfin retrouvée
- Événements de vie · **Reprise de contact avec la sœur** · 2025-11 — Reprise de contact avec sa sœur mentionnée au bilan de novembre 2025
- Événements de vie · **Relations avec la fille et le petit-fils** · 2025-11-18 → — Fille et petit-fils réguliers
- Usages et comportements · **Benzodiazépines (clonazépam de rue)** · 2024-02 · usage — Pas de BZD depuis février 2024
- Prises en charge · **Sevrage ambulatoire au CSAPA** · 2025-02 — Sevrage ambulatoire de février 2025
- Prises en charge · **CAARUD** · 2024 — Passage au CAARUD pendant la période de rue ; plus de passage depuis 2024

