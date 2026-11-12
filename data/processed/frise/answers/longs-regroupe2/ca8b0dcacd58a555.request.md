Réponds à cette demande comme le ferait le modèle appelé par l'application : lis la consigne et le message, puis écris ta réponse dans le fichier `ca8b0dcacd58a555.answer.json` du même dossier — un seul objet JSON, valide selon le schéma, sans texte autour. Ne lis aucun autre fichier.

## Consigne

Tu construis la frise chronologique d'un parcours de soins en addictologie (modèle Auriacombe et al., 2018) à partir d'observations cliniques pseudonymisées. Garde les étiquettes ([PATIENT], [SOIGNANT_2]…) telles quelles.

Pistes (kind) :
- substance_use : une piste par objet d'addiction, substance ou comportement (label = « Alcool », « Cannabis », « Opioïdes », « Jeux vidéo », « Jeux d'argent », « Écrans », « Achats », « Sexe », « Alimentation »…). Les addictions sans substance se relèvent comme les autres : début, périodes d'usage, arrêts, reprises. mode = usage, intoxication, sevrage, rechute ou craving. loss_of_control = true si une perte de contrôle est décrite.
- psychiatric : troubles et épisodes (label = trouble, ex. « Épisode dépressif »).
- somatic : problèmes somatiques (label = problème).
- medication : un traitement par piste (label = molécule ; start/end = début/arrêt).
- therapeutic_psycho : prises en charge (hospitalisation, CSAPA, psychothérapie, groupe…).
- life_event : événements de vie (famille : séparation ou divorce des parents, naissance, rupture, deuil ; scolarité, emploi, armée, logement, incarcération…).

Règles :
- Un événement = une période (start, end) ou un point (end = null, ongoing = false). ongoing = true si toujours en cours à la dernière observation.
- Dates : la précision réellement connue (YYYY, YYYY-MM ou YYYY-MM-DD) dans start et end ; start_age et end_age restent alors null. Une durée (« depuis 3 ans », « il y a 2 ans ») se date à partir de la date de l'observation.
- Antécédent daté par l'âge ou par une période de vie (« alcool depuis l'âge de 15 ans », « premiers joints à l'adolescence ») : start = null et start_age à la place ; end_age si la fin est elle aussi racontée par l'âge (sinon end_age = null). Ne calcule jamais l'année toi-même, même si l'année de naissance figure dans le texte : elle est calculée ensuite. Format de l'âge : un nombre (15), un intervalle [12, 17], ou une période : « enfance » (6–11 ans), « adolescence » (12–17 ans), « jeune adulte » (18–25 ans) ; « vers 20 ans » = [19, 21]. La note garde la formulation d'origine (« à 15 ans »).
- Le parcours d'avant le suivi compte autant que le suivi : relève chaque antécédent raconté (enfance, famille, scolarité, débuts et évolution des usages, soins antérieurs), même dit en passant ou dans une observation tardive.
- observation_ids : identifiants des observations sources (au moins un). N'invente rien qui ne soit pas écrit.
- note : courte, factuelle, en français.

## Schéma de la réponse (frise)

