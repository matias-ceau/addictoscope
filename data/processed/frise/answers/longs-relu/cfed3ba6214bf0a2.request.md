Réponds à cette demande comme le ferait le modèle appelé par l'application : lis la consigne et le message, puis écris ta réponse dans le fichier `cfed3ba6214bf0a2.answer.json` du même dossier — un seul objet JSON, valide selon le schéma, sans texte autour. Ne lis aucun autre fichier.

## Consigne

Tu regroupes les doublons d'une frise chronologique d'addictologie (modèle Auriacombe et al., 2018). La frise a été construite en lisant le dossier par lots indépendants : le même fait y revient plusieurs fois (raconté à l'entrée, repris dans une synthèse, un courrier, une observation plus tardive), sous des intitulés et avec des dates qui varient. Tu ne vois pas les observations, seulement les pistes et leurs événements. Tu ne crées rien et tu ne supprimes rien : tu dis seulement ce qui désigne la même chose.

Pistes (tracks) : regroupe les pistes d'une même rubrique qui désignent la même chose sous deux intitulés (« Accident de moto » et « Accident de la voie publique (moto) » ; « Suivi CSAPA » et « Prise en charge au CSAPA » ; « VHC » et « Hépatite C »). label = l'intitulé à garder, le plus clair. Ne regroupe pas deux substances, deux molécules, deux troubles ou deux prises en charge distincts : « Oxycodone » et « Tramadol » restent deux pistes, une hospitalisation et un suivi ambulatoire aussi.

Événements (events) : une fois les pistes regroupées, regroupe les événements qui racontent le même fait ou le même épisode.
- Même fait raconté plusieurs fois, avec une date plus ou moins précise (« 2014 », « 2014-10 », « 2014-10-14 ») ou contradictoire d'une observation à l'autre (« 2013 » selon le patient, « 2014-10-14 » dans un courrier).
- Même épisode raconté en morceaux : son début dans une observation (« en cours »), sa fin dans une autre (arrêt, sortie, fin de contrat…).
- start = le début à garder, recopié de l'un des événements du groupe : le plus précis s'ils sont compatibles, le mieux documenté s'ils se contredisent. Un « début non précisé » ne vaut pas un début raconté. end = la fin de l'épisode, recopiée d'un début ou d'une fin du groupe ; null si aucune fin n'est connue.
- Ne regroupe jamais deux épisodes distincts : deux hospitalisations, deux rechutes, deux sevrages, deux incarcérations à des dates différentes restent séparés. Les paliers de dose successifs d'un traitement restent séparés. Deux modes différents (usage, sevrage, rechute, craving, intoxication) ne se regroupent pas.
- Dans le doute, ne regroupe pas.

Ne cite que les groupes d'au moins deux éléments ; une piste ou un événement ne figure que dans un seul groupe. Reprends les identifiants tels quels (t12, e87).

## Schéma de la réponse (regroupement)

```json
{
 "type": "object",
 "additionalProperties": false,
 "required": [
  "tracks",
  "events"
 ],
 "properties": {
  "tracks": {
   "type": "array",
   "items": {
    "type": "object",
    "additionalProperties": false,
    "required": [
     "label",
     "track_ids"
    ],
    "properties": {
     "label": {
      "type": "string"
     },
     "track_ids": {
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    }
   }
  },
  "events": {
   "type": "array",
   "items": {
    "type": "object",
    "additionalProperties": false,
    "required": [
     "event_ids",
     "start",
     "end"
    ],
    "properties": {
     "event_ids": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "start": {
      "type": "string",
      "description": "YYYY, YYYY-MM ou YYYY-MM-DD, recopié d'un événement du groupe"
     },
     "end": {
      "type": [
       "string",
       "null"
      ]
     }
    }
   }
  }
 }
}
```

## Message

Frise lue en 4 lots : 152 pistes, 198 événements. Dernière observation du dossier : 2026-10-13.

## Consommations

### t1 — Cannabis
- e1 | 2016 (d'après l'âge) → 2017 | usage | Premier joint "vers 15 ans, en seconde", occasionnel puis le week-end | vu le 2020-03-09
- e2 | 2017 → 2019-09 | usage | Usage quotidien installé vers 16 ans, résine, 4 à 6 joints/j | vu le 2020-03-09
- e3 | 2019-09 → 2020-08-24 | usage | Passage à l'herbe à la fac, 8 à 10 joints/j (environ 3 g/j), premier joint au réveil ; 5-7 joints/j pendant le confinement ; perte de contrô… | vu le 2020-03-02, 2020-03-09, 2020-03-24 (+3)
- e4 | 2019-12 → 2019-12 | sevrage | Tentative d'arrêt seul de 5 jours chez ses parents (insomnie, irritabilité, sueurs, perte d'appétit), rechute à la première occasion ; deux … | vu le 2020-03-09
- e5 | 2017-06 | intoxication | Attaque de panique après ingestion d'un space cake à 16 ans, sans arrêt ensuite ; usage quotidien déjà installé | vu le 2021-01-12
- e6 | 2020-08-24 → 2021-01 | sevrage | Abstinence depuis l'hospitalisation, urines négatives ; envie tous les soirs en septembre | vu le 2020-09-22, 2020-10-13, 2020-11-10 (+1)
- e7 | 2021-01 → en cours au 2021-03-16 | rechute | Reprise : 2-3 joints le nouvel an, puis les samedis, 2-3 joints le week-end, 1 à 2 joints/j le soir en mars ; herbe | vu le 2021-01-12, 2021-02-09, 2021-03-16
- e41 | 2014 (d'après l'âge) → 2022-10-28 | usage | Premier joint a 13 ans en 4e (skatepark), occasionnel au college, quotidien des 16 ans (resine), cannabis au lycee 'pour tenir en classe' ; … | vu le 2021-10-05, 2021-11-16, 2022-01-18 (+1)
- e115 | 2014 (d'après l'âge) → 2022-10 | usage | Premiers usages dès 13 ans, résine quotidienne au lycée, auto-thérapie de l'angoisse depuis le collège | vu le 2023-02-07, 2023-04-18, 2023-06-13 (+2)
- e116 | 2019 → 2020 | usage | Herbe très dosée à la fac, 10 joints/j à l'entrée en mars 2020 | vu le 2023-02-07, 2024-01-16
- e117 | 2022 | rechute | Reprise du cannabis avant la rechute psychotique de 2022 | vu le 2024-01-16, 2025-01-21
- e118 | 2022-10 → 2023-07 | craving | TUC sévère abstinent depuis octobre 2022, craving modéré le soir en mars 2023 | vu le 2023-03-14, 2023-05-16, 2023-06-13
- e119 | 2023-07-21 → 2023-08-06 | rechute | Rechute pendant un festival puis 4-5 joints/j pendant deux semaines, arrêt spontané le 06/08 | vu le 2023-08-22, 2024-01-16
- e120 | 2023-08-06 → en cours au 2025-01-21 | Abstinence depuis le 06/08/2023, urines négatives, pensées sans passage à l'acte en 2024 | vu le 2023-08-22, 2024-01-16, 2024-03-12 (+3)
- e156 | 2014 (d'après l'âge) | usage | Premier joint à 13 ans | vu le 2026-01-20
- e157 | 2017 (d'après l'âge) → 2023-08 | usage | Cannabis quotidien dès 16 ans ; TUC sévère ; dernier usage en août 2023 | vu le 2025-11-18, 2026-01-20
- e165 | 2022-10 → 2022-10 | rechute | Reprise massive de cannabis avant la rechute d'octobre 2022 | vu le 2026-01-20
- e172 | 2023-08 → 2023-08 | rechute | Écart de deux semaines après un festival ; dernier usage jusqu'en 2026 | vu le 2026-01-20
- e181 | 2026-02-15 | rechute | Un joint le 15/02 chez un ancien ami, urines THC+ ; pas de cannabis depuis | vu le 2026-02-24, 2026-05-12, 2026-07-07 (+1)

