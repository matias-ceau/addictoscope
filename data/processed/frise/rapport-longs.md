# Frise des dossiers fictifs longs, notée contre `verite.json`

- Demandes de l'application (anthropic/claude-sonnet-5.5) écrites dans des fichiers et répondues par des sous-agents, une demande par sous-agent, sans rien d'autre sous les yeux ; 1 passage(s) par dossier ; aucun appel payant.
- Dates des passages : 2026-11-10 → 2026-11-10.
- Chemin de l'application : couche texte → détections automatiques acceptées telles quelles → masquage → vérification → identifiants restés lisibles masqués à la main (à la place de la relecture humaine, comptés plus bas) → découpage par règles quand la mise en page est reconnue, par le modèle sinon → frise.
- Tolérance sur les dates selon la certitude attendue : exacte ±3 j, mois ±15 j, année : l'année, approximative ±1 an.
- « Trouvé » = même piste, même libellé (à la formulation près), début compatible. La précision est une borne basse : un événement « en plus » peut être vrai et absent de la vérité.
- Sur une piste de consommation, une molécule opioïde vaut pour sa classe (« Oxycodone » attendu, « Opioïdes » rendu) ; jamais sur une piste de médicament.
- Les frises lues en plusieurs lots sont regroupées par une demande de plus (sans texte d'observation) : les tableaux notent la frise regroupée, la section « Regroupement des doublons » la compare à la frise telle que lue. Une piste regroupée répond à tous les intitulés sous lesquels elle a été lue.

## Synthèse

| Dossier | Attendus | Trouvés | Mal datés | Autre piste | Manqués | Produits | Rappel | Précision (borne basse) | Observations rendues / attendues |
|---|---|---|---|---|---|---|---|---|---|
| `alcool-rechutes` | 98 | 86 | 3 | 1 | 8 | 149 | 88 % | 58 % | 76/76 |
| `antalgiques-douleur` | 84 | 71 | 2 | 1 | 10 | 114 | 85 % | 62 % | 75/75 |
| `cannabis-psychose` | 71 | 65 | 2 | 0 | 4 | 133 | 92 % | 49 % | 74/74 |
| `cocaine-cadre` | 85 | 72 | 1 | 1 | 11 | 111 | 85 % | 65 % | 76/76 |
| `opiaces-parcours` | 80 | 73 | 3 | 1 | 3 | 168 | 91 % | 43 % | 75/75 |
| `polyconso-precarite` | 114 | 101 | 4 | 1 | 8 | 177 | 89 % | 57 % | 75/75 |
| **Total** | 532 | 468 | | | | 852 | 88 % | 55 % | |

## Regroupement des doublons

Les lots sont lus indépendamment et le dossier raconte lui-même plusieurs fois le passé : le même fait revient sous des intitulés et des dates qui varient. Une demande de plus montre au modèle les pistes et les événements trouvés, sans aucun texte d'observation, et lui demande lesquels désignent la même chose ; le code fusionne après contrôle (`web/src/notebook/consolidate.ts`). Chaque case : frise lue → frise regroupée.

| Passage | Dossier | Lots | Pistes attendues | Pistes | Événements | Trouvés | dont la date est sous la barre | Précision (borne basse) | Fin compatible | « En cours » juste | Dates discordantes signalées | Coût estimé de la demande |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| regroupe1 | `alcool-rechutes` | 4 | 64 | 113 → 91 | 204 → 149 | 88 → 86/98 | 1 | 43 % → 58 % | 36/54 → 38/56 | 73/88 → 77/86 | 13 | 0.05 $ |
| regroupe1 | `antalgiques-douleur` | 4 | 73 | 110 → 78 | 177 → 114 | 73 → 71/84 | 0 | 41 % → 62 % | 31/41 → 29/40 | 68/73 → 64/71 | 14 | 0.05 $ |
| regroupe1 | `cannabis-psychose` | 4 | 58 | 120 → 92 | 193 → 133 | 65 → 65/71 | 0 | 34 % → 49 % | 38/53 → 40/54 | 58/65 → 59/65 | 15 | 0.05 $ |
| regroupe1 | `cocaine-cadre` | 4 | 59 | 90 → 71 | 151 → 111 | 74 → 72/85 | 1 | 49 % → 65 % | 23/48 → 26/47 | 56/74 → 60/72 | 9 | 0.04 $ |
| regroupe1 | `opiaces-parcours` | 4 | 70 | 136 → 105 | 228 → 168 | 73 → 73/80 | 0 | 32 % → 43 % | 35/48 → 36/48 | 63/73 → 65/73 | 6 | 0.06 $ |
| regroupe1 | `polyconso-precarite` | 4 | 80 | 156 → 116 | 241 → 177 | 104 → 101/114 | 2 | 43 % → 57 % | 38/63 → 38/62 | 90/104 → 93/101 | 12 | 0.07 $ |
| **Total** | | | 404 | 725 → 553 | 1194 → 852 | 477 → 468/532 (90 % → 88 %) | 4 | 40 % → 55 % | 201/307 → 207/307 | 408/477 → 418/468 | 69 | 0.33 $ |

« Dont la date est sous la barre » : événements attendus qui ne sont plus « trouvés » parce que la barre regroupée commence à une autre date (le début d'un trouble et son diagnostic des années plus tard, par exemple), mais dont la date attendue figure parmi les mentions regroupées, affichées au survol. Les autres pertes : deux faits proches fusionnés à tort (une séparation et le divorce qui la suit), et quelques appariements qui n'étaient justes que par chance dans la frise lue.

## Rappel selon l'origine de l'événement

Un dossier long raconte le passé deux fois : à l'observation d'entrée, puis au fil du suivi, où des éléments du passé ne sont dits ou retrouvés que tard.

| Origine | `alcool-rechutes` | `antalgiques-douleur` | `cannabis-psychose` | `cocaine-cadre` | `opiaces-parcours` | `polyconso-precarite` | Total |
|---|---|---|---|---|---|---|---|
| Rapporté à l'entrée (antécédents) | 17/19 | 19/24 | 11/13 | 12/15 | 23/24 | 22/24 | 104/119 (87 %) |
| Vécu pendant le suivi | 60/69 | 42/47 | 44/48 | 50/56 | 38/44 | 70/80 | 304/344 (88 %) |
| Révélé tard (passé appris en cours de suivi) | 9/10 | 10/13 | 10/10 | 10/14 | 12/12 | 9/10 | 60/69 (87 %) |

## Volume, relecture simulée et coût

Coût estimé d'appels payants équivalents : caractères échangés ÷ 3 par jeton de demande (valeur usuelle pour du français) et ÷ 1.47 par jeton de réponse (mesuré sur les passages payants des dossiers courts), aux prix facturés lors de ces passages. Une estimation, pas une facture.

| Passage | Dossier | Pages | Observations | Découpage | Identifiants laissés par les règles (masqués à la main) | Demandes | Caractères envoyés | Caractères reçus | Coût estimé |
|---|---|---|---|---|---|---|---|---|---|
| regroupe1 | `alcool-rechutes` | 22 | 76 | courrier : modèle, historique : règles | 0 | 6 | 133425 | 71840 | 0.58 $ |
| regroupe1 | `antalgiques-douleur` | 25 | 75 | courrier : modèle, historique : règles | 0 | 6 | 133620 | 63780 | 0.52 $ |
| regroupe1 | `cannabis-psychose` | 26 | 74 | historique : règles | 0 | 5 | 133606 | 66184 | 0.54 $ |
| regroupe1 | `cocaine-cadre` | 23 | 76 | historique : règles, urgences : modèle | 1 | 6 | 135968 | 55439 | 0.47 $ |
| regroupe1 | `opiaces-parcours` | 26 | 75 | historique : règles | 0 | 5 | 138480 | 80229 | 0.64 $ |
| regroupe1 | `polyconso-precarite` | 21 | 75 | historique : règles | 0 | 5 | 137694 | 83003 | 0.66 $ |
| **Total** | | 143 | 451 | | 1 | 33 | 812793 | 420475 | 3.40 $ (0.57 $ par dossier) |

## Exactitude des événements trouvés

| Contrôle | `alcool-rechutes` | `antalgiques-douleur` | `cannabis-psychose` | `cocaine-cadre` | `opiaces-parcours` | `polyconso-precarite` | Total |
|---|---|---|---|---|---|---|---|
| début aussi précis | 99 % | 93 % | 89 % | 99 % | 90 % | 93 % | 94 % (440/468) |
| fin compatible | 68 % | 72 % | 74 % | 55 % | 75 % | 61 % | 67 % (207/307) |
| « en cours » juste | 90 % | 90 % | 91 % | 83 % | 89 % | 92 % | 89 % (418/468) |
| mode d'usage juste | 96 % | 100 % | 100 % | 93 % | 94 % | 89 % | 95 % (124/131) |
| au moins une source attendue | 100 % | 100 % | 98 % | 97 % | 96 % | 98 % | 98 % (460/468) |

## Rappel par piste (tous dossiers, tous passages)

| Piste | Trouvés / attendus | Rappel |
|---|---|---|
| Consommations | 131/140 | 94 % |
| Psychopathologie | 25/31 | 81 % |
| Somatique | 34/39 | 87 % |
| Médicaments | 81/85 | 95 % |
| Prises en charge | 67/74 | 91 % |
| Événements de vie | 130/163 | 80 % |

## Validation par le code

Événements rendus par le modèle, puis écartés ou fusionnés par `assembleTimeline` (`web/src/notebook/timeline.ts`), avant tout regroupement. Un événement sans début dans le texte est gardé s'il a une fin ou s'il est en cours : il est placé à la première observation datée qui le mentionne, et signalé « début non précisé ».

| Passage | Dossier | Rendus | Piste inconnue | Ni date ni âge | Sans source connue | Fusionnés (même événement lu dans deux lots) | Gardés | dont datés par l'âge | dont placés à la première mention |
|---|---|---|---|---|---|---|---|---|---|
| regroupe1 | `alcool-rechutes` | 216 | 0 | 0 | 0 | 12 | 204 | 20 | 7 |
| regroupe1 | `antalgiques-douleur` | 187 | 0 | 1 | 0 | 9 | 177 | 1 | 14 |
| regroupe1 | `cannabis-psychose` | 199 | 0 | 1 | 0 | 5 | 193 | 14 | 4 |
| regroupe1 | `cocaine-cadre` | 156 | 0 | 1 | 0 | 4 | 151 | 11 | 4 |
| regroupe1 | `opiaces-parcours` | 245 | 0 | 0 | 0 | 17 | 228 | 16 | 7 |
| regroupe1 | `polyconso-precarite` | 254 | 0 | 0 | 0 | 13 | 241 | 6 | 1 |

## Découpage en observations

| Passage | Document | Attendues | Rendues | Dates justes |
|---|---|---|---|---|
| regroupe1 | `alcool-rechutes/courrier.pdf` | 1 | 1 | 0/0 |
| regroupe1 | `alcool-rechutes/historique.pdf` | 75 | 75 | 75/75 |
| regroupe1 | `antalgiques-douleur/courrier.pdf` | 1 | 1 | 0/0 |
| regroupe1 | `antalgiques-douleur/historique.pdf` | 74 | 74 | 74/74 |
| regroupe1 | `cannabis-psychose/historique.pdf` | 74 | 74 | 74/74 |
| regroupe1 | `cocaine-cadre/historique.pdf` | 75 | 75 | 75/75 |
| regroupe1 | `cocaine-cadre/urgences.pdf` | 1 | 1 | 0/0 |
| regroupe1 | `opiaces-parcours/historique.pdf` | 75 | 75 | 75/75 |
| regroupe1 | `polyconso-precarite/historique.pdf` | 75 | 75 | 75/75 |

## Détail par dossier

### `alcool-rechutes`

Statut au passage `regroupe1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Alcool | 1987 → 1992 (approx) | usage | trouvé | Alcool · 1988 → 1990 · usage |
| Consommations | Alcool | 1992 → 2003 (approx) | usage | trouvé | Alcool · 1992 → 1998 · usage ⚠ fin compatible |
| Consommations | Alcool | 2003 → 2011-03 (approx) | usage | trouvé | Alcool · 2002 → 2004 · usage ⚠ fin compatible |
| Consommations | Alcool | 2011-03 (month) | sevrage | trouvé | Alcool · 2011-03 → 2011-03 · sevrage ⚠ fin compatible |
| Consommations | Alcool | 2014 (year) | sevrage | trouvé | Alcool · 2014 · sevrage |
| Consommations | Alcool | 2016 (year) | sevrage | trouvé | Alcool · 2016 · sevrage |
| Consommations | Alcool | 2017 → 2019-06-17 (year) | rechute | trouvé | Alcool · 2017 · rechute ⚠ fin compatible |
| Consommations | Alcool | 2019-06-17 → 2019-06-28 (exact) | sevrage | trouvé | Alcool · 2019-06-17 → 2019-06-28 · sevrage |
| Consommations | Alcool | 2019-12-24 → 2020-05 (exact) | rechute | trouvé | Alcool · 2019-12-24 · rechute ⚠ fin compatible |
| Consommations | Alcool | 2020-05 → 2020-09-15 (month) | usage | mal daté | Alcool · 2020-04-07 · usage |
| Consommations | Alcool | 2020-09-15 → 2021-01 (exact) | usage | trouvé | Alcool · 2020-09 → 2021-01 · usage |
| Consommations | Alcool | 2021-01 → 2021-03-26 (month) | usage | trouvé | Alcool · 2021-01 → 2021-03-26 · usage |
| Consommations | Alcool | 2021-03-26 → 2021-03-28 (exact) | sevrage | trouvé | Alcool · 2021-03-26 → 2021-03-28 · sevrage |
| Consommations | Alcool | 2021-04-06 → 2021-04-19 (exact) | sevrage | trouvé | Alcool · 2021-04-06 → 2021-04-19 · sevrage |
| Consommations | Alcool | 2022-08-13 → 2022-11-12 (exact) | rechute | trouvé | Alcool · 2022-08-13 → 2022-11-12 · rechute |
| Consommations | Alcool | 2022-11-12 → 2023-01-17 (exact) | usage | trouvé | Alcool · 2022-11-12 → 2023-01-17 · rechute ⚠ mode d'usage juste |
| Consommations | Alcool | 2023-01-17 (exact) | sevrage | trouvé | Alcool · 2023-01-17 → 2023-02-09 · sevrage ⚠ fin compatible |
| Consommations | Alcool | 2023-04 → 2023-12-04 (month) | rechute | trouvé | Alcool · 2023-04 → 2023-12-04 · rechute |
| Consommations | Alcool | 2023-12-04 → 2023-12-13 (exact) | sevrage | trouvé | Alcool · 2023-12-04 → 2023-12-13 · sevrage |
| Consommations | Alcool | 2025-03-14 → 2025-04-11 (exact) | rechute | trouvé | Alcool · 2025-03-14 → 2025-04-11 · rechute |
| Consommations | Alcool | 2025-04-11 → 2025-04-19 (exact) | sevrage | trouvé | Alcool · 2025-04-11 → 2025-04-19 · sevrage |
| Consommations | Tabac | 1986 → 2024-01-29 (approx) | usage | trouvé | Tabac · 1986 → 2024-01-29 · usage |
| Consommations | Tabac | 2024-01-29 (exact) | sevrage | manqué |  |
| Consommations | Tabac | 2024-04 → (month) | rechute | trouvé | Tabac · 2024-04 → · rechute |
| Consommations | Cannabis | 1991 (approx) | usage | trouvé | Cannabis · 1990 → 1992 · usage ⚠ fin compatible |
| Consommations | Cocaïne | 2005 → 2008 (approx) | usage | trouvé | Cocaïne · 2005 → 2008 · usage |
| Consommations | Benzodiazépines | 2022-07 → 2023-03-21 (approx) | usage | trouvé | Benzodiazépines · 2022-07 → 2023-03-21 · usage |
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
| Médicaments | Diazépam | 2023-01 → 2023-02 (month) |  | manqué |  |
| Médicaments | Disulfirame | 2023-02-14 → 2023-04 (exact) |  | trouvé | Disulfirame · 2023-02-14 → 2023-04 |
| Médicaments | Diazépam | 2023-03-21 → 2023-12-13 (exact) |  | trouvé | Diazépam · 2023-03-21 → 2023-12-13 |
| Médicaments | Naltrexone | 2023-12-14 → 2025-02 (exact) |  | trouvé | Naltrexone · 2023-12-14 → 2025-02 |
| Médicaments | Varénicline | 2024-01-15 → 2024-04 (exact) |  | trouvé | Varénicline · 2024-01-15 ⚠ fin compatible |
| Médicaments | Diazépam | 2025-04-11 → 2025-04-19 (exact) |  | trouvé | Diazépam · 2025-04-11 → 2025-04-19 |
| Médicaments | Naltrexone | 2025-04-22 → 2026-03-10 (exact) |  | trouvé | Naltrexone · 2025-04-22 → 2026-03-10 |
| Médicaments | Substituts nicotiniques | 2026-10-06 → (exact) |  | trouvé | Patchs nicotiniques · 2026-10-06 → |
| Psychopathologie | Épisode dépressif | 2009 (year) |  | trouvé | Épisode dépressif caractérisé · 2009 |
| Psychopathologie | Tentative de suicide | 2009-09 (month) |  | trouvé | Tentative de suicide · 2009-09 |
| Psychopathologie | Épisode dépressif | 2016 → 2017 (approx) |  | trouvé | Épisode dépressif caractérisé · 2016 ⚠ fin compatible |
| Psychopathologie | Épisode dépressif caractérisé | 2020-04 → 2021-06 (month) |  | trouvé | Épisode dépressif caractérisé · 2020-04 → 2021-06 |
| Psychopathologie | Épisode dépressif caractérisé sévère | 2022-11 → 2023-08 (approx) |  | trouvé | Épisode dépressif caractérisé · 2022-11 → 2023-03 |
| Psychopathologie | Crise suicidaire | 2023-01 → 2023-01-17 (month) |  | mal daté | Idées suicidaires · 2022-11-29 → 2023-02-14 |
| Somatique | Hépatopathie alcoolique | 2019-06 → (month) |  | autre piste | Alcool · 2019-06-28 → 2019-12-24 |
| Somatique | Fracture du calcanéum gauche | 2019-10-15 (exact) |  | trouvé | Fracture du calcanéum gauche · 2019-10-15 |
| Somatique | Crise convulsive de sevrage | 2021-03-28 (exact) |  | trouvé | Crise convulsive de sevrage · 2021-03-28 |
| Prises en charge | Hospitalisation pour sevrage | 2011-03 (month) |  | trouvé | Hospitalisation de sevrage · 2011-03 → 2011-03 ⚠ fin compatible |
| Prises en charge | Hospitalisation pour sevrage | 2016 (year) |  | trouvé | Hospitalisation de sevrage · 2016 |
| Prises en charge | Suivi en CSAPA | 2019-05-07 → (exact) |  | trouvé | Suivi CSAPA · 2019-05-07 → |
| Prises en charge | Accompagnement social | 2019-05-28 (exact) |  | trouvé | Suivi social · 2019-05-28 → ⚠ « en cours » juste |
| Prises en charge | Hospitalisation pour sevrage | 2019-06-17 → 2019-06-28 (exact) |  | trouvé | Hospitalisation de sevrage · 2019-06-17 → 2019-06-28 |
| Prises en charge | Psychothérapie | 2020-06-09 → 2023-01 (approx) |  | trouvé | Suivi psychologique · 2020-06-09 → ⚠ fin compatible, « en cours » juste |
| Prises en charge | Hospitalisation pour sevrage | 2021-04-06 → 2021-04-19 (exact) |  | trouvé | Hospitalisation de sevrage · 2021-04-06 → 2021-04-19 |
| Prises en charge | SSR addictologique | 2021-05-10 → 2021-06-11 (exact) |  | trouvé | SSR addictologique (Cadillac) · 2021-05-10 → 2021-06-11 |
| Prises en charge | Groupe de prévention de la rechute | 2021-06-22 (exact) |  | trouvé | Groupe de prévention de la rechute · 2021-06-22 → ⚠ « en cours » juste |
| Prises en charge | Suivi éducatif | 2022-03-08 (exact) |  | trouvé | Accompagnement éducatif et projet professionnel · 2022-03-08 → ⚠ « en cours » juste |
| Prises en charge | Hospitalisation en psychiatrie | 2023-01-17 → 2023-02-09 (exact) |  | trouvé | Hospitalisation en psychiatrie · 2023-01-17 → 2023-02-09 |
| Prises en charge | Psychothérapie | 2025-06-17 → (exact) |  | mal daté | Suivi psychologique · 2025-04-10 → |
| Événements de vie | Violences paternelles subies | 1981 → 1989 (approx) |  | trouvé | Violences paternelles dans l'enfance · 1981 → 1989 |
| Événements de vie | Apprentissage, CAP de maçon | 1989 (approx) |  | trouvé | Apprentissage de maçon (CAP) · 1989 |
| Événements de vie | Service militaire | 1992 (approx) |  | trouvé | Service militaire · 1992 |
| Événements de vie | Emploi dans une entreprise de maçonnerie | 1993 → 2021-06-08 (approx) |  | trouvé | Emploi dans une entreprise de maçonnerie · 1993 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Mariage | 1999 → 2020-01-03 (year) |  | trouvé | Mariage · 1999 ⚠ fin compatible |
| Événements de vie | Naissance de son fils Kevin | 2001 (approx) |  | manqué |  |
| Événements de vie | Naissance de sa fille Manon | 2006 (approx) |  | manqué |  |
| Événements de vie | Contrôle routier sous alcool | 2018-12-22 (exact) |  | trouvé | Contrôle routier, alcoolémie 1,6 g/L · 2018-12-22 |
| Événements de vie | Annulation du permis, obligation de soins | 2019-03-19 (exact) |  | trouvé | Annulation du permis et obligation de soins · 2019-03-19 → 2024-06-12 ⚠ fin compatible |
| Événements de vie | Reprise du travail | 2019-07-08 (exact) |  | trouvé | Reprise du travail · 2019-07-08 |
| Événements de vie | Conduite sans permis | 2019 → 2020-02 (year) |  | trouvé | Conduite sans permis · 2019 → 2020-02 |
| Événements de vie | Accident du travail, arrêt de travail | 2019-10-15 → 2021-06-08 (exact) |  | trouvé | Arrêt de travail (accident du travail) · 2019-10-15 → 2021-06-08 |
| Événements de vie | Séparation | 2020-01-03 (exact) |  | trouvé | Séparation conjugale puis divorce · 2020-01-03 → 2021-10-05 ⚠ fin compatible |
| Événements de vie | Contrôle au volant sans permis | 2020-02 (month) |  | manqué |  |
| Événements de vie | Logement : T2 à Langon | 2020-02-01 → 2023-09 (exact) |  | trouvé | Emménagement dans un T2 à Langon · 2020-02-01 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Jugement du JAF | 2020-06-16 (exact) |  | trouvé | Jugement du JAF (garde) · 2020-06-16 |
| Événements de vie | Vente de la maison de Toulenne | 2021-05 (month) |  | trouvé | Vente de la maison de Toulenne · 2021-05 |
| Événements de vie | Licenciement pour inaptitude | 2021-06-08 (exact) |  | trouvé | Licenciement pour inaptitude · 2021-06-08 |
| Événements de vie | Condamnation pour conduite sans permis | 2021-07-06 (exact) |  | trouvé | Condamnation pour conduite sans permis · 2021-07-06 |
| Événements de vie | Divorce | 2021-10-05 (exact) |  | manqué |  |
| Événements de vie | RQTH | 2021 (year) |  | trouvé | Dossier RQTH (MDPH) · 2021-05 |
| Événements de vie | Surendettement | 2021-11-18 (exact) |  | trouvé | Dossier de surendettement déposé · 2021-11-18 |
| Événements de vie | Décès de son père | 2022-11-12 (exact) |  | trouvé | Décès du père · 2022-11-12 |
| Événements de vie | Relation avec Patricia | 2022-11 → (month) |  | manqué |  |
| Événements de vie | Vie commune à Saint-Macaire | 2023-09 → (month) |  | trouvé | Installation chez la compagne (Saint-Macaire) · 2023-09 → |
| Événements de vie | Permis de conduire récupéré | 2024-06-12 (exact) |  | manqué |  |
| Événements de vie | Naissance de sa petite-fille Lina | 2025-01-21 (exact) |  | trouvé | Naissance de la petite-fille · 2025-01-21 |
| Événements de vie | Formation de métreur (AFPA) | 2025-09-08 → 2026-06-05 (exact) |  | trouvé | Formation de métreur (AFPA Bordeaux) · 2025-09-08 → 2026-06-05 |
| Événements de vie | CDD de métreur | 2026-09-01 → (exact) |  | trouvé | CDD de métreur · 2026-09-01 → |

En plus (passage `regroupe1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Alcool** · 1987 · usage — Premier verre vers 14 ans, au mariage d'un cousin.
- Consommations · **Alcool** · 1988 → 1989 · intoxication — Ivresses du samedi soir avec les copains vers 15-16 ans (bière, vin, panaché). Début des consommations à 15 ans selon l'interne.
- Consommations · **Alcool** · 2016 → 2017 — Abstinence d'un an environ après le sevrage hospitalier.
- Consommations · **Alcool** · 2019-05-14 · usage — Consommation actuelle : 6 à 8 bières de 50 cl et 3 à 4 pastis par jour (12 à 15 UIA/j), premier verre vers 7h pour arrêter de trembler ; maximum plus de 20 verres certains samedis. Tremblements matinaux, sueurs, nausées. TUAL sévère, DSM-5 9/11, AUDIT 31 le 21/05.
- Consommations · **Alcool** · 2019-06-28 · craving — Craving modéré à la sortie, surtout à l'idée de reprendre le chantier ; « le plus dur c'est midi » le 16/07.
- Consommations · **Alcool** · 2019-09-17 · craving — Craving rare, surtout le vendredi soir. TUAL en début de rémission.
- Consommations · **Alcool** · 2019-11-26 · craving — Craving en hausse l'après-midi pendant l'arrêt de travail.
- Consommations · **Alcool** · 2020-02-04 · craving — Craving +++ « dès que j'ouvre l'oeil » ; 8 à 10 bières/j, tremblements matinaux persistants.
- Médicaments · **Paracétamol** · 2019-10-22 — Seul traitement pris après la fracture du calcanéum.
- Psychopathologie · **Tristesse réactionnelle** · 2020-01-09 — Tristesse, honte, sentiment d'échec et mauvais sommeil après la séparation ; pas de critère d'épisode dépressif caractérisé ni d'idées suicidaires. Pleurs le 07/01.
- Somatique · **Hypertension artérielle** · 2019-05-14 → — HTA non traitée ? (TA élevée chez le médecin traitant) ; TA 158/97 le 14/05/2019, 132/84 à la sortie, 150/92 en février 2020.
- Somatique · **Lombalgies chroniques** · 2019-05-14 → — Lombalgies chroniques liées au métier.
- Somatique · **Appendicectomie** · 1979 → 1984 — Appendicectomie dans l'enfance.
- Somatique · **Stéatose hépatique** · 2019-06-21 — Échographie : foie augmenté de volume, stéatose diffuse, sans dysmorphie, ascite ni lésion focale. GGT 412 en mai, 248 à la sortie, 64 en septembre.
- Prises en charge · **Sevrage ambulatoire avec le médecin traitant** · 2014 — Sevrage à la maison, tenu trois semaines.
- Prises en charge · **Groupe de parole et éducation thérapeutique** · 2019-06-21 → 2019-06-28 — Groupes de parole et atelier d'éducation thérapeutique « l'alcool et le foie » pendant le séjour.
- Événements de vie · **Dirigeant bénévole d'un club de football** · 2017 — Fonction arrêtée en 2017 « à cause de la buvette ».
- Événements de vie · **Tensions conjugales** · 2019-05-07 → 2020-01-03 — Ultimatum de l'épouse en mai 2019, disputes presque tous les soirs en novembre, entretiens de couple refusés par l'épouse.
- Événements de vie · **Arrêt de travail pour le sevrage** · 2019-06-28 → 2019-07-07 — Arrêt de travail jusqu'au 07/07.
- Événements de vie · **Accident du travail** · 2019-10-15 — Chute d'un échafaudage sur un chantier ; le patient affirme avoir été à jeun.
- Événements de vie · **Procédure devant le juge aux affaires familiales** · 2020 → — Épouse a saisi le juge, audience prévue au printemps ; le patient souhaite un week-end sur deux. Aide juridictionnelle déposée le 03/03.
- Événements de vie · **Confinement et isolement** · 2020-03 → 2020-05 — Seul dans son appartement, ne voit plus personne, enfants vus par vidéo.
- Psychopathologie · **Trouble de l'usage de l'alcool sévère** · 2003 → — TUAL sévère « depuis la trentaine » ; en début de rémission au 22/06/2021.
- Consommations · **Alcool** · 2020-06-23 · usage — 4 à 6 bières par jour, pas le matin ; TUAL sévère, réduction partielle.
- Consommations · **Alcool** · 2021-03-28 → 2021-04-06 · usage — Reprise de 8 à 10 bières/j depuis la crise « pour ne pas refaire une crise » ; dernière prise le matin de l'entrée (06/04, éthylotest 0,22 g/L).
- Consommations · **Alcool** · 2021-04-19 → — Abstinence après le sevrage (sortie mi-avril) : GGT 96, CDT normale en 10/2021 ; « toujours rien bu » le 18/01/2022. Le 22/06 et le 12/10/2021, le psychiatre écrit « abstinent depuis fin mars ».
- Consommations · **Alcool** · 2021-05-04 · craving — Craving modéré.
- Médicaments · **Thiamine** · 2020-06-23 — En renouvellement d'ordonnance ; 250 mg/j, 500 mg x 2 IV pendant le sevrage ; dernière mention le 22/06/2021.
- Psychopathologie · **Idées suicidaires** · 2020-03 → 2020-05 — A pensé à la nuit de 2009 pendant le premier confinement, « seul dans l'appartement, avec les bières », « sans aller plus loin » ; pas d'idées suicidaires lors des évaluations ultérieures.
- Psychopathologie · **Anxiété** · 2021-06-08 → — Anxiété importante depuis le licenciement (argent, avenir).
- Psychopathologie · **Alexithymie** · 2020-06-09 → — Alexithymie marquée, honte et image de soi dévalorisée relevées au bilan du premier entretien psychologique.
- Somatique · **Hépatopathie alcoolique, fibrose F3** · 2020-11-10 → — Fibroscan 13,2 kPa (F3) le 10/11/2020, 13,8 kPa le 14/04/2021 ; hépatologie le 05/10/2021 : F3, pas d'hypertension portale ; échographie semestrielle.
- Prises en charge · **Plan de crise** · 2020-11-24 — Plan de crise rédigé avec le patient après révélation de la TS ; paracétamol rangé chez son frère.
- Prises en charge · **Suivi social** · 2021-03-09 → — Aide aux démarches : RQTH, surendettement, courriers, aide juridictionnelle.
- Événements de vie · **Départ en apprentissage** · 1988 → 1989 — Départ en apprentissage « à 15-16 ans ».
- Événements de vie · **Chômage (inscription Pôle emploi, ARE)** · 2021-06 → — Inscription à Pôle emploi ; ARE d'environ 1 300 € en 11/2021.
- Événements de vie · **Difficultés financières et surendettement** · 2020-12 → — Deux crédits renouvelables pris en 2020, retards de paiement depuis décembre, retards de loyer, pension alimentaire de 200 € ; dossier recevable à la Banque de France (01/2022).
- Événements de vie · **Hébergement chez son frère** · 2021-03-28 → 2021-04-06 — Hébergé par son frère depuis la crise convulsive, qui l'a conduit à l'entrée ; nouvel hébergement prévu entre la sortie et le SSR.
- Événements de vie · **Hospitalisation du père (problèmes de foie)** · 2021 — Visite à son père à l'hôpital, avant le 07/09/2021 ; ambivalence (envie de lui crier dessus et de le serrer).
- Événements de vie · **Fêtes de fin d'année sans les enfants** · 2020-12 — Période passée sans les enfants (chez leur mère cette année), « le pire [...] de ma vie » ; le terme exact est pseudonymisé dans le texte.
- Médicaments · **Escitalopram** · 2022-04-05 → 2022-05 — Traitement en cours en avril 2022, diminué à 10 mg le 05/04 ; arrêté par le patient début mai après 3 semaines à 10 mg.
- Médicaments · **Acamprosate** · 2022-04-05 → 2022-08 — 2-2-2 en cours en avril 2022 ; arrêté par le patient à la mi-août 2022, non repris.
- Psychopathologie · **Violences paternelles dans l'enfance** · 1979 → 1984 — Violences paternelles dans l'enfance.
- Somatique · **Bilan biologique discordant** · 2023-10-31 — GGT 236, CDT 3,6 %, VGM 100, ASAT/ALAT 74/52, discordant avec l'abstinence déclarée.
- Prises en charge · **Obligation de soins** · 2019 — Obligation de soins en 2019 après annulation du permis.
- Prises en charge · **Groupe de prévention de la rechute** · 2022-04-05 — Un an d'abstinence fêté avec le groupe de prévention de la rechute.
- Prises en charge · **Suivi psychologique** · 2023-02-14 — Psychologue à reprendre.
- Prises en charge · **Sevrage ambulatoire** · 2023-12-04 → 2023-12-13 — Diazépam décroissant, thiamine, passage IDE quotidien à domicile les 4 premiers jours.
- Prises en charge · **Consultation tabac** · 2024-01-15 — Consultation tabac prévue le 15/01/2024.
- Prises en charge · **Sevrage ambulatoire** · 2025-04-11 → 2025-04-19 — Diazépam décroissant sur 8 jours, thiamine, passages IDE quotidiens les 3 premiers jours ; sans complication.
- Événements de vie · **Plan de surendettement** · 2024-05-14 → — Plan en cours, mensualité 180 €, fin prévue en 2027.
- Événements de vie · **Projet de reconversion professionnelle (métreur)** · 2022-03-08 → 2025-03-04 — Pistes métreur, dessinateur, conducteur de travaux ; Cap emploi ; dossier de formation accepté le 04/03/2025.
- Consommations · **Alcool** · 1986 → 2025-04-11 · usage — TUAL sévère, début vers 14 ans ; abstinent depuis le 11/04/2025.
- Consommations · **Tabac** · 2025-09-16 → · usage — 10 cigarettes par jour (début non daté, première mention le 16/09/2025) ; demande de substituts pour un mois sans tabac.
- Psychopathologie · **Épisode dépressif caractérisé** · 2025-11-18 → — Antécédent rappelé le 18/11/2025, début non daté ; thymie euthymique puis stable depuis 3 ans sous venlafaxine.
- Prises en charge · **Suivi psychiatrique addictologique** · 2025-09-16 → — Consultations psychiatre addictologue et interne ; espacées tous les 3 mois à partir d'octobre 2026, IDE à la demande.
- Prises en charge · **Plan de prévention de la rechute** · 2026-03-10 — Plan écrit : dates anniversaires, signaux d'alerte, qui appeler.
- Événements de vie · **Stage en cabinet d'économistes de la construction (Langon)** · 2026-03-10 → 2026-05 — En stage à Langon jusqu'en mai (déjà en cours le 10/03/2026) ; débouche sur une proposition de CDD.
- Événements de vie · **Vie de couple stable** · 2025-11-18 → — Vie de couple stable (début non daté).

### `antalgiques-douleur`

Statut au passage `regroupe1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Oxycodone | 2015-06 → 2016-12 (month) | usage | trouvé | Opioïdes · 2015 → 2019-06-09 · usage ⚠ fin compatible |
| Consommations | Oxycodone | 2017 → 2019-06-03 (approx) | usage | trouvé | Opioïdes · 2018 · usage ⚠ fin compatible |
| Consommations | Oxycodone | 2018-11 (month) | intoxication | trouvé | Opioïdes · 2018-11 · intoxication |
| Consommations | Oxycodone | 2019-06-03 → 2019-06-14 (exact) | sevrage | trouvé | Opioïdes · 2019-06-05 → 2019-06-14 · sevrage |
| Consommations | Oxycodone | 2020-09 → 2020-09-18 (month) | rechute | trouvé | Opioïdes · 2020-09 → 2020-09-18 · rechute |
| Consommations | Héroïne | 2018-07 → 2018-08 (month) | usage | trouvé | Héroïne · 2018-07 → 2018-08 · usage |
| Consommations | Prégabaline | 2019 → 2021-09-14 (approx) | usage | trouvé | Prégabaline · 2019 → 2021 · usage |
| Consommations | Alcool | 1994 → 1999-03 (approx) | usage | trouvé | Alcool · 1994-08 → 1999-03 · usage |
| Consommations | Alcool | 1999-03 (month) | sevrage | trouvé | Alcool · 1999-03 → 1999-03 · sevrage ⚠ fin compatible |
| Consommations | Alcool | 2022-04 → 2022-05-21 (month) | rechute | trouvé | Alcool · 2022-04 → 2022-05-21 · rechute |
| Consommations | Alcool | 2022-07 → 2022-09-12 (approx) | rechute | trouvé | Alcool · 2022-07 → 2022-09-12 · rechute |
| Consommations | Alcool | 2022-09-12 → 2022-09-23 (exact) | sevrage | trouvé | Alcool · 2022-09-12 → 2022-09-23 · sevrage |
| Consommations | Alcool | 2023-12-23 → 2024-01-06 (exact) | rechute | trouvé | Alcool · 2023-12-23 → 2024-01-06 · rechute |
| Consommations | Tabac | 1975 → (approx) | usage | trouvé | Tabac · 1975 → · usage |
| Consommations | Méthadone | 2021-12-10 → 2021-12-11 (exact) | sevrage | trouvé | Opioïdes · 2021-12-10 → 2021-12-11 · sevrage |
| Consommations | Méthadone | 2022-05-21 (exact) | intoxication | trouvé | Opioïdes · 2022-05-21 · intoxication |
| Médicaments | Tramadol | 2013-10 → 2015-06 (month) |  | trouvé | Tramadol · 2013-10 → 2015-06 |
| Médicaments | Oxycodone | 2015-06 → 2019-06-09 (month) |  | trouvé | Oxycodone · 2015-06 → 2019-06-09 |
| Médicaments | Oxycodone (second prescripteur) | 2017 → 2019-03 (approx) |  | autre piste | Second prescripteur d'oxycodone (Lormont) · 2017 → 2019-03 |
| Médicaments | Fentanyl transdermique | 2017-02 → 2018-10 (month) |  | trouvé | Fentanyl transdermique · 2017-02 → 2018-10 |
| Médicaments | Prégabaline | 2016-03 → 2023-02-06 (month) |  | trouvé | Prégabaline · 2016-03 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Alprazolam | 2013 → 2019-06-03 (approx) |  | trouvé | Alprazolam · 2014 → 2019-06-03 |
| Médicaments | Oxazépam | 2019-06-03 → (exact) |  | trouvé | Oxazépam · 2019-06-03 → |
| Médicaments | Méthadone | 2019-06-04 → (exact) |  | trouvé | Méthadone · 2019-06-04 → |
| Médicaments | Tiotropium | 2020-11 (approx) |  | trouvé | Tiotropium · 2020-11 → ⚠ « en cours » juste |
| Médicaments | Pression positive continue (PPC) | 2020-11-05 → 2023 (approx) |  | manqué |  |
| Médicaments | Pression positive continue (PPC) | 2025-09-02 → (exact) |  | manqué |  |
| Médicaments | Duloxétine | 2022-05-31 → 2024-12-17 (exact) |  | trouvé | Duloxétine · 2022-05-31 → 2024-12-17 |
| Médicaments | Naloxone (kit) | 2022-05-31 → (exact) |  | trouvé | Naloxone nasale · 2022-05-31 → |
| Médicaments | Thiamine | 2022-09-12 (exact) |  | trouvé | Thiamine · 2022-09 |
| Médicaments | Substituts nicotiniques | 2025-09-16 → 2025-10 (approx) |  | trouvé | Substituts nicotiniques · 2025-09-16 → 2025-10 |
| Psychopathologie | Idées suicidaires | 1994 → 1999 (approx) |  | mal daté | Idées de départ (suicidaires) · 1990 → 1999 |
| Psychopathologie | Deuil traumatique (fils) | 1994-08 → (month) |  | trouvé | Deuil non élaboré de son fils · 1994-08 → |
| Psychopathologie | Épisode dépressif caractérisé | 2022-03 → 2024-12 (approx) |  | trouvé | Épisode dépressif caractérisé · 2022-05 → 2024 |
| Somatique | Fracture de L1 (chute d'un échafaudage) | 2013-10-14 (exact) |  | trouvé | Fracture lombaire L1 (arthrodèse) · 2013-10-14 |
| Somatique | Arthrodèse T12-L2 | 2013-10-16 (exact) |  | manqué |  |
| Somatique | Reprise chirurgicale (pseudarthrose, extension à L3) | 2015-06-09 (exact) |  | trouvé | Reprise chirurgicale du rachis · 2015-06-09 |
| Somatique | Lombalgies chroniques et radiculalgie droite | 2013-10 → (month) |  | trouvé | Douleur chronique lombaire et radiculalgie droite · 2013-10-14 → |
| Somatique | Chutes à domicile | 2021-06 → 2021-08 (approx) |  | trouvé | Chutes à domicile · 2021 ⚠ fin compatible |
| Somatique | Syndrome d'apnées obstructives du sommeil sévère | 2020-10-13 → (exact) |  | trouvé | Syndrome d'apnées obstructives du sommeil · 2020-10-13 → |
| Somatique | BPCO | 2020-11 → (approx) |  | trouvé | BPCO · 2020-11 → |
| Somatique | Exacerbation de BPCO hospitalisée | 2021-12-08 → 2021-12-17 (exact) |  | trouvé | Exacerbation de BPCO (surinfection bronchique) · 2021-12-08 → 2021-12-17 |
| Somatique | Pneumopathie d'inhalation (réanimation) | 2022-05-21 → 2022-05-24 (exact) |  | trouvé | Pneumopathie d'inhalation · 2022-05-21 ⚠ fin compatible |
| Somatique | Allongement du QTc | 2023-04-11 (exact) |  | mal daté | Allongement du QTc · 2022-05-31 → 2024-07-02 |
| Somatique | Chute dans l'escalier | 2024-01 (approx) |  | trouvé | Chute dans l'escalier · 2024-01 |
| Somatique | Bronchite | 2026-01 (approx) |  | trouvé | Bronchite · 2026-01-13 |
| Somatique | Exacerbation de BPCO | 2026-02 (month) |  | trouvé | Exacerbation de BPCO · 2026-02 |
| Prises en charge | Hospitalisation pour sevrage d'alcool (clinique des Pins) | 1999-03 (month) |  | trouvé | Hospitalisation de sevrage alcool (clinique des Pins) · 1999-03 → 1999-03 ⚠ fin compatible |
| Prises en charge | Centre de la douleur (CETD) | 2014-04-03 (exact) |  | trouvé | Suivi CETD (douleur) · 2014-04-03 → ⚠ « en cours » juste |
| Prises en charge | Suivi addictologique (CSAPA) | 2019-04-15 → (exact) |  | trouvé | Suivi CSAPA (addictologie, méthadone) · 2019-04-15 → |
| Prises en charge | Accompagnement social | 2019-04-25 → 2024-09-10 (exact) |  | trouvé | Suivi social · 2019-04-25 → 2020-02-25 ⚠ fin compatible |
| Prises en charge | Hospitalisation dans l'unité d'addictologie (rotation vers la méthadone) | 2019-06-03 → 2019-06-14 (exact) |  | trouvé | Hospitalisation pour rotation vers la méthadone · 2019-06-03 → 2019-06-14 |
| Prises en charge | Protocole de soins CPAM | 2020-01 (month) |  | manqué |  |
| Prises en charge | Accompagnement éducatif | 2020-01-21 → 2025-06-03 (approx) |  | trouvé | Entretiens éducatifs · 2020-02 → ⚠ fin compatible, « en cours » juste |
| Prises en charge | Psychothérapie (psychologue) | 2021-04-13 → 2025-07-01 (exact) |  | trouvé | Suivi psychologique · 2021-04-13 → 2025-07-01 |
| Prises en charge | Réanimation (surdose) | 2022-05-21 → 2022-05-24 (exact) |  | trouvé | Hospitalisation en réanimation · 2022-05-21 → 2022-05-24 |
| Prises en charge | Hospitalisation dans l'unité d'addictologie (après la surdose) | 2022-05-24 → 2022-06-03 (exact) |  | trouvé | Hospitalisation en unité d'addictologie · 2022-05-24 → 2022-06-03 |
| Prises en charge | Passages IDE à domicile | 2022-06-07 → 2022-09-27 (approx) |  | trouvé | Passages IDE à domicile · 2022-06-07 → 2022-07-07 |
| Prises en charge | Réadaptation respiratoire | 2026-05 → 2026-07 (approx) |  | trouvé | Réadaptation respiratoire · 2026-05 → 2026-07 |
| Événements de vie | CAP de maçon | 1977 (approx) |  | manqué |  |
| Événements de vie | Maçon puis chef de chantier (entreprise de Lormont) | 1977 → 2013-10-14 (approx) |  | trouvé | Emploi dans le bâtiment · 1977 → 2013-10-14 |
| Événements de vie | Service militaire | 1980 (year) |  | manqué |  |
| Événements de vie | Mariage | 1984 (year) |  | trouvé | Mariage · 1984 |
| Événements de vie | Naissance de sa fille Séverine | 1986 (approx) |  | manqué |  |
| Événements de vie | Naissance de son fils Damien | 1990 (year) |  | manqué |  |
| Événements de vie | Décès de son fils Damien (noyade) | 1994-08 (month) |  | trouvé | Décès de son fils · 1994-08 |
| Événements de vie | Suspension de permis (conduite en état d'ivresse) | 1998 (year) |  | trouvé | Suspension de permis pour conduite en état d'ivresse · 1998 |
| Événements de vie | Accident du travail, arrêt de travail | 2013-10-14 → 2016-03-31 (exact) |  | trouvé | Accident du travail (chute d'échafaudage) · 2013-10-14 ⚠ fin compatible |
| Événements de vie | Invalidité catégorie 2 et licenciement pour inaptitude | 2016 → 2023-03-01 (year) |  | trouvé | Invalidité · 2016-03-31 → 2023-03-01 |
| Événements de vie | Litige avec la CPAM (taux d'IPP) | 2017 → 2020-02-14 (year) |  | trouvé | Contestation du taux d'IPP (CPAM) · 2017 → 2020-02-14 |
| Événements de vie | Falsification d'ordonnances | 2018-07 → 2019-01 (approx) |  | trouvé | Ordonnances d'oxycodone falsifiées · 2018-07 → 2019-01 |
| Événements de vie | Signalement par la pharmacie (ordonnance falsifiée) | 2019-01 (month) |  | manqué |  |
| Événements de vie | Convocation au commissariat | 2019-02 (month) |  | trouvé | Convocation au commissariat · 2019-02 |
| Événements de vie | Rappel à la loi | 2019-03 (month) |  | trouvé | Rappel à la loi · 2019-03 |
| Événements de vie | Contrôle du service médical de la CPAM | 2019-11 → 2020-01-21 (approx) |  | trouvé | Contrôle CPAM et protocole de soins · 2019-11 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Cancer du pancréas de son épouse | 2021-08 → 2022-03-12 (month) |  | trouvé | Cancer du pancréas de l'épouse · 2021-08 → 2022-03-12 |
| Événements de vie | Décès de son épouse | 2022-03-12 (exact) |  | trouvé | Décès de son épouse · 2022-03-12 |
| Événements de vie | Visite sur la tombe de son fils | 2022-08 (month) |  | manqué |  |
| Événements de vie | Retraite | 2023-03-01 (exact) |  | trouvé | Retraite · 2023-03-01 → ⚠ « en cours » juste |
| Événements de vie | Aide à domicile | 2023-06 → (approx) |  | trouvé | Aide à domicile · 2023-06 → |
| Événements de vie | Vente de la maison de Cenon | 2024-06 (month) |  | trouvé | Vente de la maison de Cenon · 2024-06 |
| Événements de vie | Déménagement à Libourne près de sa fille | 2024-09-01 (exact) |  | trouvé | Installation à Libourne · 2024-09-01 → ⚠ « en cours » juste |
| Événements de vie | Bénévolat (atelier de réparation de vélos) | 2025-06 → (approx) |  | trouvé | Bénévolat atelier vélos · 2025-06 → |
| Événements de vie | Naissance de son petit-fils Noé | 2025-10-14 (exact) |  | trouvé | Naissance de son petit-fils · 2025-10 |

En plus (passage `regroupe1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Opioïdes** · 2019-03 → 2019-06-03 · sevrage — Manques fréquents depuis mars 2019 (« tout réduit » depuis le rappel à la loi) ; sueurs, frissons, diarrhée, jambes sans repos si retard de prise
- Consommations · **Opioïdes** · 2019-04-18 · craving — Craving surtout le matin et le soir
- Consommations · **Alcool** · 2019-04-18 · usage — Un verre de vin au repas, pas tous les jours ; AUDIT-C à 2 ; pas d'ivresse récente
- Psychopathologie · **Thymie abaissée** · 2019-04-18 → 2019-10-15 — Thymie légèrement abaissée, pas d'idées suicidaires ; « un coup de moins bien » après l'accident, jamais de suivi psychiatrique
- Somatique · **Hypertension artérielle** · 2014 → — HTA relevée parmi les antécédents à la première consultation du CETD (2014) ; date de début non précisée.
- Somatique · **BPCO** · 2019-04-15 → — Toux grasse, crachats matinaux, essoufflement à un étage, non explorée
- Somatique · **Syndrome d'apnées obstructives du sommeil** · 2019-04-18 → — Ronflements, pauses respiratoires, SpO2 86-88 % la nuit du 05/06 ; polygraphie demandée mais non faite en septembre
- Somatique · **Sueurs et constipation sous méthadone** · 2019-07-02 — Transpiration abondante et constipation, conseils hygiéno-diététiques, macrogol proposé
- Consommations · **Alcool** · 2022-05-21 · intoxication — Alcoolémie à 1,6 g/L à l'admission en réanimation ; bouteille de vin entamée retrouvée sur la table.
- Consommations · **Opioïdes** · 2020-03 → 2020-06 · craving — Dit avoir eu envie d'oxycodone pendant le confinement, sans en prendre ; urines du 09/06 oxycodone négatives.
- Consommations · **Prégabaline** · 2022-05-21 · intoxication — Prégabaline dans les toxiques à l'admission ; plaquette de Lyrica presque vide retrouvée ; « quelques » Lyrica le soir.
- Consommations · **Benzodiazépines** · 2020-06-09 · usage — BZD positives aux urines du 09/06/2020 (oxazépam prescrit).
- Consommations · **Benzodiazépines** · 2022-05-21 · intoxication — Oxazépam retrouvé dans les toxiques lors de l'admission en réanimation.
- Médicaments · **Méthadone** · 2019-06 → — 80 mg/j en 03/2020, majorée à 100 mg/j le 16/06/2020 ; délivrance 14 j puis 7 j (09/2020), à nouveau 14 j (11/2020).
- Prises en charge · **Hospitalisation en pneumologie** · 2021-12-08 → 2021-12-17 — Exacerbation de BPCO ; méthadone non prescrite à l'entrée, sevrage sévère ; sortie sous corticoïdes et antibiotiques.
- Psychopathologie · **Thymie basse** · 2021-11-09 → — Thymie basse, pleurs, sommeil de 4 h, fatigue ; antidépresseur proposé en 04/2022, refusé.
- Psychopathologie · **Deuil de l'épouse** · 2022-03-12 → — Vit seul, sommeil très haché, mange peu, pleurs ; un mois après le décès.
- Événements de vie · **Renoncement au permis poids lourd** · 2021-06-22 — Renonce au renouvellement de la catégorie poids lourd après information sur la méthadone et les apnées ; conduite déconseillée dès 06/2020 en raison de la somnolence.
- Consommations · **Alcool** · 2022-05-31 · craving — Craving le soir ("le silence de la maison"), pas de signe de sevrage à l'entrée dans l'unité.
- Consommations · **Alcool** · 2023-11-07 · craving — Évoque l'envie de "boire un coup pour tenir" à l'approche des fêtes.
- Médicaments · **Méthadone** · 2019-06 → 2019-09 — Rotation vers la méthadone en hospitalisation en juin 2019, 60 mg.
- Médicaments · **Méthadone** · 2019-09 → 2020-06 — Méthadone 80 mg en 09/2019.
- Médicaments · **Méthadone** · 2020-06 → 2022-05-31 — Méthadone 100 mg en 06/2020, prise fractionnée jusqu'à la surdose de mai 2022.
- Médicaments · **Méthadone** · 2022-05-31 → 2023-04-18 — Méthadone réduite à 80 mg/j en une prise le matin (QTc 451 ms), délivrance à 7 jours.
- Médicaments · **Méthadone** · 2023-04-18 → 2024-12-20 — Méthadone réduite à 70 mg/j (QTc 472 ms), bien tolérée, douleur 5/10.
- Médicaments · **Méthadone** · 2024-12-20 → — Méthadone gélules 60 mg/j à partir du 20/12/2024, à sa demande ("je veux finir avec moins"), pas de manque.
- Médicaments · **Méthadone (gélules)** · 2024-06-18 → — Passage de la méthadone sirop aux gélules à dose égale (70 mg) le 18/06/2024, stockage sécurisé ; délivrance par la pharmacie des Quais depuis le 05/09/2024.
- Médicaments · **Prégabaline** · 2019 → 2023-02-06 — Prégabaline 300 mg/j strict distribuée en 2022, décroissance à 225 mg/j en octobre 2022 puis 150 et 75 mg/j, arrêt le 06/02/2023.
- Psychopathologie · **Idées de mort passives** · 2022-05-31 → 2022-07-05 — Idées de mort passives sans scénario le 31/05/2022 ; plus d'idées suicidaires le 05/07/2022, plus d'idées de mort en 2023.
- Prises en charge · **Accompagnement éducatif** · 2022-06-07 → 2022-12-06 — Éducateur spécialisé pour "remettre de la vie dans la journée" ; entretien du 06/12/2022.
- Prises en charge · **Sevrage ambulatoire de l'alcool** · 2022-09-12 → 2022-09-27 — Sevrage ambulatoire avec passages IDE (J1, J3, J7), dernier passage le 27/09/2022 ; renseignements donnés sur les groupes du CSAPA et d'entraide.
- Prises en charge · **Suivi social** · 2023-03-14 → 2024-09-10 — Assistante sociale (retraite, aides, déménagement) ; suivi social terminé le 10/09/2024, RDV à la demande.
- Consommations · **Prégabaline** · 2023 · usage — Prégabaline mésusée, arrêtée en 2023.
- Consommations · **Alcool** · 2022 → 2024-01-06 · rechute — Reprise de l'alcool en 2022 avec l'épisode dépressif, rechute en 2023 ; abstinent depuis le 06/01/2024 (éthylotest 0, pas d'alcool aux consultations suivantes jusqu'en 10/2026).
- Somatique · **Appareillage du SAOS** · 2023 — Appareillage abandonné en 2023, à relancer.
- Somatique · **Appareillage du SAOS** · 2025-09 → — Reprise avec un masque narinaire mieux toléré, 5 à 6 h par nuit ; toutes les nuits en 10/2026.
- Médicaments · **Oxazépam** · 2025-04-15 → — 30 mg ; réduction à 20 mg/j acceptée en 04/2025, 20 mg depuis mai 2025.
- Médicaments · **Corticoïdes** · 2026-02 → 2026-02 — Corticoïdes 5 jours avec antibiotique pour l'exacerbation de BPCO.
- Prises en charge · **Accompagnement éducatif** · 2025-06-03 → 2025-06-03 — Clôture de l'accompagnement éducatif régulier, RDV à sa demande.
- Prises en charge · **Tabacologie** · 2026-03-17 — Nouvelle tentative d'arrêt du tabac prévue avec la tabacologue de l'antenne.

### `cannabis-psychose`

Statut au passage `regroupe1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Cannabis | 2014 → 2017 (approx) | usage | trouvé | Cannabis · 2014 → 2016 · usage |
| Consommations | Cannabis | 2017 → 2019-09 (approx) | usage | trouvé | Cannabis · 2017 → 2020-08-24 · usage |
| Consommations | Cannabis | 2019-09 → 2020-08-24 (month) | usage | trouvé | Cannabis · 2019 → 2020-03 · usage ⚠ fin compatible, au moins une source attendue |
| Consommations | Cannabis | 2019-12 → 2019-12 (month) | sevrage | trouvé | Cannabis · 2019-12 → 2019-12 · sevrage |
| Consommations | Cannabis | 2017-06 → 2017-06 (month) | intoxication | trouvé | Cannabis · 2017-06 · intoxication ⚠ fin compatible |
| Consommations | Cannabis | 2020-08-24 → 2020-09 (approx) | sevrage | trouvé | Cannabis · 2020-08-24 → 2021-01 · sevrage |
| Consommations | Cannabis | 2021-01 → 2022-05 (month) | rechute | trouvé | Cannabis · 2021-01 → · rechute ⚠ fin compatible, « en cours » juste |
| Consommations | Cannabis | 2022-06 → 2022-10-28 (month) | rechute | trouvé | Cannabis · 2022-06 → 2022-10-28 · rechute |
| Consommations | Cannabis | 2022-10-28 → 2022-11 (approx) | sevrage | trouvé | Cannabis · 2022-10-28 → 2022-11 · sevrage |
| Consommations | Cannabis | 2023-07-21 → 2023-08-06 (exact) | rechute | trouvé | Cannabis · 2023-07-21 → 2023-08-06 · rechute |
| Consommations | Cannabis | 2026-02-15 → 2026-02-15 (exact) | rechute | trouvé | Cannabis · 2026-02-15 · rechute ⚠ fin compatible |
| Consommations | Cannabinoïdes de synthèse | 2019-09 → 2020-02 (month) | usage | trouvé | Cannabinoïdes de synthèse · 2019-09 → 2020-02 · usage |
| Consommations | Tabac | 2015 → 2025-04-15 (approx) | usage | trouvé | Tabac · 2015 → 2025-04-15 · usage |
| Consommations | Alcool | 2016 (approx) | usage | trouvé | Alcool · 2016 → · usage ⚠ « en cours » juste |
| Consommations | Protoxyde d'azote | 2019-09 → 2020 (approx) | usage | trouvé | Protoxyde d'azote · 2019 → 2020 · usage |
| Consommations | Protoxyde d'azote | 2021-05 → 2021-09-05 (month) | usage | trouvé | Protoxyde d'azote · 2021-05 → 2021-09-05 · usage |
| Consommations | Protoxyde d'azote | 2022-06 → 2023-03 (approx) | usage | trouvé | Protoxyde d'azote · 2022 → 2023-03 · usage |
| Consommations | Kétamine | 2022-06 → 2023-03 (approx) | usage | trouvé | Kétamine · 2022 → 2023-03 · usage |
| Médicaments | Hydroxyzine | 2020-04-21 → 2020-08 (month) |  | trouvé | Hydroxyzine · 2020-04-21 → 2020-08 |
| Médicaments | Diazépam | 2020-08-24 → 2020-09 (approx) |  | trouvé | Diazépam · 2020-08 → 2020-09 |
| Médicaments | Rispéridone | 2020-08 → 2020-11-10 (month) |  | trouvé | Rispéridone · 2020-08 → 2020-11-10 |
| Médicaments | Aripiprazole | 2020-11-10 → 2021-03-29 (exact) |  | trouvé | Aripiprazole · 2020-11-10 → 2021-03-29 |
| Médicaments | Aripiprazole LP | 2021-03-15 → 2022-05-16 (exact) |  | trouvé | Aripiprazole LP · 2021-03 → 2022-05 |
| Médicaments | Cyanocobalamine | 2021-09-07 → 2021-11 (month) |  | trouvé | Cyanocobalamine · 2021-09-07 → 2021-11-16 |
| Médicaments | Loxapine | 2022-10 → 2022-12 (approx) |  | trouvé | Loxapine · 2022-10 → 2022-12 |
| Médicaments | Palipéridone LP | 2022-11-04 → (exact) |  | trouvé | Palipéridone LP · 2022-11-04 → 2023-06-05 ⚠ fin compatible, « en cours » juste |
| Médicaments | Sertraline | 2023-03-14 → 2024-03 (month) |  | trouvé | Sertraline · 2023-03-14 → 2024-03 |
| Médicaments | Hydroxyzine | 2026-02-24 → 2026-03 (approx) |  | trouvé | Hydroxyzine · 2026-02-24 → 2026-03-11 |
| Psychopathologie | Scarifications | 2013 → 2013 (approx) |  | trouvé | Scarifications · 2013 → 2014 |
| Psychopathologie | Prodromes psychotiques | 2018 → 2019 (approx) |  | trouvé | Prodromes psychotiques · 2018 → 2019 |
| Psychopathologie | Anxiété et idées de référence sous cannabis | 2019 → 2020-07 (approx) |  | trouvé | Idées de référence et anxiété massive · 2019-09 → 2020-02 |
| Psychopathologie | Premier épisode psychotique | 2020-06 → 2020-10 (approx) |  | trouvé | Épisode psychotique aigu (trouble psychotique induit par le cannabis) · 2020-07 → 2020-10-06 |
| Psychopathologie | Schizophrénie paranoïde | 2020-06 → (approx) |  | mal daté | Schizophrénie paranoïde · 2022-12-20 → |
| Psychopathologie | Rechute psychotique | 2022-09 → 2022-12 (month) |  | trouvé | Deuxième épisode psychotique (délire paranoïde) · 2022-09 → 2022-12-20 |
| Psychopathologie | Épisode dépressif caractérisé post-psychotique | 2023-02 → 2023-10 (approx) |  | trouvé | Épisode dépressif caractérisé post-psychotique · 2023-02 ⚠ fin compatible |
| Somatique | Fracture de la clavicule gauche (accident de scooter sous cannabis) | 2018 → 2018 (approx) |  | trouvé | Fracture de la clavicule gauche · 2018 ⚠ fin compatible |
| Somatique | Effets indésirables de la rispéridone | 2020-09 → 2021-01 (approx) |  | manqué |  |
| Somatique | Neuropathie au protoxyde d'azote (carence en B12) | 2021-08 → 2021-11 (month) |  | trouvé | Neuropathie sur protoxyde d'azote · 2021-08 → 2021-11 |
| Prises en charge | Suivi addictologique (CSAPA) | 2020-03-02 → (exact) |  | trouvé | Suivi CSAPA · 2020-03-02 → |
| Prises en charge | Hospitalisation en psychiatrie (SDT), pavillon Les Iris | 2020-08-24 → 2020-10-06 (exact) |  | trouvé | Hospitalisation en soins sans consentement (SDT) · 2020-08-24 → 2020-10-06 |
| Prises en charge | Programme de soins | 2020-10-06 → 2021-02-05 (exact) |  | trouvé | Programme de soins · 2020-10-06 → 2021-02-05 |
| Prises en charge | Suivi CMP | 2020-10-20 → (exact) |  | trouvé | Suivi CMP · 2020-10-20 → |
| Prises en charge | Accompagnement social | 2020-11-17 (exact) |  | trouvé | Accompagnement social · 2020-11-17 |
| Prises en charge | Psychothérapie | 2021-02-23 → (exact) |  | trouvé | Suivi psychologique · 2021-02-23 → |
| Prises en charge | Consultation neurologique (EMG) | 2021-09-20 → 2021-09-20 (exact) |  | manqué |  |
| Prises en charge | Accompagnement éducatif | 2022-03-15 → (exact) |  | trouvé | Suivi éducatif · 2022-03-15 → |
| Prises en charge | Hospitalisation en psychiatrie (SPI), pavillon Les Iris | 2022-10-28 → 2022-12-20 (exact) |  | trouvé | Hospitalisation en soins pour péril imminent · 2022-10-28 → 2022-12-20 |
| Prises en charge | Accompagnement budgétaire | 2023-05 → 2024-09 (approx) |  | trouvé | Accompagnement budgétaire · 2023-05 → 2024-09-03 |
| Prises en charge | Bilan psychologique | 2023-06-06 → 2023-06-27 (exact) |  | trouvé | Bilan psychologique · 2023-06-06 → 2023-06-27 |
| Prises en charge | Psychoéducation au CMP | 2023-09-19 → 2023-12 (month) |  | trouvé | Programme de psychoéducation CMP · 2023-09-19 → 2023-12 |
| Prises en charge | Groupe d'entraide mutuelle (GEM) | 2024-04 → (month) |  | trouvé | GEM (groupe d'entraide mutuelle) · 2024-04 → |
| Événements de vie | Harcèlement scolaire | 2012 → 2014 (approx) |  | trouvé | Harcèlement scolaire · 2012 → 2014 |
| Événements de vie | Saison de cueillette | 2018 → 2018 (year) |  | manqué |  |
| Événements de vie | Baccalauréat STMG | 2019-06 → 2019-06 (month) |  | trouvé | Bac STMG · 2019-06 ⚠ fin compatible |
| Événements de vie | Licence STAPS (abandon) | 2019-09 → 2020-01 (month) |  | manqué |  |
| Événements de vie | Studio étudiant à Bordeaux | 2019-09 → 2020-06 (month) |  | trouvé | Logement en studio à Bordeaux · 2019-09 → 2020-06 |
| Événements de vie | Garde à vue pour revente de cannabis | 2019-11 → 2019-11 (month) |  | trouvé | Garde à vue pour revente · 2019-11 ⚠ fin compatible |
| Événements de vie | Composition pénale (stage de sensibilisation aux dangers des stupéfiants) | 2020-02 → 2020-02 (month) |  | trouvé | Composition pénale · 2020-02 ⚠ fin compatible |
| Événements de vie | Hébergé chez ses parents (Cestas) | 2020-03-16 → 2025-09-01 (exact) |  | trouvé | Retour chez ses parents à Cestas · 2020-03-16 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Service civique (médiathèque de Cestas) | 2021-10-04 → 2022-04-30 (exact) |  | trouvé | Service civique · 2021-10-04 → 2022-04-30 |
| Événements de vie | Violence envers son père | 2022-10-27 → 2022-10-27 (exact) |  | trouvé | Dispute violente avec le père · 2022-10-27 ⚠ fin compatible |
| Événements de vie | Curatelle demandée par les parents | 2022-12-06 → 2023-10-10 (exact) |  | trouvé | Demande de curatelle par les parents · 2022 → 2023-10-10 |
| Événements de vie | AAH | 2023-09 (month) |  | trouvé | AAH · 2023-09 → ⚠ « en cours » juste |
| Événements de vie | Stage découverte chez un paysagiste | 2024-04 → 2024-04 (month) |  | trouvé | Stage découverte espaces verts · 2024-04 → 2024-04 |
| Événements de vie | RQTH | 2024-07 (month) |  | trouvé | RQTH · 2024-07 → ⚠ « en cours » juste |
| Événements de vie | CAPa jardinier-paysagiste en alternance | 2024-09-02 → 2026-08-31 (exact) |  | trouvé | CAPa jardinier-paysagiste en alternance · 2024-09-02 → 2026-07-03 ⚠ fin compatible |
| Événements de vie | Couple avec Naïs | 2025-02 → 2026-02-14 (month) |  | trouvé | Relation de couple · 2025-02 → 2026-02-14 |
| Événements de vie | Studio à Pessac | 2025-09-01 → (exact) |  | trouvé | Logement autonome (studio) · 2025-09-01 → |
| Événements de vie | Permis de conduire | 2025-10-06 → 2025-10-06 (exact) |  | trouvé | Permis B obtenu · 2025-10-06 ⚠ fin compatible |
| Événements de vie | Diplôme du CAPa | 2026-07-03 → 2026-07-03 (exact) |  | mal daté | CAPa jardinier-paysagiste en alternance · 2025-07 |
| Événements de vie | Emploi : ouvrier paysagiste (CDD de 6 mois) | 2026-09-01 → (exact) |  | trouvé | CDD d'ouvrier paysagiste · 2026-09-01 → |

En plus (passage `regroupe1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Cannabis** · 2020-09-22 · craving — Pas de cannabis depuis l'entrée à l'hôpital, "envie tous les soirs".
- Psychopathologie · **Attaque de panique** · 2017-06 — Attaque de panique après ingestion d'un space cake, à 16 ans, surveillance de 4 h aux urgences pédiatriques, non suivie ; oubliée à l'entrée au CSAPA.
- Psychopathologie · **Troubles du sommeil et anxiété** · 2019-09 → 2021-03 — Depuis quelques mois en mars 2020 (changement daté par la mère à l'arrivée à la fac) : anxiété, sommeil décalé (endormissement vers 5 h), irritabilité, isolement. Sommeil correct en mars 2021.
- Psychopathologie · **Idées de référence et méfiance** · 2020-03 — Impression qu'on le regarde dans le tram (critiquée), émoussement affectif en mars ; méfiance en juin ("les voisins savent des trucs sur moi") ; évolue vers l'épisode psychotique.
- Psychopathologie · **Hallucinations acoustico-verbales résiduelles** · 2020-12 — Quelques voix le soir la semaine précédant le 08/12, "moins fortes".
- Psychopathologie · **Aboulie, thymie plate** · 2021-01 → — Ennui, aboulie, thymie plate, peu de projets, "j'attends" ; pas d'élément psychotique.
- Somatique · **Perte de poids** · 2019-09 → 2020-03 — Perte de 4 kg depuis septembre selon la mère, appétit irrégulier.
- Somatique · **Akathisie** · 2020-09-22 — Raideur et agitation des jambes sous rispéridone, akathisie probable, signalée à l'équipe.
- Somatique · **Prise de poids** · 2020-10 → — 64 kg à 72 kg (13/10), 74 kg (+10 kg depuis mars) le 10/11, 73 kg en décembre, stable en janvier 2021.
- Somatique · **Dysfonction érectile** · 2020-10 → 2020-11 — Troubles de l'érection sous rispéridone, persistants en novembre (prises sautées) ; évolution non documentée après le relais.
- Somatique · **Hyperprolactinémie** · 2020-11-10 → 2021-01-12 — Prolactine 68 ng/mL sous rispéridone, 18 sous aripiprazole en janvier 2021.
- Médicaments · **Aripiprazole LP** · 2021-03-15 → 2022-01-10 — 400 mg, première injection le 15/03/2021 au CMP, injections mensuelles.
- Événements de vie · **Études de STAPS à Bordeaux** · 2019-09 → 2020-09 — Plus de présence en cours depuis janvier 2020, partiels non passés, abandon déclaré en juin, désinscription par la mère en septembre 2020.
- Événements de vie · **Conflits avec le père** · 2020-04 → 2020-10 — Conflits répétés pendant le confinement, dispute verbale violente ; "en pause" au 13/10/2020.
- Événements de vie · **Menace d'un voisin avec un couteau** · 2020-08-24 — Accusait le voisin de l'espionner ; amené aux urgences par les pompiers.
- Psychopathologie · **Impression qu'on parle de lui dans son dos** · 2013 → 2018 — Au lycée, « toujours l'impression qu'on parlait de moi dans mon dos », reliée par lui aux moqueries du collège ; cannabis au lycée « pour tenir en classe ».
- Psychopathologie · **Trouble de l'usage du cannabis sévère** · 2013 → — TUC sévère depuis l'adolescence ; diagnostic de trouble de l'usage du cannabis sévère retenu à l'hospitalisation de fin 2022.
- Somatique · **Prise de poids sous rispéridone** · 2020-08 → 2020-11 — Effet indésirable de la rispéridone, motif d'arrêt.
- Consommations · **Cannabis** · 2021-04 → 2022-05 · usage — Réduit à 1-2 joints le soir (parfois 2/j), non arrêté, ne souhaite pas l'arrêt total ; objectif de réduction.
- Somatique · **Carence en vitamine B12** · 2021-09-06 → 2021-11-16 — B12 effondrée (98 pg/mL), homocystéine élevée ; B12 normalisée en novembre 2021.
- Somatique · **Prise de poids sous aripiprazole LP** · 2021-11 → 2022-04 — 75 kg en juin 2021, 77 kg en novembre, 78 kg en janvier 2022, 79 kg en avril (« j'ai pris 15 kilos ») ; fatigue diurne.
- Consommations · **Alcool** · 2022-01-18 · usage — Alcool festif.
- Consommations · **Alcool** · 2022-04-12 · intoxication — Ivresse lors d'une soirée d'anniversaire, sans conséquence.
- Consommations · **Alcool** · 2022-07-05 · usage — En free party, dit n'y prendre « que de l'alcool et du shit ».
- Événements de vie · **Sans ressources propres** · 2022-04 → — Sans ressources depuis la fin du service civique ; dettes (forfait téléphone d'environ 400 euros, découvert, argent emprunté à sa soeur) ; pas de permis ; parents demandent une curatelle.
- Médicaments · **Aripiprazole LP** · 2022-01-10 → 2022-05-16 — Aripiprazole LP baissé à 300 mg (injection du 10/01/2022) ; demande d'arrêt en avril (« je suis guéri »), dernière injection le 16/05/2022, injection du 13/06 non honorée.
- Consommations · **Substances non précisées (free party)** · 2022-06 → 2022-10 · usage — « Des trucs en free party, sans précision » selon la mère ; sorties en free party presque tous les week-ends ; kétamine non recherchée.
- Médicaments · **Aripiprazole** · 2022-07-05 — Aripiprazole oral 10 mg proposé, ordonnance remise ; selon la mère, jamais pris.
- Prises en charge · **Rendez-vous non honorés** · 2022-06-13 → 2022-09-20 — Injection du 13/06 manquée, absent aux rendez-vous des 26/07, 30/08 et 20/09, injoignable ; courrier envoyé.
- Prises en charge · **Entretien social avec les parents** · 2022-12-06 — Parents reçus à leur demande ; pistes : dossier MDPH (AAH), complémentaire santé solidaire, hébergement à la sortie, alternatives à la curatelle (accompagnement budgétaire, MASP) ; patient refuse une mesure de protection.
- Psychopathologie · **Symptômes négatifs (émoussement, aboulie, retrait social)** · 2022-01 → — Émoussement affectif, aboulie, « ne plus rien ressentir » ; persistance entre les épisodes depuis 2020 selon le compte rendu hospitalier ; contact pauvre et ralentissement en janvier 2023.
- Événements de vie · **Retour chez les parents sous contrat écrit** · 2022-12-20 → — Contrat avec le père : pas de cannabis à la maison, traitement, horaires ; doit quitter la maison s'il refume ; ambiance « glaciale » ; pas d'activité.
- Consommations · **Cannabis** · 2014 → 2022-10 · usage — Cannabis dès 13 ans, quotidien au lycée (résine), TUC sévère ; abstinent depuis 10/2022. Utilisé comme auto-thérapie de l'angoisse et de la honte depuis le collège.
- Consommations · **Cannabis** · 2018 → 2018 · intoxication — Rentre « défoncé » d'une soirée en 2018 (17 ans) : accident de scooter.
- Consommations · **Cannabis** · 2023-03-14 · craving — Abstinent, craving modéré le soir.
- Consommations · **Cannabis** · 2024-05-14 · craving — Pense au cannabis en voyant les autres fumer devant le GEM, sans passage à l'acte.
- Consommations · **Alcool** · 2023-07 · usage — 2-3 bières en festival, pas d'alcool fort.
- Consommations · **Alcool** · 2024-10-15 · usage — Pas d'alcool en semaine, quelques bières le samedi.
- Consommations · **Nicotine (vapoteuse)** · 2025-04-15 → · usage — Passé à la vapoteuse le 15/04, liquide 12 mg/mL, plus aucune cigarette ; CO expiré 3 ppm.
- Psychopathologie · **Trouble psychotique induit (diagnostic initial)** · 2020 → 2023-02-07 — Diagnostic initial de trouble psychotique induit, plus pertinent en février 2023.
- Psychopathologie · **Schizophrénie paranoïde** · 2023-02-07 → — Diagnostic retenu en février 2023 (prodromes, antécédent familial au premier degré, symptômes négatifs) ; cannabis facteur précipitant.
- Psychopathologie · **Hallucinations auditives (réapparition)** · 2023-05 → 2023-08 — Voix le soir depuis fin mai, recrudescence pendant la rechute de cannabis, moindres depuis l'arrêt.
- Psychopathologie · **Voix résiduelles** · 2023-08 → — Chuchotement rare quand fatigué, critiqué ; « presque plus » en janvier 2025.
- Psychopathologie · **Troubles cognitifs** · 2023-06 → — Bilan de juin 2023 : vitesse de traitement et mémoire de travail abaissées, planification fragile.
- Somatique · **Prise de poids** · 2023-11-21 → — 82 kg, tour de taille 98 cm, glycémie à jeun 0,98 ; 84 kg en 2024-2025 ; bilan métabolique prévu.
- Médicaments · **Aripiprazole** · 2020 → 2022-05 — Aripiprazole oral puis LP 400 puis 300 mg, arrêté par le patient en mai 2022.
- Médicaments · **Palipéridone LP** · 2023-06-05 → 2024-10-07 — Palipéridone LP 100 mg mensuel à partir de l'injection du 05/06/2023 (avis CMP).
- Médicaments · **Palipéridone LP** · 2024-10-07 → — Palipéridone LP 350 mg trimestriel (CMP), première injection le 07/10/2024.
- Prises en charge · **Psychoéducation des parents (programme familles CMP)** · 2023 → 2023 — Orientation en février 2023 ; parents ont suivi le programme en 2023.
- Prises en charge · **Suivi psychologique** · 2023-04-18 → — Reprise des entretiens après l'hospitalisation ; travail sur la honte et l'image de soi ; séances espacées au mois à partir de mars 2025.
- Prises en charge · **Suivi éducatif** · 2023-05-16 — Reprise du suivi depuis la sortie d'hospitalisation ; projet d'insertion.
- Prises en charge · **Consultation tabacologie (IDE)** · 2025-05-13 — Consultation tabac, passage à la vapoteuse.
- Événements de vie · **Dossier MDPH** · 2023-03-28 — Dossier MDPH déposé (AAH, orientation professionnelle) ; complémentaire santé solidaire accordée.
- Événements de vie · **Inscription à l'auto-école** · 2025-05 → — Projet de permis de conduire, inscription faite.
- Consommations · **Cannabis** · 2017 → 2023-08 · usage — Cannabis quotidien dès 16 ans, herbe très dosée ; trouble de l'usage de cannabis sévère, en rémission depuis 08/2023.
- Consommations · **Kétamine** · 2022-10 · rechute — Reprise de kétamine avant la rechute d'octobre 2022 ; antécédent de kétamine.
- Consommations · **Cannabis** · 2025-11-18 · craving — Craving cannabis « zéro », « j'ai trop à perdre ».
- Consommations · **Cannabis** · 2026-01-20 · craving — Craving quasi nul ; a refusé un joint à une fête du CFA en décembre « sans même y penser ».
- Psychopathologie · **Harcèlement et scarifications au collège** · 2012 → 2014 — Collège difficile (harcèlement en 6e-5e, scarifications).
- Psychopathologie · **Tristesse réactionnelle à la rupture** · 2026-02-14 → 2026-03-17 — Pleurs, sommeil perturbé, ruminations ; pas d'idée suicidaire ni d'élément psychotique ; va mieux le 17/03.
- Somatique · **LDL cholestérol élevé** · 2025-02 → — LDL 1,48 en février 2025, 1,62 g/L en décembre 2025 ; mesures hygiéno-diététiques, contrôle prévu en juillet.
- Somatique · **Fatigue matinale et ralentissement** · 2025-11-18 — Fatigue matinale et « lenteur » au travail ; possible effet du traitement ; TSH et ferritine normales.
- Prises en charge · **Suivi éducatif** · 2026-09-15 → — Reprise du suivi pour l'emploi ; fin de l'accompagnement envisagée si le CDD se passe bien.
- Prises en charge · **Suivi psychologique** · 2026-01-20 → — Psychologue une fois par mois ; espacement à 6 semaines proposé après l'été.
- Événements de vie · **Contrat d'apprentissage** · 2025-09-23 → 2026-08-31 — Apprenti paysagiste ; fin du contrat le 31/08/2026.
- Événements de vie · **Achat d'une voiture d'occasion** · 2025-10 — Voiture d'occasion achetée avec l'aide de son père.

### `cocaine-cadre`

Statut au passage `regroupe1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Cocaïne | 2004 → 2014 (approx) | usage | trouvé | Cocaïne · 2004 → 2014 · usage |
| Consommations | Cocaïne | 2014 → 2021-01-28 (approx) | usage | trouvé | Cocaïne · 2014 → 2021-01-28 · usage |
| Consommations | Cocaïne | 2015 → 2016 (year) | sevrage | trouvé | Cocaïne · 2015 → 2016 · sevrage |
| Consommations | Cocaïne | 2016 (approx) | rechute | trouvé | Cocaïne · 2017 · intoxication ⚠ mode d'usage juste, au moins une source attendue |
| Consommations | Cocaïne fumée (base) | 2019-03 → 2019-06 (approx) | usage | trouvé | Cocaïne · 2019-03 → 2019-05 · usage |
| Consommations | Cocaïne | 2021-01-28 (exact) | sevrage | trouvé | Cocaïne · 2021-01-28 → 2021-08 · sevrage ⚠ fin compatible |
| Consommations | Cocaïne | 2021-08 → 2022-04 (approx) | rechute | trouvé | Cocaïne · 2021-08 → 2021-09 · rechute |
| Consommations | Cocaïne | 2022-04 → 2022-12-10 (month) | rechute | trouvé | Cocaïne · 2022-04 → 2022-12-10 · rechute |
| Consommations | Cocaïne | 2023-01 → 2023-04-08 (month) | rechute | trouvé | Cocaïne · 2023-01 → 2023-04-09 · rechute |
| Consommations | Cocaïne | 2023-04-08 (exact) | intoxication | trouvé | Cocaïne · 2023-04-09 · intoxication |
| Consommations | Cocaïne | 2024-12-21 (exact) | rechute | trouvé | Cocaïne · 2024-12-21 · rechute |
| Consommations | Alcool | 1994 → 2018 (approx) | usage | trouvé | Alcool · 1994 → 2018 · usage |
| Consommations | Alcool | 2018 → 2021-01 (approx) | usage | trouvé | Alcool · 2018 → 2021-02 · usage |
| Consommations | Alcool | 2021-01 → 2022-04 (approx) | usage | trouvé | Alcool · 2021-02 → 2021-08 · usage |
| Consommations | Alcool | 2022-04 → 2023-04-11 (month) | usage | trouvé | Alcool · 2022-04 → 2023-04-11 · usage |
| Consommations | Alcool | 2023-04-08 (exact) | intoxication | trouvé | Alcool · 2023-04-09 · intoxication |
| Consommations | Alcool | 2023-04-11 → 2023-04-21 (exact) | sevrage | trouvé | Alcool · 2023-04-11 → 2023-04-21 · sevrage |
| Consommations | Alcool | 2023-05 → 2025-02 (approx) | usage | trouvé | Alcool · 2023-04 → 2025-01 · usage |
| Consommations | Alcool | 2025-02 → 2025-05 (month) | usage | trouvé | Alcool · 2025-02 → · usage ⚠ fin compatible, « en cours » juste |
| Consommations | Alcool | 2025-05 → (approx) | usage | trouvé | Alcool · 2024-12-21 · usage ⚠ « en cours » juste, au moins une source attendue |
| Consommations | Alcool | 2026-07-20 (approx) | intoxication | trouvé | Alcool · 2026-07-20 · usage ⚠ mode d'usage juste |
| Consommations | Tabac | 1995 → 2023-04 (approx) | usage | trouvé | Tabac · 1995 → 2026-02-20 · usage ⚠ fin compatible |
| Consommations | Tabac | 2023-04 → 2026-01-20 (month) | usage | manqué |  |
| Consommations | Tabac | 2026-01-20 → 2026-01-22 (approx) | sevrage | manqué |  |
| Consommations | Tabac | 2026-01-22 → 2026-02-20 (exact) | rechute | trouvé | Tabac · 2026-01-22 · rechute ⚠ fin compatible |
| Consommations | Tabac | 2026-02-20 (exact) | sevrage | trouvé | Tabac · 2026-02-20 → · sevrage ⚠ « en cours » juste |
| Consommations | Cannabis | 1995 → 1999 (approx) | usage | trouvé | Cannabis · 1994 → 2000 · usage |
| Consommations | Jeu (paris sportifs en ligne) | 2017 → 2020-03 (year) | usage | trouvé | Jeu d'argent (paris sportifs en ligne) · 2017 → 2023-01 · usage ⚠ fin compatible |
| Consommations | Jeu (paris sportifs en ligne) | 2020-03 → 2023-01 (approx) | usage | manqué |  |
| Consommations | Jeu (paris sportifs en ligne) | 2025-11 (month) | rechute | trouvé | Jeu d'argent (paris sportifs en ligne) · 2025-11 → 2025-11 · rechute ⚠ fin compatible |
| Psychopathologie | Épisode dépressif | 2016 (year) |  | trouvé | Épisode dépressif réactionnel · 2016 → 2016 ⚠ fin compatible |
| Psychopathologie | Épisode dépressif caractérisé | 2023-01 → 2023-11 (month) |  | trouvé | Épisode dépressif caractérisé · 2023-01 → 2023-11 |
| Psychopathologie | Crise suicidaire | 2023-04-08 → 2023-04-10 (exact) |  | trouvé | Crise suicidaire · 2023-04-09 ⚠ fin compatible |
| Psychopathologie | TDAH de l'adulte, présentation combinée | 2024-01-09 → (exact) |  | mal daté | TDAH de l'adulte · 1985 → |
| Somatique | Appendicectomie | 1991 (approx) |  | trouvé | Appendicectomie · 1991 |
| Somatique | Douleur thoracique sous cocaïne | 2017 (year) |  | trouvé | Douleur thoracique sous cocaïne · 2017 |
| Somatique | Perforation de la cloison nasale | 2022-04 → 2023 (approx) |  | trouvé | Perforation de la cloison nasale · 2022-06-20 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Paroxétine | 2016 (year) |  | trouvé | Paroxétine · 2016 → 2016 ⚠ fin compatible |
| Médicaments | Escitalopram | 2023-03-07 → 2023-03 (exact) |  | trouvé | Escitalopram · 2023-03-07 ⚠ fin compatible |
| Médicaments | Escitalopram | 2023-04-18 → 2025-03 (exact) |  | trouvé | Escitalopram · 2023-04-18 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Oxazépam | 2023-04-09 → 2023-04-21 (exact) |  | trouvé | Oxazépam · 2023-04-09 → 2023-04-21 |
| Médicaments | Substituts nicotiniques | 2023-04 → 2023-06 (month) |  | trouvé | Patch nicotinique · 2023-04 ⚠ fin compatible |
| Médicaments | Méthylphénidate LP | 2024-03-05 → (exact) |  | trouvé | Méthylphénidate LP · 2024-03-05 → |
| Médicaments | Naltrexone | 2025-03-25 → 2025-08 (exact) |  | trouvé | Naltrexone · 2025-03-25 → 2025-08 |
| Médicaments | Varénicline | 2026-01-13 → 2026-01 (exact) |  | trouvé | Varénicline · 2026-01-13 → 2026-01-17 |
| Médicaments | Varénicline | 2026-02-17 → 2026-04 (approx) |  | trouvé | Varénicline · 2026-02-17 → 2026-04 |
| Prises en charge | Suivi addictologique libéral (Dr ESTRABAUD) | 2015 (year) |  | trouvé | Suivi addictologue libéral (Bordeaux) · 2015 → 2015 ⚠ fin compatible |
| Prises en charge | Suivi addictologique (CSAPA) | 2021-01-12 → (exact) |  | trouvé | Suivi CSAPA · 2021-01 → |
| Prises en charge | Psychothérapie | 2021-02-16 → (exact) |  | trouvé | Psychothérapie (psychologue) · 2021-02-16 → |
| Prises en charge | Groupe de prévention de la rechute | 2022-01 → 2022-06 (month) |  | trouvé | Groupe de prévention de la rechute · 2022-01-18 → 2022-06-14 |
| Prises en charge | Accompagnement social (dettes, surendettement) | 2023-01-31 → 2026-06-23 (exact) |  | trouvé | Suivi social (assistante sociale) · 2023-01-31 → ⚠ fin compatible, « en cours » juste |
| Prises en charge | Passage aux urgences (UHCD) | 2023-04-09 → 2023-04-10 (exact) |  | trouvé | Passage aux urgences (UHCD) · 2023-04-09 → 2023-04-10 |
| Prises en charge | Hospitalisation en addictologie | 2023-04-11 → 2023-04-27 (exact) |  | trouvé | Hospitalisation en addictologie · 2023-04-11 → 2023-04-27 |
| Prises en charge | Interdiction volontaire de jeux (ANJ) | 2023-05-02 → (exact) |  | autre piste | Interdiction volontaire de jeux (ANJ) · 2023-05-02 → |
| Prises en charge | Thérapie de couple (libéral) | 2023-09 (month) |  | trouvé | Thérapie de couple en libéral · 2023-09 → ⚠ « en cours » juste |
| Prises en charge | Consultation de tabacologie | 2026-01-13 (exact) |  | trouvé | Suivi de tabacologie (IDE) · 2026-01-13 → ⚠ « en cours » juste |
| Événements de vie | Séparation des parents | 1993 (approx) |  | trouvé | Séparation des parents · 1993 |
| Événements de vie | Jeu pathologique du père, saisie de la maison familiale | 1993 (approx) |  | manqué |  |
| Événements de vie | Redoublement de la 5e | 1992 (approx) |  | trouvé | Redoublement de la 5e et renvoi temporaire en 4e · 1991 → 1996 ⚠ fin compatible |
| Événements de vie | Exclusion temporaire du collège | 1993 (approx) |  | manqué |  |
| Événements de vie | Entrée chez Médivia (matériel médical) | 2006 (year) |  | manqué |  |
| Événements de vie | Mariage | 2009 (year) |  | trouvé | Mariage · 2009 |
| Événements de vie | Naissance de Victor | 2011 (approx) |  | manqué |  |
| Événements de vie | Naissance de Capucine | 2014 (approx) |  | manqué |  |
| Événements de vie | Promotion cadre (responsable grands comptes) | 2014 (approx) |  | trouvé | Promotion comme cadre · 2014 |
| Événements de vie | Crédits renouvelables cachés | 2019 (year) |  | manqué |  |
| Événements de vie | Accident de voiture sous cocaïne | 2020-11 (month) |  | trouvé | Accident de voiture sous cocaïne · 2020-11 |
| Événements de vie | Avertissement professionnel | 2020-12 (month) |  | trouvé | Avertissement de l'employeur · 2020-12 |
| Événements de vie | Ultimatum de l'épouse | 2020-12 (month) |  | trouvé | Ultimatum de l'épouse · 2020-12 |
| Événements de vie | Entretien préalable à licenciement | 2022-09-29 (exact) |  | trouvé | Licenciement · 2022-09-29 → 2022-11-21 ⚠ fin compatible |
| Événements de vie | Arrêt de travail | 2022-10-04 → 2022-10 (exact) |  | trouvé | Arrêt de travail · 2022-10-04 → 2022-10-19 |
| Événements de vie | Licenciement | 2022-11-21 (exact) |  | manqué |  |
| Événements de vie | Chômage (ARE) | 2022-11 → 2025-09-01 (approx) |  | trouvé | Chômage · 2022-11-21 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Suspension du permis de conduire | 2022-12-10 → 2023-07 (exact) |  | trouvé | Suspension du permis de conduire · 2022-12-10 → 2023-07 |
| Événements de vie | Découverte du jeu et des dettes par l'épouse | 2023-01 (month) |  | trouvé | Révélation du jeu et des dettes par l'épouse · 2023-01 |
| Événements de vie | Séparation du couple | 2023-01-20 → 2024-01-06 (exact) |  | trouvé | Séparation conjugale · 2023-01-20 → 2024-01-06 |
| Événements de vie | Hébergement chez sa sœur | 2023-01-20 → 2023-03-01 (exact) |  | trouvé | Hébergement chez sa sœur · 2023-01-20 → 2023-03-01 |
| Événements de vie | Studio à Mérignac | 2023-03-01 → 2024-01-06 (exact) |  | trouvé | Logement en studio (Mérignac) · 2023-03-01 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Dossier de surendettement | 2023-06-08 → 2024-03 (exact) |  | trouvé | Surendettement (dossier Banque de France) · 2023-06-08 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Reprise de la vie commune | 2024-01-06 (exact) |  | manqué |  |
| Événements de vie | Plan de surendettement (mesures imposées) | 2024-03 → (month) |  | trouvé | Plan de surendettement · 2024-03 → |
| Événements de vie | Formation de remise à niveau en gestion commerciale | 2024-04 (approx) |  | trouvé | Formation de remise à niveau en gestion commerciale · 2024-04 → ⚠ « en cours » juste |
| Événements de vie | Nouvel emploi | 2025-09-01 → (exact) |  | trouvé | Nouvel emploi (commercial sédentaire, CDI) · 2025-09-01 → |
| Événements de vie | Cancer du poumon de son père | 2026-03 (approx) |  | trouvé | Maladie du père (cancer du poumon métastatique) · 2026-03 → 2026-07-16 ⚠ fin compatible |
| Événements de vie | Décès de son père | 2026-07-16 (exact) |  | trouvé | Décès du père · 2026-07-16 |

En plus (passage `regroupe1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Cocaïne** · 2021-02-02 → 2021-03-16 · craving — Craving important le soir et en voiture aux endroits d'achat ; en diminution le 16/03, surtout le jeudi soir.
- Consommations · **Cocaïne** · 2021-09 → 2022-04 · usage — Usage de week-end : 1 ou 2 fois par week-end puis 2 à 3 soirées par mois, 1 à 1,5 g ; pas d'usage en semaine ni professionnel ; urines positives en septembre et novembre ; pensée d'une « petite trace » avant une réunion en mars sans passage à l'acte.
- Consommations · **Alcool** · 2021-08 → 2022-04 · usage — Binge les soirs de cocaïne (vin puis whisky, jusqu'à 8-10 verres), sinon 1-2 verres ; réduction en semaine.
- Psychopathologie · **Trouble de l'usage de la cocaïne sévère** · 2021-01-18 → — Diagnostic DSM-5 à l'entrée (7 critères) ; en rémission partielle (usage de week-end) en février 2022, puis rechute d'un usage sévère depuis avril 2022.
- Psychopathologie · **Trouble de l'usage de l'alcool d'intensité moyenne** · 2021-01-18 → — 4 critères DSM-5 à l'entrée ; amélioré en février 2022.
- Psychopathologie · **Difficultés de concentration, impulsivité (TDAH à explorer)** · 2021-01-18 → — Hyperactivité et impulsivité notées à l'entretien d'entrée ; plaintes de concentration, d'oublis et de désorganisation au travail, présentes « depuis toujours » selon lui ; pas d'évaluation formelle.
- Somatique · **Troubles du sommeil** · 2021-01-18 → — Sommeil de 3 à 5 h à l'entrée, très perturbé les premières nuits d'arrêt, meilleur en mars 2021 (6 h), puis sommeil court (5 h fin 2021 et début 2022, 4 h en mai 2022).
- Somatique · **Épistaxis et croûtes nasales** · 2022-04 → — Épistaxis répétées depuis quelques semaines, croûtes nasales ; consultation ORL demandée.
- Prises en charge · **Suivi addictologique médical (consultations)** · 2021-01-18 → — Première consultation le 18/01/2021 après appel du 12/01 ; suivi par psychiatre addictologue et interne, puis suivi mensuel ; pas de traitement médicamenteux.
- Prises en charge · **Suivi infirmier (IDE)** · 2021-01-26 → — Bilan biologique, ECG et entretiens avec l'IDE ; contacts téléphoniques ; rappel prévu après le rendez-vous manqué d'avril 2022.
- Événements de vie · **Entrée dans l'entreprise actuelle** · 2006 — Entré en 2006 dans l'entreprise actuelle de distribution de matériel médical.
- Événements de vie · **Difficulté professionnelle (trimestre raté)** · 2021-06 — Trimestre « raté », remarque du manager devant l'équipe ; colère puis effondrement.
- Événements de vie · **Révélation de la rechute à l'épouse** · 2021-10 — Il en parle à son épouse en octobre : « elle l'a mal pris mais elle reste » ; couple fragile.
- Événements de vie · **Réorganisation de l'entreprise** · 2022-03 → — Réorganisation annoncée, nouveau directeur régional orienté chiffre ; peur d'être « mis au placard » ; pression commerciale citée comme facteur de la reprise.
- Consommations · **Cocaïne** · 2009 · usage — Consommation de cocaïne « depuis l'âge de 30 ans » selon le patient (urgences).
- Consommations · **Jeu d'argent (paris sportifs en ligne)** · 2023-04 · craving — Paris « dans la tête » dans les jours précédant le 11/04/2023, alors qu'il ne joue plus.
- Événements de vie · **Interdiction volontaire de jeux (ANJ)** · 2023-01-31 → — Formulaire de demande rempli avec l'assistante sociale ; demande en cours d'instruction au 07/03/2023.
- Événements de vie · **Endettement** · 2019 → — Crédits renouvelables souscrits depuis 2019 à l'insu de l'épouse, prêt personnel de 2021, découvert ; environ 38 000 € recensés hors crédit immobilier (le patient parle d'une vingtaine de milliers). Dossier de surendettement envisagé.
- Prises en charge · **Suivi éducatif individuel mensuel** · 2022-06-14 — Proposition d'un suivi individuel une fois par mois avec l'éducateur, en plus du suivi médical ; accepté.
- Somatique · **Amaigrissement** · 2022-06 → 2022-09 — Perte de 5 kg depuis juin selon la balance de l'IDE (13/09/2022).
- Somatique · **Amaigrissement** · 2023-03-07 — Perte de 6 kg dans le contexte de l'épisode dépressif.
- Psychopathologie · **Irritabilité, anxiété et insomnie** · 2022-06 → 2022-12 — Irritabilité, sommeil de 4 h, anxiété, ruminations sur l'argent, sans idée suicidaire.
- Consommations · **Cocaïne** · 2022-12-10 → 2023-01 · sevrage — Pas de cocaïne depuis le contrôle du 10/12/2022 (abstinence de 10 jours au 20/12) ; reprise après les fêtes.
- Événements de vie · **Projet de vente de la maison** · 2023-04 — Vente de la maison évoquée lors de l'appel difficile avec l'épouse la veille du passage aux urgences.
- Consommations · **Cocaïne** · 2023-04-09 → · sevrage — Abstinence de cocaïne depuis le 09/04/2023, maintenue à la sortie du 27/04.
- Consommations · **Cocaïne** · 2023-04-11 → 2023-04-27 · craving — Craving intense les premiers jours d'hospitalisation (« très envie » le 13/04), en nette baisse à la sortie.
- Prises en charge · **Entretien familial** · 2023-04-25 — Entretien avec l'épouse à la demande du patient : elle ne souhaite pas reprendre la vie commune pour l'instant mais « reste là pour les enfants ».
- Consommations · **Cocaïne** · 2020-11 · intoxication — Soirée sous cocaïne, accident de la voiture de fonction en novembre 2020 ; confié à l'assistante sociale puis confirmé au psychiatre.
- Consommations · **Cocaïne** · 2022-04 → 2023-04 · usage — Nouvelle escalade d'avril 2022 à avril 2023, avec perforation septale (06/2022) ; dernière consommation le 09/04/2023.
- Consommations · **Cocaïne** · 2024-12-22 → 2024-12-29 · craving — Craving fort pendant une semaine après la rechute.
- Consommations · **Jeu d'argent (paris sportifs en ligne)** · 2024-12 · craving — Envie de parier sur le match du lendemain, sans passage à l'acte.
- Somatique · **Élévation des GGT** · 2025-03 → — GGT 64 (à 31 un an avant), CDT limite.
- Médicaments · **Escitalopram** · 2023-03 → 2025-03 — 15 mg poursuivi ; décroissance à 10 mg puis 5 mg à partir de janvier 2025 ; arrêté fin mars 2025 sans syndrome de sevrage.
- Prises en charge · **Évaluation du TDAH (ASRS, DIVA 2.0)** · 2023-11-28 → 2024-01-09 — Deux consultations avec l'interne, entretien avec la mère le 12/12/2023 ; diagnostic de TDAH de l'adulte.
- Événements de vie · **Retour au domicile conjugal** · 2024-01-06 → — Retour à la maison avec l'épouse et les enfants ; budget commun géré par l'épouse.
- Consommations · **Cocaïne** · 2026-07-20 · craving — "Envie énorme" de cocaïne le soir des obsèques de son père ; a appelé sa sœur, pas de reprise.
- Prises en charge · **Logiciel de blocage des sites de jeux** · 2025-12-16 → — Installé avec l'éducateur sur téléphone, ordinateur et tablette familiale ; code gardé par l'épouse ; toujours actif en 09/2026.

### `opiaces-parcours`

Statut au passage `regroupe1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Héroïne | 2005 → 2007 (approx) | usage | trouvé | Héroïne · 2005 → 2017-03 · usage ⚠ fin compatible |
| Consommations | Héroïne | 2007 → 2015 (approx) | usage | trouvé | Héroïne · 2007 → 2015 · usage |
| Consommations | Héroïne | 2011 → 2011 (approx) | sevrage | trouvé | Héroïne · 2011 · sevrage ⚠ fin compatible, au moins une source attendue |
| Consommations | Héroïne | 2011 (approx) | rechute | trouvé | Héroïne · 2011 · rechute |
| Consommations | Héroïne | 2012 → 2017-03 (approx) | usage | trouvé | Héroïne · 2012 → 2017-03-05 · usage |
| Consommations | Héroïne | 2018-02-10 → 2018-03-15 (approx) | rechute | trouvé | Héroïne · 2018-02-10 → 2018-03 · rechute |
| Consommations | Héroïne | 2020-11-16 → 2021-01-03 (exact) | rechute | trouvé | Héroïne · 2020-11-16 → 2021-01-03 · rechute |
| Consommations | Héroïne | 2020-11-20 (exact) | intoxication | trouvé | Héroïne · 2020-11-20 · intoxication |
| Consommations | Buprénorphine de rue | 2010 → 2012 (approx) | usage | trouvé | Héroïne · 2010 → 2012 · usage |
| Consommations | Cocaïne | 2007 → 2012 (approx) | usage | trouvé | Cocaïne · 2007 → 2012 · usage |
| Consommations | Cocaïne basée (crack) | 2015 → 2017-06-10 (approx) | usage | trouvé | Crack · 2015 → 2017-06 · usage |
| Consommations | Benzodiazépines de rue (Rivotril) | 2014 → 2018-03 (approx) | usage | trouvé | Benzodiazépines · 2014 → 2017-03 · usage |
| Consommations | Benzodiazépines de rue (Rivotril) | 2020-11-20 (exact) | rechute | trouvé | Benzodiazépines · 2020-11-20 · usage ⚠ mode d'usage juste |
| Consommations | Alcool | 2023-12 → 2024-04-10 (month) | usage | trouvé | Alcool · 2023-12 → 2024-04-10 · usage |
| Consommations | Tabac | 2001 → (approx) | usage | trouvé | Tabac · 2003 → · usage |
| Consommations | Cannabis | 2002 → 2019-05 (approx) | usage | trouvé | Cannabis · 2002 → · usage ⚠ fin compatible, « en cours » juste |
| Consommations | Cannabis | 2020-02 → 2025-05 (approx) | usage | trouvé | Cannabis · 2020-02 → · usage ⚠ fin compatible, « en cours » juste |
| Médicaments | Buprénorphine (en détention) | 2010-01 → 2010-05 (approx) |  | trouvé | Buprénorphine · 2010-01 → 2010-05 |
| Médicaments | Buprénorphine haut dosage | 2012 → 2017-03-05 (approx) |  | trouvé | Buprénorphine · 2012 → 2017-03-05 |
| Médicaments | Méthadone | 2017-03-06 → (exact) |  | trouvé | Méthadone · 2017-03-06 → |
| Médicaments | Zopiclone | 2017-07-04 → 2018-02-27 (exact) |  | trouvé | Zopiclone · 2017-07-04 → 2018-02-27 |
| Médicaments | Escitalopram | 2017-10-17 → 2021-09-28 (exact) |  | trouvé | Escitalopram · 2017 → 2021 ⚠ au moins une source attendue |
| Médicaments | Amoxicilline-acide clavulanique | 2018-02-20 → 2018-02-27 (approx) |  | trouvé | Amoxicilline-acide clavulanique · 2018-02-20 → 2018-02-27 |
| Médicaments | Naloxone (kit nasal) | 2018-03-06 → (exact) |  | trouvé | Naloxone nasale · 2018-03-06 ⚠ « en cours » juste |
| Médicaments | Sofosbuvir/velpatasvir | 2018-10-08 → 2018-12-30 (exact) |  | trouvé | Sofosbuvir/velpatasvir · 2018-10-08 → 2018-12-30 |
| Médicaments | Implant contraceptif | 2020-01-09 → (exact) |  | trouvé | Implant contraceptif · 2020-01-09 → |
| Médicaments | Prazosine | 2021-04-13 → 2023-04-18 (exact) |  | trouvé | Prazosine · 2021-04-13 → 2023-04-18 |
| Médicaments | Sertraline | 2021-09-28 → (exact) |  | trouvé | Sertraline · 2021-09-28 → |
| Médicaments | Oxazépam | 2022-03-15 → 2023-02-06 (exact) |  | trouvé | Oxazépam · 2022-03-15 → 2023-02-06 |
| Médicaments | Substituts nicotiniques | 2025-02-18 → 2026-05 (month) |  | trouvé | Substitut nicotinique · 2025-02-18 → 2026-05 |
| Psychopathologie | Scarifications | 2002 → 2003-02 (approx) |  | trouvé | Scarifications · 2002 ⚠ fin compatible |
| Psychopathologie | Tentative de suicide | 2003-02 → 2003-02 (month) |  | trouvé | Intoxication médicamenteuse volontaire · 2003-02 ⚠ fin compatible |
| Psychopathologie | Trouble de l'adaptation avec humeur dépressive | 2003-02 → 2003-03 (month) |  | trouvé | Trouble de l'adaptation avec humeur dépressive · 2003-02-10 → 2003-03-28 |
| Psychopathologie | Trouble de stress post-traumatique | 2017-06 → 2025 (approx) |  | trouvé | Trouble de stress post-traumatique · 2017-06 → ⚠ fin compatible, « en cours » juste |
| Psychopathologie | Épisode dépressif caractérisé | 2020-11 → 2021-09 (approx) |  | trouvé | Épisode dépressif caractérisé · 2020 → 2021 |
| Psychopathologie | Idées suicidaires (passage aux urgences) | 2021-02-08 (exact) |  | autre piste | Passage aux urgences · 2021-02-08 |
| Somatique | Hépatite C | 2013 → 2019-03-26 (year) |  | trouvé | Hépatite C · 2013 → 2019-03-26 |
| Somatique | Abcès du bras droit | 2009 (approx) |  | trouvé | Abcès du bras droit · 2009 |
| Somatique | Abcès de l'avant-bras gauche | 2018-02-20 → 2018-04 (approx) |  | trouvé | Abcès de l'avant-bras · 2018-02-20 → 2018-04-10 |
| Somatique | Mauvais état dentaire, soins à la PASS | 2017 → 2023 (approx) |  | trouvé | Problèmes dentaires · 2017-02-27 → ⚠ fin compatible, « en cours » juste |
| Somatique | Fausse couche spontanée | 2011 (approx) |  | trouvé | Fausse couche · 2011 |
| Somatique | Grossesse | 2018-12-28 → 2019-10-04 (exact) |  | trouvé | Grossesse · 2018-12 → 2019-10 |
| Somatique | Syndrome de sevrage néonatal (Lina) | 2019-10-06 → 2019-10-19 (exact) |  | trouvé | Syndrome de sevrage néonatal · 2019 ⚠ fin compatible, au moins une source attendue |
| Somatique | Allongement du QT | 2021-09-21 → 2021-11-23 (exact) |  | trouvé | QT long · 2021-09-21 → 2021-11-23 |
| Prises en charge | Hospitalisation en psychiatrie pour adolescents | 2003-02-10 → 2003-03-28 (exact) |  | trouvé | Hospitalisation en psychiatrie pour adolescents · 2003-02-10 → 2003-03-28 |
| Prises en charge | Suivi en CMP adolescents | 2003-03-28 (approx) |  | trouvé | Suivi CMP adolescents · 2003-03 |
| Prises en charge | Sevrage hospitalier (clinique) | 2011 → 2011 (approx) |  | trouvé | Sevrage hospitalier · 2011 ⚠ fin compatible |
| Prises en charge | Suivi addictologique (CSAPA) | 2017-02-20 → (exact) |  | trouvé | Suivi au CSAPA · 2017-02-20 → |
| Prises en charge | Accompagnement social (CSAPA) | 2017-04-18 (exact) |  | trouvé | Suivi social · 2017-04-18 → ⚠ « en cours » juste |
| Prises en charge | Psychothérapie (psychologue du CSAPA) | 2017-11-07 → 2023-03 (approx) |  | trouvé | Suivi psychologique · 2017-11-07 → ⚠ fin compatible, « en cours » juste |
| Prises en charge | EMDR | 2021-05 → 2023-03 (month) |  | trouvé | EMDR · 2021-05 → 2023-03 |
| Prises en charge | Hospitalisation en réanimation | 2020-11-20 → 2020-11-21 (exact) |  | trouvé | Hospitalisation en réanimation (CHU) · 2020-11-20 → 2020-11-21 |
| Prises en charge | Accompagnement éducatif (CSAPA) | 2021-06-08 (exact) |  | trouvé | Entretien éducatif (préparation du retour de [PROCHE_1]) · 2021-06-08 |
| Événements de vie | Placement en famille d'accueil (ASE) | 1994 → 2005 (approx) |  | trouvé | Placement ASE · 1994 → 2005 |
| Événements de vie | Arrêt de la scolarité | 2003 (approx) |  | trouvé | Arrêt de la scolarité · 2003 |
| Événements de vie | Décès de la grand-mère maternelle | 2004 (approx) |  | trouvé | Décès de la grand-mère maternelle · 2004 |
| Événements de vie | Installation en Gironde | 2006 (approx) |  | trouvé | Arrivée en Gironde · 2006 |
| Événements de vie | Emploi d'aide à domicile | 2006 → 2009 (year) |  | trouvé | Emploi d'aide à domicile · 2006 → 2009 |
| Événements de vie | Incarcération | 2010-01 → 2010-05 (month) |  | trouvé | Incarcération · 2010-01 → 2010-05 |
| Événements de vie | Couple avec M. GARRABOS | 2012 → 2017-06-10 (year) |  | manqué |  |
| Événements de vie | Violences conjugales | 2013 → 2017-06-10 (year) |  | trouvé | Violences conjugales · 2013 → 2017-06-10 |
| Événements de vie | Emploi d'aide à domicile | 2013 → 2014 (year) |  | trouvé | Emploi d'aide à domicile · 2013 → 2014 |
| Événements de vie | RSA | 2014 → 2022-09-01 (year) |  | trouvé | RSA · 2014 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Naissance d'Enzo | 2014-08-17 (exact) |  | trouvé | Naissance du fils · 2014-08 |
| Événements de vie | Placement d'Enzo (ASE) | 2015-11 → 2022-07-01 (month) |  | trouvé | Placement du fils à l'ASE · 2015-11 → 2022-07-01 |
| Événements de vie | Séparation, départ du domicile conjugal | 2017-06-10 (exact) |  | mal daté | Domiciliation au CSAPA · 2017-04-18 |
| Événements de vie | Hébergement d'urgence (115) | 2017-06-13 → 2017-09-18 (exact) |  | trouvé | Hébergement d'urgence (115) · 2017-06-13 → 2017-09-18 |
| Événements de vie | CHRS | 2017-09-18 → 2019-06-30 (exact) |  | trouvé | Hébergement en CHRS · 2017-09-18 → 2019-06-30 |
| Événements de vie | Condamnation de l'ex-conjoint | 2018-02-08 (exact) |  | trouvé | Audience pénale du conjoint · 2018-02-08 |
| Événements de vie | Couple avec M. LESTRADE | 2018-05 → (month) |  | trouvé | Couple avec M. [PERSONNE_3] · 2018-05 → |
| Événements de vie | Logement autonome (Cenon) | 2019-07-01 → (exact) |  | trouvé | Logement social à Cenon · 2019-07-01 → |
| Événements de vie | Naissance de Lina | 2019-10-04 (exact) |  | trouvé | Grossesse et naissance de [PERSONNE_1] · 2019-10 |
| Événements de vie | AEMO pour Lina | 2019-11-13 → 2021-11 (month) |  | trouvé | AEMO pour [PERSONNE_1] · 2019-11-13 → 2021-11 |
| Événements de vie | Hébergement d'Enzo un week-end sur deux | 2020-09 → 2021-09 (month) |  | manqué |  |
| Événements de vie | Décès du frère (surdose) | 2020-11-14 (exact) |  | trouvé | Décès du frère · 2020-11-14 |
| Événements de vie | Enzo une semaine sur deux au domicile | 2021-09 → 2022-07-01 (month) |  | manqué |  |
| Événements de vie | Retour d'Enzo au domicile (mainlevée du placement) | 2022-07-01 (exact) |  | mal daté | Mainlevée du placement de [PROCHE_1] · 2022-06-21 |
| Événements de vie | Emploi d'aide à domicile (CDI) | 2022-09-01 → (exact) |  | trouvé | Emploi d'aide à domicile · 2022-09-01 → |
| Événements de vie | Reprise de contact avec sa mère | 2025-04 (month) |  | trouvé | Retrouvailles avec la mère · 2025-04 |
| Événements de vie | Permis de conduire | 2026-06-12 (exact) |  | mal daté | Permis de conduire · 2025-06-24 → 2026-06-12 |

En plus (passage `regroupe1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Héroïne** · 2009 · usage — Période la plus lourde vers 2009 : jusqu'à 1 g/j, « je ne faisais que ça », vols et petits deals pour payer, plusieurs nuits dehors, manque quotidien, perte de poids (« 42 kilos »).
- Consommations · **Héroïne** · 2017-02-27 → 2017-07-04 · craving — Craving quotidien (matin et fin de journée) à l'entrée ; craving ++ après la séparation (juin 2017) ; modéré le 04/07/2017.
- Consommations · **Cocaïne** · 2017-03-10 · usage — Urines du 10/03/2017 positives à la cocaïne ; explique « une trace » lors d'une soirée chez des amis, minimise ; nie le crack. Urines du 27/03 puis de juin négatives.
- Consommations · **Benzodiazépines** · 2018-02 · usage — Rivotril de rue 2 mg certains soirs, en même temps que la reprise d'héroïne.
- Consommations · **Alcool** · 2017-02-27 · usage — Usage rare, quelques bières en soirée, pas d'ivresse récente ; pas d'alcool signalé ensuite.
- Psychopathologie · **Anxiété** · 2017-02-27 → — Anxiété « depuis toujours » selon la patiente ; anxiété au premier plan à l'examen d'entrée.
- Psychopathologie · **Troubles du sommeil** · 2017-02-27 → — Endormissement après 2 h, réveils ; cauchemars ; sommeil de 3-4 h par nuit en juillet 2017 ; zopiclone puis arrêt en février 2018.
- Psychopathologie · **Symptômes dépressifs** · 2017-06-20 → — Thymie basse, pleurs, culpabilité, anhédonie partielle ; pas d'idée suicidaire.
- Psychopathologie · **Trouble de la personnalité borderline (hypothèse)** · 2018-02 → 2018-04-10 — Hypothèse évoquée en février 2018 lors de la rechute, non retenue le 10/04/2018 (tableau expliqué par le TSPT et la rechute).
- Somatique · **Perte de poids importante** · 2009 — Perte de poids importante à l'époque de l'usage le plus lourd (« 42 kilos »).
- Somatique · **Traumatisme par violences conjugales** · 2017-06-10 — Coups au visage et aux côtes le 10/06/2017, certificat des urgences le 11/06 (ITT 4 jours), radio sans fracture ; ecchymoses en résorption le 20/06.
- Médicaments · **Escitalopram** · 2017-10-17 → — Escitalopram 10 mg/j à partir du 17/10/2017, majoré à 20 mg le 16/01/2018 ; ECG à surveiller (QTc 438 ms).
- Prises en charge · **Délivrance quotidienne de méthadone** · 2017-03-06 → 2017-09-12 — Délivrance quotidienne au CSAPA depuis l'initiation ; passage à l'hebdomadaire accordé le 12/09/2017.
- Prises en charge · **Délivrance hebdomadaire de méthadone** · 2017-09-12 → 2018-02-27 — Délivrance hebdomadaire accordée pour stabilité et urines négatives ; bien gérée (flacons rapportés vides) ; retour à la délivrance quotidienne après la reprise d'héroïne.
- Prises en charge · **Délivrance quotidienne de méthadone** · 2018-02-28 → — Retour à la délivrance quotidienne au CSAPA à partir du 28/02/2018, avec entretien de réduction des risques.
- Événements de vie · **Enfance avec une mère alcoolique** · 1993 → 1998 — Enfance « pas facile, ma mère buvait » ; élevée par sa mère et sa grand-mère ; peu de détails.
- Événements de vie · **Garde à vue** · 2010 — « Quelques jours de garde à vue vers 2010 » pour un vol ; pas d'autre affaire selon elle.
- Événements de vie · **Couple avec un conjoint consommateur** · 2012 → 2017-06-10 — Couple depuis 2012, vie chez lui à Floirac ; il consomme (héroïne, cocaïne). Départ du domicile le 10/06/2017.
- Événements de vie · **Plainte contre le conjoint** · 2017-06-13 — Plainte déposée au commissariat après le départ du 10/06 ; ordonnance de protection évoquée (elle réfléchit).
- Consommations · **Héroïne** · 2010-05 · rechute — Rechute à l'héroïne "la première semaine" après la sortie de détention.
- Consommations · **Buprénorphine** · 2010-05 → 2012 · usage — BHD de rue commencée après la sortie de détention, avant la prescription en ville de 2012.
- Consommations · **Buprénorphine** · 2012 → 2017 · usage — BHD prescrite en ville de 2012 à 2017 avec mésusage nasal.
- Consommations · **Crack** · 2018-02 · craving — Lors de la rechute de février, "envie de la galette" plus que de l'héroïne ; pas de consommation de crack rapportée depuis juin 2017.
- Consommations · **Héroïne** · 2018-06-26 · craving — Pas de consommation depuis mars, "même pas envie, sauf quand je passe à la gare".
- Consommations · **Héroïne** · 2019-05 → 2019-10 · sevrage — Manque le soir sous méthadone pendant la grossesse (bâillements, crampes, sueurs, craving), lié au 3e trimestre ; plus de manque depuis l'accouchement. Pas de consommation, urines négatives.
- Consommations · **Héroïne** · 2019-12-10 · craving — Repère les moments de fatigue (le soir, seule) où "les vieilles envies remontent" ; prévoit d'appeler M. [PERSONNE_3] ou sa voisine.
- Consommations · **Héroïne** · 2020-02-18 · craving — Pas de craving rapporté pour l'héroïne, "sauf quand je croise des anciens".
- Consommations · **Cannabis** · 2018-09 → 2019-05 · usage — 2 joints le soir (premier constat en 09/2018), 1 joint en mars 2019 ; arrêté "pour le bébé" depuis mai 2019.
- Consommations · **Tabac** · 2018-09 → · usage — 20 cig/j en 09/2018, 15 en 02/2019, 10 en 03/2019, 8 en 07/2019, 12 en 02/2020, 20 en 04/2020 (confinement).
- Médicaments · **Méthadone** · 2017-03-06 → 2018-09-17 — Méthadone sirop, 80 mg stable depuis juin 2017 ; délivrance hebdomadaire au CSAPA reprise le 10/04/2018 ; relais par les gélules à partir du 17/09/2018.
- Médicaments · **Méthadone** · 2018-09-17 — Gélules 80 mg, délivrance hebdomadaire en pharmacie de ville ; délivrance tous les 14 jours pendant le confinement (04/2020).
- Médicaments · **Méthadone** · 2019-07-16 → 2019-11-26 — Augmentée à 90 mg/j fractionnée 45 mg matin + 45 mg soir (3e trimestre) ; retour à 80 mg en une prise le 26/11/2019 (somnolence le soir).
- Médicaments · **Méthadone** · 2020-11-25 → — Délivrance quotidienne en pharmacie à partir du 25/11/2020 ; 80 mg, majoration à discuter.
- Médicaments · **Escitalopram** · 2018-01 → — 20 mg depuis janvier 2018, réduit à 10 mg le 12/02/2019 (grossesse), remonté à 20 mg le 24/11/2020.
- Psychopathologie · **Idées de mort passives (deuil)** · 2020-11-24 → — Douleur, culpabilité, pleurs, insomnie totale après le décès de son frère ; nie toute intention ("il y a les petits").
- Somatique · **Problèmes dentaires** · 2018-06 → — Caries multiples, 2 extractions à l'été 2018, 4 caries soignées en 2019, prothèse partielle prévue après l'accouchement ; presque terminés en 02/2020.
- Prises en charge · **Psychothérapie (Mme [SOIGNANT_7])** · 2018-04 → — Entretiens toutes les deux semaines (suivi déjà en cours en 04/2018), puis mensuels depuis décembre 2019.
- Prises en charge · **Suivi PMI et maternité** · 2019-02 → — Lien avec la maternité du CHU (staff de parentalité le 09/07/2019), sage-femme de PMI tous les 15 jours ; TISF proposée après la naissance.
- Événements de vie · **Séparation de l'ex-conjoint** · 2017-06 — Séparation en juin 2017 ; pas de nouveau contact depuis la condamnation de 2018.
- Événements de vie · **Néonatologie de [PERSONNE_1] (sevrage néonatal)** · 2019-10 → 2019-10-19 — Syndrome de sevrage néonatal à J2, morphine orale ; sortie le 19/10, culpabilité de la patiente.
- Consommations · **Benzodiazépines** · 2018 · usage — Rivotril de rue jusqu'en 2018
- Consommations · **Héroïne** · 2020-12-01 → 2021-04-13 · craving — Craving ++ le soir et manque en fin de journée en décembre 2020 ; craving rare en avril 2021, surtout aux dates anniversaires
- Consommations · **Héroïne** · 2022-10-04 → 2022-10-06 · sevrage — Un peu de manque les 3 premiers soirs après la baisse de méthadone de 70 à 60 mg
- Consommations · **Cannabis** · 2021-04-13 → · usage — Cannabis mentionné depuis avril 2021 : 2 joints le soir, puis 1 joint le soir, plus occasionnel en septembre 2024
- Consommations · **Tabac** · 2021-04-13 → · usage — Tabac 15 cigarettes par jour, stable ; pense demander de l'aide plus tard
- Consommations · **Benzodiazépines** · 2022-03-15 → 2023-02 · usage — Oxazépam 50 mg 3 cp/j (parfois 4) prescrit par un autre médecin, renouvellement mensuel depuis le 15/03/2022, non connu du CSAPA ; avance refusée par le pharmacien
- Consommations · **Benzodiazépines** · 2022-11-29 → 2023-02-06 · sevrage — Décroissance de l'oxazépam, dernière prise le 06/02/2023, sevrage terminé sans complication
- Consommations · **Alcool** · 2023-11-07 · usage — Pas d'alcool déclaré, une bière de temps en temps
- Consommations · **Alcool** · 2024-06-11 · craving — Envies le soir certains jours, gérées par la tisane et le balcon
- Psychopathologie · **Trouble de l'usage de l'alcool** · 2023-12 → 2024-04 — Trouble de l'usage de l'alcool d'intensité moyenne, apparu avec la baisse de méthadone ; abstinence depuis avril 2024
- Psychopathologie · **Idées suicidaires** · 2020-12-01 → 2021-02 — Idées de mort passives en décembre 2020, puis idées suicidaires avec scénario le 08/02/2021 ; plus d'idées suicidaires depuis février 2021
- Psychopathologie · **Cauchemars post-traumatiques** · 2020 → — Cauchemars quasi quotidiens depuis le décès du frère (avril 2021), moitié moins en juin 2021, une fois par mois en avril 2023, rares ensuite
- Psychopathologie · **Angoisses au travail** · 2022-10-18 → 2022-11-29 — Anxiété avant les nouvelles bénéficiaires, réveils à 4h, boule au ventre ; pas d'attaque de panique franche
- Somatique · **Prothèse dentaire** · 2023 — Prothèse dentaire posée en début d'année 2023
- Somatique · **Élévation de la GGT** · 2024-02-13 → 2024-05-22 — GGT 112 et VGM 99 en février 2024, 31 le 22/05/2024, 27 en août
- Médicaments · **Méthadone** · 2020-12-01 → 2020-12-08 — Méthadone 90 mg (ECG avant augmentation)
- Médicaments · **Méthadone** · 2020-12-08 → 2021-09-28 — Méthadone 100 mg depuis le 08/12/2020
- Médicaments · **Méthadone** · 2021-09-28 → 2021-10-05 — Méthadone 90 mg pendant 1 semaine (QT long)
- Médicaments · **Méthadone** · 2021-10-05 → 2022-03-01 — Méthadone 80 mg à partir du 05/10/2021
- Médicaments · **Méthadone** · 2022-03-01 → 2022-10-04 — Méthadone 70 mg à partir du 01/03/2022
- Médicaments · **Méthadone** · 2022-10-04 → 2023-04-04 — Méthadone 60 mg depuis le 04/10/2022 ; pas de nouvelle baisse pendant la décroissance de l'oxazépam
- Médicaments · **Méthadone** · 2023-04-04 → 2023-11-07 — Méthadone 50 mg depuis le 04/04/2023, bien supportée
- Médicaments · **Méthadone** · 2023-11-07 → 2024-09-17 — Méthadone 40 mg depuis le 07/11/2023, baisse suspendue après la reprise d'alcool
- Médicaments · **Méthadone** · 2024-09-17 → 2025-03-03 — Méthadone 35 mg à partir du 17/09/2024, reprise de la baisse par paliers de 5 mg
- Médicaments · **Escitalopram** · 2020-12-01 → 2021-09-28 — Escitalopram 20 mg, mentionné dès le 01/12/2020 ; arrêté le 28/09/2021 en raison du QT long
- Médicaments · **Naloxone nasale** · 2020-12-01 — Nouveau kit de naloxone nasale remis le 01/12/2020, entourage formé ; kit vérifié à jour en février 2022
- Prises en charge · **Délivrance quotidienne de méthadone en pharmacie** · 2020-12-01 → 2021-03-09 — Délivrance quotidienne maintenue après la surdose, jusqu'en mars 2021
- Prises en charge · **Délivrance hebdomadaire de méthadone en pharmacie** · 2021-03-09 → 2022-01 — Délivrance hebdomadaire reprise depuis le 09/03/2021
- Prises en charge · **Délivrance de méthadone tous les 14 jours** · 2022-01 → 2024-09-17 — Délivrance tous les 14 jours en pharmacie depuis janvier 2022
- Prises en charge · **Délivrance de méthadone tous les 28 jours** · 2024-09-17 → — Délivrance tous les 28 jours en pharmacie (stabilité, accord de l'équipe) ; erreur de date d'ordonnance corrigée en décembre 2024
- Prises en charge · **Plan de sécurité** · 2021-02-09 — Plan de sécurité écrit (personnes à appeler, 3114, méthadone rangée à la pharmacie), conjoint informé
- Prises en charge · **Contrôles urinaires mensuels** · 2022-02-15 — Contrôles urinaires mensuels acceptés pendant la baisse de méthadone
- Prises en charge · **Suivi social trimestriel** · 2022-07-05 → — RDV social tous les 3 mois demandé par la patiente pour le budget et les papiers
- Prises en charge · **Pause de la baisse de méthadone** · 2024-02-20 → 2024-09-17 — Pause à 40 mg, arrêt de l'alcool sans sevrage médicamenteux, entretiens rapprochés ; reprise de la baisse en septembre 2024
- Événements de vie · **Fugues** · 1999 → 2004 — Fugues à l'adolescence, « a tout cassé »
- Événements de vie · **Changement de famille d'accueil** · 2002 — Rupture à 15 ans : « après l'hôpital ils m'ont changée de famille »
- Consommations · **Cannabis** · 2025-02 → 2025-05 · usage — 1 joint occasionnel le week-end en février 2025 ; arrêt « pour de bon » en mai 2025.
- Consommations · **Tabac** · 2025-02 → · usage — Consommation déjà présente à la première observation : 15 cig/j (02/2025), 6 (10/2025), 5 (01/2026), 4 (04/2026), 3-4 (06/2026), 3 cig/j (09/2026) ; demande d'aide.
- Médicaments · **Méthadone** · 2025-03-03 → 2025-10-07 — Palier 30 mg à partir du 03/03/2025, bien toléré.
- Médicaments · **Méthadone** · 2025-10-07 → 2026-04-14 — Palier 25 mg à partir du 07/10/2025, délivrance 28 j ; ECG de contrôle QTc 428 ms ; sans manque.
- Médicaments · **Méthadone** · 2026-04-14 → — Palier 20 mg à partir du 14/04/2026, délivrance 28 j, bien supporté, sans manque ; prochain palier 15 mg discuté en novembre.
- Médicaments · **Naloxone nasale** · 2026-02-17 — Kit renouvelé le 17/02/2026 (le précédent était périmé).
- Médicaments · **Implant contraceptif** · 2026-01-08 — Changement d'implant le 08/01/2026 par la sage-femme (à changer en janvier 2026).
- Psychopathologie · **Hypervigilance (« mode alerte »)** · 2018 — « Le mode alerte » en 2018, disparu en 2025 (peut s'asseoir dos à la porte).
- Prises en charge · **EMDR** · 2021 → 2023 — EMDR 2021-2023 pour le TSPT.
- Prises en charge · **Entretien psychologique de bilan** · 2025-05-13 — Bilan à la demande de la patiente, deux ans après la fin de l'EMDR ; porte ouverte, bilan dans un an.
- Prises en charge · **CMPP de [PROCHE_1]** · 2025-09 → — Suivi de [PROCHE_1] au CMPP depuis septembre 2025 (RDV pris en juin), mieux ; proposition de poursuivre un an.
- Événements de vie · **Logement à Cenon en famille** · 2025-02 → — Vit à Cenon avec M. [PERSONNE_3] et les deux enfants (déjà le cas à la première observation).
- Événements de vie · **Exclusion scolaire de [PROCHE_1]** · 2025-06 — [PROCHE_1] exclu 2 jours de l'école pour une bagarre ; soutien éducatif.
- Événements de vie · **Perte de la boîte de méthadone** · 2025-12-09 — Perte de la boîte de gélules de 7 jours (sac volé dans le bus ?), plainte déposée ; délivrance exceptionnelle de 7 jours ; pas de suspicion de mésusage.
- Événements de vie · **Retrouvailles avec la famille d'accueil** · 2026 — A revu sa famille d'accueil cet été en Dordogne avec les enfants.

### `polyconso-precarite`

Statut au passage `regroupe1`.

| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |
|---|---|---|---|---|---|
| Consommations | Alcool | 1987 → 2006 (approx) | usage | trouvé | Alcool · 1987 → 2006 · usage |
| Consommations | Alcool | 2006 → 2018-09-10 (approx) | usage | trouvé | Alcool · 2006 → 2025-02 · usage ⚠ fin compatible |
| Consommations | Alcool | 2009 (approx) | sevrage | trouvé | Alcool · 2009 · sevrage |
| Consommations | Alcool | 2016 (year) | sevrage | trouvé | Alcool · 2016 · sevrage |
| Consommations | Alcool | 2016 (year) | rechute | trouvé | Alcool · 2016 · rechute |
| Consommations | Alcool | 2018-02 (month) | sevrage | trouvé | Alcool · 2018-02 · sevrage |
| Consommations | Alcool | 2018-09-10 → 2018-09-20 (exact) | sevrage | trouvé | Alcool · 2018-09-10 → 2018-09-20 · sevrage |
| Consommations | Alcool | 2018-10-05 → 2018-11-16 (exact) | rechute | trouvé | Alcool · 2018-10-05 · rechute ⚠ fin compatible |
| Consommations | Alcool | 2018-11-16 → 2018-11-22 (exact) | sevrage | trouvé | Alcool · 2018-11-16 → 2018-11-22 · sevrage |
| Consommations | Alcool | 2018-11-22 → 2019-04 (exact) | rechute | trouvé | Alcool · 2018-11-22 · rechute ⚠ fin compatible |
| Consommations | Alcool | 2019-04 → 2020-01-06 (month) | usage | mal daté | Alcool · 2021-01 · usage |
| Consommations | Alcool | 2020-01-06 → 2020-01-21 (approx) | sevrage | trouvé | Alcool · 2020-01-10 → 2020-01-21 · sevrage |
| Consommations | Alcool | 2020-01-21 → 2021-06-07 (month) | rechute | manqué |  |
| Consommations | Alcool | 2021-06-07 → 2021-06-18 (exact) | sevrage | trouvé | Alcool · 2021-06-07 → 2021-06-18 · sevrage |
| Consommations | Alcool | 2021-08 → 2021-08-19 (approx) | rechute | trouvé | Alcool · 2021-08 → 2021-08 · rechute |
| Consommations | Alcool | 2022-02 → 2022-02-19 (approx) | rechute | trouvé | Alcool · 2022-02 → 2022-02 · rechute |
| Consommations | Alcool | 2022-02-19 (exact) | intoxication | trouvé | Alcool · 2022-02-19 · intoxication |
| Consommations | Alcool | 2022-12-24 (exact) | rechute | trouvé | Alcool · 2022-12-24 · usage ⚠ mode d'usage juste |
| Consommations | Alcool | 2023-01 → 2023-04-17 (month) | rechute | trouvé | Alcool · 2023-01 → 2023-04-17 · rechute |
| Consommations | Alcool | 2024-01 → 2025-01 (month) | usage | trouvé | Alcool · 2024-01 → 2025-01 · usage |
| Consommations | Alcool | 2025-01 → 2025-02-11 (month) | rechute | trouvé | Alcool · 2025-01 → 2025-02-11 · rechute |
| Consommations | Alcool | 2025-02-11 → 2025-02-18 (exact) | sevrage | trouvé | Alcool · 2025-02-11 → 2025-02-18 · sevrage |
| Consommations | Alcool | 2026-03-07 (exact) | rechute | trouvé | Alcool · 2026-03-07 · usage ⚠ mode d'usage juste |
| Consommations | Benzodiazépines | 2019-04 → 2021-06-07 (approx) | usage | trouvé | Benzodiazépines (clonazépam de rue) · 2019 → 2021-06-07 · usage |
| Consommations | Benzodiazépines | 2021-06-07 → 2024-02-10 (exact) | sevrage | trouvé | Benzodiazépines (clonazépam de rue) · 2021-06-07 → · sevrage ⚠ fin compatible, « en cours » juste |
| Consommations | Crack | 2019-10 → 2020-03 (approx) | usage | autre piste | Brûlures des lèvres et des doigts (crack) · 2020-09 → 2021-06 |
| Consommations | Crack | 2020-03 → 2021-06-07 (approx) | usage | trouvé | Crack · 2019-10 → 2021-06-06 · usage |
| Consommations | Crack | 2021-06-07 → 2021-06-18 (exact) | sevrage | trouvé | Crack · 2021-06-07 → 2021-06-11 · craving ⚠ fin compatible, mode d'usage juste |
| Consommations | Crack | 2024-04 → 2024-05-05 (month) | rechute | trouvé | Crack · 2024-04 → 2024-05-05 · rechute |
| Consommations | Tabac | 1987 → 2025-05-13 (approx) | usage | trouvé | Tabac · 1987 → · usage ⚠ fin compatible, « en cours » juste |
| Consommations | Tabac | 2025-05-13 → (exact) | usage | mal daté | Tabac · 2026-01-20 → · usage |
| Consommations | Cannabis | 1992 (approx) | usage | trouvé | Cannabis · 1991 → 1993 · usage ⚠ fin compatible |
| Médicaments | Alprazolam | 2015 → 2018-09-10 (year) |  | trouvé | Alprazolam · 2015 → 2018-09-10 |
| Médicaments | Alprazolam | 2018-10 → 2019-04 (month) |  | trouvé | Alprazolam · 2018-10 → 2018-11 ⚠ fin compatible |
| Médicaments | Paroxétine | 2016 → 2017 (approx) |  | trouvé | Paroxétine · 2016 → 2017 |
| Médicaments | Sertraline | 2018-05-29 → 2019-04 (exact) |  | trouvé | Sertraline · 2018-05-29 → 2019-04 |
| Médicaments | Thiamine | 2018-05-29 → 2023-03 (exact) |  | trouvé | Thiamine · 2018-05-29 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Diazépam | 2018-09-10 → 2018-09-19 (exact) |  | trouvé | Diazépam · 2018-09-10 ⚠ fin compatible |
| Médicaments | Baclofène | 2018-09-20 → 2019-04 (exact) |  | trouvé | Baclofène · 2018-09-20 → 2019-04 |
| Médicaments | Diazépam | 2018-11-18 → 2018-11-25 (approx) |  | trouvé | Diazépam · 2018-11-18 ⚠ fin compatible |
| Médicaments | Mirtazapine | 2021-02-02 → (exact) |  | trouvé | Mirtazapine · 2021-02-02 → |
| Médicaments | Diazépam | 2021-06-07 → 2024-02-10 (exact) |  | trouvé | Diazépam · 2021-06 → 2024-02-10 |
| Médicaments | Acamprosate | 2021-06-18 → 2022-10 (exact) |  | trouvé | Acamprosate · 2021-06-18 → 2022-10 |
| Médicaments | Sofosbuvir/velpatasvir | 2021-10-18 → 2022-01 (exact) |  | trouvé | Traitement antiviral du VHC · 2021-10-18 → 2022-01 |
| Médicaments | Nalméfène | 2024-06-04 → 2025-01 (exact) |  | trouvé | Nalméfène · 2024-06-04 → 2025-01 |
| Médicaments | Diazépam | 2025-02-11 → 2025-02-18 (exact) |  | trouvé | Diazépam · 2025-02-11 → 2025-02-18 |
| Médicaments | Thiamine | 2025-02-11 (exact) |  | trouvé | Thiamine · 2025-02-11 |
| Médicaments | Acamprosate | 2025-02-18 → 2026-10-13 (exact) |  | trouvé | Acamprosate · 2025-02-18 → ⚠ fin compatible, « en cours » juste |
| Médicaments | Substituts nicotiniques | 2025-05-13 → (exact) |  | trouvé | Substituts nicotiniques · 2025-05-13 → |
| Psychopathologie | Tentative de suicide | 2007 (year) |  | trouvé | Intoxication médicamenteuse volontaire · 2007 |
| Psychopathologie | Épisode dépressif | 2016 → 2017 (year) |  | trouvé | Épisode dépressif · 2016 ⚠ fin compatible |
| Psychopathologie | Épisode dépressif caractérisé | 2017-12 (approx) |  | trouvé | Épisode dépressif caractérisé · 2018 → 2018-10 ⚠ fin compatible |
| Psychopathologie | Épisode dépressif caractérisé sévère | 2021-01 → 2022-04 (month) |  | trouvé | Épisode dépressif caractérisé sévère · 2021-01 ⚠ fin compatible |
| Psychopathologie | Trouble de stress post-traumatique | 2022-03 → (month) |  | mal daté | Trouble de stress post-traumatique · 2005 → |
| Somatique | Appendicectomie | 1984 (approx) |  | trouvé | Appendicectomie · 1984 |
| Somatique | Traumatisme crânien | 2005 (year) |  | trouvé | Traumatisme crânien avec perte de connaissance · 2005 |
| Somatique | Hépatopathie alcoolique | 2018-06 → (month) |  | trouvé | Hépatopathie alcoolique · 2018-06-21 → |
| Somatique | Crise convulsive de sevrage | 2018-11-18 (exact) |  | trouvé | Crise convulsive de sevrage · 2018-11-18 |
| Somatique | Delirium tremens | 2020-01-10 (exact) |  | trouvé | Delirium tremens · 2020-01-10 → 2020-01-13 ⚠ fin compatible |
| Somatique | Hépatite C | 2021-02 → 2022-09 (month) |  | trouvé | Hépatite C · 2021-02 → 2022-09 |
| Somatique | Polyneuropathie sensitive | 2021-06 → (month) |  | mal daté | Polyneuropathie · 2021-11-03 → |
| Somatique | Pancréatite aiguë | 2021-08-19 (exact) |  | trouvé | Pancréatite aiguë · 2021-08-19 |
| Somatique | Fracture bimalléolaire de la cheville gauche | 2022-02-19 (exact) |  | trouvé | Fracture bimalléolaire de la cheville gauche · 2022-02-19 |
| Prises en charge | Hospitalisation (réanimation) pour intoxication volontaire | 2007 (year) |  | manqué |  |
| Prises en charge | Hospitalisation pour sevrage (Marmande) | 2009 (approx) |  | trouvé | Hospitalisation de sevrage à Marmande · 2009 |
| Prises en charge | Hospitalisation pour sevrage (clinique du Lac) | 2016 (year) |  | trouvé | Sevrage hospitalier (clinique du Lac) · 2016 |
| Prises en charge | Suivi au CSAPA | 2018-05-22 → (exact) |  | trouvé | Suivi CSAPA · 2018-05-22 → |
| Prises en charge | Accompagnement social | 2018-06-12 → (exact) |  | trouvé | Suivi social · 2018-06-12 → |
| Prises en charge | Hospitalisation pour sevrage | 2018-09-10 → 2018-09-20 (exact) |  | trouvé | Hospitalisation de sevrage, CH · 2018-09 ⚠ fin compatible, au moins une source attendue |
| Prises en charge | Passage aux urgences et UHCD | 2018-11-18 → 2018-11-20 (exact) |  | trouvé | Passage UHCD · 2018-11-18 → 2018-11-20 |
| Prises en charge | Fréquentation du CAARUD La Passerelle | 2019-06 (month) |  | trouvé | CAARUD · 2019-06 → ⚠ « en cours » juste |
| Prises en charge | Équipe mobile psychiatrie-précarité | 2019-07-09 (exact) |  | trouvé | EMPP · 2019-07-09 → 2021-02-02 ⚠ fin compatible |
| Prises en charge | Suivi éducatif | 2019-09-17 → (exact) |  | manqué |  |
| Prises en charge | Hospitalisation (réanimation puis médecine) pour delirium tremens | 2020-01-10 → 2020-01-21 (exact) |  | trouvé | Hospitalisation (réanimation puis médecine) · 2020-01-10 → 2020-01-21 |
| Prises en charge | Hospitalisation pour sevrage | 2021-06-07 → 2021-06-18 (exact) |  | trouvé | Hospitalisation de sevrage (alcool, BZD, crack) · 2021-06-07 → 2021-06-18 |
| Prises en charge | Hospitalisation pour pancréatite aiguë | 2021-08-19 → 2021-08-27 (exact) |  | manqué |  |
| Prises en charge | Psychothérapie | 2021-10-12 → 2025-11-18 (exact) |  | trouvé | Suivi psychologique · 2021-10-12 → 2023 ⚠ fin compatible |
| Prises en charge | Hospitalisation en orthopédie | 2022-02-19 → 2022-02-26 (exact) |  | trouvé | Hospitalisation orthopédique · 2022-02-19 → 2022-02-26 |
| Prises en charge | SSR addictologique (clinique fictive des Pins-Gris) | 2023-04-17 → 2023-06-09 (exact) |  | trouvé | SSR addictologique des Pins-Gris · 2023-04-17 → 2023-06-09 |
| Prises en charge | EMDR | 2023-07 → 2025-09 (month) |  | trouvé | EMDR · 2023-07 → 2025-09 |
| Prises en charge | Sevrage ambulatoire | 2025-02-11 → 2025-02-18 (exact) |  | trouvé | Sevrage ambulatoire · 2025-02-11 → 2025-02-18 |
| Événements de vie | Emploi de secrétaire comptable (Transports fictifs Lamarque) | 1991 → 2014 (year) |  | trouvé | Emploi de secrétaire comptable · 1991 → 2014 |
| Événements de vie | Mariage avec Bruno TOULOUZE | 1994 (year) |  | trouvé | Mariage · 1994 → 2006 ⚠ fin compatible |
| Événements de vie | Naissance de Mélanie | 1995 (approx) |  | trouvé | Naissance de [PROCHE_3] · 1995 |
| Événements de vie | Naissance de Teddy | 1998 (approx) |  | trouvé | Naissance de [PROCHE_4] · 1998 |
| Événements de vie | Violences conjugales | 1996 → 2006 (approx) |  | trouvé | Violences conjugales · 1996 → 2006 |
| Événements de vie | Décès du père | 2003 (year) |  | trouvé | Décès du père · 2003 |
| Événements de vie | Séparation | 2006 (year) |  | trouvé | Séparation d'avec son mari · 2006 |
| Événements de vie | Divorce | 2008 (year) |  | trouvé | Divorce · 2008 |
| Événements de vie | Placement des enfants (ASE) | 2009 → 2012 (year) |  | trouvé | Placement des enfants (ASE) · 2009 → 2012 |
| Événements de vie | Installation à Bègles | 2010 (year) |  | trouvé | Installation à Bègles (HLM) · 2010 → 2019-04-16 ⚠ fin compatible |
| Événements de vie | Perte de contact avec ses enfants | 2014 (approx) |  | trouvé | Rupture de contact avec les enfants · 2014 → ⚠ « en cours » juste |
| Événements de vie | Licenciement | 2014 (year) |  | manqué |  |
| Événements de vie | Vie de couple avec Jean-Luc MAUBOURGUET | 2017 → 2021-01-19 (year) |  | trouvé | Vie en couple avec le compagnon · 2017 → ⚠ fin compatible, « en cours » juste |
| Événements de vie | Dette locative et commandement de quitter les lieux | 2018-03 (month) |  | manqué |  |
| Événements de vie | Jugement d'expulsion | 2018-12-18 (exact) |  | trouvé | Expulsion et période de rue · 2018 → 2020-03-20 ⚠ fin compatible, au moins une source attendue |
| Événements de vie | Expulsion du logement | 2019-04-16 (exact) |  | trouvé | Expulsion du logement · 2019-04-16 |
| Événements de vie | Vie à la rue | 2019-04-16 → 2021-06-18 (exact) |  | trouvé | Expulsion et période de rue · 2019 → 2021-06 |
| Événements de vie | Hôtel 115 (confinement) | 2020-03-20 → 2020-06-30 (exact) |  | trouvé | Hébergement à l'hôtel (dispositif 115, confinement) · 2020-03-20 → 2020-06-30 |
| Événements de vie | Prostitution | 2020 → 2021-01 (approx) |  | trouvé | Prostitution pour payer la drogue · 2020 → 2021-01-19 |
| Événements de vie | Garde à vue | 2020-08 (month) |  | trouvé | Garde à vue · 2020-08 |
| Événements de vie | Décès de son compagnon | 2021-01-19 (exact) |  | trouvé | Décès du compagnon · 2021-01-19 |
| Événements de vie | Halte de nuit femmes | 2021-01-26 → 2021-06-18 (exact) |  | trouvé | Hébergement à la halte de nuit femmes · 2021-01-26 → 2021-06-07 ⚠ fin compatible |
| Événements de vie | CHRS Le Fanal | 2021-06-18 → 2023-08 (exact) |  | trouvé | CHRS Le Fanal · 2021-06-18 → 2023-08 |
| Événements de vie | Curatelle renforcée | 2022-01-18 → (exact) |  | trouvé | Curatelle renforcée · 2022-01-18 → |
| Événements de vie | Reprise de contact avec sa fille | 2022-12 (month) |  | trouvé | Retrouvailles avec la fille · 2022-12-24 |
| Événements de vie | Effacement de la dette locative (rétablissement personnel) | 2023-07 (month) |  | manqué |  |
| Événements de vie | Pension de famille Les Ajoncs (Cenon) | 2023-09-01 → (exact) |  | trouvé | Pension de famille Les Ajoncs · 2023-09-01 → |
| Événements de vie | Naissance de son petit-fils Lyam | 2023-10-14 (exact) |  | trouvé | Naissance du petit-fils · 2023-10-14 |
| Événements de vie | Refus de contact de son fils | 2024-11 (month) |  | trouvé | Refus de contact du fils · 2024-11 |
| Événements de vie | Allocation aux adultes handicapés | 2025-06 → (month) |  | manqué |  |
| Événements de vie | Décès de sa mère | 2025-07-08 (exact) |  | trouvé | Décès de la mère · 2025-07-08 |
| Événements de vie | Reprise de contact avec son fils | 2025-07-12 (exact) |  | trouvé | Reprise de contact avec le fils · 2025-07 → ⚠ « en cours » juste |
| Événements de vie | Bénévolat à l'épicerie solidaire de Cenon | 2026-05 → (month) |  | trouvé | Bénévolat à l'épicerie solidaire · 2026-05 → |

En plus (passage `regroupe1`), à relire : vrai mais absent de la vérité, ou erreur.

- Consommations · **Alcool** · 2018-09-20 · craving — Craving important à la sortie, baclofène introduit.
- Médicaments · **Alprazolam** · 2018-11-27 → 2019-04 — Représcrit 0,5 mg x3 par le médecin traitant (ordonnance de 14 jours début décembre) ; plus d'alprazolam en avril 2019 après la perte des ordonnances lors de l'expulsion.
- Médicaments · **Diazépam IV** · 2020-01-10 → 2020-01-13 — Diazépam IV en réanimation pour delirium tremens (3 jours).
- Psychopathologie · **Anxiété** · 2015 → — Angoisse traitée par alprazolam depuis 2015 ; HAD anxiété 14 en mai 2018.
- Psychopathologie · **Humeur triste et troubles du sommeil** · 2019-07-09 — Humeur triste, sommeil très mauvais, peur la nuit, pas d'idée suicidaire exprimée.
- Somatique · **Plaies infectées des pieds** · 2019-07-09 — Plaies infectées aux deux pieds (chaussures inadaptées), soins faits, orientation PASS.
- Somatique · **Toux grasse** · 2019-11-05 — Toux grasse sans fièvre en novembre 2019, « tousse moins » en décembre.
- Somatique · **Amaigrissement, dénutrition** · 2019-11-05 → — Perte de 5 ou 6 kg estimée en novembre 2019 ; 47 kg et dénutrition en janvier 2020, diététicienne vue.
- Prises en charge · **Sevrage hospitalier programmé** · 2018-09-10 → 2018-09-20 — Hospitalisation en unité de sevrage de 10 jours, sortie le 20/09.
- Prises en charge · **Accompagnement PASS** · 2019-11-05 — Orientation PASS dès juillet, accepte un accompagnement en novembre 2019.
- Événements de vie · **Bac pro de secrétariat** · 1990 — Bac pro de secrétariat en 1990.
- Événements de vie · **Départ des enfants chez leur père** · 2009 — Les enfants sont partis vivre chez leur père en 2009.
- Événements de vie · **Dernier emploi** · 2014 — Dernier emploi en 2014 (intérim, secrétariat), pas de droits chômage.
- Événements de vie · **RSA** · 2015 → — Au RSA depuis 2015, environ 550 € en 2018.
- Événements de vie · **Procédure d'expulsion** · 2018-03 → 2019-04-16 — Dette de loyer de 4 800 €, commandement de quitter les lieux en mars 2018, plan d'apurement en juillet, audience reportée (04/12 puis 18/12), jugement du 18/12/2018 ordonnant l'expulsion, FSL refusé.
- Événements de vie · **Hébergement chez un ami du compagnon** · 2019-04-16 → 2019-05 — Dort dans le salon d'un ami à Bordeaux, puis « de canapé en canapé » avant la tente.
- Événements de vie · **Sans domicile (tente)** · 2019-05 → — Dort sous une tente avec son compagnon depuis « fin mai », puis sous un pont en novembre ; refus de la mise à l'abri 115 par le compagnon en décembre.
- Consommations · **Alcool** · 2008 · usage — Escalade de la consommation reliée par la patiente aux démarches du divorce.
- Consommations · **Tabac** · 2020-02-11 → 2021-06-07 · usage — 20 à 30 cigarettes/j en 2020, 25 cigarettes/j en 2021 ; dernière mention à l'entrée de juin 2021.
- Psychopathologie · **Humeur dépressive** · 2020-02-11 — Humeur basse, anhédonie, "je survis" ; pas d'idées suicidaires.
- Psychopathologie · **Idées de mort** · 2021-01-26 → — Idées de mort sans scénario ("je devrais être partie avec lui"), quotidiennes en février 2021, moins présentes en novembre 2021 ; pas d'idées suicidaires ; pas d'antécédent de TS.
- Somatique · **Amaigrissement, dénutrition** · 2020-07 → 2021-06 — Perte de poids en 2020 ; 49 kg en février 2021, 50 kg en juin 2021.
- Somatique · **Mauvais état dentaire** · 2021-06 — Plusieurs extractions à prévoir.
- Médicaments · **Alprazolam** · 2015 → 2019 — Alprazolam prescrit 2015-2019, arrêté avant le passage au clonazépam de rue.
- Médicaments · **Diazépam** · 2020-01-20 — Diazépam arrêté la veille de la sortie d'hospitalisation de janvier 2020.
- Médicaments · **Thiamine** · 2020-01-21 → — 250 mg/j sur ordonnance ; 500 mg IV 3 jours à l'entrée de juin 2021 ; 250 mg/j à la sortie, inchangé en novembre 2021.
- Médicaments · **Diazépam** · 2021-06-07 → — Protocole fixe 40 mg/j puis relais dégressif : 30 mg/j à la sortie, 20 mg/j en novembre 2021, 15 mg/j en février 2022.
- Médicaments · **Vitamine B6** · 2021-06-18 — Prescrite sur l'ordonnance de sortie.
- Prises en charge · **Sevrage hospitalier alcool** · 2016 — Premier sevrage hospitalier en 2016 (clinique du Lac).
- Prises en charge · **Sevrage hospitalier alcool** · 2018-09 — Sevrage au CH en septembre 2018.
- Prises en charge · **Suivi CSAPA** · 2020-02-11 → — Consultations avec le Dr addictologue ; plusieurs rendez-vous non honorés en 2020-2021.
- Prises en charge · **CAARUD** · 2020-07 → — Kits base, domiciliation, aide aux papiers, dépistages ; dernière mention en septembre 2021.
- Prises en charge · **Suivi social** · 2021-03-16 → — Reprise après 18 mois sans contact : CHRS, RSA, curatelle, papiers, AAH.
- Prises en charge · **Hospitalisation gastro-entérologie** · 2021-08-19 — Pancréatite aiguë ; sortie prévue le 27/08.
- Événements de vie · **Poussée dans l'escalier par l'ex-mari** · 2005 — Perte de connaissance, 2 jours à l'hôpital de Marmande.
- Événements de vie · **RSA suspendu** · 2019 → 2021 — Suspendu depuis l'été 2019 (pas de déclaration trimestrielle) ; rétabli depuis l'été 2021.
- Événements de vie · **Retour à la rue (squat puis tente)** · 2020-06-30 → 2021-01-26 — Squat puis tente à Bacalan, pas de place 115 pour le couple ; ensuite hall d'immeuble puis halte de nuit.
- Événements de vie · **Demande de curatelle** · 2021-03-16 → 2022-01-18 — Accord de la patiente ; certificat médical demandé ; audience début 2022.
- Événements de vie · **Demande d'AAH** · 2022-01 → — Dossier à constituer avec certificat médical.
- Prises en charge · **Suivi en CMP** · 2007 — Suivi en CMP pendant quelques mois après l'IMV de 2007.
- Psychopathologie · **Épisode dépressif** · 2018 — Épisode dépressif en 2018 (sertraline 2018-2019).
- Consommations · **Alcool** · 2018-11-18 · sevrage — Crise convulsive de sevrage le 18/11/2018.
- Prises en charge · **[ETABLISSEMENT_3]** · 2019 → — Partenaire de suivi depuis 2019 (nature non précisée).
- Prises en charge · **Hospitalisation de sevrage, CH** · 2021-06 — Sevrage hospitalier au CH en juin 2021.
- Somatique · **Séquelle frontale droite de traumatisme crânien** · 2022-02-19 → — Séquelle frontale droite d'un traumatisme crânien ancien, vue au scanner du 19/02/2022.
- Médicaments · **Thiamine** · 2022-04-05 — Thiamine mentionnée dans les conclusions d'avril 2022 à mars 2023 ; début et fin exacts non précisés.
- Médicaments · **Vitamine B6** · 2022-04-05 — Vitamine B6 prescrite le 05/04/2022.
- Prises en charge · **Kinésithérapie** · 2022-04-05 — Kinésithérapie prescrite après la fracture.
- Événements de vie · **Demande d'AAH** · 2022-04-05 — Certificat MDPH rempli le 05/04/2022.
- Médicaments · **Diazépam** · 2022-06-07 — Demande de délivrance anticipée de 2 jours (4 comprimés perdus), accordée une fois ; pas d'autre chevauchement depuis le début.
- Événements de vie · **Reprise de contact avec la fille** · 2022-09-20 — Souhaite reprendre contact avec sa fille [PROCHE_3] ; lettre écrite avec l'aide de l'éducateur ; réponse début décembre 2022.
- Consommations · **Alcool** · 2022-12 · craving — Craving les jours suivants le 24/12, gérés.
- Prises en charge · **IDE hebdomadaire avant l'admission en SSR** · 2023-03-14 → 2023-04-17 — Passage IDE hebdomadaire jusqu'à l'entrée en SSR ; demande d'admission en SSR addictologique faite le 14/03/2023.
- Somatique · **Troubles des fonctions exécutives (MoCA 25/30)** · 2023-06 → — MoCA à 25/30 (fonctions exécutives) au SSR, à recontrôler.
- Événements de vie · **Demande d'AAH** · 2023-06 — Dossier AAH déposé en juin 2023, en attente en septembre 2023.
- Événements de vie · **Surendettement** · 2023-07 — Effacement de la dette locative de Bègles (rétablissement personnel) en juillet 2023.
- Prises en charge · **CAARUD** · 2024 — Retour au CAARUD une fois pour des pipes propres, pendant la rechute de crack de 2024.
- Somatique · **Hépatopathie alcoolique** · 2024-05-15 → — Fibroscan du 15/05/2024 : 8,1 kPa (amélioration nette) ; GGT 64.
- Prises en charge · **Séances de psychothérapie hebdomadaires** · 2024-12 → 2025-01 — Séances hebdomadaires prévues en décembre-janvier.
- Événements de vie · **Hospitalisation de la mère** · 2025-04 → 2025-07-08 — Mère de 85 ans hospitalisée à Marmande depuis avril 2025 (insuffisance cardiaque) ; elle y a revu sa sœur [PROCHE_2].
- Prises en charge · **Suivi tabacologique IDE** · 2025-05-13 → — Suivi tabacologique IDE mensuel mis en place.
- Événements de vie · **AAH accordée** · 2025-06 → — AAH accordée par la MDPH (taux 50-79 %), à compter de juin 2025.
- Consommations · **Alcool** · 2025-07-12 · craving — Craving fort le soir des obsèques, géré en appelant l'hôte de la pension et avec ses gommes ; pas d'alcool.
- Médicaments · **Acamprosate** · 2026-01-20 → 2026-10-13 — Renouvelé en janvier 2026 (333 mg 2-2-2) ; oubli le week-end du 07/03 ; prise irrégulière depuis l'été, arrêt décidé le 13/10/2026. Début non précisé.
- Médicaments · **Mirtazapine** · 2026-01-20 → — Renouvelée en janvier 2026 ; 15 mg le soir ; demande de diminution (prise de poids) ; arrêt progressif proposé, elle préfère attendre après janvier, réévaluation en février. Début non précisé.
- Médicaments · **Substituts nicotiniques** · 2026-01-20 → — Patchs 14 mg ; début non précisé, constaté à cette date.
- Somatique · **Hépatopathie alcoolique** · 2026-04-14 → — Hépatopathie alcoolique citée en rappel ; début non précisé. GGT 41, VGM 94, plaquettes 168.
- Somatique · **Fibroscan** · 2025-09 — Fibroscan de septembre : 6,9 kPa (rapporté en octobre 2026, année déduite du contexte).
- Prises en charge · **Psychothérapie (suivi mensuel)** · 2025-09 → 2025-11-18 — Espacement mensuel puis fin du suivi régulier le 18/11/2025 d'un commun accord ; porte ouverte, notamment autour de janvier.
- Événements de vie · **Requête d'allègement de la curatelle** · 2026-10 — Requête en allègement de la curatelle déposée (certificat médical prévu en avril 2026).
- Événements de vie · **Visite du fils à Cenon** · 2026-06 — Son fils est venu à Cenon avec sa compagne en juin.