```json
{
 "type": "object",
 "additionalProperties": false,
 "required": [
  "events"
 ],
 "properties": {
  "events": {
   "type": "array",
   "items": {
    "type": "object",
    "additionalProperties": false,
    "required": [
     "kind",
     "label",
     "start",
     "end",
     "start_age",
     "end_age",
     "ongoing",
     "mode",
     "loss_of_control",
     "note",
     "observation_ids"
    ],
    "properties": {
     "kind": {
      "type": "string",
      "enum": [
       "substance_use",
       "psychiatric",
       "somatic",
       "medication",
       "therapeutic_psycho",
       "life_event"
      ]
     },
     "label": {
      "type": "string"
     },
     "start": {
      "type": [
       "string",
       "null"
      ],
      "description": "YYYY, YYYY-MM ou YYYY-MM-DD ; null si l'antécédent n'est daté que par l'âge"
     },
     "end": {
      "type": [
       "string",
       "null"
      ]
     },
     "start_age": {
      "anyOf": [
       {
        "type": "number"
       },
       {
        "type": "array",
        "items": {
         "type": "number"
        }
       },
       {
        "type": "string"
       },
       {
        "type": "null"
       }
      ],
      "description": "âge en années : 14, [12, 17], « enfance », « adolescence » ou « jeune adulte » ; null si la date est connue"
     },
     "end_age": {
      "anyOf": [
       {
        "type": "number"
       },
       {
        "type": "array",
        "items": {
         "type": "number"
        }
       },
       {
        "type": "string"
       },
       {
        "type": "null"
       }
      ],
      "description": "âge en années : 14, [12, 17], « enfance », « adolescence » ou « jeune adulte » ; null si la date est connue"
     },
     "ongoing": {
      "type": "boolean"
     },
     "mode": {
      "anyOf": [
       {
        "type": "string",
        "enum": [
         "usage",
         "intoxication",
         "sevrage",
         "rechute",
         "craving"
        ]
       },
       {
        "type": "null"
       }
      ]
     },
     "loss_of_control": {
      "type": "boolean"
     },
     "note": {
      "type": "string"
     },
     "observation_ids": {
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    }
   }
  }
 }
}
```

## Message

Observations (ordre chronologique) :