### t2 — Tabac
- e8 | 2015 (d'après l'âge) → en cours au 2021-03-16 | usage | Depuis 14 ans, roulées, 15 cig/j puis 20 cig/j ; pas de tentative d'arrêt | vu le 2020-03-09, 2020-06-09, 2020-10-13 (+2)
- e56 | 2021-06 → en cours au 2023-01-10 | usage | 20 cig/j en juin 2021, 18 en novembre 2021, 25 en juillet 2022, 20 en janvier 2023 ; arret propose, pas pret | vu le 2021-06-15, 2021-11-16, 2022-01-18 (+2)
- e127 | 2023-03 → 2025-04-15 | usage | 20 cigarettes/j, tabacologie refusée en janvier 2024, arrêt le 15/04/2025 | vu le 2023-03-14, 2023-11-21, 2024-01-16 (+4)
- e174 | 2025-04 | sevrage | Arrêt du tabac en avril 2025 | vu le 2025-07-08, 2026-01-20

### t3 — Alcool
- e9 | 2016 (d'après l'âge) → en cours au 2021-03-16 | usage | Depuis 15-16 ans, en soirée, bière et vodka, ivresses le samedi (4-5 verres) ; pas d'usage en semaine, pas de sevrage ; "pas pendant le conf… | vu le 2020-03-09, 2020-06-09, 2020-10-13 (+1)
- e52 | 2022-01-18 → 2022-01-18 | usage | Alcool festif | vu le 2022-01-18
- e53 | 2022-04-12 → 2022-04-12 | intoxication | Soiree d'anniversaire, ivresse sans consequence | vu le 2022-04-12
- e126 | 2023-08 → en cours au 2024-10-15 | usage | 2-3 bières en festival, puis quelques bières le samedi, pas d'alcool fort | vu le 2023-08-22, 2024-10-15

### t4 — Jeux vidéo
- e10 | 2020-03-09 → en cours au 2021-02-23 | usage | Plusieurs heures par jour ("c'est ce que je fais quand je fume") ; nuits sur des jeux en ligne pendant et après le confinement | vu le 2020-03-09, 2020-04-21, 2020-12-08 (+1)

### t35 — Cannabis (usage quotidien, resine)
- e42 | 2017 (d'après l'âge) | usage | Quotidien des 16 ans, resine | vu le 2022-01-18

### t36 — Cannabis (herbe tres dosee, 10 joints/j)
- e43 | 2019 → 2020-03 | usage | Herbe tres dosee a partir de la fac (2019), jusqu'a 10 joints/j a l'entree au CSAPA | vu le 2022-01-18

### t37 — Cannabis (space cake)
- e44 | 2017-06 → 2017-06 | intoxication | Attaque de panique apres un space cake, passage aux urgences (CR retrouve en janvier 2021) | vu le 2022-01-18

### t39 — Cannabis (1-2 joints le soir)
- e46 | 2021-04 → 2022-05 | usage | 1-2 joints le soir, parfois 2/j ; refuse l'arret total ; objectif de reduction | vu le 2021-05-18, 2021-06-15, 2021-06-29 (+5)

### t40 — Cannabis (reprise massive)
- e47 | 2022-06 → 2022-10-28 | rechute | Reprise massive depuis debut juin, herbe 6 a 8 joints/j, 'enormement' tout l'ete ; free parties | vu le 2022-07-05, 2022-11-02

### t41 — Cannabis (sevrage hospitalier)
- e48 | 2022-10-28 → 2022-11-10 | sevrage | Sevrage sans complication majeure (irritabilite, insomnie), urines negatives depuis le 10/11 ; aucun cannabis depuis le 28/10 ; abstinence m… | vu le 2022-11-22, 2023-01-10

### t42 — Cannabinoides de synthese (e-liquide PTC)
- e49 | 2019-09 → 2020-02 | usage | E-liquide en vapoteuse plusieurs fois par semaine, en plus du cannabis ; revele a l'IDE en juin 2021 ; arret en fevrier 2020 ; angoisses, id… | vu le 2021-06-15, 2021-06-29, 2021-11-16 (+1)

