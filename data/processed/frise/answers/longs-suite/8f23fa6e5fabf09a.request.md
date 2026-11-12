Réponds à cette demande comme le ferait le modèle appelé par l'application : lis la consigne et le message, puis écris ta réponse dans le fichier `8f23fa6e5fabf09a.answer.json` du même dossier — un seul objet JSON, valide selon le schéma, sans texte autour. Ne lis aucun autre fichier.

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

### o1 — 2018-05-22 — Entretien téléphonique (IDE)
Entretien téléphonique du 22/05/2018 (Urgence : Bas)
Validé par [SOIGNANT_2]
- IDE le 22/05/2018 à 11:20
Appel de Mme [PATIENT]
46 ans, adressée par son médecin traitant le Dr [SOIGNANT_3]
(Bègles), qui a faxé un
courrier ce matin.
Demande "d'arrêter de boire pour de bon", parle d'un "dernier sevrage en 2016 qui n'a servi à rien". Boit environ 2 litres de
vin par jour, "un peu de bière en plus quand il fait chaud". Tremblements le matin, a déjà "le verre du réveil".
Sous Xanax 0,25 mg 3 fois par jour prescrit par le Dr [SOIGNANT_3]
depuis "trois ans à peu près".
Vit à Bègles avec son compagnon, "lui aussi il boit". Problèmes de loyer, "on va peut-être me mettre dehors".
Elle pleure au téléphone, dit qu'elle n'en peut plus. Pas d'idées suicidaires exprimées quand je pose la question.
Tél : [TEL]
RDV médical donné le 29/05 à 14h avec le Dr [SOIGNANT_4]
Lui ai conseillé de ne surtout pas arrêter d'un coup d'ici là.