### o38 — 2023-02-07 — Observation psychiatrique de suivi (Médecin)
Observation psychiatrique de suivi du 07/02/2023 (Urgence : Bas)
Validé par [SOIGNANT_2]
- Médecin le 07/02/2023 à 18:50
Observations :
Entretien familial : [PATIENT]
ses deux parents. 1h15.
Retour sur le diagnostic posé par le service. La mère, en larmes, dit qu'elle "y pense depuis longtemps" : dès la
terminale (2018-2019), [PATIENT]
avait changé, bien avant la fac et l'herbe forte. Il ne mangeait plus avec la famille "parce
qu'on le regardait mâcher", restait des heures sans rien faire, avait collé des post-it sur la webcam de son ordinateur,
disait que deux professeurs "parlaient de lui en cours" et qu'un camarade "lui volait ses pensées". Ses notes s'étaient
effondrées, il avait eu le bac de justesse. Elle n'en avait rien dit à l'entrée ("on pensait que c'était le shit et
l'adolescence", "je ne voulais pas qu'on le mette dans une case").
Le père ajoute [PATIENT]
ne voyait plus personne dès la première.
La mère confirme cette fois que son frère, M. [PERSONNE_3]
54 ans, est atteint de schizophrénie, hospitalisé à de
nombreuses reprises depuis ses 20 ans, aujourd'hui en foyer, "on n'en parlait pas dans la famille". Elle avait dit au
CSAPA qu'il n'y avait aucun antécédent, puis avait parlé d'une dépression.
[PATIENT] écoute, se dit "soulagé que ce soit pas seulement de ma faute". Il confirme lui-même que "les profs qui parlaient
de moi" datent de la terminale, "bien avant la fac", et qu'il fumait alors de la résine "comme d'hab".
Le père dit regretter "d'avoir crié au lieu d'écouter" ; il accepte de participer au programme pour les familles.
Synthèse : des symptômes prodromiques présents dès 2018-2019 (retrait, idées de référence, bizarreries), avant l'herbe
très dosée et les cannabinoïdes de synthèse, un antécédent familial au premier degré de la mère, deux épisodes et des
symptômes négatifs persistants : le diagnostic de schizophrénie est retenu, le cannabis ayant probablement précipité et
aggravé l'évolution. Le diagnostic de trouble psychotique induit retenu en 2020 n'est plus pertinent.
Conclusions :
- Psychoéducation des parents : orientation vers le programme pour les familles du CMP
- Poursuite palipéridone LP 75 mg
- RDV 1 mois

### o39 — 2023-03-14 — Observation psychiatrique de suivi (Médecin)
Observation psychiatrique de suivi du 14/03/2023 (Urgence : Bas)
Validé par [SOIGNANT_2]
- Médecin le 14/03/2023 à 17:20
Observations :
Vu ce jour.
Tristesse marquée depuis plusieurs semaines (depuis début février), pleurs, anhédonie, culpabilité envers son père ("je
l'ai frappé"), sentiment d'avenir bouché, "à quoi ça sert". Idées de mort passives, pas d'idée suicidaire active, pas de
scénario. Sommeil augmenté. Pas de recrudescence délirante.
Abstinent du cannabis, craving modéré le soir. Tabac 20 cig/j.
Episode dépressif caractérisé post-psychotique.
Facteurs de protection : sa soeur, sa mère, le projet évoqué avec l'éducateur ; pas d'accès à des armes ; pas
d'antécédent de geste suicidaire (scarifications en 5e).
Conclusions :
- Sertraline 50 mg/j
- Plan de sécurité rédigé, numéros donnés, mère informée
- RDV 3 semaines

### o40 — 2023-03-28 — Entretien social (Assistante sociale)
Entretien social du 28/03/2023 (Urgence : Bas)
Validé par [SOIGNANT_8]
- Assistante sociale le 28/03/2023 à 11:15
[PATIENT] reçu seul, puis avec sa mère.
Dossier MDPH constitué (certificat médical du Dr [SOIGNANT_2]
demande d'AAH et d'orientation professionnelle),
déposé ce jour. Complémentaire santé solidaire accordée.
Curatelle : les parents maintiennent leur demande. [PATIENT]
refuse toujours mais accepte de "parler d'argent" avec
quelqu'un. Il a remboursé une partie du forfait téléphonique grâce à de petits travaux de jardinage chez des voisins de
ses parents. Proposé : attendre la décision MDPH, mettre en place un accompagnement budgétaire au CSAPA, et
réévaluer la nécessité d'une mesure dans 6 mois. La mère accepte, "pour l'instant".
Courriel du patient pour les démarches : [EMAIL]

### o41 — 2023-04-18 — Entretien psychologique (Psychologue)
Entretien psychologique du 18/04/2023 (Urgence : Bas)
Validé par [SOIGNANT_5]
- Psychologue le 18/04/2023 à 16:30
Reprise des entretiens après l'hospitalisation.
[PATIENT] est triste, ralenti, mais présent. Il revient sur le mot "schizophrène" : il l'a cherché sur internet, "c'est que des
tueurs dans les films". Il parle de son oncle, qu'il a vu deux fois enfant, "il parlait tout seul, ça me faisait peur", et de la
peur de "finir comme lui en foyer".
Il relie de lui-même le collège, le cannabis "pour ne plus sentir" et le moment où "tout est devenu bizarre" au lycée.
Travail sur la honte, sur ce qu'il garde de lui-même en dehors de la maladie (l'humour, le dessin, le football).

### o42 — 2023-05-16 — Entretien éducatif (Educateur spécialisé)
Entretien éducatif du 16/05/2023 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Educateur spécialisé le 16/05/2023 à 14:45
Reprise du suivi depuis la sortie. Point sur les fréquentations et les sorties.
[PATIENT] dit ne plus aller en free party "depuis mars, j'ai plus la tête à ça". Il explique qu'entre l'été 2022 et mars 2023 (y
compris quelques sorties après l'hôpital, en janvier et février, sans le dire à personne), il prenait de la kétamine en free
party, en sniff, "une ou deux traces par soirée, des fois plus", presque chaque week-end l'été dernier, plus rarement
ensuite. Il dit avoir eu deux "K-hole" dont un où il ne savait plus "si j'étais vivant". Avec du protoxyde "de temps en
temps" aussi pendant cette période. Jamais dit au médecin "parce qu'on m'aurait encore réhospitalisé".
Il pense que la kétamine "l'a aidé à décrocher de la réalité" à l'automne, avant l'hôpital, et que sa mère "s'en doutait".
Pas de consommation depuis mars, pas d'envie, "c'est le cannabis qui me manque, pas ça".
Information RDR donnée, accord pour transmettre au Dr [SOIGNANT_2]
Projet : il voudrait faire quelque chose "dans la nature". Recherche d'un stage découverte en espaces verts à travailler.

### o43 — 2023-06-13 — Observation psychiatrique de suivi (Interne)
Observation psychiatrique de suivi du 13/06/2023 (Urgence : Bas)
Validé par [SOIGNANT_10]
- Interne le 13/06/2023 à 18:05
Observations :
Vu ce jour.
Rappel : schizophrénie paranoïde (diagnostic retenu en 2022-2023, 1er épisode en 2020, rechute en 2022 après arret
de l'aripiprazole LP), TUC sévère abstinent depuis 10/2022, kétamine en free party jusqu'en mars 2023 (dit à
l'éducateur), EDC post-psychotique sous sertraline.
Réapparition de voix le soir depuis fin mai ("un chuchotement"), critiquées, anxiété. Pas de reprise de cannabis selon lui,
urines du jour négatives.
Avis CMP : palipéridone LP augmentée à 100 mg mensuel à partir de l'injection du 05/06/2023.
Thymie un peu meilleure sous sertraline, moins de pleurs. Sommeil 10h. Plaintes de concentration ("je relis trois fois la
même page") : bilan psychologique demandé à Mme [SOIGNANT_5]
en cours.
Conclusions :
Sertraline 50 mg poursuivie. RDV 2 mois.

### o44 — 2023-06-27 — Bilan psychologique (Psychologue)
Bilan psychologique du 27/06/2023 (Urgence : Bas)
Validé par [SOIGNANT_5]
- Psychologue le 27/06/2023 à 17:45
Bilan demandé par le Dr [SOIGNANT_2]
(plaintes de concentration et de mémoire, projet d'insertion). 3 séances (06/06,
20/06, 27/06).
Contexte : 22 ans, schizophrénie paranoïde, deux hospitalisations (2020, 2022), TUC sévère en rémission précoce,
sous palipéridone LP et sertraline.
Observation : coopérant, ralenti, fatigable au-delà d'une heure. Humour présent. Pas d'élément délirant au cours des
séances.
Résultats : efficience globale dans la moyenne basse. Vitesse de traitement nettement abaissée. Mémoire de travail
abaissée, empan limité. Mémoire épisodique verbale : apprentissage lent, bon rappel indicé. Fonctions exécutives :
flexibilité correcte, planification fragile, persévérations en cas de consigne complexe. Attention soutenue fluctuante.
Cognition sociale : bonne reconnaissance des émotions de base, attribution d'intentions hostiles dans les situations
ambiguës.
Echelles : anhédonie sociale marquée ; estime de soi basse ; symptomatologie dépressive modérée, en amélioration
par rapport à mars selon lui.
Sur le plan projectif et clinique : vécu de honte massif, crainte d'être réduit à "la maladie", désir de normalité très présent
(travail, couple, logement). Le cannabis apparaît comme une auto-thérapie de l'angoisse et de la honte depuis le
collège.
Conclusions : profil compatible avec les troubles cognitifs observés dans les troubles psychotiques et les suites de
consommation importante, potentiel d'amélioration. Propositions : remédiation cognitive au CMP à discuter,
apprentissage en situation concrète plutôt qu'en cours théorique (orientation vers une formation en alternance),
poursuite du suivi psychologique.
Le contraste entre la plainte (très forte) et les performances (modérément abaissées) est à souligner : beaucoup
d'anticipation d'échec, abandon rapide devant la difficulté, qui s'atténue avec l'encouragement.
Restitution faite au patient, qui retient "que je suis pas bête, juste lent".

### o45 — 2023-07-25 — Transmission (IDE)
Transmission du 25/07/2023 (Urgence : Bas)
Validé par [SOIGNANT_7]
- IDE le 25/07/2023 à 09:50
Appel de la pharmacie de Cestas : ordonnance de sertraline arrivée à échéance. Renouvellement faxé après accord du
Dr [SOIGNANT_2]
(en congés, accord par message).

### o46 — 2023-08-22 — Observation psychiatrique de suivi (Interne)
Observation psychiatrique de suivi du 22/08/2023 (Urgence : Bas)
Validé par [SOIGNANT_10]
- Interne le 22/08/2023 à 17:30
Observations :
Vu ce jour.
Rechute du cannabis pendant un festival de musique fin juillet (21-23/07) puis "tous les jours pendant deux semaines"
chez un ami, herbe, 4-5 joints/j. Arrêt début août de lui-même : recrudescence des voix et de la méfiance pendant cette
période, "ça m'a fait peur". Depuis le 06/08, pas de cannabis, urines négatives ce jour.
Voix moins présentes depuis l'arrêt. Injection du mois faite. Pas d'alcool fort, 2-3 bières en festival.
Valorisation de l'arrêt spontané. Analyse de la situation à risque (festival, amis consommateurs).
Conclusions :
RDV 1 mois. Lien avec la psychologue. Propose une participation au programme de psychoéducation du CMP
(septembre), accepté.

### o47 — 2023-10-10 — Entretien social (Assistante sociale)
Entretien social du 10/10/2023 (Urgence : Bas)
Validé par [SOIGNANT_8]
- Assistante sociale le 10/10/2023 à 10:30
Décision MDPH reçue : AAH accordée à compter de septembre 2023 (taux 50-79 %, restriction substantielle et durable
d'accès à l'emploi), orientation vers le marché du travail avec accompagnement. RQTH demandée en complément
(dossier incomplet, à renvoyer).
Accompagnement budgétaire mis en place depuis mai : [PATIENT]
a soldé la dette de téléphone, a ouvert un livret, verse
une participation aux parents.
Point sur la mesure de protection, avec la mère : au vu de la gestion actuelle, pas de demande de curatelle pour
l'instant, d'un commun accord. "On verra si ça recommence."
[PATIENT] participe au programme de psychoéducation du CMP depuis le 19/09 (10 séances, le mardi).

### o48 — 2023-11-21 — Observation IDE (IDE)
Observation IDE du 21/11/2023 (Urgence : Bas)
Validé par [SOIGNANT_7]
- IDE le 21/11/2023 à 11:20
Entretien IDE. Poids 82 kg, tour de taille 98 cm, glycémie à jeun 0,98. Conseils diététiques, marche.
Urines négatives. Tabac 20 cig/j, "pas maintenant".
Dit que la psychoéducation "c'est un peu l'école mais ça m'aide à comprendre".

### o49 — 2024-01-16 — Observation psychiatrique de suivi - synthèse annuelle (Médecin)
Observation psychiatrique de suivi - synthèse annuelle du 16/01/2024 (Urgence : Bas)
Validé par [SOIGNANT_2]
- Médecin le 16/01/2024 à 18:55
Observations :
Vu ce jour. Synthèse annuelle, presque 4 ans de suivi.
Rappel : M. [PATIENT]
22 ans. Harcèlement scolaire au collège (2012-2014), scarifications en 5e. Cannabis
dès 13 ans, quotidien au lycée (résine), herbe très dosée et cannabinoïdes de synthèse à la fac (2019-2020), 10 joints/j
à l'entrée en mars 2020. Urgences pour attaque de panique sous cannabis en 2017. Garde à vue pour revente en
novembre 2019 (composition pénale). Protoxyde d'azote avec neuropathie en 2021. Kétamine en free party de l'été
2022 à mars 2023.
Prodromes dès la terminale (2018-2019, rapportés par la mère en février 2023). Premier épisode psychotique en 2020
avec hospitalisation sous contrainte en septembre 2020 (6 semaines), diagnostic initial de trouble psychotique induit.
Rispéridone mal tolérée, aripiprazole oral puis LP 400 puis 300 mg, arrêté par le patient en mai 2022. Rechute
psychotique et deuxième hospitalisation du 28/10 au 20/12/2022 (SPI). Schizophrénie paranoïde retenue (prodromes,
oncle maternel schizophrène, symptômes négatifs). Palipéridone LP depuis novembre 2022 (75 puis 100 mg depuis juin
2023). EDC post-psychotique en 2023 sous sertraline 50 mg.
Suivi : psychologue (Mme [SOIGNANT_5]
bilan psychologique de juin 2023 : ralentissement, mémoire de travail
abaissée), éducateur (M. [SOIGNANT_3]
assistante sociale (Mme [SOIGNANT_8]
AAH, accompagnement budgétaire).
Curatelle demandée par les parents fin 2022, finalement non sollicitée en octobre 2023.
Evolution 2023 : abstinence de cannabis depuis le 06/08/2023 après un écart de deux semaines en juillet. Plus de
kétamine ni de protoxyde. Voix résiduelles rares, critiquées. Thymie nettement améliorée depuis l'automne, plus d'idées
de mort, reprise d'intérêts (dessin, marche). AAH depuis septembre. Psychoéducation au CMP terminée en décembre,
"j'ai compris que c'était une maladie comme le diabète". Relations familiales apaisées, le père "me reparle
normalement".
Points de vigilance : prise de poids (82 kg), tabac 20 cig/j, isolement social persistant, inactivité.
Facteurs de rechute identifiés avec lui : arrêt du traitement (2022), reprise du cannabis (2020, 2022, 2023), conflits
familiaux, festivals et free parties, ennui. Facteurs de protection : alliance avec l'équipe, injection retard, mère et soeur,
projet professionnel naissant, compréhension de la maladie depuis la psychoéducation.
Echanges avec le Dr [SOIGNANT_4]
(CMP) : accord pour maintenir 100 mg mensuel au moins un an, réévaluation d'une
forme trimestrielle si stabilité.
Conclusions :
- Palipéridone LP 100 mg mensuel (CMP)
- Sertraline : arrêt progressif à envisager au printemps si stabilité
- Projet d'insertion avec l'éducateur, RQTH
- Proposition tabacologie (refusée pour l'instant)
- RDV 2 mois

### o50 — 2024-03-12 — Observation psychiatrique de suivi (Médecin)
Observation psychiatrique de suivi du 12/03/2024 (Urgence : Bas)
Validé par [SOIGNANT_2]
- Médecin le 12/03/2024 à 12:40
Observations :
Vu ce jour.
Thymie stable depuis plus de 4 mois, sommeil correct, se lève à 9h. Demande d'arrêter la sertraline, "je me sens bien".
Pas d'élément psychotique en dehors d'un chuchotement "de temps en temps quand je suis fatigué". Pas de cannabis.
Il s'est inscrit pour un stage découverte en espaces verts avec l'éducateur (avril). Parle du GEM de Pessac, où il veut
aller "voir".
Conclusions :
- Arrêt de la sertraline ce jour (25 mg pendant 10 jours puis arrêt)
- Palipéridone LP 100 mg inchangée
- RDV 2 mois

### o51 — 2024-03-26 — Entretien psychologique (Psychologue)
Entretien psychologique du 26/03/2024 (Urgence : Bas)
Validé par [SOIGNANT_5]
- Psychologue le 26/03/2024 à 16:30
[PATIENT] arrive avec un carnet de dessins (des arbres, beaucoup). Il raconte qu'il va commencer à fréquenter un GEM à
Pessac, conseillé par l'éducateur.
Il parle de l'arrêt de la sertraline avec une petite inquiétude, "et si je redeviens triste". Nous reprenons ce qui l'a aidé en
2023.
Il évoque pour la première fois l'idée d'un appartement à lui, "pas tout de suite".

### o52 — 2024-04-23 — Transmission (IDE)
Transmission du 23/04/2024 (Urgence : Bas)
Validé par [SOIGNANT_7]
- IDE le 23/04/2024 à 16:00
RDV IDE de 14h non honoré. Rappelé : "j'étais au GEM, j'ai oublié". Reprogrammé en juin.

### o53 — 2024-05-14 — Entretien éducatif (Educateur spécialisé)
Entretien éducatif du 14/05/2024 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Educateur spécialisé le 14/05/2024 à 15:10
[PATIENT] fréquente depuis début avril le GEM de Pessac (groupe d'entraide mutuelle), deux à trois après-midi par semaine
: atelier jardin partagé, jeux de société. "Les gens là-bas, ils savent, je dois pas faire semblant."
Stage découverte de 2 semaines fait en avril chez un paysagiste de Gradignan : retour positif de l'employeur, [PATIENT]
très
fier.
Projet : CAPa jardinier-paysagiste en alternance à la rentrée de septembre. Recherche d'employeur à mener avec la
mission locale et Cap emploi (RQTH en cours). Permis de conduire à envisager ensuite.
Pas de consommation selon lui. Il dit penser au cannabis "quand je vois les autres fumer devant le GEM", sans passage
à l'acte.

### o54 — 2024-06-18 — Observation IDE (IDE)
Observation IDE du 18/06/2024 (Urgence : Bas)
Validé par [SOIGNANT_7]
- IDE le 18/06/2024 à 10:45
Entretien IDE reprogrammé. Poids 84 kg. TA 124/78. Urines négatives.
Tabac 20 cig/j, pense à la vapoteuse "quand j'aurai un salaire". Infos sur les substituts, brochure remise.
Ravi du GEM, va "au jardin" trois fois par semaine.

### o55 — 2024-09-03 — Entretien social (Assistante sociale)
Entretien social du 03/09/2024 (Urgence : Bas)
Validé par [SOIGNANT_8]
- Assistante sociale le 03/09/2024 à 11:00
RQTH accordée en juillet 2024 (5 ans).
Entrée en CAPa jardinier-paysagiste en alternance (2 ans) le 02/09/2024 : centre de formation à Blanquefort, employeur
une entreprise d'espaces verts de Pessac. Contrat d'apprentissage signé. Point sur le cumul AAH et salaire d'apprenti,
déclaration trimestrielle à la CAF expliquée.
Trajets : bus et vélo, en attendant le permis.
Mise à jour du dossier social : "trouble psychotique induit par le cannabis, suivi [ETABLISSEMENT_4]
(repris du dossier
MDPH initial).
Toujours hébergé chez ses parents. Gère seul son budget, plus d'accompagnement budgétaire nécessaire.

### o56 — 2024-09-17 — Entretien psychologique (Psychologue)
Entretien psychologique du 17/09/2024 (Urgence : Bas)
Validé par [SOIGNANT_5]
- Psychologue le 17/09/2024 à 17:10
Deux semaines de CAPa : [PATIENT]
est épuisé mais rayonnant. Il dit que le premier jour au CFA il a eu "la boule au ventre
comme au collège", la peur des moqueries, puis s'est rendu compte que "personne ne me connait, je peux être juste
Travail sur la gestion de la fatigue et des moments d'angoisse sur le chantier. Séances maintenues tous les 15 jours
pendant le premier trimestre.

### o57 — 2024-10-15 — Observation psychiatrique de suivi (Médecin)
Observation psychiatrique de suivi du 15/10/2024 (Urgence : Bas)
Validé par [SOIGNANT_2]
- Médecin le 15/10/2024 à 17:50
Observations :
Vu ce jour.
Stable depuis plus d'un an (pas de décompensation, voix résiduelles très rares). Pour alléger les contraintes avec
l'alternance, passage à la palipéridone LP trimestrielle : première injection de 350 mg faite au CMP le 07/10/2024 (relais
de la dose mensuelle de 100 mg).
Très investi dans le CAPa, fatigue physique, "je dors comme un bébé". Rythme : 3 semaines en entreprise, 1 semaine
au CFA. Il dit apprécier le tuteur, "il crie pas, il montre". Il n'a pas parlé de sa maladie au CFA, seulement au tuteur, avec
l'accord de l'éducateur.
Il demande s'il pourra un jour arrêter le traitement : réponse nuancée, pas avant une longue période de stabilité et
jamais seul, rappel de 2022 qu'il cite lui-même.
Pas de cannabis, pas d'alcool en semaine, quelques bières le samedi. Tabac 20 cig/j.
Conclusions :
Palipéridone LP 350 mg tous les 3 mois (CMP). RDV 3 mois.

### o58 — 2024-12-10 — Transmission (IDE)
Transmission du 10/12/2024 (Urgence : Bas)
Validé par [SOIGNANT_7]
- IDE le 10/12/2024 à 10:05
Appel de Mme [PATIENT]
: demande si son fils "peut boire un peu pour le réveillon" avec son traitement. Informations
générales données, à voir avec le patient lui-même. Pas d'inquiétude particulière, "il va bien".

### o59 — 2025-01-21 — Observation psychiatrique de suivi - synthèse annuelle (Médecin)
Observation psychiatrique de suivi - synthèse annuelle du 21/01/2025 (Urgence : Bas)
Validé par [SOIGNANT_2]
- Médecin le 21/01/2025 à 18:20
Observations :
Vu ce jour. Synthèse annuelle.
Rappel : 23 ans, schizophrénie paranoïde (prodromes dès 2018, premier épisode en 2020 avec hospitalisation sous
contrainte, rechute en octobre 2022 après arrêt de l'aripiprazole LP et reprise du cannabis), TUC sévère (début à 13
ans, abstinent depuis août 2023), antécédents de cannabinoïdes de synthèse, protoxyde (neuropathie 2021), kétamine
(2022-2023). Oncle maternel schizophrène.
Traitement : palipéridone LP, 75 mg mensuel (12/2022), 100 mg (06/2023), puis 350 mg trimestriel depuis le
07/10/2024. Sertraline 03/2023 - 03/2024.
Evolution 2024 : pas de décompensation, pas de rechute du cannabis (urines négatives), GEM depuis avril, CAPa en
alternance depuis septembre, bonne intégration dans l'entreprise. RQTH. Relations familiales apaisées, envisage un
logement autonome "après la première année". Thymie stable, plus de symptômes dépressifs. Voix "presque plus".
Psychothérapie : séances régulières avec Mme [SOIGNANT_5]
travail sur la honte et l'image de soi, le harcèlement du
collège est "digéré" selon lui. Remédiation cognitive proposée en 2023 non faite (préférence pour l'apprentissage en
situation, conformément au bilan psychologique de juin 2023), à rediscuter si difficultés en formation.
Famille : relations apaisées, la soeur [PROCHE_1]
est partie faire ses études à Toulouse, il dit qu'elle lui "manque". Les parents
ont suivi le programme pour les familles du CMP en 2023.
Points de vigilance : tabac 20 cig/j (souhaite maintenant réduire), poids 84 kg, examens ophtalmo et bilan lipidique à
faire, retentissement de la fatigue sur l'apprentissage.
Facteurs de rechute revus avec lui : il cite lui-même le cannabis, l'arrêt du traitement, les nuits blanches et "les
embrouilles avec mon père". Plan de prévention de la rechute écrit et partagé avec le CMP.
Le diagnostic de trouble psychotique induit qui figure encore dans le dossier social et le dossier MDPH est à mettre à
jour (schizophrénie retenue depuis 2023).
Conclusions :
- Palipéridone LP 350 mg trimestriel (CMP)
- Orientation IDE pour le tabac
- Bilan métabolique
- RDV 3 mois

### o60 — 2025-03-11 — Entretien psychologique (Psychologue)
Entretien psychologique du 11/03/2025 (Urgence : Bas)
Validé par [SOIGNANT_5]
- Psychologue le 11/03/2025 à 17:20
[PATIENT] arrive en avance, rasé, "en forme". Il annonce qu'il est en couple depuis un mois avec [PERSONNE_1]
24 ans,
rencontrée au GEM. Il a pu lui parler de sa maladie, elle "connait" (elle-même suivie pour un trouble bipolaire).
Inquiétude : "et si je redeviens fou devant elle ?".
Travail sur la place de la relation, sur ce qu'il veut lui dire ou non de son passé (le harcèlement, les "délires"). Il dit que le
collège "ne me fait plus pleurer".
Séances espacées au mois, à sa demande.

### o61 — 2025-05-13 — Observation IDE (IDE)
Observation IDE du 13/05/2025 (Urgence : Bas)
Validé par [SOIGNANT_7]
- IDE le 13/05/2025 à 11:30
Consultation tabac. [PATIENT]
est passé à la vapoteuse le 15/04 (liquide 12 mg/mL nicotine), plus aucune cigarette depuis,
"même pas une". CO expiré 3 ppm. Bravo.
Projet de permis de conduire (inscription auto-école faite). En parlant de la conduite, il raconte qu'en 2018, à 17 ans, il a
eu un accident de scooter en rentrant d'une soirée "défoncé" : chute seul dans un rond-point, fracture de la clavicule
gauche, urgences et bras en écharpe un mois. Il avait dit à ses parents qu'un chien avait traversé. "Personne ne sait
que j'avais fumé." Jamais signalé dans le dossier (ATCD somatiques notés "aucun" à l'entrée).
Echange sur cannabis et conduite, ce qu'il connait déjà.
Transmis au Dr [SOIGNANT_2]