### t43 — Protoxyde d'azote (ballons en soiree)
- e50 | 2019-09 | usage | Plusieurs fois par mois en soiree, en ballons, pendant la premiere annee de fac (a l'entree : 'essaye une fois') | vu le 2021-09-07, 2022-01-18

### t44 — Protoxyde d'azote (usage intensif)
- e51 | 2021-05 → 2021-09-05 | usage | Bonbonnes de 600 g, une ou deux par week-end voire en semaine ; arret accepte, plus de proto depuis le 05/09 | vu le 2021-09-07, 2021-09-14, 2021-11-16 (+1)

### t45 — Alcool (free parties)
- e54 | 2022-06 → 2022-10 | usage | Dit ne prendre en free party 'que de l'alcool et du shit' | vu le 2022-07-05

### t46 — Substances non precisees (free party)
- e55 | 2022-06 → 2022-10 | usage | 'Des trucs en free party' selon la mere, sans precision ; ketamine non recherchee | vu le 2022-11-02

### t98 — Cannabinoïdes de synthèse
- e121 | 2019 → 2020 | usage | Consommés à la fac | vu le 2023-02-07, 2024-01-16, 2025-11-18 (+1)

### t99 — Protoxyde d'azote
- e122 | 2021 → 2021 | usage | Usage avec neuropathie en 2021 | vu le 2024-01-16, 2025-01-21, 2025-11-18 (+1)
- e123 | 2022 → 2023-03 | usage | Usage de temps en temps en free party pendant la période kétamine | vu le 2023-05-16

### t101 — Kétamine
- e125 | 2022 → 2023-03 | usage | Sniff en free party, presque chaque week-end l'été 2022, deux K-hole, dernières sorties en janvier-février 2023 | vu le 2023-05-16, 2023-06-13, 2024-01-16
- e166 | 2022-10 → 2022-10 | rechute | Reprise massive avec le cannabis avant la rechute | vu le 2025-11-18, 2026-01-20

### t102 — Vapotage nicotinique
- e128 | 2025-04-15 → en cours au 2025-05-13 | usage | Passage à la vapoteuse 12 mg/mL, plus aucune cigarette, CO 3 ppm | vu le 2025-05-13

### t128 — Cannabis (herbe très dosée)
- e158 | 2019 → 2020 | usage | Herbe très dosée en 2019-2020 | vu le 2026-01-20

### t136 — Nicotine (vapoteuse)
- e175 | 2025-04 → en cours au 2026-10-13 | usage | Vapoteuse depuis l'arrêt du tabac | vu le 2025-07-08, 2025-11-18, 2026-07-07 (+1)

## Psychopathologie

### t5 — Anxiété, sommeil décalé et isolement
- e11 | 2019-09 → en cours au 2021-02-23 | Depuis quelques mois avant l'entrée : anxiété, endormissement vers 5h, isolement, ne voit plus ses amis ; thymie plate puis aboulie, ennui | vu le 2020-03-09, 2021-01-12, 2021-02-09 (+1)

### t6 — Idées de référence et méfiance
- e12 | 2020-03 → 2020-08-24 | Impression qu'on le regarde dans le tram, critiquée ; émoussement affectif ; puis méfiance ("les voisins savent des trucs"), à surveiller | vu le 2020-03-09, 2020-06-09

### t7 — Premier épisode psychotique aigu (trouble psychotique induit par le cannabis)
- e13 | 2020-07 → 2020-10 | Délire persécutif, papier aluminium sur la fenêtre, hallucinations acoustico-verbales, menace d'un voisin avec un couteau ; diagnostic diffé… | vu le 2020-07-15, 2020-08-25, 2020-09-22 (+1)

### t8 — Attaque de panique (space cake)
- e14 | 2017-06 | Tachycardie, sensation de mort imminente, déréalisation ; passage aux urgences pédiatriques à 16 ans, non suivi | vu le 2021-01-12

### t38 — Attaque de panique
- e45 | 2017-06 → 2017-06 | Passage aux urgences apres un space cake | vu le 2022-01-18

### t47 — Harcelement scolaire (impact)
- e57 | 2012 → 2014 | Harcelement en 6e-5e par un groupe de garcons : surnoms, bousculades, sac jete dans les toilettes, video diffusee en 5e ; jamais dit aux par… | vu le 2021-10-05, 2022-01-18

### t49 — Scarifications
- e59 | 2013 → 2014 | Avant-bras coupes avec un compas 'quelques fois' en 5e, cicatrices fines | vu le 2021-10-05, 2022-01-18
- e109 | 2013 (d'après l'âge) → 2018 | Scarifications en 5e, pas d'antécédent de geste suicidaire | vu le 2023-03-14, 2024-01-16
- e155 | 2012 (d'après l'âge) → 2015 | Scarifications au collège | vu le 2026-01-20

### t50 — Impression qu'on parlait de lui dans son dos
- e60 | 2016 (d'après l'âge) → 2018 | Au lycee, relie lui-meme aux moqueries du college ; 'arrete de penser au college' en seconde | vu le 2021-10-05

### t51 — Anxiete massive et idees de reference
- e61 | 2019-09 → 2020-02 | Periode des cannabinoides de synthese | vu le 2021-06-15, 2021-06-29

### t57 — Premier episode psychotique (trouble psychotique induit par le cannabis)
- e67 | 2020-08 → 2020-10-06 | Ete 2020 : persecution, hallucinations acoustico-verbales ; diagnostic retenu : trouble psychotique induit par le cannabis | vu le 2021-11-16, 2022-01-18, 2023-01-10

### t71 — Honte et crainte de la maladie
- e85 | 2020-08 → 2021-05 | Honte autour de l'episode de l'ete ; pense que 'c'etait la beuh' | vu le 2021-05-18

### t72 — Symptomes negatifs (emoussement, aboulie)
- e86 | 2021-11 → en cours au 2023-01-10 | Se plaint de 'ne plus rien ressentir' ; retrait social ; persistants entre les episodes selon le CR hospitalier | vu le 2022-01-18, 2023-01-10

### t73 — Rechute psychotique (deuxieme episode)
- e88 | 2022-09 → 2022-12-20 | Degradation depuis septembre : insomnie, 'organisation' persecutrice, desorganisation, perte de 6 kg ; apres arret de l'antipsychotique et r… | vu le 2022-09-20, 2022-11-02, 2022-11-22 (+1)

### t79 — Schizophrenie paranoide
- e94 | 2022-12-20 → en cours au 2023-01-10 | Diagnostic retenu a la sortie ; trouble de l'usage du cannabis severe | vu le 2022-11-22, 2023-01-10
- e104 | 2023-02 → en cours au 2025-01-21 | Diagnostic retenu en février 2023 (prodromes, antécédent familial, symptômes négatifs) | vu le 2023-02-07, 2023-06-13, 2024-01-16 (+1)
- e168 | 2020 → en cours au 2026-01-20 | Diagnostic retenu en février 2023 ; 1er épisode 2020, rechute 2022 | vu le 2025-11-18, 2026-01-20

### t85 — Prodromes psychotiques
- e100 | 2018 → 2019 | Retrait, idées de référence, post-it sur la webcam, notes effondrées en terminale (2018-2019), rapportés par la mère en 2023 | vu le 2023-02-07, 2024-01-16, 2025-01-21 (+1)

### t86 — Premier épisode psychotique
- e101 | 2020 → 2020 | Hospitalisation sous contrainte en septembre 2020, diagnostic initial de trouble psychotique induit | vu le 2023-06-13, 2023-06-27, 2024-01-16 (+1)

### t87 — Trouble psychotique induit (diagnostic initial)
- e102 | 2020 → 2023-02 | Diagnostic retenu en 2020, jugé plus pertinent en février 2023, encore présent dans le dossier social et MDPH | vu le 2023-02-07, 2024-01-16, 2024-09-03 (+1)

### t88 — Rechute psychotique
- e103 | 2022-10 → 2022-12 | Après arrêt de l'aripiprazole LP en mai 2022 et reprise du cannabis, deuxième hospitalisation | vu le 2023-06-13, 2024-01-16, 2025-01-21 (+2)

### t89 — Voix et méfiance
- e105 | 2023-05 → 2023-08 | Voix le soir depuis fin mai, recrudescence pendant la rechute de cannabis, moins présentes après l'arrêt; ensuite voix résiduelles rares | vu le 2023-06-13, 2023-08-22, 2024-01-16 (+1)

### t90 — Épisode dépressif caractérisé post-psychotique
- e106 | 2023-02 → 2024-03 | Tristesse depuis début février 2023, idées de mort passives; thymie nettement améliorée depuis l'automne 2023, sertraline arrêtée en mars 20… | vu le 2023-03-14, 2023-06-13, 2024-01-16 (+2)

### t91 — Troubles cognitifs
- e107 | 2023-06 → 2023-06 | Bilan psychologique : ralentissement, mémoire de travail abaissée, planification fragile, anhédonie sociale | vu le 2023-06-27

### t92 — Attaque de panique sous cannabis
- e108 | 2017 → 2017 | Passage aux urgences en 2017 | vu le 2024-01-16

### t129 — Épisode psychotique (premier)
- e160 | 2020-08 → 2020-10 | Premier épisode à l'été 2020, alors considéré comme induit par le cannabis | vu le 2025-11-18, 2026-01-20

### t133 — Épisode dépressif post-psychotique
- e169 | 2023 → 2023 | EDC post-psychotique en 2023 | vu le 2026-01-20

### t134 — Symptômes négatifs
- e171 | 2023 | Plus marqués en 2023, nettement moindres en 2026 | vu le 2026-01-20

### t140 — Détresse réactionnelle à la rupture
- e179 | 2026-02-14 → 2026-03-17 | Tristesse, ruminations, sommeil perturbé, pas d'idée suicidaire ; amélioration en mars | vu le 2026-02-17, 2026-02-24, 2026-03-17

### t152 — Fatigue matinale et ralentissement
- e198 | 2025-11-18 → en cours au 2026-01-20 | Possible effet du traitement | vu le 2025-11-18, 2026-01-20

## Somatique

### t9 — Perte de poids
- e15 | 2019-09 → 2020-03 | Perte de 4 kg depuis septembre selon la mère, appétit irrégulier | vu le 2020-03-09

### t10 — Akathisie probable
- e16 | 2020-09-22 | Raideur et agitation des jambes sous rispéridone 6 mg | vu le 2020-09-22

### t11 — Prise de poids sous antipsychotique
- e17 | 2020-10 → 2021-01 | 64 kg à 72 puis 74 kg ; stable en janvier | vu le 2020-10-13, 2020-11-10, 2020-12-08 (+1)
- e77 | 2021-11 | 77 kg en novembre 2021, 78 kg en janvier 2022, 79 kg en avril 2022 ; fatigue diurne | vu le 2021-11-16, 2022-01-18, 2022-04-12

### t12 — Dysfonction érectile et hyperprolactinémie
- e18 | 2020-10 → 2021-01 | Prolactine 68 ng/mL en novembre, 18 sous aripiprazole en janvier | vu le 2020-10-13, 2020-11-10, 2021-01-12

### t60 — Effets indesirables de la rispéridone (prise de poids, hyperprolactinemie, dysfonction erectile)
- e72 | 2020-08 → 2020-11 | Intolerance ayant conduit a l'arret | vu le 2022-01-18

### t66 — Neuropathie sur protoxyde d'azote (carence B12)
- e80 | 2021-08 → en cours au 2021-11-16 | Fourmillements et engourdissement des pieds depuis debut aout, hypoesthesie, areflexie, Romberg positif, B12 a 98 pg/mL ; EMG du 20/09 : neu… | vu le 2021-09-07, 2021-09-14, 2021-11-16

### t97 — Fracture de la clavicule gauche
- e114 | 2018 → 2018 | Accident de scooter, urgences, bras en écharpe un mois, jamais signalé jusque-là | vu le 2025-05-13

### t100 — Neuropathie liée au protoxyde d'azote
- e124 | 2021 → 2021 | Neuropathie en 2021 | vu le 2024-01-16, 2025-01-21

### t103 — Prise de poids
- e129 | 2023-11 → en cours au 2025-01-21 | 82 kg, tour de taille 98 cm, glycémie à jeun 0,98; 84 kg en 2024-2025, bilan métabolique prévu | vu le 2023-11-21, 2024-01-16, 2024-06-18 (+1)

### t131 — Neuropathie au protoxyde
- e164 | 2021 | Sans séquelle | vu le 2025-11-18, 2026-01-20

### t135 — Fracture de la clavicule
- e173 | 2018 → 2018 | Accident de scooter sous cannabis, dit à l'IDE en mai 2025 | vu le 2026-01-20

### t151 — LDL élevé
- e197 | 2025-02 → en cours au 2026-01-20 | LDL 1,48 en février 2025, 1,62 en décembre 2025 ; mesures hygiéno-diététiques | vu le 2025-07-08, 2025-12-16, 2026-01-20

## Médicaments

### t13 — Hydroxyzine
- e19 | 2020-04-21 → 2020-08 | 25 mg le soir ; prise irrégulière, arrêtée par le patient ("empoisonnée") | vu le 2020-04-21, 2020-06-09, 2020-08-25
- e70 | 2020 (début non précisé) | Non prise depuis l'ete 2020 ; ordonnance expiree en avril 2021, non renouvelee (demandee 'pour dormir apres un joint') | vu le 2021-04-13
- e180 | 2026-02-24 → 2026-03-10 | 25 mg au coucher si besoin, 15 jours ; prise 4 soirs | vu le 2026-02-24, 2026-03-17

### t14 — Rispéridone
- e20 | 2020-08-24 → 2020-11-10 | Introduite à l'hôpital, 6 mg puis 4 mg à la sortie ; arrêtée pour prise de poids, prolactine et dysfonction érectile | vu le 2020-08-25, 2020-09-22, 2020-10-13 (+1)
- e71 | 2020-08 → 2020-11 | Arretee pour intolerance | vu le 2022-01-18
- e130 | 2020 → 2020 | Mal tolérée | vu le 2024-01-16, 2026-01-20

### t15 — Diazépam
- e21 | 2020-08-24 → 2020-09 | Pour le sevrage à l'hôpital, arrêté avant le 22/09 | vu le 2020-08-25, 2020-09-22

### t16 — Aripiprazole oral
- e22 | 2020-11-10 → 2021-03 | 10 mg puis 15 mg le 01/12 ; observance irrégulière ; arrêt prévu 14 jours après la première injection LP | vu le 2020-11-10, 2020-12-08, 2021-01-12 (+2)
- e73 | 2020-11 → 2021-03 | 10 puis 15 mg | vu le 2022-01-18
- e162 | 2020 → 2021-03 | Aripiprazole oral puis relais LP en mars 2021 | vu le 2026-01-20

### t17 — Aripiprazole LP
- e23 | 2021-03-15 → en cours au 2021-03-16 | 400 mg, première injection au CMP, injections mensuelles | vu le 2021-02-09, 2021-03-16
- e163 | 2021-03 → 2022-05 | 400 puis 300 mg, arrêté par le patient | vu le 2026-01-20

### t62 — Aripiprazole LP 400 mg
- e75 | 2021-03-15 → 2022-01-10 | Mensuel depuis le 15/03/2021, somnolence le lendemain ; baisse a 300 mg | vu le 2021-06-29, 2021-09-07, 2021-11-16 (+1)

### t63 — Aripiprazole LP 300 mg
- e76 | 2022-01-10 → 2022-05-16 | Mensuel (CMP) ; derniere injection le 16/05/2022 ; demande d'arret ('je suis gueri'), injection du 13/06 manquee | vu le 2022-01-18, 2022-04-12, 2022-05-03 (+2)

### t67 — Cyanocobalamine IM
- e81 | 2021-09 → 2021-11 | 1000 ug quotidien 1 semaine puis hebdomadaire, IDE du CSAPA ; arret en novembre 2021, B12 normalisee | vu le 2021-09-07, 2021-09-14, 2021-11-16

### t75 — Aripiprazole oral 10 mg (propose)
- e90 | 2022-07-05 → 2022-07-05 | Ordonnance remise, observance incertaine ; selon la mere jamais pris | vu le 2022-07-05, 2022-11-02

### t77 — Loxapine
- e92 | 2022-10-28 → 2022-12 | Injection au debut du sejour, diminution puis arret | vu le 2022-11-02, 2022-11-22, 2023-01-10

### t78 — Palipéridone LP
- e93 | 2022-11-04 → en cours au 2023-01-10 | 150 mg le 04/11, 100 mg le 11/11, puis 75 mg mensuel au CMP a partir du 12/12/2022 | vu le 2022-11-22, 2023-01-10

### t104 — Aripiprazole
- e131 | 2020 → 2022-05 | Oral puis LP 400 puis 300 mg, arrêté par le patient en mai 2022 | vu le 2023-06-13, 2024-01-16, 2025-01-21

### t105 — Palipéridone
- e132 | 2022-11 → en cours au 2025-01-21 | LP 75 mg mensuel, 100 mg dès l'injection du 05/06/2023, 350 mg trimestriel depuis le 07/10/2024 | vu le 2023-02-07, 2023-06-13, 2024-01-16 (+2)

### t106 — Sertraline
- e133 | 2023-03 → 2024-03-12 | 50 mg/j, arrêt progressif de la sertraline à partir du 12/03/2024 (25 mg 10 jours) | vu le 2023-03-14, 2023-06-13, 2024-01-16 (+2)
- e170 | 2023 → 2023 | Traitement de l'EDC post-psychotique ; dates exactes non précisées | vu le 2026-01-20

### t137 — Palipéridone LP 350 mg trimestriel
- e176 | 2025-07-01 → en cours au 2026-10-13 | Traitement en cours dès la première observation de cette période (début antérieur non précisé) ; injections 01/07, 30/09/2025, 29/09/2026 au… | vu le 2025-07-08, 2025-10-14, 2026-10-13

## Prises en charge

### t18 — Suivi CSAPA et entretiens motivationnels
- e24 | 2020-03-02 → en cours au 2021-03-16 | Accueil IDE puis suivi médical, objectif de réduction du cannabis | vu le 2020-03-02, 2020-03-09, 2020-03-24 (+2)

### t19 — Passage aux urgences pédiatriques
- e25 | 2017-06 | Surveillance de 4h, conseil de consultation non suivi | vu le 2021-01-12

### t20 — Hospitalisation en soins à la demande d'un tiers
- e26 | 2020-08-24 → 2020-10-06 | Pavillon psychiatrique, 6 semaines | vu le 2020-08-25, 2020-09-22, 2020-10-13

### t21 — Programme de soins (SDT ambulatoire)
- e27 | 2020-10-06 → 2021-02-05 | Levée le 05/02/2021, soins en libre | vu le 2020-10-13, 2020-11-17, 2021-02-09

### t22 — Suivi CMP
- e28 | 2020-10-20 → en cours au 2021-03-16 | Première consultation le 20/10 ; aripiprazole, injections LP | vu le 2020-10-13, 2020-11-10, 2020-12-08 (+1)
- e196 | 2025-07 → en cours au 2026-10-13 | Suivi de la schizophrénie, injections au CMP | vu le 2025-07-08, 2026-01-20, 2026-10-13

### t23 — Suivi social
- e29 | 2020-11-17 → en cours au 2020-11-17 | Entretien avec l'assistante sociale, mission locale envisagée plus tard | vu le 2020-11-17

### t24 — Psychothérapie
- e30 | 2021-02-23 → en cours au 2021-02-23 | Entretiens avec la psychologue tous les 15 jours | vu le 2021-02-09, 2021-02-23

### t56 — Suivi CSAPA
- e66 | 2020-03 → en cours au 2022-01-18 | Adresse par sa mere ; suivi depuis mars 2020 | vu le 2022-01-18
- e195 | 2020 → en cours au 2026-10-13 | Presque 6 ans de suivi en janvier 2026 ; RDV tous les 3 mois proposés pendant un an | vu le 2026-01-20, 2026-10-13

### t58 — Hospitalisation en SDT (pavillon)
- e68 | 2020-08-24 → 2020-10-06 | Soins sans consentement du 24/08 au 06/10/2020 | vu le 2022-01-18

### t59 — Programme de soins
- e69 | 2020-10-06 → 2021-02-05 | Programme de soins leve le 05/02/2021 | vu le 2022-01-18

### t61 — Bilan social
- e74 | 2020-11 → 2020-11 | Bilan social fait en novembre 2020 | vu le 2022-01-18

### t64 — Psychotherapie (Mme psychologue)
- e78 | 2021-02 → en cours au 2022-01-18 | Suivi regulier, bonne alliance ; 5e entretien en mai 2021, rythme hebdomadaire propose en octobre 2021 | vu le 2021-05-18, 2021-10-05, 2022-01-18

### t65 — Education specialisee
- e79 | 2022-03-15 → en cours au 2022-12-06 | Premier entretien le 15/03/2022 : projet apres le service civique, permis, mission locale ; projet professionnel suspendu en decembre 2022 | vu le 2022-03-15, 2022-05-03, 2022-12-06

### t68 — Consultation neurologique (EMG)
- e82 | 2021-09-20 → 2021-09-20 | Neuropathie axonale sensitive moderee | vu le 2021-09-07, 2021-11-16

### t74 — Absence aux rendez-vous CSAPA
- e89 | 2022-06 → 2022-09-20 | RDV de juin, juillet, 26/07, 30/08 et 20/09 non honores | vu le 2022-06-21, 2022-07-05, 2022-09-20

### t76 — Hospitalisation en soins pour peril imminent (pavillon)
- e91 | 2022-10-28 → 2022-12-20 | Soins pour peril imminent puis soins libres, 7 semaines et demie | vu le 2022-11-02, 2022-11-22, 2023-01-10

### t82 — Entretien social
- e97 | 2022-12-06 → 2022-12-06 | Avec les parents puis le patient par telephone ; MDPH, complementaire sante solidaire | vu le 2022-12-06

### t83 — Mission locale
- e98 | 2022-05 → 2022-05 | Inscription reactivee, RDV pris | vu le 2022-05-03

### t107 — Suivi CSAPA / psychiatrique
- e134 | 2020-03 → en cours au 2025-01-21 | Suivi depuis mars 2020 (entrée avec 10 joints/j) | vu le 2024-01-16, 2025-01-21

### t108 — Hospitalisation sous contrainte
- e135 | 2020-09 → 2020-10 | Six semaines, premier épisode psychotique | vu le 2023-06-27, 2024-01-16

### t109 — Hospitalisation (SPI)
- e136 | 2022-10-28 → 2022-12-20 | Deuxième hospitalisation pour rechute psychotique | vu le 2024-01-16

### t110 — Entretien familial
- e137 | 2023-02-07 → 2023-02-07 | Entretien avec les deux parents, orientation vers le programme pour les familles du CMP | vu le 2023-02-07

### t111 — Programme pour les familles du CMP
- e138 | 2023 | Les parents ont suivi le programme en 2023 | vu le 2023-02-07, 2025-01-21

### t112 — Psychothérapie avec la psychologue
- e139 | 2023-04 → en cours au 2025-03-11 | Reprise après l'hospitalisation, honte, image de soi; séances mensuelles depuis mars 2025 | vu le 2023-04-18, 2024-09-17, 2025-01-21 (+1)

### t113 — Bilan psychologique
- e140 | 2023-06-06 → 2023-06-27 | Trois séances, remédiation cognitive proposée non faite | vu le 2023-06-27, 2025-01-21

### t114 — Suivi éducatif
- e141 | 2023-05 → en cours au 2024-05-14 | Reprise du suivi par l'éducateur spécialisé, projet d'insertion | vu le 2023-05-16, 2024-01-16, 2024-05-14
- e190 | 2025-06 (début non précisé) | Plus de suivi éducatif régulier depuis juin 2025 (relais mission locale) | vu le 2025-09-23, 2026-01-20

### t115 — Psychoéducation du CMP
- e142 | 2023-09-19 → 2023-12 | 10 séances le mardi, terminée en décembre | vu le 2023-10-10, 2024-01-16

### t116 — Groupe d'entraide mutuelle (GEM) de Pessac
- e143 | 2024-04 → en cours au 2025-01-21 | Deux à trois après-midi par semaine, jardin partagé | vu le 2024-03-12, 2024-03-26, 2024-05-14 (+2)

### t117 — Accompagnement budgétaire
- e144 | 2023-05 → 2024-09 | Au CSAPA, dette de téléphone soldée, plus nécessaire en septembre 2024 | vu le 2023-03-28, 2023-10-10, 2024-09-03

### t118 — Plan de prévention de la rechute
- e145 | 2025-01 → 2025-01 | Écrit et partagé avec le CMP | vu le 2025-01-21

### t130 — Hospitalisation SDT (premier épisode)
- e161 | 2020-08-24 → 2020-10-06 | Pavillon, SDT, du 24/08 au 06/10/2020 | vu le 2026-01-20

### t132 — Hospitalisation SPI (rechute)
- e167 | 2022-10-28 → 2022-12-20 | SPI du 28/10 au 20/12/2022 | vu le 2026-01-20

### t147 — Mission locale (emploi)
- e191 | 2025-06 | Relais pour l'emploi après le CAPa | vu le 2025-09-23, 2026-01-20

### t148 — Reprise du suivi éducatif
- e192 | 2026-09-15 → en cours au 2026-09-15 | Fin prévue de l'accompagnement si le CDD se passe bien | vu le 2026-07-07, 2026-09-15

### t149 — GEM
- e193 | 2025-09-23 → en cours au 2026-09-15 | Fréquentation du GEM (atelier jardin, samedi) ; déjà fréquenté auparavant | vu le 2025-09-23, 2026-03-17, 2026-09-15

### t150 — Psychologue mensuelle
- e194 | 2026-01-20 (début non précisé) → en cours au 2026-05-12 | Une fois par mois ; espacement proposé toutes les 6 semaines après l'été 2026 | vu le 2026-01-20, 2026-03-17, 2026-05-12

## Événements de vie

### t25 — Naissance à Arcachon
- e31 | 2001 | Enfance à Cestas, père technicien aéronautique, mère secrétaire médicale, une sœur plus jeune | vu le 2020-03-09

### t26 — Arrêt du football en club
- e32 | 2017 (d'après l'âge) → 2018 | Football en club arrêté en première | vu le 2020-03-09

### t27 — Cueillette de myrtilles
- e33 | 2018 | Seul emploi, une saison l'été 2018 | vu le 2020-03-09, 2020-11-17

### t28 — Bac STMG
- e34 | 2019-06 | Obtenu "de justesse" | vu le 2020-03-09, 2020-11-17

### t29 — Licence STAPS à Bordeaux
- e35 | 2019-09 → 2020-09 | Plus de présence aux cours dès janvier 2020, partiels non passés, désinscription par la mère en septembre | vu le 2020-03-02, 2020-03-09, 2020-06-09 (+1)

### t30 — Studio à Bordeaux
- e36 | 2019-09 → 2020-06 | Loyer payé par les parents, rendu fin juin | vu le 2020-03-09, 2020-06-09, 2020-11-17

### t31 — Retour chez les parents à Cestas
- e37 | 2020-03-16 → en cours au 2020-11-17 | Confinement, puis hébergement maintenu | vu le 2020-03-24, 2020-06-09, 2020-11-17

### t32 — Conflits avec le père
- e38 | 2020-03 → 2020-10 | Relations tendues, disputes pendant le confinement, "en pause" en octobre | vu le 2020-03-09, 2020-04-21, 2020-10-13
- e87 | 2022-01 | Moins frequents ; dispute violente le 27/10/2022 : pere bouscule, contusion de l'epaule, pas de plainte ; pere ne veut plus le voir a la mai… | vu le 2022-01-18, 2022-11-02, 2022-12-06

### t33 — Menace d'un voisin avec un couteau
- e39 | 2020-08-24 | Conduit aux urgences par les pompiers | vu le 2020-08-25

### t34 — Inscription à la mission locale de Cestas
- e40 | 2020-11-17 | Acceptée "pour plus tard" | vu le 2020-11-17

### t48 — Harcelement scolaire au college
- e58 | 2012 → 2014 | 6e et 5e (2012-2014) | vu le 2021-10-05, 2022-01-18, 2023-04-18 (+4)

### t52 — Premiere annee de fac
- e62 | 2019-09 → 2020-02 | Septembre a fevrier, premiere annee de fac | vu le 2021-06-15

### t53 — Revente de cannabis aux amis de la promo
- e63 | 2019-11 → 2019-11 | Pour payer sa consommation | vu le 2022-03-15

### t54 — Garde a vue 24 h (detention de cannabis)
- e64 | 2019-11 → 2019-11 | Controle a la sortie de la fac avec une vingtaine de sachets d'herbe ; parents non informes | vu le 2022-03-15

### t55 — Composition penale : stage de sensibilisation et amende
- e65 | 2020-02 → 2020-02 | Stage de deux jours en fevrier 2020 et amende ; non declare au medecin ; casier a verifier (extrait B3 demande) | vu le 2022-03-15, 2022-05-03

### t69 — Service civique a la mediatheque
- e83 | 2021-10-04 → 2022-04-30 | 24 h/semaine, 'ca me leve le matin' ; attestation remise ; animation d'un atelier jeux video | vu le 2021-11-16, 2022-03-15, 2022-05-03

### t70 — Isolement social, ennui
- e84 | 2021-05 | Plus d'amis 'a part ceux qui fument', s'ennuie a Cestas | vu le 2021-05-18

### t80 — Difficultes financieres et sans ressources
- e95 | 2022-04 → en cours au 2022-12-06 | Sans ressources depuis la fin du service civique ; dettes (forfait telephone ~400 euros, decouvert, emprunt a sa soeur) ; demande de curatel… | vu le 2022-12-06

### t81 — Hebergement chez les parents
- e96 | 2022-12-06 → en cours au 2023-01-10 | Heberge chez ses parents ; contrat ecrit avec le pere apres la sortie (pas de cannabis, traitement, horaires) ; foyer jeunes travailleurs et… | vu le 2022-12-06, 2023-01-10

### t84 — Suppression des reseaux sociaux
- e99 | 2022-12 | Pour 'couper avec l'organisation' | vu le 2023-01-10

### t93 — Bac de justesse
- e110 | 2019 → 2019 | Notes effondrées en terminale, bac de justesse | vu le 2023-02-07

### t94 — Études à la fac
- e111 | 2019 → 2020 | Années de fac avec herbe très dosée et cannabinoïdes de synthèse | vu le 2023-02-07, 2024-01-16

### t95 — Garde à vue pour revente
- e112 | 2019-11 → 2019-11 | Garde à vue pour revente de cannabis, composition pénale | vu le 2024-01-16
- e159 | 2019 | Garde à vue pour revente en 2019 | vu le 2026-01-20

### t96 — Accident de scooter sous cannabis
- e113 | 2018 → 2018 | À 17 ans, chute seule en rentrant d'une soirée 'défoncé', fracture de la clavicule gauche, caché aux parents | vu le 2025-05-13

### t119 — Curatelle demandée par les parents
- e146 | 2022 → 2023-10 | Demande fin 2022, refus du patient, non sollicitée en octobre 2023 | vu le 2023-03-28, 2023-10-10, 2024-01-16

### t120 — Dossier MDPH et complémentaire santé solidaire
- e147 | 2023-03-28 → 2023-03-28 | Dossier MDPH déposé, complémentaire santé solidaire accordée | vu le 2023-03-28

### t121 — AAH
- e148 | 2023-09 → en cours au 2025-01-21 | AAH accordée à compter de septembre 2023 (taux 50-79 %) | vu le 2023-10-10, 2024-01-16, 2024-09-03 (+1)
- e188 | 2025-07 → en cours au 2026-09-15 | Maintenue ; à réduire ou suspendue avec le salaire (2026) | vu le 2025-07-08, 2025-09-23, 2026-09-15

### t122 — RQTH
- e149 | 2024-07 → 2024-07 | RQTH accordée pour 5 ans | vu le 2023-10-10, 2024-09-03
- e189 | 2025-07 → en cours au 2026-09-15 | Mentionnée ; discussion sur son usage en emploi | vu le 2026-01-20, 2026-09-15

### t123 — Stage découverte en espaces verts
- e150 | 2024-04 → 2024-04 | Deux semaines chez un paysagiste, retour positif | vu le 2024-03-12, 2024-05-14

### t124 — CAPa jardinier-paysagiste en alternance
- e151 | 2024-09-02 → en cours au 2025-01-21 | Formation de 2 ans, contrat d'apprentissage | vu le 2024-09-03, 2024-09-17, 2024-10-15 (+1)

### t125 — Hébergé chez ses parents
- e152 | 2024-09 → en cours au 2025-01-21 | Toujours hébergé chez ses parents, envisage un logement autonome | vu le 2024-09-03, 2025-01-21

### t126 — Relation de couple
- e153 | 2025-02 → en cours au 2025-03-11 | En couple avec une jeune femme rencontrée au GEM | vu le 2025-03-11

### t127 — Inscription à l'auto-école
- e154 | 2025-05 → 2025-05 | Projet de permis de conduire | vu le 2025-05-13

### t138 — Couple avec [PERSONNE_1]
- e177 | 2025-02 → 2026-02-14 | En couple depuis février 2025, rupture le 14/02/2026 | vu le 2025-07-08, 2026-02-24

### t139 — Rupture avec [PERSONNE_1]
- e178 | 2026-02-14 | Le jour de son anniversaire | vu le 2026-02-17, 2026-02-24

### t141 — CAPa en apprentissage (paysagiste)
- e182 | 2024 → 2026-08-31 | Première année validée en 2025, deuxième année commencée en octobre 2025, contrat d'apprentissage terminé le 31/08/2026 | vu le 2025-07-08, 2025-10-14, 2026-07-07

### t142 — Diplôme CAPa obtenu
- e183 | 2026-07-03 | Résultats reçus le 03/07/2026 | vu le 2026-07-07

### t143 — CDD ouvrier paysagiste
- e184 | 2026-09-01 → en cours au 2026-10-13 | CDD de 6 mois, 35 h, possibilité de CDI ; conduit le camion de l'équipe | vu le 2026-07-07, 2026-09-15, 2026-10-13

### t144 — Logement autonome à Pessac
- e185 | 2025-09-01 → en cours au 2025-10-14 | Studio en bailleur social (loyer 290 euros) ; demande déposée avant juillet 2025 | vu le 2025-07-08, 2025-09-23, 2025-10-14

### t145 — Permis B obtenu
- e186 | 2025-10-06 → 2025-10-06 | Premier passage | vu le 2025-10-14

### t146 — Achat d'une voiture d'occasion
- e187 | 2025-10 | Avec l'aide de son père | vu le 2025-10-14