### o2 — 2018-05-29 — Observation médicale d'entrée (Psychiatre addictologue)
Observation médicale d'entrée du 29/05/2018 (Urgence : Bas)
Validé par [SOIGNANT_5]
- Psychiatre addictologue le 29/05/2018 à 19:12
Observations :
Motif : Mme [PATIENT]
46 ans, née le [NE(E) EN 1972]
à Marmande, adressée par le Dr [SOIGNANT_3]
médecin
traitant à Bègles, pour prise en charge d'un trouble de l'usage de l'alcool. Demande personnelle : "un sevrage, mais un
vrai, pas comme la dernière fois", et "ne pas finir comme mon père". Venue seule, à l'heure, tenue correcte mais négligée,
odeur d'alcool discrète.
Histoire des consommations :
- Alcool : premier verre "vers 15 ans", à Marmande, "aux fêtes de village", premières ivresses dans la foulée. Usage festif
et de fin de semaine pendant les années de travail et de mariage, "comme tout le monde là-bas". Usage quotidien installé
au moment de la séparation d'avec son mari en 2006 ("c'est là que j'ai commencé le matin"). Perte de contrôle "depuis
une dizaine d'années" : n'arrive plus à s'arrêter une fois le premier verre pris, boit seule, cache des bouteilles.
Actuellement environ 2 L de vin rouge par jour (soit environ 20 UIA), parfois 2 ou 3 bières l'après-midi, premier verre au
réveil vers 8h pour "arrêter les tremblements". Maximum : "3 litres certains jours l'hiver dernier". Pas d'épisode de
convulsion ni de delirium rapporté. Dit n'avoir fait qu'un seul sevrage hospitalier, en 2016, "à la clinique du Lac" à
Bordeaux, une semaine, rechute "au bout d'un mois, peut-être moins". Jamais de postcure. Plusieurs tentatives d'arrêt
seule, "deux ou trois jours, pas plus", la dernière en février, interrompue par des tremblements et "une angoisse à hurler".
Conséquences décrites : chutes à domicile (pas de fracture), oublis, disputes avec le compagnon, dette de loyer liée à
l'argent "parti dans le vin". Boit surtout à la maison, seule le matin, avec [PERSONNE_1]
l'après-midi. Ne conduit pas (pas de
voiture depuis 2014).
Questionnée sur ce qui l'a aidée en 2016 : "rien, je suis sortie un vendredi et le lundi j'avais rebu". Elle n'a jamais pris
d'aide à l'abstinence (ni acamprosate ni baclofène), "on ne me l'a pas proposé".
- Benzodiazépines : alprazolam (Xanax) 0,5 mg matin, midi et soir, prescrit par le Dr [SOIGNANT_3]
depuis 2015 pour
"l'angoisse" (ordonnance vue ce jour : 0,5 mg x3, et non 0,25 comme noté à l'appel). Dit le prendre comme prescrit,
"parfois un de plus le soir". Pas d'achat hors prescription.
- Tabac : depuis l'âge de 15 ans, environ 25 cigarettes par jour actuellement. Pas de tentative d'arrêt.
- Cannabis : "quelques joints vers 20 ans", jamais régulier.
- Autres produits : nie formellement tout autre produit, "jamais de drogue dure, je ne suis pas comme ça". Jamais
d'injection.
Antécédents psychiatriques : un épisode dépressif en 2016, traité par paroxétine par le Dr [SOIGNANT_3]
pendant "un an
environ", arrêté seule. Actuellement tristesse de l'humeur depuis l'hiver, perte d'intérêt, sommeil haché, sentiment d'échec,
culpabilité vis-à-vis de ses enfants. Pas d'idées suicidaires actives ; à la question des antécédents de geste suicidaire,
répond "jamais, non". Pas d'hospitalisation en psychiatrie.
Antécédents somatiques : appendicectomie à 12 ans. Pas de traumatisme crânien ("non, jamais"). Pas de bilan hépatique
récent selon elle. Pas de dépistage VIH/VHC fait. Pas d'allergie connue.
Antécédents familiaux : père ouvrier agricole, "gros buveur", décédé en 2003 d'une cirrhose. Mère [PROCHE_1]
78 ans, vit à
Marmande, contacts téléphoniques "quand elle veut bien". Une sœur aînée, [PROCHE_2]
à Marmande également, "on ne se
parle plus trop".
Biographie : née et élevée à Marmande, dernière de deux filles. Enfance qu'elle décrit comme "normale, avec un père qui
buvait" : pas de violence physique rapportée, des disputes "le samedi soir", une mère "qui tenait tout". Bonne élève
jusqu'au collège, "forte en maths", orientée en lycée professionnel "parce qu'il fallait gagner sa vie vite". Bac pro de
secrétariat en 1990. Parcours professionnel décrit de façon floue : "des petits boulots, de l'intérim, du secrétariat un peu
partout", dernier emploi en 2014, au RSA depuis 2015. Mariée en 1994 avec M. [PERSONNE_2]
deux enfants :
[PROCHE_3] (23 ans) et [PROCHE_4]
(20 ans). Séparation en 2006 : "ça s'est mal fini, il buvait aussi", n'en dit pas plus. Les enfants
"sont partis vivre chez leur père en 2009", quand "ça n'allait pas du tout". Plus de contact avec eux depuis 2014 environ ;
c'est le sujet qui la fait pleurer.
Quand je lui demande ce qu'elle aimait faire, elle répond "les chiffres", puis change de sujet. Pas de loisirs actuels, sort
peu, "la télé, le bar en bas".
Installée à Bègles depuis 2010, appartement en HLM [ADRESSE]
Vit depuis 2017 avec M. [PROCHE_5]
[PROCHE_5] [PERSONNE_1] qu'elle a rencontré "au bar", lui-même consommateur d'alcool important. Dette de loyer,
commandement de quitter les lieux reçu en mars, "je n'ai pas osé ouvrir les courriers pendant des mois". Pas d'antécédent
judiciaire. Pas de permis de conduire suspendu. Pas de mesure de protection.
Journée type : lever vers 7h, premier verre, courses "au plus près", télévision, sieste alcoolisée, "l'apéro avec [PERSONNE_1]
à
partir de 17h, coucher tôt. Ne mange qu'une fois par jour. Ne voit plus d'amis "d'avant".
Examen : TA 148/92, FC 96. Tremblements fins des extrémités. Pas d'astérixis. Discrète érythrose faciale. Hépatomégalie
à 2 travers de doigt. Pas de signe neurologique focal, marche normale. Poids 58 kg.
Contact bon, adapté, un peu de honte. Thymie basse, pleurs, ralentissement modéré. Discours cohérent, pas d'élément
délirant.
Échelles : AUDIT à faire avec l'IDE ; HAD anxiété 14, dépression 13.
Motivation : ambivalente mais réelle ; elle dit avoir "peur de mourir comme mon père, jaune, à 58 ans". Elle redoute surtout
le regard des soignants et "qu'on fouille dans ma vie". Elle ne souhaite pas que le compagnon soit associé aux soins pour
l'instant.
Synthèse : trouble de l'usage de l'alcool sévère (9 critères DSM-5 sur 11), consommation matinale, dépendance physique.
Usage de benzodiazépines prescrites, à surveiller. Tabagisme à 25 cigarettes par jour. Épisode dépressif caractérisé
d'intensité moyenne, en contexte d'alcoolisation, à réévaluer après sevrage. Grande précarité menaçante (expulsion).
Conclusions :
- Inscription pour sevrage hospitalier programmé (liste d'attente, délai 2 à 3 mois), à ne pas tenter seule.
- Thiamine 500 mg/j dès maintenant.
- Sertraline 50 mg le matin débutée ce jour, malgré l'alcool, devant l'intensité de la symptomatologie.
- Bilan : NFS, BHC, GGT, TP, CDT, sérologies VIH/VHB/VHC (refuse les sérologies pour l'instant), fibroscan.
- Pas de modification de l'alprazolam, à revoir au moment du sevrage.
- Orientation vers Mme [SOIGNANT_6]
(AS) pour la dette et la procédure d'expulsion.
- RDV IDE dans 1 semaine, médical dans 4 semaines.

### o3 — 2018-06-05 — Observation IDE (IDE)
Observation IDE du 05/06/2018 (Urgence : Bas)
Validé par [SOIGNANT_2]
- IDE le 05/06/2018 à 16:05
Mme [PATIENT]
vient pour son bilan, à jeun "à part un verre ce matin pour pouvoir venir" (elle me le dit franchement,
ce qui est bien). Prise de sang faite.
AUDIT à 33. Fagerström à 7.
Sertraline commencée depuis une semaine, un peu de nausées, "ça passe". Thiamine prise.
Elle me reparle de ses enfants, de sa fille surtout. Je n'insiste pas, elle a RDV avec Mme [SOIGNANT_6]
la semaine prochaine.
Résultats reçus à 17h : GGT 412, VGM 106, plaquettes 118 G/L, TP 74 %, ASAT 142, ALAT 61, CDT 5,8 %. Transmis au
Dr [SOIGNANT_4]

### o4 — 2018-06-12 — Observation sociale (Assistante sociale)
Observation sociale du 12/06/2018 (Urgence : Bas)
Validé par [SOIGNANT_6]
- Assistante sociale le 12/06/2018 à 12:40
Premier entretien social.
Mme [PATIENT]
domiciliée [ADRESSE]
Locataire en titre seule (M. [PROCHE_5]
hébergé, non déclaré).
Ressources : RSA (environ 550 €), pas d'APL depuis la dette. Dette locative 4 800 € (environ 14 mois). Commandement
de quitter les lieux reçu en mars 2018, assignation devant le tribunal à venir. N'a jamais répondu au bailleur.
Parcours professionnel : "intérim, secrétariat", n'a "pas de papiers", ne sait pas dire combien d'années travaillées. Pas de
droits chômage.
Démarches : saisine du FSL, demande de plan d'apurement auprès du bailleur, prise de contact avec l'ADIL pour
l'audience. Dossier de surendettement à envisager.
Mme est d'accord pour que je contacte le bailleur. Prochain RDV dans 3 semaines.

### o5 — 2018-06-26 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 26/06/2018 (Urgence : Bas)
Validé par [SOIGNANT_5]
- Psychiatre addictologue le 26/06/2018 à 18:30
Observations :
Vue ce jour.
Consommation inchangée, "un peu moins le soir", 1,5 à 2 L/j. Sertraline 50 mg bien tolérée, humeur discrètement
meilleure, "je pleure moins".
Fibroscan du 21/06 : 9,8 kPa, compatible avec une fibrose F2-F3. Biologie : GGT 412, VGM 106, thrombopénie à 118.
Hépatopathie alcoolique, explications données.
Accepte enfin les sérologies.
Conclusions :
Sertraline 50 mg, thiamine 500 mg/j
Sérologies VIH, VHB, VHC
Sevrage hospitalier confirmé pour le 10/09
RDV 1 mois

### o6 — 2018-07-03 — Observation sociale (Assistante sociale)
Observation sociale du 03/07/2018 (Urgence : Bas)
Validé par [SOIGNANT_6]
- Assistante sociale le 03/07/2018 à 11:05
RDV de suivi. Le bailleur accepte de suspendre la procédure si un plan d'apurement est respecté (100 €/mois en plus du
loyer courant). Mme [PATIENT]
signe, "je vais y arriver". Dossier FSL envoyé.
Elle n'a toujours pas trouvé de bulletins de salaire, "tout est resté chez mon ex".
Revoir en septembre, après l'hospitalisation.

### o7 — 2018-07-17 — Observation IDE (IDE)
Observation IDE du 17/07/2018 (Urgence : Bas)
Validé par [SOIGNANT_2]
- IDE le 17/07/2018 à 15:10
RDV non honoré. Appel sur le portable : répondeur. Message laissé.
Rappelle à 15h : est "chez sa mère à Marmande pour quelques jours", avait oublié. Va bien, "pareil". Nouveau RDV le
31/07.

### o8 — 2018-09-10 — Observation médicale d'entrée (Interne)
Observation médicale d'entrée du 10/09/2018 (Urgence : Bas)
Validé par [SOIGNANT_7]
- Interne le 10/09/2018 à 17:55
Observations :
Entrée programmée dans l'unité de sevrage pour Mme [PATIENT]
46 ans, suivie au CSAPA par le Dr [SOIGNANT_8]
Rappel : TUAL sévère, début de la consommation à 13 ans selon la patiente ce jour (15 ans dans l'observation d'entrée),
consommation quotidienne depuis la séparation en 2006, un sevrage antérieur en 2016 (clinique du Lac). Pas d'ATCD de
crise convulsive ni de DT. Tabac 25 cig/j. Alprazolam 0,5 mg x3 (MT). Sertraline 50 mg depuis fin mai. Hépatopathie
alcoolique F2-F3 au fibroscan de juin.
Dernière consommation ce matin 9h, environ 1,5 L hier.
Examen : TA 156/98, FC 108, sueurs, tremblements, Cushman 8. Pas de syndrome confusionnel. Pas de signe de
localisation.
[ADRESSE]
[VILLE]
Sérologies de juillet : VIH -, VHB vacciné, VHC -.
Conclusions :
Protocole diazépam (Cushman toutes les 4h), alprazolam arrêté et inclus dans le protocole
Thiamine 500 mg IV 3 jours
Sertraline poursuivie
Hydratation, vitamine PP, B6

### o9 — 2018-09-11 — Observation infirmière (Infirmier(ère))
Observation infirmière du 11/09/2018 (Urgence : Bas)
Validé automatiquement le 12/09/2018 à 06:00 par [SOIGNANT_9]
Nuit agitee jusqu'a 2h. Sueurs, tremblements, anxieuse. Cushman 9 a 23h -> diazepam 20 mg selon protocole. Cushman
5 a 3h.
Pas d'hallucinations, orientee. Demande a fumer x3, accompagnee sur le patio.
Dit qu'elle a "deja fait ca a Marm..." puis se reprend "non, a Bordeaux". A noter.
S'est endormie vers 3h30.

### o10 — 2018-09-20 — Observation médicale de suivi (Interne)
Observation médicale de suivi du 20/09/2018 (Urgence : Bas)
Validé par [SOIGNANT_7]
- Interne le 20/09/2018 à 11:40
Observations :
Sortie ce jour après 10 jours. Sevrage sans complication (Cushman max 9 la première nuit). Diazépam arrêté à J9.
Alprazolam non réintroduit, la patiente est d'accord ("on verra si je tiens").
Craving important. Introduction du baclofène 10 mg x3, titration en ambulatoire.
Échographie hépatique : hépatomégalie stéatosique, pas de nodule.
Conclusions :
Ordonnance de sortie : baclofène 10 mg x3, sertraline 50 mg, thiamine 250 mg/j
RDV Dr [SOIGNANT_4]
le 16/10

### o11 — 2018-10-16 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 16/10/2018 (Urgence : Bas)
Validé par [SOIGNANT_5]
- Psychiatre addictologue le 16/10/2018 à 18:05
Observations :
Vue ce jour.
Rechute le 05/10, [PERSONNE_1]
avait ramené un cubi", reprise quotidienne, environ 1 L/j. Honte, mais revenue d'elle-même.
Baclofène pris à 30 mg/j, pas de somnolence. Le Dr [SOIGNANT_3]
a represcrit l'alprazolam 0,5 mg x3 "parce que je dormais
plus".
Humeur stable, sertraline poursuivie.
Audience d'expulsion fixée au 04/12.
Conclusions :
Titration du baclofène jusqu'à 60 mg/j (20 mg x3)
Appel au Dr [SOIGNANT_3]
: ne pas augmenter l'alprazolam
RDV 1 mois

### o12 — 2018-11-20 — Observation ELSA (IDE ELSA)
Observation ELSA du 20/11/2018 (Urgence : Bas)
Validé par [SOIGNANT_10]
- IDE ELSA le 20/11/2018 à 10:15
Appel UHCD. Pte [PATIENT]
vue a l'UHCD.
Amenee par les pompiers le 18/11 au soir : crise convulsive generalisee devant son compagnon, a domicile, recup en 10
min. Morsure de langue.
Contexte : arret brutal de l'OH depuis le 16/11 "plus d'argent" + plus de Xanax depuis 4-5 jours (ordonnance pas
renouvelee). Baclofene pris irregulierement.
TDM cerebrale aux [SOIGNANT_11]
: pas de lesion aigue. Alcoolemie nulle a l'arrivee.
Diazepam 10 mg x4 aux [SOIGNANT_11]
Cushman 4 ce matin.
Propose hospit en addicto : refuse, [PERSONNE_1]
est tout seul".
Sortie contre avis medical ce jour avec ordonnance diazepam 5 jours (Dr [SOIGNANT_11]
+ info CSAPA.
RDV pris Dr [SOIGNANT_4]
le 27/11.

### o13 — 2018-11-27 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 27/11/2018 (Urgence : Bas)
Validé par [SOIGNANT_5]
- Psychiatre addictologue le 27/11/2018 à 17:45
Observations :
Vue ce jour avec M. [PROCHE_5]
à sa demande.
Crise convulsive généralisée de sevrage le 18/11 (alcool + arrêt de l'alprazolam), sortie de l'UHCD contre avis (cf. ELSA).
A repris l'alcool dès le 22/11, environ 1 L/j, "pour ne pas refaire une crise".
Information sur le risque de nouvelle crise ou de delirium en cas d'arrêt brutal. Baclofène 60 mg/j pris "presque tous les
jours". Alprazolam 0,5 mg x3 représcrit par le MT.
Humeur : "je vais perdre l'appartement". Audience reportée au 18/12.
Conclusions :
Pas de sevrage seule : consigne écrite remise
Nouvelle inscription en sevrage hospitalier dès que possible
Baclofène 60 mg, sertraline 50 mg, thiamine
RDV 3 semaines

### o14 — 2018-12-04 — Entretien téléphonique (IDE)
Entretien téléphonique du 04/12/2018 (Urgence : Bas)
Validé par [SOIGNANT_2]
- IDE le 04/12/2018 à 14:40
Appel du Dr [SOIGNANT_3]
médecin traitant : il a bien reçu le courrier du Dr [SOIGNANT_4]
Il continue l'alprazolam 0,5 mg x3
"pour éviter une nouvelle crise", sans augmenter, ordonnance de 14 jours. Il a appris que l'audience était reportée.
Transmis au Dr [SOIGNANT_4]

### o15 — 2019-01-15 — Observation IDE (IDE)
Observation IDE du 15/01/2019 (Urgence : Bas)
Validé par [SOIGNANT_2]
- IDE le 15/01/2019 à 10:30
Passage rapide pour l'ordonnance de baclofène (le Dr [SOIGNANT_4]
l'avait laissée au secrétariat). Mme [PATIENT]
dit
que "ça va à peu près", consommation "pareille". Pas de nouvelle crise.
Me demande si je peux appeler le bailleur pour elle, je lui rappelle que c'est Mme [SOIGNANT_6]
qui suit ça et je lui donne un
RDV.
Pas le temps pour un vrai entretien, elle attendait [PERSONNE_1]
dehors.

### o16 — 2019-03-12 — Observation IDE (IDE)
Observation IDE du 12/03/2019 (Urgence : Bas)
Validé par [SOIGNANT_2]
- IDE le 12/03/2019 à 09:45
Passage pour le renouvellement du baclofène 60 mg et de la sertraline. Mme [PATIENT]
est pressée, "on a des
cartons à faire". Pas d'entretien possible. Je lui rappelle le RDV avec Mme [SOIGNANT_6]
du 19/03.

### o17 — 2019-03-19 — Observation sociale (Assistante sociale)
Observation sociale du 19/03/2019 (Urgence : Bas)
Validé par [SOIGNANT_6]
- Assistante sociale le 19/03/2019 à 14:50
Point sur la procédure d'expulsion.
Jugement du 18/12/2018 : résiliation du bail et expulsion ordonnée, sans délai supplémentaire. Le FSL a été refusé (dette
trop ancienne, pas de reprise du paiement du loyer courant). Concours de la force publique accordé par la préfecture,
expulsion possible dès la fin de la trêve hivernale (31/03).
Mme [PATIENT]
est sidérée, "je pensais qu'ils allaient attendre". Le couple ne veut pas être séparé : refuse les places
115 "femmes seules".
Demande SIAO déposée (hébergement couple). Je lui donne l'adresse du CAARUD et de l'accueil de jour. Revoir avant la
date.

### o18 — 2019-04-23 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 23/04/2019 (Urgence : Bas)
Validé par [SOIGNANT_5]
- Psychiatre addictologue le 23/04/2019 à 16:20
Observations :
Venue sans RDV, accompagnée de M. [PROCHE_5]
Expulsée le 16/04/2019 au matin, en présence de l'huissier et de la police. Dorment depuis chez un ami de [PERSONNE_1]
à
Bordeaux, "dans le salon", "ça va pas durer".
A perdu ses médicaments et ses ordonnances dans le déménagement : plus de baclofène ni de sertraline depuis une
semaine, "de toute façon j'en voyais pas l'intérêt". Plus d'alprazolam non plus.
Alcool : environ 2 L/j, "c'est pire".
Pleure, épuisée. Pas d'idées suicidaires, "j'ai pas le temps pour ça".
Conclusions :
Represcription proposée : n'en veut pas pour l'instant, sauf la thiamine
Pas de sevrage dans ce contexte : réduction des risques, ne pas arrêter brutalement
Lien avec l'équipe mobile psychiatrie-précarité (EMPP) et le CAARUD demandé avec son accord
Recontacter Mme [SOIGNANT_6]

### o19 — 2019-06-04 — Observation IDE (IDE)
Observation IDE du 04/06/2019 (Urgence : Bas)
Validé par [SOIGNANT_2]
- IDE le 04/06/2019 à 17:00
RDV non honoré.
Numéro de portable ne répond plus ("ce numéro n'est plus attribué").
Appel au [ETABLISSEMENT_3]
: la connaissent, elle passe "de temps en temps" avec son compagnon. Message laissé
pour qu'elle rappelle le CSAPA.

### o20 — 2019-07-09 — Observation équipe mobile précarité (IDE EMPP)
Observation équipe mobile précarité du 09/07/2019 (Urgence : Bas)
Validé par [SOIGNANT_12]
- IDE EMPP le 09/07/2019 à 18:40
Rencontre lors de la maraude, quai de Paludate, avec M. [PROCHE_5]
Le couple dort sous une tente près de la gare
Saint-Jean depuis "fin mai".
Mme [PATIENT]
dit avoir été "expulsée en mars" et être passée "de canapé en canapé" avant la tente.
Alcool : vin en brique, "2 ou 3 litres à deux". Dit prendre "des Rivotril de la rue" depuis le printemps, "2 ou 3 par jour", pour
dormir et "pas trembler", achetés autour de la gare. Plus de traitement prescrit.
Plaies infectées aux deux pieds (chaussures inadaptées) : soins faits, orientation PASS.
Humeur triste, sommeil très mauvais, peur la nuit ("on se fait voler"). Pas d'idée suicidaire exprimée.
Lui ai rappelé que le CSAPA l'attend. Accepte d'être revue par l'EMPP chaque semaine. Domiciliation à faire au CAARUD.
M. [PROCHE_5]
présent, parle beaucoup à sa place ; quand il s'éloigne, elle dit "c'est grâce à lui que je suis pas
morte dehors". Pas d'élément évoquant des violences dans le couple à ce stade, question posée seule à seule.

### o21 — 2019-09-17 — Transmission CAARUD (Éducateur spécialisé)
Transmission CAARUD du 17/09/2019 (Urgence : Bas)
Validé par [SOIGNANT_13]
- Éducateur spécialisé le 17/09/2019 à 11:25
Transmission de Mme [PERSONNE_3]
éducatrice au [ETABLISSEMENT_3]
avec l'accord de Mme [PATIENT]
:
- fréquente le CAARUD depuis juin, deux à trois fois par semaine (douches, laverie, café), domiciliation postale faite au
CAARUD en août ;
- prend du matériel de réduction des risques "pour son compagnon" (embouts, roule-ta-paille) ;
- demande des préservatifs ;
- reste fragile, "beaucoup d'alcool dès le matin".
Je l'ai vue ensuite au CSAPA (RDV pris par le CAARUD) : souhaite garder un lien "mais pas de sevrage dehors, c'est trop
dur". Accord pour un RDV éducatif mensuel et un RDV avec le Dr [SOIGNANT_4]
à l'automne.

### o22 — 2019-11-05 — Observation équipe mobile précarité (IDE EMPP)
Observation équipe mobile précarité du 05/11/2019 (Urgence : Bas)
Validé par [SOIGNANT_12]
- IDE EMPP le 05/11/2019 à 19:05
Maraude. Mme [PATIENT]
et M. [PROCHE_5]
ont déplacé la tente sous le pont, côté Bastide.
Amaigrie (elle estime avoir perdu "5 ou 6 kilos"). Plusieurs pipes à crack et des cuillères dans la tente : Mme dit que c'est
"à [PERSONNE_1]
nie en consommer elle-même.
Alcool inchangé. Rivotril de rue "quand j'en trouve".
Toux grasse, pas de fièvre. Proposition d'accompagnement à la PASS : accepte pour jeudi.
Bien que fatiguée, a gardé de l'humour, parle de sa fille ("elle a 24 ans maintenant").

### o23 — 2019-12-10 — Observation équipe mobile précarité (IDE EMPP)
Observation équipe mobile précarité du 10/12/2019 (Urgence : Bas)
Validé par [SOIGNANT_12]
- IDE EMPP le 10/12/2019 à 20:10
Maraude par grand froid. Couple toujours sous le pont, couvertures de survie distribuées. Proposition de mise à l'abri 115
(gymnase, plan grand froid, couples acceptés) : refus de M. [PROCHE_5]
Mme suit.
Mme [PATIENT]
tousse moins. Alcool "comme d'hab". Repasser jeudi.

### o24 — 2020-01-14 — Observation ELSA (IDE ELSA)
Observation ELSA du 14/01/2020 (Urgence : Bas)
Validé par [SOIGNANT_10]
- IDE ELSA le 14/01/2020 à 14:30
Appel du service de medecine (secteur 3). Pte [PATIENT]
47 ans.
Admise le 10/01 via SAMU : trouvee confuse dans la tente par son compagnon, agitee, hallucinations (insectes, "des gens
dans la tente"), fievre 38,6, tachycardie 130. Pas bu depuis 4 jours "plus d'argent, il faisait trop froid pour faire la manche".
Delirium tremens -> rea 3 jours (diazepam IV, thiamine), transferee en medecine le 13/01.
Ce jour : orientee, critique partiellement, amnesie des 2 premiers jours.
Toxiques urinaires a l'entree : BZD +, cocaine +. Interrogee : reconnait "la galette" (crack) "quelques fois depuis [PERSONNE_4]
fume "avec [PERSONNE_1]
"pas tous les jours".
Info RDR crack donnee (pipes, embouts). Propose SSR addicto : reflechit.
Compagnon M. [PROCHE_5]
passe tous les jours, reste dans le hall (alcoolise, calme). La pte s'inquiete pour lui "il va
pas tenir sans moi".
Vu avec medecin du service : thiamine 500 mg x3 IV poursuivie, pas de BZD a la sortie (risque de mesusage avec le
clonazepam de rue). Poids 47 kg, denutrition, dieteticienne passee.
Repasser jeudi.
