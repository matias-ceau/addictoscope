Réponds à cette demande comme le ferait le modèle appelé par l'application : lis la consigne et le message, puis écris ta réponse dans le fichier `1fa7ad9c8ecd1c08.answer.json` du même dossier — un seul objet JSON, valide selon le schéma, sans texte autour. Ne lis aucun autre fichier.

## Consigne

Tu relis une frise chronologique d'addictologie (modèle Auriacombe et al., 2018) contre le texte des observations dont elle a été tirée. La frise a été construite en lisant le dossier par morceaux : vérifie chaque événement contre tout le texte. Garde les étiquettes ([PATIENT], [SOIGNANT_2]…) telles quelles.

Ne signale que ce que le texte contredit ; un événement juste ne figure pas dans ta réponse.
- verdict = "wrong" : le fait n'existe pas dans le texte. Exemples : un médicament seulement demandé par le patient ou envisagé par l'équipe, jamais prescrit ; un fait qui concerne un proche ; un fait nié.
- verdict = "fix" : le fait existe mais sa date, sa fin ou sa note est à reprendre. Cherche surtout : un événement noté en cours alors qu'il s'arrête plus loin dans le dossier, ou noté terminé alors qu'il se poursuit ; un antécédent placé à la date de l'observation qui le raconte alors que le texte permet de le dater plus tôt ; une date de fin prise pour un début (« jusqu'en », « sorti le ») ; une durée mal comptée ; une note qui dit autre chose que le texte. Donne start, end, ongoing et note tels qu'ils doivent être (start = null et note = "" s'ils ne changent pas).
- missing : les événements importants du parcours que la frise n'a pas (tentative de suicide, hospitalisation, traitement, début ou arrêt d'un usage, événement de vie marquant, antécédent raconté en passant), avec les mêmes champs et les mêmes règles que la frise, et leurs observations sources.
- reason : ce que dit le texte, en une phrase courte. N'invente rien.

## Schéma de la réponse (relecture)

```json
{
 "type": "object",
 "additionalProperties": false,
 "required": [
  "verdicts",
  "missing"
 ],
 "properties": {
  "verdicts": {
   "type": "array",
   "items": {
    "type": "object",
    "additionalProperties": false,
    "required": [
     "id",
     "verdict",
     "start",
     "end",
     "ongoing",
     "note",
     "reason"
    ],
    "properties": {
     "id": {
      "type": "string",
      "description": "numéro de l'événement : e1, e2…"
     },
     "verdict": {
      "type": "string",
      "enum": [
       "fix",
       "wrong"
      ]
     },
     "start": {
      "type": [
       "string",
       "null"
      ],
      "description": "début juste ; null si inchangé"
     },
     "end": {
      "type": [
       "string",
       "null"
      ],
      "description": "fin juste ; null s'il n'y en a pas"
     },
     "ongoing": {
      "type": "boolean",
      "description": "en cours à la dernière observation"
     },
     "note": {
      "type": "string",
      "description": "note juste ; chaîne vide si inchangée"
     },
     "reason": {
      "type": "string",
      "description": "ce que dit le texte, en une phrase"
     }
    }
   }
  },
  "missing": {
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

Frise à relire (numéro | piste | période | note | observations sources), dernière observation le 2026-10-13 :

e1 | substance_use / Cocaïne | 2004 → 2014 | Première prise vers 25 ans en soirée (23 ans selon o4), usage festif le week-end, sniffée, en groupe, jusqu'à la promotion de 2014 (usage) | o2, o4, o15, o47, o58
e2 | substance_use / Cocaïne | 2014 → 2021-01-28 | Usage en semaine, solitaire, professionnel depuis la promotion ; 3 à 4 g/semaine ; impossibilité de s'arrêter, nuits blanches, descentes ; trouble de l'usage sévère (usage, perte de contrôle) | o2, o4, o15
e3 | substance_use / Cocaïne | 2021-01-28 → 2021-08-15 | Abstinence de six mois et demi, urines négatives en mars (sevrage) | o4, o7, o8, o10, o15
e4 | substance_use / Cocaïne | 2021-02 → 2021-03 | Craving important le soir et en voiture, en diminution en mars (jeudi soir) (craving) | o4, o7
e5 | substance_use / Cocaïne | 2021-08-15 → 2022-04 | Rechute pendant les vacances au Cap Ferret, puis usage de week-end 2 à 3 fois par mois, 1 à 1,5 g (rechute) | o10, o11, o12, o15, o58
e6 | substance_use / Cocaïne | 2022-03 → 2022-03 | Pensée d'une « petite trace » avant une réunion, sans passage à l'acte (craving) | o16
e7 | substance_use / Cocaïne | 2022-04 → 2022-12-10 | Reprise d'un usage en semaine, seul à l'hôtel puis mardi et jeudi, y compris au travail ; environ 3 g/semaine ; rechute d'un usage sévère (rechute, perte de contrôle) | o19, o20, o21, o23, o24, o25, o26, o27
e8 | substance_use / Alcool | 1994 | Premières ivresses vers 15 ans ; consommation sociale importante dans le métier (intoxication) | o2
e9 | substance_use / Alcool | 2018 → 2021-01 | Consommation quotidienne de 4 à 6 verres (vin, whisky) depuis deux à trois ans, davantage les soirs de cocaïne ; trouble de l'usage moyen (usage) | o2, o4, o15
e10 | substance_use / Alcool | 2021-02 → 2021-08 | Alcool réduit : 2-3 verres le soir puis pas d'alcool en semaine, 3-4 verres le samedi (usage) | o4, o7, o8
e11 | substance_use / Alcool | 2021-08 → 2022-04 | Binge les soirs de cocaïne (jusqu'à 8-10 verres), sinon 1-2 verres (intoxication) | o10, o12, o15
e12 | substance_use / Alcool | 2022-04 → en cours | Reprise d'une consommation quotidienne de 4-5 verres le soir (rechute) | o19
e13 | substance_use / Tabac | 1995 → 2026-02-20 | 15 à 20 cigarettes par jour depuis 16 ans, plus les soirs de cocaïne ; pas de tentative d'arrêt, refuse d'aborder l'arrêt (usage) | o2, o8, o11, o15, o66, o68
e14 | substance_use / Cannabis | 1991 → 1999 | Consommation au lycée, arrêt vers 20 ans (usage) | o2
e15 | substance_use / Jeux d'argent | 2021-01 → 2021-01 | « Je ne joue pas, à part un loto de temps en temps » (usage) | o2
e16 | substance_use / Jeux d'argent | 2022-02 | Pronostics entre collègues, jeu non exploré en détail ; se ferme quand il est question de dettes en groupe (usage) | o15, o17
e17 | substance_use / Écrans | 2022-02 → en cours | Beaucoup de temps sur son téléphone le soir (matchs, résultats, vidéos) pour combler un sentiment de vide (usage) | o15, o16, o17
e18 | psychiatric / Difficultés d'attention et impulsivité (TDAH à évaluer) | 1985 → en cours | Hyperactivité, impulsivité, besoin de remplir chaque minute déjà enfant, concentration difficile « depuis toujours » masquée par la cocaïne ; pas d'évaluation formelle | o2, o5, o8, o15
e19 | psychiatric / Coups de mou et descentes tristes | 2021-01-18 → en cours | Périodes de « coup de mou » et descentes tristes après les week-ends de consommation ; thymie stable, pas d'idées suicidaires | o2, o12, o15
e20 | somatic / Appendicectomie | 1991 | Appendicectomie à 12 ans | o2
e21 | somatic / Troubles du sommeil | 2021-01 → en cours | Sommeil de 3 à 5 heures par nuit, perturbé au sevrage puis 6 h en mars, de nouveau 4-5 h | o2, o4, o7, o12, o15, o19
e22 | somatic / Tension artérielle élevée | 2021-01 → en cours | TA 142/88 à l'entrée, 138/86 en septembre 2021, 136/84 en février 2022 | o2, o11, o15
e23 | somatic / Épistaxis et croûtes nasales | 2022-04 → en cours | Épistaxis répétées depuis quelques semaines, consultation ORL demandée | o19
e24 | therapeutic_psycho / Suivi CSAPA | 2021-01-18 → en cours | Première consultation le 18/01/2021, suivi mensuel puis tous les 15 jours à 2 mois ; premier suivi spécialisé de sa vie | o1, o2, o3, o4, o15, o19, o21, o24, o28, o34, o47, o58
e25 | therapeutic_psycho / Bilan biologique, ECG et urines | 2021-01-26 → 2021-01-26 | Prise de sang, ECG, urines positives à la cocaïne, AUDIT 17 | o3, o4
e26 | therapeutic_psycho / Suivi psychologique | 2021-02-16 → en cours | Entretiens tous les 15 jours, bonne alliance | o5, o9, o15, o16, o39, o43, o58, o63, o69, o75
e27 | therapeutic_psycho / Groupe de prévention de la rechute | 2022-01-18 → 2022-06-14 | 8 séances de janvier à juin, le mardi soir, animé par l'éducateur ; assidu aux trois premières, jugé utile mais scolaire | o12, o14, o15, o16, o17, o20, o67
e28 | therapeutic_psycho / Consultation ORL demandée | 2022-05 → 2022-05 | Consultation ORL demandée pour les épistaxis ; arrêt de travail proposé et refusé | o19
e29 | life_event / Séparation des parents | 1993 | Parents séparés quand il avait 14 ans, resté avec sa mère ; père souvent sur les routes | o2, o5, o45, o46, o48, o69
e30 | life_event / Scolarité (bac puis BTS commercial) | 1991 → 1996 | Scolarité correcte, bac puis BTS commercial | o2
e31 | life_event / Emploi : entrée dans l'entreprise actuelle | 2006 → 2006 | Commercial dans plusieurs entreprises puis entrée en 2006 dans l'entreprise actuelle | o2
e32 | life_event / Mariage | 2009 → 2009 | Marié depuis 2009 avec une infirmière scolaire | o2
e33 | life_event / Naissance du premier enfant | 2011 → 2011 | Enfant de 9 ans en janvier 2021 (année approximative) | o2
e34 | life_event / Naissance du second enfant | 2014 → 2014 | Enfant de 6 ans en janvier 2021 (année approximative) | o2
e35 | life_event / Promotion comme cadre | 2014 → 2014 | Promotion comme cadre, début de la pression et de l'usage professionnel | o2, o15
e36 | life_event / Avertissement de l'employeur | 2020-12 → 2020-12 | Avertissement écrit pour un rendez-vous client manqué | o1, o2
e37 | life_event / Ultimatum de l'épouse | 2020-12 → 2020-12 | Épouse trouve de la cocaïne dans sa veste mi-décembre : « la dernière fois » | o1, o2
e38 | life_event / Remarque du manager devant l'équipe | 2021-06 → 2021-06 | Trimestre « raté », remarque du manager devant l'équipe, effondrement | o9
e39 | life_event / Révélation de la rechute à l'épouse | 2021-10 → 2021-10 | Informe son épouse de la rechute de l'été, qui reste | o12, o15
e40 | life_event / Reprise de la course à pied | 2021-03 | Course à pied deux fois par semaine « pour remplacer » | o7
e41 | life_event / Réorganisation de l'entreprise | 2022-03 → en cours | Réorganisation annoncée, nouveau directeur régional, peur d'être mis au placard | o16, o19
e42 | substance_use / Cocaïne | 2009 → 2023-04-09 | Consommation de cocaïne depuis l'âge de 30 ans selon le patient, quasi quotidienne début 2023 ; trouble d'usage sévère (usage, perte de contrôle) | o34, o24
e43 | substance_use / Cocaïne fumée (base) | 2019-03 → 2019-06 | Cocaïne cuisinée et fumée à la pipe au printemps 2019, 5 ou 6 week-ends, avec un collègue ; arrêt par peur de la dépendance, jamais évoqué avant juin 2022 (usage) | o20, o21
e44 | substance_use / Cocaïne | 2015 → 2016 | Consommation de cocaïne motivant un suivi addictologique libéral en 2015 ; arrêt puis abstinence d'environ huit mois en 2015-2016, niée à l'entrée (sevrage) | o22
e45 | substance_use / Cocaïne | 2022-12-10 → 2022-12-20 | Abstinence de 10 jours déclarée après le contrôle routier (sevrage) | o27
e46 | substance_use / Cocaïne | 2023-01 → 2023-04-09 | Reprise après les fêtes, 2 à 3 fois par semaine puis 3 soirs sur 7 depuis mars, seul le soir (rechute, perte de contrôle) | o29, o32, o35, o34
e47 | substance_use / Cocaïne | 2023-04-08 | Intoxication aiguë : environ 2 g sniffés entre 20h et 23h, seul, avec une bouteille de whisky ; urines positives (intoxication) | o34, o35, o42, o51, o54, o58
e48 | substance_use / Cocaïne | 2023-04-11 → 2023-04-27 | Craving intense les premiers jours d'hospitalisation, en nette baisse à la sortie (craving) | o36, o37, o38
e49 | substance_use / Cocaïne | 2023-04-09 → en cours | Abstinence de cocaïne depuis le 09/04/2023 à la sortie d'hospitalisation (sevrage) | o38
e50 | substance_use / Alcool | 2022-06 → 2023-04-10 | Alcool quotidien : 5-6 verres/j en octobre, 4-6 en janvier, 3-5 en mars, whisky tous les soirs en avril ; réduit à 2-3 verres après le 10/12/2022 (usage) | o21, o24, o25, o27, o29, o32, o35, o58
e51 | substance_use / Alcool | 2023-04-08 | Intoxication alcoolique aiguë (alcoolémie 1,92 g/L, bouteille de whisky) (intoxication) | o34, o35
e52 | substance_use / Alcool | 2023-04-11 → 2023-04-21 | Sevrage hospitalier sous oxazépam sans complication, arrêt le 21/04 (sevrage) | o35, o37, o38, o58
e53 | substance_use / Jeux d'argent | 2017 → 2023-01 | Paris sportifs en ligne depuis 2017, d'abord sur le foot avec des collègues (pronostics, « petits billets ») ; chasse aux pertes, mensonges, emprunts ; dettes cachées ; perte estimée à plus de 60 000 euros ; révélé en janvier 2023 (usage, perte de contrôle) | o20, o28, o29, o31, o58, o47, o51
e54 | substance_use / Jeux d'argent | 2020-03 → 2023-01 | Augmentation nette au premier confinement : tous sports, paris en direct, plusieurs comptes, la nuit, mises de 200 à 500 euros (usage, perte de contrôle) | o29, o58
e55 | substance_use / Jeux d'argent | 2023-01 → en cours | Plus de pari depuis fin janvier selon lui, interdiction volontaire de jeux (ANJ) en cours ; paris « dans la tête » en avril (sevrage) | o32, o35
e56 | substance_use / Tabac | 2023-04-09 → en cours | Tabac 15 cigarettes par jour aux urgences, 5 cig/j à la sortie sous patch (usage) | o34, o38
e57 | psychiatric / Épisode dépressif réactionnel | 2016 → 2016 | État dépressif réactionnel après l'arrêt de la cocaïne, bonne évolution sous paroxétine ; minimisé par le patient (« un coup de fatigue ») | o22, o58
e58 | psychiatric / Épisode dépressif caractérisé | 2023-01 → 2023-11 | Tristesse, anhédonie, aboulie, insomnie, perte de 6 kg, idées de mort passives ; EDC d'intensité moyenne depuis janvier 2023 | o29, o32, o34, o35, o38, o42, o46, o58, o61, o69, o74
e59 | psychiatric / Idées suicidaires | 2023-01-24 → 2023-04-27 | Idées de mort passives en janvier-mars, puis crise suicidaire avec scénario (pont d'Aquitaine) le 09/04/2023 ; plus d'idée suicidaire à la sortie, plan de sécurité | o29, o32, o34, o35, o36, o37, o38
e60 | psychiatric / Crise suicidaire | 2023-04-09 | Messages d'adieu à sa sœur, scénario précis, pas de passage à l'acte grâce à l'appel de la sœur | o34, o35, o36, o58
e61 | somatic / Perforation de la cloison nasale | 2022-06-20 → en cours | Perforation septale d'environ 1 cm constatée à l'ORL le 20/06/2022, soins locaux, arrêt du sniff ; saignements de nez moins fréquents en septembre | o21, o23, o58
e62 | somatic / Amaigrissement | 2022-06 → 2022-09 | Perte de 5 kg depuis juin d'après la balance du service, fatigue | o23
e63 | medication / Paroxétine | 2016 → 2016 | Paroxétine 20 mg pendant trois mois pour l'état dépressif de 2016 | o22, o58
e64 | medication / Escitalopram | 2023-03-07 → 2023-03-25 | Escitalopram 10 mg/j introduit le 07/03 ; arrêté par le patient environ 15 jours avant le 09/04 | o32, o33, o34, o37
e65 | medication / Escitalopram | 2023-04-18 → 2025-03 | Reprise à 15 mg/j, maintenue à la sortie | o37, o38, o57, o58, o60, o61
e66 | medication / Oxazépam | 2023-04-09 → 2023-04-21 | Oxazépam 20 mg aux urgences puis protocole de sevrage alcool en décroissance, arrêt le 21/04 | o34, o35, o36, o37, o38
e67 | medication / Substitut nicotinique (patch) | 2023-04 → 2023 | Patch nicotinique 21 mg/24h pendant l'hospitalisation, poursuivi à la sortie | o37, o38, o42, o68
e68 | therapeutic_psycho / Médecin traitant | 2008 → en cours | Suivi par le médecin traitant depuis 2008 | o22
e69 | therapeutic_psycho / Suivi addictologique libéral | 2015 → 2015 | Suivi d'environ six mois par un addictologue libéral à Bordeaux pour la cocaïne, adressé par le médecin traitant ; arrêt ensuite, omis à l'entrée | o22, o58
e70 | therapeutic_psycho / Entretiens éducateur spécialisé | 2022-06-14 → en cours | Entretien individuel mensuel proposé et accepté, en plus du suivi médical | o20
e71 | therapeutic_psycho / Suivi social | 2023-01-31 → 2026-06-23 | Assistante sociale : orientation en novembre 2022, entretien le 31/01/2023 pour les dettes, ANJ, surendettement | o25, o29, o30, o38, o40, o44, o53, o58, o73
e72 | therapeutic_psycho / Suivi psychologique | 2023-02-14 → en cours | Entretien psychologique du 14/02/2023, psychologue déjà en place en janvier ; hebdomadaire pendant un mois après la sortie | o29, o31, o38
e73 | therapeutic_psycho / Passage aux urgences (UHCD) | 2023-04-09 → 2023-04-10 | Urgences et UHCD pour crise suicidaire et intoxication alcool-cocaïne | o34, o35
e74 | therapeutic_psycho / Hospitalisation en addictologie | 2023-04-11 → 2023-04-27 | Hospitalisation pour sevrage alcool, arrêt cocaïne et risque suicidaire | o35, o36, o37, o38, o39, o58, o68, o69
e75 | life_event / Difficultés professionnelles | 2022-06 → 2022-11-21 | Travail compliqué, objectifs non atteints, absences, retards, convocation puis entretien préalable à licenciement le 29/09/2022 | o21, o23, o24
e76 | life_event / Arrêt de travail | 2022-10-04 → 2022-10-19 | Arrêt de travail de 15 jours accepté | o24
e77 | life_event / Licenciement | 2022-11-21 | Licenciement pour insuffisance professionnelle notifié le 21/11/2022 | o25, o30, o47, o58
e78 | life_event / Chômage | 2022-11-21 → en cours | Sans emploi, inscrit à Pôle emploi, ARE ouverte | o25, o30, o34, o40, o53, o58
e79 | life_event / Suspension du permis de conduire | 2022-12-10 → 2023-07 | Contrôle gendarmerie le 10/12/2022 (salivaire cocaïne positif, alcool 0,6 g/L), suspension de 6 mois prévue | o26, o27, o34, o42, o58
e80 | life_event / Endettement | 2019 → en cours | Crédits renouvelables depuis 2019 à l'insu de l'épouse, prêt personnel de 2021, découvert ; environ 38 000 € recensés hors crédit immobilier, découverts en janvier 2023 | o28, o29, o30
e81 | life_event / Séparation conjugale | 2023-01-20 → 2024-01-06 | Départ du domicile le 20/01/2023 à la demande de l'épouse ; épouse parlait de séparation dès octobre 2022 ; entretien familial le 25/04, pas de reprise de la vie commune | o24, o28, o29, o34, o38, o40, o49, o58
e82 | life_event / Hébergement chez sa sœur | 2023-01-20 → 2023-03-01 | Hébergé chez sa sœur après le départ du domicile | o29, o30, o32, o63
e83 | life_event / Logement en studio | 2023-03-01 → en cours | Emménagement dans un studio le 01/03/2023 ; enfants vus un week-end sur deux | o32, o33
e84 | life_event / Interdiction volontaire de jeux (ANJ) | 2023-01-31 → en cours | Demande d'interdiction volontaire de jeux remplie le 31/01, en cours d'instruction en mars | o29, o30, o32, o39, o40, o46
e85 | life_event / Projet de vente de la maison | 2023-04-08 | Appel difficile avec l'épouse au sujet de la vente de la maison le soir de l'intoxication | o35
e86 | substance_use / Cocaïne | 2014 → 2023-04 | Usage professionnel et solitaire depuis 2014, avec perte de contrôle ; escalade d'avril 2022 à avril 2023 ; dernière consommation le 09/04/2023. (usage, perte de contrôle) | o58, o47
e87 | substance_use / Cocaïne | 2019-03 → 2019-05 | Cocaïne fumée quelques week-ends au printemps 2019. (usage) | o58
e88 | substance_use / Cocaïne | 2022-04 → 2023-04 | Nouvelle escalade d'avril 2022 à avril 2023, avec perforation septale en 06/2022. (usage, perte de contrôle) | o58
e89 | substance_use / Cocaïne | 2024-12-21 | Rechute ponctuelle lors d'une soirée d'anciens collègues : environ 1,5 g, beaucoup d'alcool, "deux traces, et puis toute la nuit" ; pas de reprise depuis. (rechute, perte de contrôle) | o57, o58, o61, o71, o75
e90 | substance_use / Cocaïne | 2024-12-22 → 2024-12-28 | Craving fort pendant une semaine après la rechute. (craving) | o57
e91 | substance_use / Jeux d'argent | 2024-12-22 | Envie de parier sur le match du lendemain, sans passage à l'acte, pour la première fois depuis longtemps. (craving) | o57
e92 | substance_use / Alcool | 2023-04 → 2025-02 | Consommation modérée de week-end : 1 à 2 verres en 07/2023, 2-3 verres en 11/2023, 2-3 verres le samedi en 06/2024 ; beaucoup d'alcool lors de la rechute du 21/12/2024. (usage) | o42, o46, o54, o57, o58
e93 | substance_use / Alcool | 2025-02 → en cours | Usage quotidien de 4 à 5 verres depuis début février 2025 (32 verres une semaine), sans signe de dépendance physique, déclencheur : ennui et chômage. (usage) | o58, o59, o60
e94 | substance_use / Tabac | 2023-07-11 → en cours | Tabac : 5-8 cig/j (07/2023), 8 cig/j (11/2023), 8-10 cig/j (03/2025). (usage) | o42, o47, o58
e95 | psychiatric / TDAH | 2024-01-09 → en cours | TDAH de l'adulte, présentation combinée, diagnostiqué en janvier 2024 ; symptômes présents dans l'enfance (avant 12 ans). | o47, o48, o49, o61, o63, o69, o75
e96 | therapeutic_psycho / Thérapie de couple | 2023-09 → en cours | Thérapie de couple en libéral avec l'épouse, en cours d'espacement en 03/2025. | o43, o44, o58
e97 | therapeutic_psycho / Évaluation TDAH | 2023-11-28 → 2024-01-09 | Évaluation avec l'interne : ASRS, DIVA 2.0, hétéro-anamnèse maternelle, bulletins scolaires. | o47, o48, o49
e98 | medication / Méthylphénidate LP | 2024-03-05 → en cours | 18 mg puis 36 mg (16/04/2024) puis 54 mg (09/2024) ; bien toléré, bilan cardiologique normal. | o51, o52, o55, o58, o61, o62, o64, o65, o71, o75, o76
e99 | medication / Naltrexone | 2025-02 → 2025-08 | Prescrite à la reprise de l'alcool (02/2025), prise « presque tous les jours », nausées la première semaine ; arrêtée par le patient à la mi-août 2025 (« je n'en avais plus besoin »), validé. | o59, o60, o61, o64
e100 | somatic / Douleur thoracique sous cocaïne | 2017 | Passage aux urgences en 2017 après une nuit de cocaïne, révélé en 2024 ; bilan cardiologique normal en 02/2024. | o50, o51, o58
e101 | somatic / Élévation des GGT | 2025-03 → en cours | GGT 64 (31 un an avant), CDT limite. | o59, o58
e102 | life_event / Accident de voiture sous cocaïne | 2020-11 | Voiture de fonction contre un muret au retour d'une soirée sous cocaïne, sans blessé ; faussement déclaré comme chevreuil. | o40, o42
e103 | life_event / Père joueur pathologique | 1985 → 1990 | Père représentant en vins : PMU tous les jours puis casino ; le patient l'accompagnait au PMU enfant ; dettes, huissiers. | o45, o46, o48, o69, o75
e104 | life_event / Difficultés scolaires | 1985 → 1996 | Enfant agité, souvent puni, mots des enseignants dès le CP ; scolarité sauvée au lycée par le sport. | o45, o47, o48
e105 | life_event / Redoublement de la 5e | 1991 → 1996 | Redoublement de la 5e. | o45, o47, o48
e106 | life_event / Renvoi temporaire en 4e | 1991 → 1996 | Renvoi de 3 jours en 4e pour une bagarre. | o45, o47, o48
e107 | life_event / Père : éloignement | 2023-09-12 → en cours | Père malade et loin ; pas revu depuis plusieurs années, ne souhaite pas le revoir. | o43, o45
e108 | life_event / Surendettement | 2023-06-08 → en cours | Dossier déposé le 08/06/2023, recevable le 14/09/2023 ; plan imposé de 7 ans depuis mars 2024, mensualité 420 €, FICP ; dettes 41 500 €. | o40, o44, o53, o58, o63, o69, o73, o76
e109 | life_event / Formation de remise à niveau en gestion commerciale | 2024-04 → en cours | Financée par France Travail, en cours. | o52, o53, o56
e110 | substance_use / Cocaïne | 2021-02 → 2023-04 | Trouble de l'usage de cocaïne sévère, travaillé en psychothérapie les deux premières années du suivi ; abstinent depuis 04/2023. (usage) | o61, o69
e111 | substance_use / Cocaïne | 2026-07-20 | « Envie énorme » le soir des obsèques de son père ; appelle sa sœur et reste avec elle, pas de reprise. (craving) | o74
e112 | substance_use / Alcool | 2025-02 → en cours | Reprise de l'alcool depuis 02/2025 (2-3 verres 4 soirs sur 7 en mai 2025, « le dernier produit qui restait », relié à l'ennui) ; réduction nette puis quelques verres le week-end, 2 verres le samedi en 09/2026 ; TU alcool en rémission. (rechute) | o61, o63, o64, o66, o71, o75
e113 | substance_use / Alcool | 2026-07-20 | « Pas mal de whisky » le soir des obsèques de son père, « mais pas plus ». (usage) | o74, o75
e114 | substance_use / Jeux d'argent | 2022 → 2022 | Paris sportifs : il « jouait déjà tous les soirs » à l'époque du groupe de 2022, pariant parfois pendant les pauses ; non dit à l'époque. (usage) | o67
e115 | substance_use / Jeux d'argent | 2025-11 → 2025-11 | Rechute brève : paris sur le foot environ 10 jours sur un site étranger non couvert par l'interdiction ANJ (publicité sur un réseau social), perte de 600 € ; arrêt seul après une nuit à « se refaire », dit à son épouse puis spontanément à l'équipe. Pas de jeu depuis, jeu en rémission. (rechute, perte de contrôle) | o66, o67, o69, o71, o75
e116 | substance_use / Tabac | 2026-01-22 → 2026-01-22 | Rechute sur la cigarette le 22/01 après l'arrêt de la varénicline au bout de quatre jours (nausées). (rechute) | o69, o70
e117 | substance_use / Tabac | 2026-02-20 → en cours | Arrêt du tabac depuis le 20/02/2026 sous varénicline ; abstinent confirmé en 05, 09 et 10/2026 (CO 2 ppm), très fier ; tabac en sevrage. (sevrage) | o70, o71, o72, o75, o76
e118 | medication / Varénicline | 2026-01-13 → 2026-01-17 | Débutée le 13/01/2026, arrêtée au bout de quatre jours (nausées), non dit à l'IDE avant le 17/02. | o68, o69, o70
e119 | medication / Varénicline | 2026-02-17 → 2026-04 | Reprise le 17/02/2026 (au milieu du repas), poursuite jusqu'à 12 semaines ; terminée « il y a quelques semaines » selon le patient le 12/05/2026. | o70, o71, o72
e120 | psychiatric / Crise suicidaire | 2023-04 → 2023-04 | Crise suicidaire d'avril 2023, suivie de l'hospitalisation. | o69, o74
e121 | psychiatric / Deuil du père | 2026-07-16 → en cours | Tristesse « mais pas comme en 2023 », pas d'idée suicidaire ; 09/2026 : pas de symptôme dépressif caractérisé, sommeil correct. | o74, o75
e122 | somatic / Insomnie d'endormissement | 2026-01 → 2026-09 | Insomnie d'endormissement « depuis l'hiver » (03/2026) ; sommeil correct en 09/2026. | o71, o75
e123 | somatic / Baisse d'appétit et perte de poids | 2025-09 → 2026-09 | Appétit diminué le midi (09/2025), 74 kg en 12/2025 (-3 kg depuis l'été), 72 kg en 03/2026 (79 kg en 2024), remonté à 75 kg en 09/2026. | o64, o66, o71, o75, o76
e124 | somatic / Père : cancer du poumon métastatique | 2026-02 → 2026-07-16 | Père malade (cancer du poumon métastatique, à Pau) ; le patient s'y rend un week-end sur deux ; décès le 16/07/2026. | o69, o71, o73, o74
e125 | therapeutic_psycho / Blocage des sites de jeux | 2025-12-16 → en cours | Logiciel de blocage des sites de jeux et de paris installé avec l'éducateur sur téléphone, ordinateur et tablette familiale, code gardé par l'épouse ; notifications sportives désactivées ; toujours actif en 09/2026. | o66, o67, o75
e126 | therapeutic_psycho / Consultations de tabacologie IDE | 2026-01-13 → en cours | Consultations de tabacologie (01/2026, 02/2026, 05/2026 annulée puis reportée, 10/2026) ; CO 18, 16 puis 2 ppm. | o68, o70, o72, o76
e127 | life_event / Révélation du jeu par l'épouse | 2023-01 → 2023-01 | Janvier 2023 : l'épouse révèle le jeu, les dettes et un suivi antérieur ; vécu comme une catastrophe puis une libération, avant la période la plus grave. | o69
e128 | life_event / Recherche d'emploi | 2025-05 → 2025-09-01 | Deux entretiens d'embauche en mai 2025 (un en seconde étape), RDV manqué pour un entretien à Libourne en juin, promesse d'embauche en juillet. | o61, o62, o63
e129 | life_event / Emploi de commercial sédentaire (CDI) | 2025-09-01 → en cours | CDI dans une PME de matériel agricole à Libourne dès le 01/09/2025 ; période d'essai validée fin 12/2025 ; refuse une soirée de bienvenue et un poste itinérant par prudence ; peur de « redevenir le commercial d'avant ». | o63, o64, o66, o73, o75
e130 | life_event / Décès du père | 2026-07-16 | Père décédé le 16/07/2026 à Pau ; obsèques le 20/07. | o74, o75

Observations (ordre chronologique) :

### o1 — 2021-01-12 — Entretien téléphonique (IDE)
Entretien téléphonique du 12/01/2021 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 12/01/2021 à 14:05
Appel de M. [PATIENT]
41 ans, qui demande un RDV "pour la cocaïne, et un peu l'alcool aussi". Très poli,
débit rapide, dit appeler depuis sa voiture entre deux clients. Explique que sa femme a trouvé "un sachet" dans sa veste
juste avant [PERSONNE_1]
et lui a dit que c'était "la dernière fois". A reçu aussi un avertissement de son employeur en décembre
(RDV client manqué). Pas de traitement en cours. Pas d'idées noires exprimées.
RDV médical donné le 18/01 à 17h30 avec le Dr [SOIGNANT_2]
(il ne peut pas en journée). Tél : [TEL]

### o2 — 2021-01-18 — Observation médicale d'entrée (Psychiatre addictologue)
Observation médicale d'entrée du 18/01/2021 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 18/01/2021 à 20:12
Observations :
Première consultation. M. [PATIENT]
41 ans, cadre commercial (responsable grands comptes dans une société de
distribution de matériel médical), marié, deux enfants, vient de lui-même sur l'insistance de son épouse. Arrive en
costume, directement du travail, très à l'aise au début, un peu dans la séduction, puis plus touché quand on parle des
enfants.
Motif : "Je veux arrêter la coke avant de tout perdre." Deux déclencheurs récents : son épouse a trouvé de la cocaïne
dans sa veste à la mi-décembre et lui a posé un ultimatum ; avertissement écrit de son employeur en décembre 2020 pour
un rendez-vous manqué avec un client important ("j'étais pas en état, j'avais fait la nuit"). Demande "quelque chose pour
l'envie", et que sa femme ne soit pas mise au courant de tout.
Histoire de la consommation de cocaïne :
- Première prise vers 25 ans, en soirée, avec des amis de son ancienne équipe commerciale, "pour tenir la nuit". Usage
festif ensuite, le week-end, une fois par mois puis presque tous les week-ends pendant plusieurs années, toujours sniffée,
"jamais autrement", toujours en groupe.
- Changement net "il y a six ou sept ans", au moment de sa promotion comme cadre : usage en semaine, seul, pour "tenir
le rythme" et "être brillant en rendez-vous". Prises dans la voiture ou aux toilettes avant les réunions. Impossibilité de
s'arrêter une fois le sachet ouvert, consomme jusqu'à épuisement du produit, nuits blanches, "descentes" très pénibles le
lendemain avec irritabilité et tristesse.
- Actuellement 3 à 4 g par semaine, 4 jours sur 7 environ, achetés par l'intermédiaire d'un contact, environ 70 euros le
gramme. Maximum : "5 ou 6 g" sur un week-end.
- Arrêts : "deux ou trois fois quelques semaines", seul, sans aide. Dit n'avoir jamais consulté pour cela, ni psychiatre ni
addictologue ("c'est la première fois que je parle de ça à quelqu'un").
- Jamais injectée, jamais fumée selon lui. Pas de partage de paille "depuis longtemps".
- Journée type d'un jour de consommation : première ligne vers 10 h dans la voiture avant le premier rendez-vous, puis
toutes les deux heures environ, déjeuner client arrosé, retour tardif "pour que les enfants soient couchés", whisky pour
dormir, 3 à 4 heures de sommeil. Les lendemains : fatigue, irritabilité, "je ne supporte personne", parfois arrêt de travail
d'un jour qu'il dit "pour migraine".
- Budget : "entre 800 et 1 000 euros par mois", payés sur ses primes, "je gagne bien, ce n'est pas un problème d'argent".
Pas de dette selon lui.
- Retentissement : tensions conjugales depuis plusieurs années, son épouse a découvert la cocaïne une première fois "il y
a longtemps" et il avait promis d'arrêter ; il pense que son épouse "ne sait pas tout" sur les quantités. Il a conduit sous
cocaïne et sous alcool "très souvent", jamais contrôlé, "pas d'accident".
Alcool : premières ivresses vers 15 ans. Consommation "sociale" importante dans le métier (repas d'affaires, salons).
Depuis deux à trois ans, consommation quotidienne de 4 à 6 verres (vin, whisky le soir), davantage les soirs de cocaïne
("l'alcool pour redescendre"), jusqu'à une bouteille de vin et plusieurs whiskys. Pas de consommation matinale, pas de
tremblements, pas d'antécédent de sevrage compliqué.
Tabac : depuis 16 ans, 15 à 20 cigarettes par jour, plus les soirs de cocaïne. Pas de tentative d'arrêt.
Cannabis : au lycée, arrêt vers 20 ans. Pas d'autre produit (ni MDMA, ni opiacés, ni médicaments détournés).
Jeu : "Je ne joue pas, à part un loto de temps en temps."
Antécédents psychiatriques : aucun selon lui. Pas d'hospitalisation, pas de traitement psychotrope, pas de tentative de
suicide. Décrit des périodes de "coup de mou" après les week-ends de consommation. Toujours été "speed", "j'ai besoin
que ça bouge".
Antécédents somatiques : appendicectomie à 12 ans. Pas d'antécédent cardiaque, "jamais allé aux urgences de ma vie",
pas d'épistaxis. Dit dormir 4 à 5 heures par nuit.
Antécédents familiaux : père "qui aimait bien les courses", pas d'alcoolisme connu. Pas d'antécédent psychiatrique familial
connu.
Biographie : né à Pau, aîné de deux enfants (une sœur, [PROCHE_1]
qui vit à Eysines). Parents séparés quand il avait 14 ans,
"sans plus", il est resté avec sa mère. Scolarité "correcte", bac puis BTS commercial. Commercial dans plusieurs
entreprises puis entré en 2006 dans l'entreprise actuelle, cadre depuis plusieurs années, bien payé, objectifs "énormes".
Marié depuis 2009 avec [PERSONNE_2]
infirmière scolaire ; deux enfants, [PERSONNE_3]
9 ans et [PERSONNE_4]
6 ans. Propriétaires d'une
maison à Saint-Médard-en-Jalles. Pas d'antécédent judiciaire. Permis de conduire valide, roule beaucoup pour son travail
(40 000 km/an).
Examen : bonne présentation, contact chaleureux, logorrhée modérée, discours cohérent. Humeur plutôt neutre, anxiété à
l'évocation du couple. Pas d'idée suicidaire. Pas d'élément psychotique, pas d'épisode de persécution sous produit
rapporté. TA 142/88, FC 92. Pas de lésion nasale visible à l'inspection simple.
Critères DSM-5 : trouble de l'usage de la cocaïne sévère (7 critères : perte de contrôle, envie persistante d'arrêter et
échecs, temps passé, craving, retentissement professionnel, poursuite malgré les problèmes conjugaux, consommation
en situation dangereuse au volant). Trouble de l'usage de l'alcool d'intensité moyenne (4 critères). Tabagisme.
Ce qu'il attend : "des outils", "un médicament si ça existe", "que ça reste entre nous vis-à-vis du travail". Inquiétude sur la
confidentialité vis-à-vis de l'employeur (mutuelle d'entreprise) : rassuré. Il dit ne pas pouvoir envisager d'arrêt de travail ni
d'hospitalisation, "on est en pleine période de renouvellement des contrats".
Entretien complémentaire sur le mode de vie : sport "avant", football en club jusqu'à 30 ans, plus rien depuis. Alimentation
irrégulière, saute souvent le déjeuner les jours de consommation. Pas de traitement en cours, pas d'automédication par
benzodiazépines ou somnifères, "parfois un Doliprane pour la tête". Pas d'allergie connue.
Facteurs de protection : enfants, épouse "qui ne lâche pas", emploi, absence d'antécédent judiciaire. Facteurs de
vulnérabilité : pression professionnelle, déplacements fréquents avec nuits à l'hôtel, réseau d'amis consommateurs, accès
facile au produit, revenus élevés.
Motivation : stade de la préparation selon Prochaska ; il a déjà supprimé une partie des contacts de son téléphone "hier
soir". Il demande s'il existe "un traitement de substitution comme pour l'héroïne" : information donnée sur l'absence de
traitement validé, sur l'intérêt des approches psychothérapeutiques et sur la gestion des descentes.
Conclusions :
Trouble de l'usage de la cocaïne sévère, usage d'alcool associé, tabagisme. Demande d'aide sincère mais très liée à
l'ultimatum de l'épouse. Hyperactivité et impulsivité notées à l'entretien, à réévaluer à distance.
Projet : arrêt de la cocaïne, objectif de réduction de l'alcool (pas plus de 2 verres par jour, pas d'alcool les jours de
semaine). Pas de traitement médicamenteux d'emblée. Bilan biologique (NFS, BHC, GGT, CDT, sérologies
VIH/VHC/VHB), recherche urinaire de toxiques, ECG. Proposition de suivi psychologique (Mme [SOIGNANT_4]
et d'un
entretien IDE. RDV dans 15 jours avec l'interne puis avec moi.

### o3 — 2021-01-26 — Observation IDE (IDE)
Observation IDE du 26/01/2021 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 26/01/2021 à 17:48
M. [PATIENT]
vu pour le bilan et un entretien. Très pressé, a pris sur sa pause déjeuner, téléphone qui sonne tout le
temps, je lui ai demandé de le couper, il a bien rigolé. Prise de sang faite, urines remises : cocaïne positive (dit avoir
consommé samedi). ECG fait : RAS d'après moi, transmis au médecin.
AUDIT 17. Il dit qu'il va "arrêter jeudi, c'est décidé, j'ai prévenu personne". Je lui ai expliqué les descentes, le sommeil,
l'appétit qui revient. Numéros utiles donnés.

### o4 — 2021-02-02 — Observation psychiatrique de suivi (Interne)
Observation psychiatrique de suivi du 02/02/2021 (Urgence : Bas)
Validé par [SOIGNANT_5]
- Interne le 02/02/2021 à 18:40
Observations :
Vu ce jour (interne, supervisé par le Dr [SOIGNANT_2]
Rappel : TU cocaïne sévère depuis la promotion professionnelle, début de la cocaïne vers 23 ans en soirée, alcool 4-6
verres/j, tabac 15-20 cig/j.
Dit ne plus avoir consommé de cocaïne depuis jeudi 28/01. Craving important le soir et en voiture "aux endroits où
j'achetais". Sommeil très perturbé les premières nuits, hypersomnie le week-end, irritabilité avec les enfants.
Alcool : 2-3 verres le soir, "pas plus".
Bilan : GGT 78, CDT normale, sérologies négatives. ECG normal, QTc 412.
Il a parlé de sa démarche à son épouse, qui "attend de voir". Au travail, personne n'est au courant. Il dit avoir moins
d'appétit pour le travail et plus pour la nourriture.
Conclusions :
Arrêt de la cocaïne depuis le [NE(E) EN 2021]
Stratégies vis-à-vis du craving (trajets modifiés, numéro du contact supprimé : à faire).
Pas de traitement. RDV psychologue le 16/02. RDV 15 j.

### o5 — 2021-02-16 — Entretien psychologique (Psychologue)
Entretien psychologique du 16/02/2021 (Urgence : Bas)
Validé par [SOIGNANT_4]
- Psychologue le 17/02/2021 à 09:20
Premier entretien. M. [PATIENT]
arrive en avance, s'excuse de "faire perdre du temps", puis parle beaucoup et vite, saute
d'un sujet à l'autre. Il décrit sa vie comme "une course permanente" : objectifs, primes, classement des commerciaux
affiché chaque lundi. La cocaïne lui a permis pendant des années "d'être celui qu'on attend", drôle, infatigable.
Il parle de son épouse avec admiration et un peu de crainte ("elle, elle est droite"). Il dit avoir honte vis-à-vis de ses
enfants, surtout de [PERSONNE_3]
"qui commence à comprendre quand je suis bizarre".
Peu de choses sur son enfance : "rien de spécial, mes parents se sont séparés, mon père était souvent sur les routes". Il
change de sujet quand j'évoque son père.
Il dit que l'arrêt "se passe bien", mais décrit des soirées où il ne sait pas quoi faire de lui-même, tourne en rond, "je mets le
foot à la télé et je regarde mon téléphone".
Bonne alliance, demande de travail centrée sur "comprendre pourquoi j'ai besoin de toujours plus".
Proposition : entretiens tous les 15 jours.
Il dit aussi qu'il "ne s'est jamais posé", qu'il a toujours eu besoin de remplir chaque minute, déjà enfant.

### o6 — 2021-03-02 — Observation IDE (IDE)
Observation IDE du 02/03/2021 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 02/03/2021 à 18:10
RDV médical non honoré ce jour. Appel au patient : en séminaire à Toulouse, avait oublié de prévenir. RDV redonné le
16/03.

### o7 — 2021-03-16 — Observation psychiatrique de suivi (Interne)
Observation psychiatrique de suivi du 16/03/2021 (Urgence : Bas)
Validé par [SOIGNANT_5]
- Interne le 16/03/2021 à 19:02
Observations :
Vu ce jour
Abstinent de cocaïne depuis 7 semaines, urines négatives. Craving en diminution, surtout le jeudi soir ("c'était le jour").
Alcool réduit : pas d'alcool en semaine "sauf exception", 3-4 verres le samedi.
Sommeil meilleur, 6 h par nuit. Ambiance plus détendue à la maison selon lui.
Au travail : "les chiffres baissent un peu, je suis moins rapide".
Il a repris la course à pied deux fois par semaine, "pour remplacer". Il a supprimé le numéro de son contact et changé
d'itinéraire le jeudi.
Conclusions :
Poursuite de l'abstinence. Pas de traitement.
RDV avec le Dr [SOIGNANT_2]
en avril (fin de mon semestre).

### o8 — 2021-04-20 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 20/04/2021 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 20/04/2021 à 20:30
Observations :
Vu ce jour
Abstinence de cocaïne maintenue depuis le 28/01. Tabac inchangé, 15 cig/j. Alcool le week-end.
Se plaint de difficultés de concentration au travail, oublis, "je n'arrive plus à finir un dossier". Évoque l'idée que la cocaïne
"l'aidait à se concentrer". À explorer à distance de l'arrêt.
Thymie correcte, pas d'idée noire.
Il rapporte une soirée professionnelle avec de l'alcool sans cocaïne, "première fois depuis des années", vécue comme une
victoire. Le couple va "mieux", sorties en famille le week-end.
Conclusions :
Poursuite du suivi psychologique.
RDV 2 mois.

### o9 — 2021-06-15 — Entretien psychologique (Psychologue)
Entretien psychologique du 15/06/2021 (Urgence : Bas)
Validé par [SOIGNANT_4]
- Psychologue le 15/06/2021 à 18:50
Séance centrée sur le travail. M. [PATIENT]
a "raté" son trimestre, son manager lui a fait une remarque devant l'équipe.
Colère, puis effondrement : "sans la coke je suis un commercial moyen". Il fait le lien avec le besoin de reconnaissance,
l'idée qu'il ne vaut que par ses résultats.
Il évoque les vacances d'août au Cap Ferret avec des amis "qui consomment" et dit qu'il a "peur et envie à la fois".
Travail sur un plan pour les vacances (qui prévenir, comment partir d'une soirée).

### o10 — 2021-09-07 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 07/09/2021 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 07/09/2021 à 20:05
Observations :
Vu ce jour
Rechute de cocaïne pendant les vacances, "vers le 15 août", au Cap Ferret, lors d'une soirée arrosée chez des amis :
"une trace, puis toute la nuit". Plusieurs prises pendant la semaine suivante. Depuis la rentrée, "une ou deux fois" le
week-end, environ 1 g à chaque fois. Rien au travail selon lui.
Alcool : binge les soirs de cocaïne (vin puis whisky), sinon 1-2 verres.
L'épouse n'est pas au courant de la reprise. Culpabilité ++.
Il dit avoir "baissé la garde" après six mois sans produit : "je pensais que j'étais guéri". La soirée s'est faite chez un ancien
collègue, le produit circulait, il n'a pas pu partir. Il a consommé ensuite seul deux soirs de la même semaine, "pour finir ce
qu'on m'avait laissé".
Travail : pas d'impact pour l'instant.
Conclusions :
Rechute de la cocaïne mi-août 2021 après 6 mois et demi d'abstinence, usage de week-end depuis.
Analyse de la rechute. Le patient refuse d'en parler à son épouse "pour l'instant".
RDV 1 mois, IDE dans 15 jours.

### o11 — 2021-09-21 — Observation IDE (IDE)
Observation IDE du 21/09/2021 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 21/09/2021 à 17:55
Entretien IDE avec M. [PERSONNE_5]
Urines positives cocaïne (samedi dernier, il le dit sans difficulté). Tension 138/86. Me
parle surtout de la rentrée des enfants, [PERSONNE_4]
est en CP, il est fier, a montré les photos. Fume toujours autant, 15-20/j,
"pas le moment".

### o12 — 2021-11-09 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 09/11/2021 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 09/11/2021 à 19:40
Observations :
Vu ce jour
Usage de cocaïne stabilisé selon lui à 2-3 soirées par mois, toujours en week-end, 1 à 1,5 g. Alcool en binge ces soirs-là
(jusqu'à 8-10 verres), sinon peu.
A fini par en parler à son épouse en octobre, "elle l'a mal pris mais elle reste".
Travail : objectifs à nouveau atteints. Sommeil 5 h.
Thymie : neutre, quelques "descentes" tristes le dimanche. Pas d'idée suicidaire. Sommeil court. Il trouve la
psychothérapie utile, "je vois mieux les pièges".
Conclusions :
Usage festif de week-end, pas de reprise de l'usage en semaine.
Proposition d'intégrer le groupe de prévention de la rechute animé par M. [SOIGNANT_6]
(éducateur) à partir de janvier :
accepte.
RDV janvier.

### o13 — 2021-12-14 — Entretien téléphonique (IDE)
Entretien téléphonique du 14/12/2021 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 14/12/2021 à 11:30
Appel du patient pour décaler son RDV psychologue (déplacement à Paris pour un salon). RDV redonné en janvier. Rien
de particulier signalé.

### o14 — 2022-01-11 — Observation éducateur (Éducateur spécialisé)
Observation éducateur du 11/01/2022 (Urgence : Bas)
Validé par [SOIGNANT_6]
- Éducateur spécialisé le 11/01/2022 à 16:30
Entretien d'accueil avant le groupe "prévention de la rechute" (8 séances de janvier à juin, le mardi soir).
M. [PATIENT]
se présente comme "pas tout à fait comme les autres, moi je bosse", puis rectifie en riant. Je lui explique
le fonctionnement (confidentialité, présence, pas de jugement). Il dit consommer "un peu" le week-end, objectif "zéro en
semaine, et réduire le reste".
Situations à risque citées : fins de mois avec les primes, déplacements à l'hôtel, matchs de foot entre collègues. Il dit
adorer le foot, "je suis tous les championnats".
Inscrit, première séance le 18/01.

### o15 — 2022-02-08 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 08/02/2022 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 08/02/2022 à 20:15
Observations :
Synthèse après un an de suivi.
Rappel du parcours : M. [PATIENT]
42 ans, cadre commercial, marié, deux enfants. Cocaïne depuis l'âge de 25 ans
(2004), festive pendant une dizaine d'années, puis usage en semaine, solitaire et professionnel depuis sa promotion de
2014, avec perte de contrôle ; 3 à 4 g par semaine à l'entrée en janvier 2021. Alcool associé (4-6 verres/j à l'entrée, binge
les soirs de cocaïne). Tabac 15-20 cig/j depuis l'âge de 16 ans. Pas d'antécédent psychiatrique, pas de suivi antérieur.
Venu après un avertissement professionnel (décembre 2020) et l'ultimatum de son épouse.
Évolution sur l'année : arrêt de la cocaïne le [NE(E) EN 2021]
abstinence de six mois et demi, rechute mi-août 2021 pendant
les vacances, puis usage de week-end, 2 à 3 fois par mois, 1 à 1,5 g, avec binge d'alcool. Pas de reprise de l'usage
professionnel. Réduction de l'alcool en semaine. Tabac inchangé.
Suivi psychologique régulier depuis février 2021 (Mme [SOIGNANT_4]
bonne alliance. Groupe de prévention de la rechute
depuis janvier 2022, assidu aux trois premières séances.
Plainte persistante de difficultés de concentration, d'impatience, de désorganisation au travail, présentes "depuis toujours"
mais masquées par la cocaïne selon lui. À explorer (TDAH ? effet de l'arrêt ?), pas d'évaluation formelle pour l'instant.
Thymie stable. Pas d'idée suicidaire. Couple fragile mais "ça tient".
Examen : TA 136/84. Pas d'épistaxis signalée.
Entourage : épouse informée depuis octobre de la rechute de l'été, soutien "à distance". Enfants scolarisés à
Saint-Médard, [PERSONNE_3]
en CM2, [PERSONNE_4]
en CP. Le patient décrit une vie "à cent à l'heure", sport abandonné, sommeil
court (5 h), beaucoup de temps sur son téléphone le soir.
Biologie de janvier : GGT 52, CDT normale. Urines : positives deux fois sur cinq contrôles en 2021 (septembre,
novembre).
Tabac : refuse encore d'aborder l'arrêt, "une chose à la fois".
Il n'évoque pas de difficulté financière ni d'autre conduite addictive (jeu non exploré en détail : "pronostics entre
collègues"). Il souhaite à terme "un usage festif contrôlé", objectif que je ne valide pas mais que nous discutons : risques
de reprise de l'usage professionnel, rappel des antécédents de perte de contrôle.
Conclusions :
TU cocaïne sévère en rémission partielle (usage de week-end). TU alcool d'intensité moyenne, amélioré. Tabagisme.
Poursuite du suivi mensuel, du groupe et de la psychothérapie. Aborder à nouveau le tabac.
RDV mars.

### o16 — 2022-03-15 — Entretien psychologique (Psychologue)
Entretien psychologique du 15/03/2022 (Urgence : Bas)
Validé par [SOIGNANT_4]
- Psychologue le 15/03/2022 à 18:55
M. [PATIENT]
arrive tendu : réorganisation annoncée dans son entreprise, un nouveau directeur régional "qui veut faire du
chiffre". Il parle de sa peur d'être "mis au placard" à 42 ans.
Il dit consommer "beaucoup moins", seulement en soirée, mais reconnaît avoir pensé à "une petite trace" avant une
réunion la semaine dernière, "pour la première fois depuis un an". Il ne l'a pas fait.
Il parle d'un sentiment de vide le soir, qu'il remplit "avec le téléphone, les matchs, les vidéos". Quand je l'interroge sur ce
qu'il fait sur son téléphone, il répond "rien de spécial, des résultats, des vidéos".
Travail sur les signaux d'alerte et sur ce qu'il pourrait dire à son épouse quand il va mal. Il trouve le groupe "utile mais un
peu scolaire".

### o17 — 2022-03-22 — Observation éducateur (Éducateur spécialisé)
Observation éducateur du 22/03/2022 (Urgence : Bas)
Validé par [SOIGNANT_6]
- Éducateur spécialisé le 22/03/2022 à 22:10
Groupe n°5. M. [PATIENT]
présent, assez dissipé, beaucoup de blagues, coupe la parole. Sur le thème "les pensées
permissives" il donne l'exemple de la "petite trace méritée après un gros contrat". Quand un participant parle de dettes, il
se ferme et regarde son téléphone. Je lui en fais la remarque à la pause : "c'était le score du match".

### o18 — 2022-04-05 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 05/04/2022 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 05/04/2022 à 20:40
Observations :
RDV non honoré. Message laissé sur le répondeur. Pas de nouvelles du patient à 20h.
Conclusions :
Rappel par l'IDE demain.

### o19 — 2022-05-03 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 03/05/2022 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 03/05/2022 à 19:55
Observations :
Vu ce jour (RDV manqué d'avril : "réunion tardive")
Reprise d'un usage de cocaïne en semaine depuis début avril : soirées seul à l'hôtel lors de déplacements puis "le mardi
et le jeudi", y compris au travail avant des rendez-vous. Estime à 3 g par semaine. Pression commerciale (réorganisation,
nouveau directeur régional).
Alcool : 4-5 verres le soir, de nouveau quotidien.
Épistaxis répétées depuis quelques semaines, croûtes nasales.
Il dit que la reprise s'est faite "par paliers" : une prise à l'hôtel lors d'un séminaire début avril, puis une deuxième la
semaine suivante "pour un rendez-vous important", puis l'habitude revenue. Il ne l'a pas dit à son épouse. Sommeil 4 h,
perte d'appétit.
Conclusions :
Rechute d'un usage sévère depuis avril 2022.
Proposition d'arrêt de travail : refusée ("ce serait pire"). Consultation ORL demandée. Rappel des risques
cardiovasculaires.
RDV dans 15 jours.

### o20 — 2022-06-14 — Observation éducateur (Éducateur spécialisé)
Observation éducateur du 14/06/2022 (Urgence : Bas)
Validé par [SOIGNANT_6]
- Éducateur spécialisé le 14/06/2022 à 17:15
Entretien individuel de fin de groupe (il a manqué 3 séances sur 8).
Il dit que le groupe l'a aidé "à voir ses excuses". Il reconnaît avoir "replongé" depuis avril.
En fin d'entretien, à propos d'un autre participant qui fume du crack, il me dit à voix basse qu'il a "fait de la base" lui aussi,
au printemps 2019, avec un collègue de l'époque : la cocaïne cuisinée et fumée à la pipe, "plusieurs week-ends de suite,
peut-être cinq ou six". Il a arrêté parce que "ça m'a fait peur, je n'ai jamais eu autant envie de recommencer tout de suite".
Il n'en avait jamais parlé, "ni au docteur ni à ma femme", et me demande si c'est "grave que ce ne soit pas dans le
dossier". Je lui dis que je le transmets au Dr [SOIGNANT_2]
il est d'accord.
Évoque aussi, en passant, les pronostics de foot avec les collègues, "on met des petits billets".
Proposition : poursuivre en individuel avec moi une fois par mois en plus du suivi médical. Accepte.
Il dit qu'il a "toujours aimé ce qui va vite et ce qui fait peur".

### o21 — 2022-06-28 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 28/06/2022 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 28/06/2022 à 20:20
Observations :
Vu ce jour
Usage de cocaïne en semaine persistant, 3 jours sur 7, "un peu moins depuis 15 jours". Alcool quotidien.
Consultation ORL le 20/06 : perforation de la cloison nasale d'environ 1 cm, soins locaux, arrêt impératif du sniff. Le
patient est inquiet ("ça m'a calmé").
Reprise avec lui de l'usage de cocaïne fumée au printemps 2019 confié à M. [SOIGNANT_6]
: le confirme, "cinq ou six
week-ends", jamais depuis.
Il dit que le travail "devient compliqué", objectifs non atteints, sentiment d'être surveillé. Thymie : irritabilité, pas de
tristesse marquée, pas d'idée suicidaire.
Conclusions :
Perforation septale. TU cocaïne sévère en rechute.
Proposition d'un sevrage hospitalier : refusé. Rappel de la réduction des risques (pas de partage de paille, sérum
physiologique).
Courrier demandé au médecin traitant (Dr [SOIGNANT_7]
pour les antécédents.
RDV 15 jours.

### o22 — 2022-07-12 — Observation médicale (Psychiatre addictologue)
Observation médicale du 12/07/2022 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 12/07/2022 à 18:00
Observations :
Courrier reçu ce jour du Dr [SOIGNANT_7]
médecin traitant, en réponse à ma demande :
- suivi du patient depuis 2008 ;
- "M. [PATIENT]
a consulté en 2015 le Dr [SOIGNANT_8]
addictologue libéral à Bordeaux, à qui je l'avais adressé pour une
consommation de cocaïne ; il a été suivi environ six mois et avait arrêté" ;
- en 2016, "état dépressif réactionnel après l'arrêt de la cocaïne", traité par paroxétine 20 mg pendant trois mois, bonne
évolution ;
- pas d'autre antécédent notable, appendicectomie.
Revu brièvement avec le patient au téléphone : confirme le suivi de 2015 ("je l'avais zappé, ou j'avais pas envie d'en
parler") et une abstinence "de huit mois à peu près" en 2015-2016. Minimise l'épisode de 2016 ("un coup de fatigue").
Conclusions :
Correction des antécédents : suivi addictologique libéral en 2015 avec abstinence de huit mois ; épisode dépressif en
2016 traité par paroxétine. Ces éléments avaient été niés à l'entrée.

### o23 — 2022-09-13 — Observation IDE (IDE)
Observation IDE du 13/09/2022 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 13/09/2022 à 18:35
Vu pour entretien, en retard d'une heure. Fatigué, amaigri (-5 kg depuis juin d'après notre balance). Urines positives
cocaïne. Dit "3-4 jours par semaine, je sais". Absences au travail ces derniers temps, son chef l'a convoqué. Saignements
de nez moins fréquents. Je lui reparle de l'hospitalisation, il dit "après la rentrée des enfants". Transmis au Dr

### o24 — 2022-10-04 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 04/10/2022 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 04/10/2022 à 20:10
Observations :
Vu ce jour
[SOIGNANT_2]
Convoqué à un entretien préalable à licenciement le 29/09 : retards, absences non justifiées, chiffres en chute, "on m'a dit
que je sentais l'alcool à une réunion". Attend la décision. Colère contre son directeur, peu de critique.
Cocaïne : 3-4 jours par semaine, 3 à 4 g. Alcool 5-6 verres/j.
Thymie : irritable, sommeil 4 h, pas d'idée suicidaire.
Épouse "à bout", parle de séparation.
Il reconnaît que des clients se sont plaints de rendez-vous annulés au dernier moment. Il parle de "complot" de son
directeur, puis concède : "j'étais pas là, même quand j'étais là".
Conclusions :
TU cocaïne sévère, usage quotidien d'alcool.
Nouvelle proposition d'hospitalisation : "pas maintenant". Proposition d'un arrêt de travail : accepte un arrêt de 15 jours.
RDV 15 jours.

### o25 — 2022-11-22 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 22/11/2022 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 22/11/2022 à 19:30
Observations :
Vu ce jour
Licenciement notifié par courrier hier, 21/11/2022, pour insuffisance professionnelle. Préavis non effectué. Dit être
"soulagé et terrifié". Inscription à Pôle emploi prévue.
Cocaïne : poursuite, 3 g par semaine environ. Alcool quotidien.
Projette de "se remettre en forme avant de chercher".
Il dit qu'il n'en a pas encore parlé à ses enfants. Son épouse, informée, "ne dit plus rien". Il évoque le besoin de "rentrer de
l'argent vite", sans préciser.
Thymie : anxieuse, sommeil 4 h, pas d'idée suicidaire.
Conclusions :
Perte d'emploi. Orientation vers l'assistante sociale (Mme [SOIGNANT_9]
pour les droits.
RDV 1 mois.

### o26 — 2022-12-13 — Entretien téléphonique (IDE)
Entretien téléphonique du 13/12/2022 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 13/12/2022 à 10:45
Appel du patient, très tendu. Contrôlé par la gendarmerie samedi soir (10/12) au retour d'un repas : dépistage salivaire
positif à la cocaïne et alcool à 0,6 g/L. Permis suspendu, il attend la décision de la préfecture (il parle de 6 mois).
"Comment je vais chercher du travail sans voiture." Me demande une attestation de suivi, je lui dis de la demander au Dr
[SOIGNANT_2] à son RDV. Pas d'idées noires exprimées. Transmis.

### o27 — 2022-12-20 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 20/12/2022 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 20/12/2022 à 19:45
Observations :
Vu ce jour
Arrêté préfectoral reçu : suspension du permis de conduire pour 6 mois à compter du contrôle du 10/12/2022, restitution
conditionnée à un avis favorable de la commission médicale et à des analyses. Attestation de suivi remise.
Le patient dit que le contrôle l'a "réveillé" : pas de cocaïne depuis, alcool "deux ou trois verres". Très anxieux, insomnie,
ruminations sur l'argent ("le chômage, ce n'est pas mon salaire"), sans plus de précision. Tendu quand j'évoque son
budget.
Pas d'idée suicidaire. Fêtes de fin d'année prévues chez sa sœur.
Conclusions :
Suspension de permis depuis le 10/12/2022. TU cocaïne sévère, abstinence de 10 jours.
RDV fin janvier, IDE disponible pendant les fêtes.

### o28 — 2023-01-17 — Entretien téléphonique (Psychiatre addictologue)
Entretien téléphonique du 17/01/2023 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 17/01/2023 à 13:20
Observations :
Appel de Mme [PERSONNE_2]
épouse du patient, qui demande à me parler. Information donnée sur le secret
médical : je l'écoute sans lui transmettre d'information sur le suivi.
Elle a découvert la semaine dernière, en cherchant un document pour Pôle emploi, des relevés bancaires d'un compte
qu'elle ne connaissait pas et des courriers de relance de plusieurs organismes de crédit. Elle parle de "quatre crédits
renouvelables au moins" et de virements réguliers vers des sites de paris sportifs en ligne, "des centaines d'euros par
semaine, depuis des années". Elle dit qu'elle savait pour la cocaïne mais "pas ça", qu'il lui a menti "sur tout", et qu'elle va
lui demander de quitter la maison.
Elle s'inquiète pour lui : "il dit que de toute façon il ne vaut rien". Je l'encourage à appeler le 15 en cas d'inquiétude
immédiate et lui donne le numéro du 3114.
Conclusions :
Information d'un tiers : jeu d'argent (paris sportifs en ligne) et dettes cachées, jamais évoqués par le patient en deux ans
de suivi.
RDV avancé avec le patient : appel au patient, vient le 24/01.

### o29 — 2023-01-24 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 24/01/2023 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 24/01/2023 à 20:45
Observations :
Vu ce jour, à ma demande après l'appel de son épouse.
Le patient arrive défait, mal rasé, s'excuse longuement. Il reconnaît d'emblée le jeu : "Je savais qu'un jour ça sortirait."
Histoire du jeu : paris sportifs en ligne depuis 2017, d'abord sur le foot "pour pimenter les matchs", avec des collègues,
quelques dizaines d'euros. Augmentation progressive, puis nette au premier confinement en 2020 ("je n'avais plus que ça,
et la coke"). Paris sur tous les sports, paris en direct, plusieurs comptes sur différents sites, la nuit. Mises de 200 à 500
euros, "des fois 2 000 sur un week-end". Chasse aux pertes, mensonges, emprunts. Gains importants au début ("j'ai
touché 6 000 une fois, c'est ça qui m'a eu").
Lien avec la cocaïne : "les deux allaient ensemble", paris la nuit sous cocaïne, cocaïne pour "tenir" après les pertes.
Dettes : crédits renouvelables souscrits depuis 2019 à l'insu de son épouse, un prêt personnel, découvert. Il dit "une
vingtaine de mille", sans pouvoir donner de chiffre précis.
ICJE : 21/27.
Situation : son épouse lui a demandé de partir, il a quitté la maison vendredi 20/01, hébergé chez sa sœur [PROCHE_1]
à
Eysines. Voit les enfants le mercredi.
Cocaïne : reprise après les fêtes, 2 à 3 fois par semaine, "moins qu'avant faute d'argent". Alcool : 4-6 verres/j. Permis
suspendu depuis décembre.
Thymie : tristesse marquée, honte, anhédonie, insomnie, perte d'appétit. Idées de mort passives ("ce serait plus simple
pour tout le monde"), pas de projet, critiquées, facteurs de protection : enfants, sœur.
Il dit avoir caché le jeu "parce que la coke, au moins, vous saviez quoi en faire". Il décrit des nuits entières sur les
applications, les résultats en direct, l'impossibilité de s'arrêter quand il perdait, les mensonges à son épouse (relevés
détournés, compte ouvert dans une autre banque). Il pense que le jeu "a tout aggravé" au travail : manque de sommeil,
retards, téléphone en réunion.
Il dit que les sites lui offraient des "bonus" et des "paris remboursés", qu'un conseiller VIP l'appelait quand il ne jouait plus
pendant quelques jours. Il estime avoir perdu "plus de 60 000 euros" en cinq ans, gains déduits, sans certitude. Il n'a
jamais joué au casino ni au PMU, "ça c'était mon père".
Conclusions :
Jeu d'argent pathologique (paris sportifs en ligne) sévère, révélé ce jour, avec endettement. TU cocaïne sévère, TU alcool.
Symptomatologie dépressive.
RDV avec l'AS (Mme [SOIGNANT_9]
dès la semaine prochaine pour les dettes. Information sur l'interdiction volontaire de
jeux (ANJ). Numéro du 3114. Pas d'antidépresseur pour l'instant, réévaluation dans 15 jours. Psychologue maintenue.

### o30 — 2023-01-31 — Observation sociale (Assistante sociale)
Observation sociale du 31/01/2023 (Urgence : Bas)
Validé par [SOIGNANT_9]
- Assistante sociale le 02/02/2023 à 10:15
Entretien à la demande du Dr [SOIGNANT_10]
M. [PATIENT]
arrive avec une pochette de courriers non ouverts "pour la
première fois".
Situation administrative : licencié le 21/11/2022 (insuffisance professionnelle), inscrit à Pôle emploi, ARE ouverte (environ
3 100 €/mois), indemnité de licenciement en partie déjà utilisée ("pour boucher des trous").
Logement : propriétaire avec son épouse d'une maison à Saint-Médard-en-Jalles, crédit immobilier en commun (1 150
€/mois). Hébergé depuis le 20/01 chez sa sœur, cherche un studio.
Endettement (premier recensement, à compléter) :
- 4 crédits renouvelables : 9 800 €, 7 200 €, 6 500 €, 4 900 € ;
- prêt personnel de 2021 : 8 300 € restant dû ;
- découvert : 1 400 € ;
soit environ 38 000 € hors crédit immobilier. Mensualités cumulées supérieures à 1 600 €.
Il me dit que son épouse "ne connaît pas la moitié des montants".
Permis de conduire suspendu (contrôle du 10/12/2022), en attente de la commission médicale.
Démarches proposées : demande d'interdiction volontaire de jeux auprès de l'ANJ (formulaire rempli avec lui ce jour),
courriers aux organismes pour suspension, constitution d'un dossier de surendettement auprès de la Banque de France
quand la situation de logement sera claire, information sur l'aide juridictionnelle en cas de procédure de séparation.
Prochain RDV dans 3 semaines avec tous les relevés.
Revenus : ARE seule ; son épouse assure seule le crédit immobilier depuis le départ du patient. Pension pour les enfants
non encore fixée, il verse "ce qu'il peut".
Il a signé ce jour un mandat pour que je contacte la Banque de France si nécessaire.
Il me dit avoir aussi emprunté de l'argent à des collègues, remboursé depuis, et "jamais à la famille". Il refuse pour l'instant
de contacter son épouse au sujet du budget commun.

### o31 — 2023-02-14 — Entretien psychologique (Psychologue)
Entretien psychologique du 14/02/2023 (Urgence : Bas)
Validé par [SOIGNANT_4]
- Psychologue le 14/02/2023 à 18:30
M. [PATIENT]
revient sur ces deux années pendant lesquelles il "jouait la comédie" ici aussi. Il dit qu'il avait plus honte du
jeu que de la cocaïne : "la coke, c'est presque glamour dans mon milieu, le jeu c'est minable".
Il décrit le pari en direct comme "le seul moment où je ne pensais à rien" ; une excitation qu'il compare à la première trace.
Il pleure en parlant de [PERSONNE_4]
qui lui a demandé pourquoi il "habitait chez tata".
Il parle pour la première fois de son père : "lui aussi aimait bien parier", puis s'arrête et dit qu'il n'a pas envie d'aller là
aujourd'hui.
Pas d'idée suicidaire exprimée ce jour.

### o32 — 2023-03-07 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 07/03/2023 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 07/03/2023 à 20:00
Observations :
Vu ce jour
A emménagé le 01/03 dans un studio à Mérignac [ADRESSE]
Voit ses enfants un week-end sur deux
chez sa sœur.
Thymie : tristesse quotidienne depuis janvier, anhédonie, aboulie, insomnie de milieu de nuit, perte de 6 kg, ruminations
de culpabilité ; idées de mort passives intermittentes, sans projet. Plus de deux mois d'évolution malgré la diminution des
consommations.
Jeu : plus de pari depuis fin janvier selon lui, interdiction ANJ en cours.
Cocaïne : 1 à 2 fois par semaine, "quand je suis seul le soir". Alcool 3-5 verres/j.
Il dit avoir honte de recevoir ses enfants dans un studio. Il passe ses journées "à rien", ne cherche pas encore de travail. Il
a reçu la confirmation que sa demande d'interdiction de jeux est en cours d'instruction.
Conclusions :
Épisode dépressif caractérisé d'intensité moyenne depuis janvier 2023.
Introduction d'escitalopram 10 mg/j. 3114 rappelé. RDV 1 mois, IDE dans 15 jours.

### o33 — 2023-03-21 — Observation IDE (IDE)
Observation IDE du 21/03/2023 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 21/03/2023 à 17:40
Entretien IDE. Dit prendre l'escitalopram "presque tous les jours", nausées les premiers jours. TA 131/82. Studio "triste
mais calme". Rien d'autre de particulier. Rappel RDV médical du 11/04.

### o34 — 2023-04-09 — compte rendu de passage aux urgences (médecin urgentiste)
[ETABLISSEMENT_1] - SERVICE DES URGENCES
Compte rendu de passage aux urgences
Patient
Né le
N° de séjour [DOSSIER]
Adresse
Personne à prévenir
Mme [PERSONNE_8]
(sœur), [TEL]
Médecin
Dr [SOIGNANT_15]
A.
Arrivée le 09/04/2023 à 01:40 - Sortie le 10/04/2023 à 11:30 (UHCD)
Motif : idées suicidaires dans un contexte d'intoxication alcoolique et de prise de cocaïne. Amené par les
sapeurs-pompiers, alertés par sa sœur qui a reçu des SMS d'adieu vers 0h30. Retrouvé à son domicile, habillé, des
clés de deux-roues à la main.
Histoire : homme de 43 ans, séparé depuis 3 mois, sans emploi depuis novembre, suivi au CSAPA de
l'établissement (Dr [SOIGNANT_2]
Consommation de cocaïne depuis l'âge de 30 ans selon le patient, "presque tous
les jours" depuis le début de l'année. Ce soir : environ 2 g de cocaïne sniffée entre 20h et 23h et une bouteille de
whisky entière, seul, après une dispute téléphonique avec son épouse. Dettes de jeu importantes.
Antécédents : aucun antécédent médical selon le patient, premier passage aux urgences. Pas d'antécédent de
tentative de suicide. Épisode dépressif depuis janvier : escitalopram 10 mg prescrit en mars, arrêté par le patient
depuis une quinzaine de jours. Tabac 15 cig/j. Permis de conduire suspendu depuis décembre.
Examen : patient conscient, Glasgow 15, haleine œnolique, mydriase bilatérale réactive, agitation modérée. TA
158/96, FC 112, T 37,4 °C, SpO2 98 %. Pas de douleur thoracique, pas de déficit neurologique. Pas de lésion
traumatique ni de trace de scarification.
ECG : tachycardie sinusale à 112/min, pas de trouble de la repolarisation. Troponine négative à H0 et H3.
Alcoolémie 1,92 g/L à 02:30. Dépistage urinaire : cocaïne positive, cannabis, opiacés, benzodiazépines négatifs.
Paracétamolémie et salicylémie négatives.
Évaluation psychiatrique (le 09/04 à 10h, après dégrisement) : humeur dépressive, désespoir, culpabilité centrée sur
les dettes et la séparation. Idées suicidaires avec scénario précis : se jeter du pont d'Aquitaine, avait pris les clés du
scooter d'un voisin. Pas de passage à l'acte grâce à l'appel de sa sœur. Ambivalence, critique partielle au réveil.
Pas d'élément psychotique.
Prise en charge : surveillance scopée, hydratation, oxazépam 20 mg, surveillance UHCD 24 h. Entretien avec la
sœur. Réévaluation le 10/04 : pas d'idée suicidaire active, accepte un hébergement chez sa sœur et un
rendez-vous au CSAPA dès demain ; hospitalisation en addictologie à discuter avec son psychiatre.
Conclusion : crise suicidaire avec scénario, intoxication aiguë alcool (1,92 g/L) et cocaïne. Épisode dépressif,
traitement interrompu. Sortie vers le domicile de sa sœur, RDV au CSAPA le 11/04/2023 avec le Dr [SOIGNANT_2]
Numéro du 3114 remis.
Dr A. [SOIGNANT_15]

### o35 — 2023-04-11 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 11/04/2023 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 11/04/2023 à 18:50
Observations :
Vu ce jour en urgence, au retour d'un passage aux urgences de notre établissement ce week-end, sorti de l'UHCD hier
(CR des urgences à récupérer).
Le patient raconte une soirée seul dans son studio samedi, "beaucoup de coke et pas mal de whisky", après un appel
difficile avec son épouse au sujet de la vente de la maison. Il a envoyé des messages à sa sœur, qui a appelé les
secours. Il parle d'idées de mort "comme d'habitude, sans plus", "je ne voulais pas vraiment le faire", et dit ne pas avoir eu
de projet précis. Il dit prendre l'escitalopram "régulièrement".
Sa sœur, présente à la fin de l'entretien avec son accord, dit qu'il lui avait écrit "pardon pour tout, je vais aller faire un tour
sur le pont".
Thymie très basse, pleurs, désespoir, honte ; risque suicidaire jugé élevé dans le contexte (isolement, dettes, perte
d'emploi, séparation, intoxications répétées).
Il décrit les jours précédents : nuits sans sommeil, paris "dans la tête" alors qu'il ne joue plus, cocaïne 3 soirs sur 7 depuis
mars, whisky tous les soirs. Il se sent "un poids pour tout le monde". Il ne sait pas dire combien il a consommé samedi.
Examen : contact correct, ralentissement, pleurs, pas d'élément psychotique, pas de signe de sevrage à ce stade. TA
138/90, FC 96.
Conclusions :
Crise suicidaire au décours d'une intoxication cocaïne-alcool. EDC.
Hospitalisation proposée dans l'unité d'addictologie, acceptée : entrée directe ce jour. Sevrage de l'alcool (oxazépam
selon protocole), arrêt de la cocaïne, surveillance du risque suicidaire.

### o36 — 2023-04-13 — Observation infirmière (Infirmier(ère))
Observation infirmière du 13/04/2023 (Urgence : Bas)
Validé automatiquement le 14/04/2023 à 06:00 par [SOIGNANT_11]
Nuit. Pt [PATIENT]
reveille a 2h, ne trouve pas le sommeil, demande a parler. Dit avoir "tres envie" de coke, transpire,
tachycarde 98. Parle de samedi : "j'avais les cles du scooter de mon voisin, j'allais au pont d'Aquitaine", sa soeur l'a
appele avant. Pleure. Pas d'idee suicidaire actuelle exprimee, "ici ca va". Oxazepam 10mg en si besoin donne a 2h15.
Dort a 3h. Transmis a l'equipe de jour et au medecin.

### o37 — 2023-04-18 — Observation médicale de suivi (Psychiatre addictologue)
Observation médicale de suivi du 18/04/2023 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 18/04/2023 à 17:30
Observations :
J7 d'hospitalisation. Sevrage d'alcool sans complication, oxazépam en décroissance. Craving de cocaïne intense les
premiers jours, en baisse. Dort mieux.
CR des urgences récupéré : arrivée le 09/04 à 1h40, alcoolémie 1,92 g/L, urines positives cocaïne ; idées suicidaires avec
scénario rapportées aux urgences (pont d'Aquitaine), confirmées par le patient à l'IDE de nuit. Le CR indique aussi un
arrêt de l'escitalopram depuis une quinzaine de jours : le patient le reconnaît finalement ("j'avais l'impression que ça ne
servait à rien").
Pas d'idée suicidaire depuis l'entrée, plan de sécurité rédigé avec lui.
Substituts nicotiniques (patch 21 mg) bien tolérés.
Conclusions :
Reprise de l'escitalopram à 15 mg/j. Préparation de la sortie : suivi rapproché, psychologue, AS. Contact avec sa sœur
pour l'hébergement les premiers jours.

### o38 — 2023-04-27 — Observation médicale de sortie (Psychiatre addictologue)
Observation médicale de sortie du 27/04/2023 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 27/04/2023 à 12:30
Observations :
Hospitalisation du 11/04/2023 au 27/04/2023 dans l'unité d'addictologie, à la suite d'un passage aux urgences le 09/04
(intoxication cocaïne et alcool, crise suicidaire).
Sevrage de l'alcool sous oxazépam sans complication, arrêt le 21/04. Abstinence de cocaïne depuis le 09/04. Craving en
nette baisse.
Thymie : amélioration partielle, sommeil réparateur, plus d'idée suicidaire, se projette (enfants, dossier de surendettement,
recherche d'emploi). Plan de sécurité remis.
Tabac : patch 21 mg, 5 cig/j.
Entretien familial le 25/04 avec son épouse, à la demande du patient : elle ne souhaite pas reprendre la vie commune
pour l'instant mais "reste là pour les enfants". Le patient l'accepte.
Bilan biologique de sortie : GGT 61, ASAT/ALAT normales, sérologies négatives.
Conclusions :
Sortie ce jour, hébergé quelques jours chez sa sœur puis retour au studio.
Traitement : escitalopram 15 mg/j, patch nicotinique 21 mg/24h.
Suivi : Dr [SOIGNANT_2]
dans 15 jours, psychologue hebdomadaire pendant un mois, AS, IDE. Courrier au Dr [SOIGNANT_7]

### o39 — 2023-05-16 — Entretien psychologique (Psychologue)
Entretien psychologique du 16/05/2023 (Urgence : Bas)
Validé par [SOIGNANT_4]
- Psychologue le 16/05/2023 à 18:45
Reprise après l'hospitalisation. M. [PATIENT]
est plus posé, parle moins vite. Il dit avoir "touché le fond sur ce pont, même
si je n'y suis pas allé".
Il a reçu la confirmation de son interdiction de jeux (effective début mai) : "c'est bizarre, c'est un soulagement". Il a
supprimé les applications de son téléphone devant sa sœur.
Travail sur la honte et sur la place des enfants. Il souhaite écrire une lettre à son épouse pour "tout dire, une fois".
Il demande que les séances restent hebdomadaires jusqu'à l'été.

### o40 — 2023-06-13 — Observation sociale (Assistante sociale)
Observation sociale du 13/06/2023 (Urgence : Bas)
Validé par [SOIGNANT_9]
- Assistante sociale le 15/06/2023 à 09:50
Entretien de suivi.
Dossier de surendettement déposé à la Banque de France le 08/06/2023 avec mon aide. Montant déclaré après relevés
complets : 41 500 € de dettes non immobilières (deux créanciers supplémentaires retrouvés, dont un crédit en ligne).
Interdiction volontaire de jeux effective depuis le 02/05/2023 (courrier de l'ANJ apporté).
Séparation : pas de procédure de divorce engagée pour l'instant, "on fait une pause". La maison n'est finalement pas mise
en vente.
En reprenant l'historique du prêt auto pour le dossier, M. [PATIENT]
me dit qu'en novembre 2020 il a "planté la voiture
de fonction contre un muret" en rentrant d'une soirée sous cocaïne, sans blessé, et qu'il avait déclaré à l'assurance et à
son employeur un "chevreuil sur la route". Il n'en avait jamais parlé ici. Je l'encourage à en parler au Dr [SOIGNANT_2]
Permis : commission médicale le 27/06.
Prochain RDV en septembre (recevabilité).
Il dit aussi n'avoir "jamais rien déclaré à personne" et avoir payé lui-même les réparations du véhicule "en liquide".
Budget prévisionnel établi avec lui : ARE 3 100 €, loyer du studio 590 €, participation au crédit immobilier 575 €, pension
pour les enfants 300 €, charges courantes ; reste à vivre insuffisant pour faire face aux mensualités des crédits.

### o41 — 2023-06-27 — Observation IDE (IDE)
Observation IDE du 27/06/2023 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 27/06/2023 à 17:20
RDV IDE annulé par le patient ce matin : convocation à un atelier Pôle emploi. Reporté en juillet. Il dit au téléphone que
"tout va bien, pas de rechute".

### o42 — 2023-07-11 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 11/07/2023 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 11/07/2023 à 20:15
Observations :
Vu ce jour
Abstinent de cocaïne depuis le 09/04 (3 mois), urines négatives à chaque contrôle. Alcool : 1 à 2 verres le week-end, rien
en semaine. Pas de jeu.
Permis récupéré début juillet après avis favorable de la commission médicale.
Thymie : nette amélioration, sommeil correct, a repris le sport (course à pied), recherche d'emploi active.
Évoque l'accident de voiture de novembre 2020 sous cocaïne confié à l'AS : le confirme, "j'aurais pu tuer quelqu'un".
Tabac : 5-8 cig/j, patch arrêté fin juin.
Il a postulé à plusieurs offres, sans retour. Relation apaisée avec son épouse, ils se voient pour les enfants et "parlent
vraiment".
Conclusions :
Rémission précoce cocaïne. EDC en amélioration. Escitalopram 15 mg poursuivi.
RDV septembre.

### o43 — 2023-09-12 — Entretien psychologique (Psychologue)
Entretien psychologique du 12/09/2023 (Urgence : Bas)
Validé par [SOIGNANT_4]
- Psychologue le 12/09/2023 à 18:40
M. [PATIENT]
annonce qu'il a commencé avec son épouse une thérapie de couple chez une conseillère conjugale en
libéral, "une idée à elle". Première séance "très dure", elle a dit devant lui tout ce qu'elle avait découvert. Il dit qu'il a "enfin
tout entendu sans fuir".
Il a passé l'été à courir, a perdu sa "panse de commercial", ne boit presque plus. Les enfants ont passé deux semaines
avec lui chez sa sœur.
Il évoque à nouveau les difficultés de concentration, "maintenant que je suis clean je vois que ce n'était pas que la coke".
Il parle aussi de son père, malade et loin, avec qui il n'a "plus grand-chose à se dire".
Poursuite tous les 15 jours.

### o44 — 2023-09-26 — Observation sociale (Assistante sociale)
Observation sociale du 26/09/2023 (Urgence : Bas)
Validé par [SOIGNANT_9]
- Assistante sociale le 26/09/2023 à 11:00
Dossier de surendettement déclaré recevable par la commission le 14/09/2023. Suspension des poursuites. Orientation
probable vers des mesures imposées (pas de bien saisissable hors résidence principale). M. [PATIENT]
est rassuré. Il
dit avoir commencé avec son épouse une thérapie de couple en libéral ce mois-ci.
Prochain point au printemps ou à réception de la décision.

### o45 — 2023-10-10 — Entretien psychologique (Psychologue)
Entretien psychologique du 10/10/2023 (Urgence : Bas)
Validé par [SOIGNANT_4]
- Psychologue le 10/10/2023 à 19:05
Séance importante. M. [PATIENT]
revient de lui-même sur son père. [PERSONNE_6]
représentant en vins, "toujours sur les
routes", jouait : tiercé et quinté au PMU tous les jours, puis le casino de Biarritz le samedi soir. [PATIENT]
l'accompagnait
parfois au PMU, enfant, "c'était nos moments à nous". Dettes, huissiers ; la maison familiale a été saisie l'année de ses 14
ans et sa mère est partie avec les deux enfants, c'est là la séparation des parents. Il dit qu'il s'était juré "de ne jamais être
comme lui" et qu'il s'est retrouvé "avec les mêmes lettres recommandées sur la table".
Il évoque aussi l'école : "j'étais le gamin qui ne tenait pas en place", souvent puni, un redoublement, un renvoi de quelques
jours au collège. Il dit qu'il a toujours eu du mal à finir ce qu'il commence, à attendre, qu'il perd tout.
Je lui fais part de l'intérêt d'une évaluation d'un éventuel trouble de l'attention, déjà évoqué par le Dr [SOIGNANT_2]
Il est
demandeur.
Transmis au médecin.
Il dit qu'il comprend mieux pourquoi il a "toujours eu besoin d'un truc qui va vite". Il fait le lien entre le PMU de son enfance
et l'excitation des paris en direct, "c'était le même bruit dans la tête".
Il n'a pas revu son père depuis plusieurs années, ne souhaite pas le revoir pour l'instant.
Il se souvient des "jours de tiercé gagnant" où son père revenait avec des cadeaux, et des soirs où il ne revenait pas. Sa
mère lui disait de ne jamais "parler des courses" à l'école. Il pleure pendant une partie de la séance, puis dit qu'il se sent
"plus léger".

### o46 — 2023-11-07 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 07/11/2023 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 07/11/2023 à 20:30
Observations :
Vu ce jour
Abstinent de cocaïne depuis 7 mois. Alcool 2-3 verres le week-end. Pas de jeu, interdiction respectée, il dit ne pas avoir
cherché à la contourner.
Thymie normalisée depuis environ un mois : plaisir retrouvé, sommeil 7 h, projets. EDC en rémission.
Thérapie de couple en cours depuis septembre, rapprochement avec son épouse, ils envisagent un retour à la maison
"après les fêtes".
Éléments rapportés à la psychologue : père joueur pathologique (PMU, casino), saisie de la maison familiale et séparation
des parents à ses 14 ans ; difficultés scolaires et agitation dans l'enfance. Plainte attentionnelle persistante malgré 7 mois
d'abstinence.
Plan de surendettement en cours d'instruction. Recherche d'emploi : formation envisagée.
Conclusions :
Évaluation d'un TDAH de l'adulte à organiser avec l'interne (Dr [SOIGNANT_12]

### o47 — 2023-11-28 — Observation psychiatrique de suivi (Interne)
: ASRS, DIVA, recueil auprès de la mère,
bulletins scolaires.
Escitalopram 15 mg poursuivi.
Observation psychiatrique de suivi du 28/11/2023 (Urgence : Bas)
Validé par [SOIGNANT_13]
- Interne le 28/11/2023 à 19:50
Observations :
Vu ce jour pour évaluation TDAH (1re consultation)
Rappel : patient de 44 ans suivi depuis 01/2021 pour TU cocaïne sévère (début vers 25 ans, usage professionnel depuis
2014), abstinent depuis 04/2023 ; jeu pathologique (paris sportifs en ligne depuis la coupe du monde 2018) avec
surendettement ; EDC en 2023 avec crise suicidaire ; licencié en 11/2022.
ASRS v1.1 : 6/6 items de la partie A positifs.
Enfance (selon le patient) : "pile électrique", bavard, oublis permanents, affaires perdues, devoirs jamais finis,
redoublement de la 5e, renvoi de 3 jours en 4e pour s'être battu, punitions fréquentes. Scolarité "sauvée" au lycée par le
sport. Pas de bilan à l'époque.
Adulte : désorganisation, procrastination, impulsivité (achats, paroles, conduite), recherche de sensations, ennui rapide,
retards. Compensation au travail par l'hyperactivité et, depuis 25 ans, par la cocaïne ("ça me mettait droit").
DIVA 2.0 débutée : critères d'inattention 7/9 à l'âge adulte.
Thymie : euthymique, sommeil 7 h, pas de symptôme dépressif résiduel. Pas d'épisode d'élation spontanée en dehors des
produits.
Consommations actuelles : pas de cocaïne depuis le 09/04, alcool 2 verres le samedi, pas de jeu. Tabac 8 cig/j.
Conclusions :
Forte suspicion de TDAH. Poursuite de la DIVA au prochain RDV. Contact de la mère (accord du patient) et bulletins
scolaires si possible.

### o48 — 2023-12-12 — Entretien téléphonique (Interne)
Entretien téléphonique du 12/12/2023 (Urgence : Bas)
Validé par [SOIGNANT_13]
- Interne le 12/12/2023 à 14:10
Observations :
Entretien téléphonique avec Mme [PERSONNE_7]
mère du patient, avec l'accord de ce dernier.
Décrit un enfant "adorable mais épuisant", qui "ne tenait pas cinq minutes à table", "toujours dans la lune en classe",
cahiers mal tenus, nombreux mots des enseignants dès le CP. Redoublement de la 5e "à cause du bazar à la maison"
(dettes de son mari, huissiers). Renvoi temporaire en 4e après une bagarre. Elle cite un bulletin de CM2 : "intelligent mais
ne se concentre pas".
Elle confirme spontanément le jeu de son ex-mari : "il a tout perdu aux courses, la maison aussi", séparation en 1993. Elle
s'inquiète d'avoir appris que [PATIENT]
a fait pareil".
Elle enverra des bulletins scolaires si elle les retrouve.
Conclusions :
Hétéro-anamnèse en faveur de symptômes de TDAH présents dans l'enfance, avant 12 ans.

### o49 — 2024-01-09 — Observation psychiatrique de suivi (Interne)
Observation psychiatrique de suivi du 09/01/2024 (Urgence : Bas)
Validé par [SOIGNANT_13]
- Interne le 09/01/2024 à 20:00
Observations :
Vu ce jour (2e consultation TDAH)
Est rentré vivre à la maison avec son épouse et les enfants le 06/01/2024. "On recommence doucement." Thérapie de
couple poursuivie.
Fin de la DIVA 2.0 : inattention 7/9 et hyperactivité-impulsivité 6/9 à l'âge adulte ; inattention 8/9 et hyperactivité-impulsivité
7/9 dans l'enfance, concordant avec l'hétéro-anamnèse maternelle et deux bulletins scolaires (CM2, 5e) apportés par le
patient. Retentissement professionnel, conjugal, financier.
Pas d'épisode maniaque ou hypomane retrouvé ; les épisodes d'excitation sont liés à la cocaïne.
Abstinent de cocaïne depuis 9 mois. Pas de jeu. Alcool réduit.
Diagnostics différentiels discutés : effets résiduels de la cocaïne (peu probable après 9 mois d'abstinence et symptômes
présents dans l'enfance), trouble anxieux, trouble de l'humeur (EDC en rémission). Pas de contre-indication psychiatrique
au méthylphénidate ; vigilance sur le risque de mésusage compte tenu des antécédents.
Conclusions :
TDAH de l'adulte, présentation combinée (validé avec le Dr [SOIGNANT_2]
Discussion d'un traitement par méthylphénidate : ECG préalable, interrogatoire cardiovasculaire, TA, poids. RDV avec le
Dr [SOIGNANT_2]
en février.

### o50 — 2024-02-06 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 06/02/2024 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 06/02/2024 à 20:25
Observations :
Vu ce jour avant introduction éventuelle d'un psychostimulant.
ECG du 30/01 : rythme sinusal, 72/min, QTc 418, pas d'anomalie. TA 128/80. Poids 79 kg.
À l'interrogatoire cardiovasculaire détaillé, le patient rapporte, après une hésitation, un passage aux urgences de la
Polyclinique fictive de Mérignac en 2017 pour une douleur thoracique "en barre" survenue après une nuit de cocaïne :
ECG et troponine "normaux" selon lui, sorti le matin avec le conseil de "voir un cardiologue", ce qu'il n'a pas fait. Il dit qu'il
n'en avait jamais parlé, à l'entrée il avait dit n'être "jamais allé aux urgences", "par honte, j'avais menti aux urgentistes sur
la coke aussi".
Pas d'autre épisode de douleur thoracique, pas de palpitation, pas de malaise. Pas de mort subite familiale.
Le patient dit qu'il a "fait le ménage dans tous les mensonges", et qu'il ne pense pas qu'il en reste. Il comprend la
nécessité de l'avis cardiologique, "même si j'ai hâte".
Conclusions :
Antécédent de douleur thoracique sous cocaïne aux urgences en 2017, jusqu'ici non connu.
Avis cardiologique demandé avant le méthylphénidate. RDV après la consultation.

### o51 — 2024-03-05 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 05/03/2024 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 05/03/2024 à 19:50
Observations :
Vu ce jour
Consultation de cardiologie le 26/02 : échographie cardiaque et épreuve d'effort normales, pas de contre-indication au
méthylphénidate, surveillance TA et fréquence.
Abstinent de cocaïne depuis 11 mois, de jeu depuis janvier 2023. Alcool : 2 verres le week-end.
Information détaillée : risque de mésusage faible avec la forme LP, ordonnance sécurisée, délivrance fractionnée, contrôle
TA/poids.
Le patient dit attendre beaucoup du traitement, "peut-être trop". Rappel que le traitement ne remplace pas le suivi
psychologique.
Conclusions :
Introduction du méthylphénidate LP 18 mg le matin, augmentation prévue à 36 mg dans un mois selon tolérance.
Escitalopram 15 mg poursuivi. IDE dans 3 semaines.

### o52 — 2024-04-16 — Observation psychiatrique de suivi (Interne)
Observation psychiatrique de suivi du 16/04/2024 (Urgence : Bas)
Validé par [SOIGNANT_13]
- Interne le 16/04/2024 à 19:35
Observations :
Vu ce jour
Méthylphénidate LP 18 mg depuis le 05/03 : amélioration partielle de l'organisation, effet qui s'estompe en début
d'après-midi. Bonne tolérance (TA 128/80, FC 78, poids 78 kg).
Pas de craving de cocaïne accru, pas de jeu. Recherche d'emploi : formation de remise à niveau en gestion commerciale.
Conclusions :
Augmentation à 36 mg/j. Ordonnance sécurisée 28 j.
Dernier RDV avec moi (fin de semestre). RDV Dr [SOIGNANT_2]
en juin.

### o53 — 2024-05-21 — Observation sociale (Assistante sociale)
Observation sociale du 21/05/2024 (Urgence : Bas)
Validé par [SOIGNANT_9]
- Assistante sociale le 22/05/2024 à 10:30
Point surendettement. Décision de la commission reçue en mars 2024 : mesures imposées sur 7 ans (84 mois),
mensualité de 420 €, effacement partiel des intérêts, pas de nouveau crédit pendant la durée du plan, inscription au FICP.
M. [PATIENT]
a payé les deux premières échéances.
Retour au domicile conjugal depuis janvier : budget commun reconstruit avec son épouse, qui gère désormais les
comptes ("c'est mieux comme ça").
ARE jusqu'à l'été 2025. Formation de remise à niveau en cours, financée par France Travail.
Il me demande s'il doit déclarer son TDAH à un futur employeur : information donnée (pas d'obligation, RQTH possible
mais non souhaitée).
Prochain RDV à sa demande.

### o54 — 2024-06-18 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 18/06/2024 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 18/06/2024 à 20:10
Observations :
Vu ce jour
Méthylphénidate LP 36 mg : "le jour et la nuit", termine ses tâches, moins d'impulsivité verbale à la maison selon son
épouse. TA 132/84, FC 82, poids 77 kg. Sommeil correct.
Abstinent de cocaïne depuis 14 mois, pas de jeu. Alcool : 2-3 verres le samedi.
Thymie stable, euthymique.
Évoque la possibilité de réduire l'escitalopram : à rediscuter en fin d'année.
Il note aussi moins d'envie de jouer "même devant un match". Couple : thérapie poursuivie, "on se parle".
Conclusions :
Poursuite méthylphénidate LP 36 mg et escitalopram 15 mg.
RDV septembre.

### o55 — 2024-09-17 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 17/09/2024 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 17/09/2024 à 20:00
Observations :
Vu ce jour
Bonne rentrée familiale. Effet du méthylphénidate jugé insuffisant en fin de journée (retours de formation, devoirs des
enfants : "je redeviens une pile à 17h").
TA 130/82, FC 84, poids 77 kg. Pas de palpitation, pas de douleur thoracique.
Pas de cocaïne, pas de jeu. Alcool stable.
Conclusions :
Augmentation du méthylphénidate LP à 54 mg/j. Surveillance TA par l'IDE dans un mois.
RDV décembre.

### o56 — 2024-12-10 — Observation IDE (IDE)
Observation IDE du 10/12/2024 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 10/12/2024 à 17:35
Entretien IDE. TA 130/80, FC 82, poids 77 kg. Méthylphénidate 54 mg depuis septembre, bien supporté, il dit que la
formation se passe bien et qu'il a commencé à envoyer des candidatures. Urines négatives. Il est un peu inquiet pour les
fêtes : une soirée d'anciens collègues est prévue le 21, il hésite à y aller. On en a parlé, il a fait une liste de "plans de
sortie". Transmis.

### o57 — 2025-01-07 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 07/01/2025 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 07/01/2025 à 19:45
Observations :
Vu ce jour
Rechute de cocaïne le samedi 21/12/2024, lors d'une soirée d'anciens collègues de [MASQUE]
: "deux traces, et puis toute la
nuit", environ 1,5 g, avec beaucoup d'alcool. Rentré à 6 h, en a parlé lui-même à son épouse le lendemain. Pas de reprise
depuis, craving fort pendant une semaine. Pas de jeu, mais "j'ai eu envie de parier sur le match du lendemain, pour la
première fois depuis longtemps".
Pas de signe dépressif. Il en tire des leçons : "plus de soirées avec cette équipe".
Méthylphénidate LP 54 mg bien toléré, TA 130/80.
Il souhaite arrêter l'escitalopram, euthymique depuis plus d'un an.
Il ajoute qu'il ne voulait pas "laisser passer la soirée" pour ne pas paraître "malade" devant ses anciens collègues, et qu'il
était parti avec l'idée de ne boire que de l'eau.
Conclusions :
Rechute ponctuelle le 21/12/2024 (cocaïne, alcool), sans reprise.
Décroissance de l'escitalopram : 10 mg pendant un mois puis 5 mg, arrêt fin février.
RDV mars.

### o58 — 2025-03-04 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 04/03/2025 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 04/03/2025 à 20:40
Observations :
Synthèse après quatre ans de suivi.
Rappel : M. [PATIENT]
45 ans, ancien cadre commercial [MASQUE]
matériel médical), marié, deux enfants [PERSONNE_3]
13
ans, [PERSONNE_4]
10 ans). Suivi depuis janvier 2021.
Cocaïne : début vers 25 ans (2004) en contexte festif, usage professionnel et solitaire depuis 2014 avec perte de contrôle.
Premier suivi en libéral (Dr [SOIGNANT_8]
en 2015 avec 8 mois d'abstinence, nié à l'entrée et retrouvé dans le courrier du
médecin traitant en 2022. Douleur thoracique sous cocaïne aux urgences en 2017, révélée en 2024. Cocaïne fumée
quelques week-ends au printemps 2019. Au CSAPA : arrêt le [NE(E) EN 2021]
rechute à l'été 2021 puis usage de week-end,
nouvelle escalade d'avril 2022 à avril 2023 avec perforation septale (06/2022). Abstinence depuis l'hospitalisation d'avril
2023, une rechute ponctuelle le 21/12/2024.
Jeu : paris sportifs en ligne depuis 2017, majorés au confinement, révélés par l'épouse en janvier 2023, dettes de 41 500
€, interdiction ANJ depuis mai 2023, surendettement avec plan de 7 ans depuis mars 2024. Père joueur pathologique.
Alcool : usage quotidien associé jusqu'en avril 2023 (sevrage hospitalier), puis consommation modérée de week-end.
Psychiatrie : épisode dépressif en 2016 (paroxétine, médecin traitant) ; EDC de janvier à novembre 2023 avec crise
suicidaire et intoxication le 09/04/2023, hospitalisation du 11 au 27/04/2023 ; escitalopram de mars 2023, en cours d'arrêt.
TDAH de l'adulte, présentation combinée, diagnostiqué en janvier 2024 ; méthylphénidate LP depuis mars 2024, 54 mg
depuis septembre 2024.
Vie : licencié en décembre 2022 ; permis suspendu de décembre 2022 à juillet 2023 ; séparation du couple de janvier
2023 à janvier 2024, thérapie de couple ; chômage, formation.
Actuellement : escitalopram 5 mg, arrêt prévu dans 15 jours. Depuis le début février, "un verre ou deux tous les soirs" qui
deviennent souvent 4 ou 5 : candidatures sans réponse, fin des droits au chômage en vue, ennui. Pas de cocaïne ni de
jeu. Thymie correcte, un peu d'anxiété.
Tabac : 8-10 cig/j.
Entourage : épouse et enfants soutenants ; sœur toujours présente. Pas de procédure judiciaire en cours. Permis valide.
Traitements actuels : méthylphénidate LP 54 mg, escitalopram 5 mg. TA 130/82, FC 80, poids 77 kg.
Suivi : psychologue mensuelle (Mme [SOIGNANT_4]
depuis 2021, AS pour le plan de surendettement, IDE. Thérapie de
couple en libéral depuis septembre 2023, en cours d'espacement. Le patient est le premier à rappeler les éléments qu'il
avait tus : "j'ai mis deux ans à tout dire".
Perforation septale stable, pas d'épistaxis depuis 2023. Bilan cardiologique normal en février 2024.
Conclusions :
TU cocaïne en rémission prolongée. Jeu pathologique en rémission. TDAH traité. Reprise d'un usage quotidien d'alcool à
surveiller.
Arrêt de l'escitalopram fin mars. Bilan GGT/CDT. Discussion d'un traitement de réduction à la prochaine consultation.
RDV fin mars, IDE dans 15 jours.

### o59 — 2025-03-18 — Observation IDE (IDE)
Observation IDE du 18/03/2025 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 18/03/2025 à 17:50
Entretien IDE. Alcool : 4 à 5 verres de vin tous les soirs depuis début février, il a compté sur l'appli que je lui avais
conseillée, "ça fait 32 verres la semaine dernière, ça m'a fait un choc". Pas de verre le matin. GGT 64 (à 31 il y a un an),
CDT limite.
Il dit qu'il boit "parce qu'il s'ennuie et qu'il a peur de ne jamais retrouver de boulot". Sa femme lui a dit "je ne vais pas
revivre ça". Je lui ai parlé de la naltrexone, il veut en parler au Dr [SOIGNANT_2]
TA 136/86. Transmis.

### o60 — 2025-03-25 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 25/03/2025 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 25/03/2025 à 19:30
Observations :
Vu ce jour
Usage quotidien d'alcool depuis début février 2025, 4 à 5 verres/j, sans signe de dépendance physique. Objectif de
réduction.
Escitalopram arrêté comme prévu, pas de syndrome de sevrage, thymie stable.
Pas de cocaïne, pas de jeu.
Il dit que l'ennui est le principal déclencheur : journées vides, candidatures sans réponse. Son épouse s'inquiète, sans
conflit. Pas de consommation matinale, pas de tremblement.
Conclusions :
Introduction de naltrexone 50 mg/j, à prendre une heure avant la situation à risque (approche de réduction). Information
sur les opioïdes.
RDV avec l'interne en mai.

### o61 — 2025-05-20 — Observation psychiatrique de suivi (Interne)
Observation psychiatrique de suivi du 20/05/2025 (Urgence : Bas)
Validé par [SOIGNANT_14]
- Interne le 20/05/2025 à 19:40
Observations :
Vu ce jour (nouvel interne, 1re rencontre)
Rappel : TU cocaïne sévère en rémission (abstinent depuis 04/2023, 1 écart 12/2024), jeu pathologique (paris sportifs) en
rémission, TDAH sous méthylphénidate LP 54 mg, EDC 2023 en rémission, reprise alcool depuis 02/2025 sous
naltrexone.
Naltrexone prise "presque tous les jours", nausées la première semaine. Alcool : 2-3 verres certains soirs, 4 jours sur 7,
"jamais plus de 3", journal de consommation tenu.
Deux entretiens d'embauche ce mois-ci, dont un en seconde étape.
TA 128/82, FC 80.
Thymie euthymique depuis l'arrêt de l'escitalopram. Sommeil 6-7 h.
Conclusions :
Réduction nette de l'alcool. Poursuite naltrexone et méthylphénidate.
RDV juillet.

### o62 — 2025-06-17 — Observation IDE (IDE)
Observation IDE du 17/06/2025 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 17/06/2025 à 18:00
RDV non honoré. Message du patient en fin de journée : oubli, "j'étais à un entretien à Libourne". RDV redonné.
Ordonnance sécurisée de méthylphénidate renouvelée par le Dr [SOIGNANT_2]
envoyée par courrier à sa demande.

### o63 — 2025-07-08 — Entretien psychologique (Psychologue)
Entretien psychologique du 08/07/2025 (Urgence : Bas)
Validé par [SOIGNANT_4]
- Psychologue le 08/07/2025 à 18:40
Séance de bilan, à quatre ans et demi de suivi, à la demande de M. [PATIENT]
qui veut "espacer".
Il mesure le chemin : il y a deux ans il "dormait chez sa sœur avec des dettes partout", aujourd'hui il vit avec sa famille,
rembourse, a "compris comment il fonctionne".
Il parle du diagnostic de TDAH comme d'un "soulagement mêlé de colère" : il se demande ce qu'aurait été sa vie avec un
diagnostic à 10 ans, et pense à son père ("peut-être que lui aussi").
Il évoque l'alcool de ce printemps comme "le dernier produit qui restait", le relie à l'ennui.
Il vient d'obtenir une promesse d'embauche : commercial sédentaire dans une PME de matériel agricole à Libourne, CDI,
début au 1er septembre. Peur de "redevenir le commercial d'avant". Travail sur les limites (horaires, soirées clients, alcool
en salon).
Proposition : séances mensuelles à partir de la rentrée.

### o64 — 2025-09-09 — Observation psychiatrique de suivi (Interne)
Observation psychiatrique de suivi du 09/09/2025 (Urgence : Bas)
Validé par [SOIGNANT_14]
- Interne le 09/09/2025 à 20:05
Observations :
Vu ce jour
A commencé son nouvel emploi le 01/09/2025 (commercial sédentaire, CDI, période d'essai de 4 mois). Fatigué mais
content. Trajets en voiture 45 min.
A arrêté de lui-même la naltrexone à la mi-août, pendant les vacances, "je n'en avais plus besoin". Alcool : quelques
verres le week-end seulement depuis l'été.
Méthylphénidate LP 54 mg, efficace, TA 132/84. Appétit diminué le midi.
Pas de cocaïne, pas de jeu.
Il dit qu'il a refusé une soirée de bienvenue "par prudence" et qu'il ne parle pas de son parcours au travail.
Conclusions :
Arrêt de la naltrexone en août 2025 (initiative du patient), validé. Poursuite méthylphénidate.
RDV décembre avec le Dr [SOIGNANT_2]
(fin de mon semestre en octobre).

### o65 — 2025-10-14 — Entretien téléphonique (IDE)
Entretien téléphonique du 14/10/2025 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 14/10/2025 à 09:40
Appel de la pharmacie : le patient a présenté son ordonnance de méthylphénidate avec 5 jours de retard, la pharmacienne
demande si elle peut délivrer la totalité. Vu avec le Dr [SOIGNANT_2]
: oui, délivrance du reste de l'ordonnance
(chevauchement autorisé). Le patient dit avoir "oublié avec le boulot". Pas d'autre souci.

### o66 — 2025-12-02 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 02/12/2025 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 02/12/2025 à 20:20
Observations :
Vu ce jour
Bonne adaptation au nouveau poste, période d'essai "validée en fin de mois normalement", bons retours de son
responsable. Horaires tenus, pas de soirées clients.
Rechute du jeu en novembre : sur un site de paris étranger non couvert par l'interdiction ANJ, "trouvé par une pub sur un
réseau social", paris sur le foot pendant environ 10 jours, perte de 600 €. Il s'est arrêté seul après une nuit à "se refaire",
en a parlé à son épouse puis l'a dit spontanément ici. Honte, mais "je n'ai pas caché, c'est déjà ça".
Pas de cocaïne. Alcool : 2-3 verres le week-end.
Méthylphénidate LP 54 mg, TA 134/84, poids 74 kg (-3 kg depuis l'été). Il dit manger peu à midi.
Tabac : 10 cig/j, souhaite arrêter en janvier.
Il dit avoir été "piqué" par la publicité un soir de fatigue, après une journée difficile, en se disant "un seul pari, pour voir".
Conclusions :
Rechute brève du jeu en novembre 2025, arrêtée.
Logiciel de blocage des sites de jeux à installer sur ses appareils (voir avec M. [SOIGNANT_6]
Varénicline à prévoir en
janvier, RDV IDE tabacologie.
RDV mars.

### o67 — 2025-12-16 — Observation éducateur (Éducateur spécialisé)
Observation éducateur du 16/12/2025 (Urgence : Bas)
Validé par [SOIGNANT_6]
- Éducateur spécialisé le 16/12/2025 à 17:30
Entretien à la demande du Dr [SOIGNANT_2]
après l'épisode de jeu de novembre.
On a installé ensemble un logiciel de blocage des sites de jeux et de paris sur son téléphone, son ordinateur et la tablette
familiale ; son épouse garde le code. On a aussi désactivé les notifications des applis de résultats sportifs. Il rit : "je
redeviens un supporter normal".
Il me reparle du groupe de 2022, il dit qu'à l'époque il "jouait déjà tous les soirs" pendant que je lui parlais de la coke, et
qu'il pariait parfois pendant les pauses du groupe. Je lui dis que je m'en souviens, du "score du match".
Proposition : il peut me rappeler à tout moment en cas d'envie de jouer.

### o68 — 2026-01-13 — Observation IDE (IDE)
Observation IDE du 13/01/2026 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 13/01/2026 à 18:10
Consultation de tabacologie. Fume 10 à 12 cigarettes par jour depuis l'âge de 16 ans, plus en voiture et après les repas.
Fagerström 5. CO expiré 18 ppm. Plusieurs fois "presque arrêté" (patchs à l'hôpital en 2023) mais repris "dès que ça allait
mieux".
Motivation : ses enfants [PERSONNE_4]
lui cache ses paquets), le sport, "le dernier truc à régler".
Varénicline prescrite par le Dr [SOIGNANT_2]
: début ce jour, schéma de titration expliqué, date d'arrêt fixée au 20/01. Effets
indésirables expliqués (nausées, rêves). TA 132/84. Méthylphénidate inchangé.
RDV dans 3 semaines.

### o69 — 2026-02-10 — Entretien psychologique (Psychologue)
Entretien psychologique du 10/02/2026 (Urgence : Bas)
Validé par [SOIGNANT_4]
- Psychologue le 10/02/2026 à 19:00
Bilan psychologique, cinq ans de suivi, rédigé à la demande du Dr [SOIGNANT_2]
pour la synthèse d'équipe.
M. [PATIENT]
46 ans, est suivi en psychothérapie depuis février 2021, tous les 15 jours puis de façon hebdomadaire après
l'hospitalisation d'avril 2023, mensuelle depuis septembre 2025.
Pendant les deux premières années, le travail a porté sur la cocaïne et sur une image de soi entièrement adossée à la
performance professionnelle. Ce travail a été en partie faussé par ce qui n'était pas dit : le jeu, les dettes, un suivi
antérieur. Le patient le formule lui-même : "je vous racontais une version présentable". La révélation par son épouse en
janvier 2023 a été vécue comme une catastrophe puis comme une libération ; elle a précédé la période la plus grave
(épisode dépressif, crise suicidaire d'avril 2023).
À partir de l'automne 2023, l'histoire familiale a pu être abordée : un père joueur, des dettes, la saisie de la maison et la
séparation des parents à ses 14 ans, l'enfant qui accompagnait son père au PMU et vivait ces moments comme "nos
moments à nous". Le jeu à l'âge adulte prend sens dans cette loyauté et ce rejet mêlés. Le diagnostic de TDAH (janvier
2024) a permis une relecture moins culpabilisante de son parcours scolaire et de son besoin de stimulation, sans servir
d'excuse : "ça explique, ça n'efface pas".
Aujourd'hui : relation de couple réinvestie, place de père plus présente (il accompagne [PERSONNE_3]
au rugby), activité
professionnelle plus modeste mais stable, remboursement des dettes tenu. Les points de vulnérabilité restent l'ennui, la
honte qui pousse à cacher (l'épisode de jeu de novembre 2025 est le premier qu'il a dit d'emblée), et les situations de
"fête" liées à son ancienne vie professionnelle.
Il signale aujourd'hui avoir arrêté la varénicline au bout de quatre jours en janvier (nausées) et avoir "rechuté" sur la
cigarette le 22/01 ; il veut reprendre "avec un vrai rendez-vous".
Proposition : poursuite mensuelle, travail sur la prévention de la rechute à partir des situations de fête et sur le deuil
anticipé de son père, malade.
Sur le plan des consommations, il dit ne plus penser à la cocaïne "que dans les fêtes", n'a pas joué depuis novembre, boit
peu. Le tabac est le dernier objectif qu'il se fixe.
Points d'appui : un discours plus authentique, une capacité nouvelle à demander de l'aide (sa sœur, son épouse, l'équipe),
l'activité physique régulière. Le patient formule le souhait d'être "un jour un ancien patient", tout en disant qu'il veut "garder
un fil" avec le centre.

### o70 — 2026-02-17 — Observation IDE (IDE)
Observation IDE du 17/02/2026 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 17/02/2026 à 17:45
Revu en tabacologie. M. [PATIENT]
avoue qu'il avait arrêté la varénicline au bout de quelques jours en janvier à cause
des nausées, il n'a pas osé me le dire au téléphone. Reprise de la varénicline ce jour, à prendre au milieu du repas,
nouvelle date d'arrêt fixée au 20/02. CO 16 ppm. Il est motivé, a prévenu ses collègues. Transmis au Dr [SOIGNANT_2]

### o71 — 2026-03-17 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 17/03/2026 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 17/03/2026 à 20:00
Observations :
Vu ce jour
Arrêt du tabac depuis le 20/02/2026 sous varénicline (reprise le 17/02 après un premier essai interrompu en janvier).
Quelques envies, nausées légères.
Insomnie d'endormissement depuis l'hiver, appétit faible, poids 72 kg (79 kg en 2024). Sous méthylphénidate LP 54 mg,
efficacité jugée bonne mais "trop fort l'après-midi".
Pas de cocaïne depuis le 21/12/2024, pas de jeu depuis novembre. Alcool : week-end, 2 verres.
Son père, à Pau, a un cancer du poumon métastatique, il s'y rend un week-end sur deux.
Il dit que l'arrêt du tabac est "plus dur que la coke, parce que c'est partout". Il court trois fois par semaine.
Conclusions :
Diminution du méthylphénidate LP à 36 mg/j. Poursuite varénicline jusqu'à 12 semaines.
RDV juin.

### o72 — 2026-05-12 — Observation IDE (IDE)
Observation IDE du 12/05/2026 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 12/05/2026 à 10:20
RDV IDE annulé par le patient (déplacement professionnel). Dit au téléphone avoir fini la varénicline "il y a quelques
semaines", toujours sans tabac, "je cours deux fois par semaine". RDV reporté au mois de juin.

### o73 — 2026-06-23 — Observation sociale (Assistante sociale)
Observation sociale du 23/06/2026 (Urgence : Bas)
Validé par [SOIGNANT_9]
- Assistante sociale le 23/06/2026 à 11:20
Point annuel. Plan de surendettement respecté sans incident depuis mars 2024 (28 échéances de 420 € réglées). Salaire
stable depuis septembre 2025, période d'essai validée fin décembre 2025. Le couple a renégocié l'assurance du crédit
immobilier.
M. [PATIENT]
demande s'il peut solder le plan plus tôt avec une prime : information donnée sur la demande de révision
auprès de la commission. Pas de nouveau crédit souscrit.
Il va souvent à Pau voir son père, "ce n'est plus qu'une question de semaines".
Fin du suivi social régulier proposée, recontact possible à tout moment : d'accord.

### o74 — 2026-07-21 — Entretien téléphonique (Psychiatre addictologue)
Entretien téléphonique du 21/07/2026 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 21/07/2026 à 12:45
Observations :
Appel du patient : son père est décédé le 16/07/2026 à Pau. Obsèques hier. Il dit avoir eu "une envie énorme" de cocaïne
le soir, il a appelé sa sœur et est resté avec elle. Il a bu "pas mal de whisky" le soir des obsèques, "mais pas plus". Pas
d'idée suicidaire, se dit triste "mais pas comme en 2023".
Conclusions :
Deuil. Pas de reprise de cocaïne. RDV avancé à septembre au retour de vacances, psychologue en août, numéro du
3114 rappelé.

### o75 — 2026-09-15 — Observation psychiatrique de suivi (Psychiatre addictologue)
Observation psychiatrique de suivi du 15/09/2026 (Urgence : Bas)
Validé par [SOIGNANT_3]
- Psychiatre addictologue le 15/09/2026 à 20:10
Observations :
Vu ce jour
Deux mois après le décès de son père. Tristesse, souvenirs mêlés, il a trié avec sa sœur des papiers où il a trouvé des
reconnaissances de dettes de son père datant des années 1990, "ça m'a fait drôle". Pas de symptôme dépressif
caractérisé, sommeil correct.
Pas de cocaïne depuis le 21/12/2024. Pas de jeu, logiciel de blocage toujours actif. Alcool : 2 verres le samedi, une
alcoolisation le soir des obsèques. Tabac : abstinent depuis le 20/02.
Méthylphénidate LP 36 mg : bon équilibre, poids 75 kg, TA 128/80.
Travail : bonne année, prime de fin d'exercice, refuse un poste itinérant "pour ne pas retomber dans les hôtels".
Il évoque l'idée d'espacer les rendez-vous, "mais pas de les arrêter". Il souhaite garder la psychologue une fois par mois.
Conclusions :
TU cocaïne en rémission prolongée. Jeu en rémission. TU alcool en rémission. Tabac en sevrage. TDAH équilibré.
Poursuite du méthylphénidate LP 36 mg. RDV tous les 3 mois.

### o76 — 2026-10-13 — Observation IDE (IDE)
Observation IDE du 13/10/2026 (Urgence : Bas)
Validé par [SOIGNANT_1]
- IDE le 13/10/2026 à 18:00
Entretien IDE de suivi. TA 126/80, FC 76, poids 75 kg. Toujours sans cigarette depuis février, CO 2 ppm, il est très fier et
me montre l'appli qui compte les euros économisés, "ça rembourse un bout du plan". Urines négatives. Méthylphénidate
pris tous les matins, délivrance OK.
Il me dit que [PERSONNE_3]
15 ans, lui a posé des questions sur la cocaïne après une soirée de son lycée, il lui a "tout raconté, en
version courte". Il demande s'il peut l'emmener un jour à la consultation jeunes consommateurs "juste pour parler".
Informations données.
Prochain RDV médical en décembre.
