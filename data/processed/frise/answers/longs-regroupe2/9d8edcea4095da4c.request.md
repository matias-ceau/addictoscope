Réponds à cette demande comme le ferait le modèle appelé par l'application : lis la consigne et le message, puis écris ta réponse dans le fichier `9d8edcea4095da4c.answer.json` du même dossier — un seul objet JSON, valide selon le schéma, sans texte autour. Ne lis aucun autre fichier.

## Consigne

Tu aides un clinicien en addictologie à structurer un dossier patient PDF déjà pseudonymisé (les noms sont remplacés par des étiquettes comme [PATIENT] ou [SOIGNANT_2] : garde-les tels quels).

Le dossier est une suite d'observations cliniques (consultations, entretiens, notes infirmières, courriers, comptes rendus). Pour chaque observation, rends :
- start / end : première et dernière ligne de l'observation (titre compris), en numéros de page et de ligne tels qu'ils sont donnés (p3 L12 → page 3, line 12) ;
- date : date clinique de la rencontre (YYYY-MM-DD), jamais la date de validation, d'édition ou d'impression ; null si absente ;
- kind : type d'observation tel qu'écrit (ex. « psychiatrique de suivi », « IDE », « courrier de sortie ») ;
- author_role : fonction de l'auteur si elle est indiquée ou évidente, sinon null ;
- continues_previous : true seulement si la première observation de ces pages est la suite d'une observation commencée avant ces pages ;
- summary : une phrase, en français, factuelle.

Les en-têtes et pieds de page répétés à chaque page (encadré d'identité, adresse de l'établissement, « Page x/y », mentions d'édition) ne font partie d'aucune observation : une observation coupée par un saut de page continue après l'encadré de la page suivante. Utilise les images pour reconnaître la mise en page. Ne crée pas d'observation pour un en-tête seul.

## Schéma de la réponse (segmentation)

```json
{
 "type": "object",
 "additionalProperties": false,
 "required": [
  "observations"
 ],
 "properties": {
  "observations": {
   "type": "array",
   "items": {
    "type": "object",
    "additionalProperties": false,
    "required": [
     "start",
     "end",
     "date",
     "kind",
     "author_role",
     "continues_previous",
     "summary"
    ],
    "properties": {
     "start": {
      "type": "object",
      "additionalProperties": false,
      "required": [
       "page",
       "line"
      ],
      "properties": {
       "page": {
        "type": "integer"
       },
       "line": {
        "type": "integer"
       }
      }
     },
     "end": {
      "type": "object",
      "additionalProperties": false,
      "required": [
       "page",
       "line"
      ],
      "properties": {
       "page": {
        "type": "integer"
       },
       "line": {
        "type": "integer"
       }
      }
     },
     "date": {
      "type": [
       "string",
       "null"
      ],
      "description": "YYYY-MM-DD, date de la consultation"
     },
     "kind": {
      "type": "string"
     },
     "author_role": {
      "type": [
       "string",
       "null"
      ]
     },
     "continues_previous": {
      "type": "boolean"
     },
     "summary": {
      "type": "string"
     }
    }
   }
  }
 }
}
```

## Message

Ces pages sont le début du document.

Pages 1 à 1, lignes numérotées :
p1 L1 | Pôle d'addictologie - Unité de sevrage - [ADRESSE]
p1 L2 | Chef de pôle
p1 L3 | Dr [SOIGNANT_1]
p1 L4 | Praticiens hospitaliers
p1 L5 | Dr [SOIGNANT_2]
p1 L6 | Dr [SOIGNANT_3]
p1 L7 | Dr [SOIGNANT_4]
p1 L8 | Cadre de santé
p1 L9 | Mme [PERSONNE_1]
p1 L10 | Secrétariat de l'unité
p1 L11 | Tél. [TEL]
p1 L12 | Langon, le 21/04/2021
p1 L13 | Dr [SOIGNANT_5]
p1 L14 | Copie : Dr [SOIGNANT_3]
p1 L15 | CSAPA
p1 L16 | Objet : compte rendu d'hospitalisation
p1 L17 | Patient : M. [PATIENT]
p1 L18 | né le [NE(E) EN 1973]
p1 L19 | Domicile : [ADRESSE]
p1 L20 | Hospitalisé du 06/04/2021 au 19/04/2021 dans l'unité de sevrage.
p1 L21 | Cher Confrère,
p1 L22 | Votre patient, M. [PATIENT]
p1 L23 | 48 ans, a été hospitalisé pour un sevrage d'alcool
p1 L24 | programmé, dont la date a été avancée après une crise convulsive généralisée
p1 L25 | tonico-clonique survenue le dimanche 28/03/2021 à son domicile, lors d'un arrêt
p1 L26 | brutal de l'alcool entrepris seul (dernière consommation le vendredi 26/03). Il avait
p1 L27 | été pris en charge aux urgences de Langon : CPK modérément élevées, scanner
p1 L28 | cérébral sans anomalie, retour à domicile le soir même sous oxazépam.
p1 L29 | Antécédents : trouble de l'usage de l'alcool sévère. En reprenant les archives de
p1 L30 | l'établissement, nous retrouvons un premier sevrage hospitalier en mars 2011 à la
p1 L31 | [ETABLISSEMENT_2] (Lormont), interrompu par le patient au bout d'une semaine, puis
p1 L32 | un sevrage ambulatoire en 2014, un sevrage dans notre unité en 2016 suivi d'une
p1 L33 | abstinence de huit mois, et un sevrage dans notre unité en juin 2019. Épisodes
p1 L34 | dépressifs en 2016 et en 2020. Pas d'antécédent de geste suicidaire. Tabagisme
p1 L35 | à 25 cigarettes par jour. Hépatopathie alcoolique avec fibrose sévère (Fibroscan
p1 L36 | de novembre 2020). Fracture du calcanéum gauche en accident du travail
p1 L37 | (octobre 2019). Séparé depuis 2019, deux enfants.
p1 L38 | Traitement à l'entrée : baclofène 60 mg/j, escitalopram 15 mg/j, thiamine 250 mg/j,
p1 L39 | oxazépam 10 mg x 3/j (urgences).
p1 L40 | Évolution : sevrage par oxazépam selon protocole renforcé, sans nouvelle crise,
p1 L41 | sans confusion. Score de Cushman à 1 dès J5. Oxazépam arrêté le 16/04.
p1 L42 | Biologie : GGT 318, VGM 102, plaquettes 141 G/L, TP 79 %. Fibroscan le
p1 L43 | 14/04/2021 : 13,8 kPa (F3). Le baclofène a été maintenu à 60 mg/j, avec une
p1 L44 | décroissance à poursuivre.
p1 L45 | Traitement de sortie : acamprosate 333 mg 2-2-2, baclofène 60 mg/j en
p1 L46 | décroissance de 10 mg par semaine, escitalopram 15 mg/j, thiamine 250 mg/j.
p1 L47 | Suite : entrée en SSR addictologique [ETABLISSEMENT_3]
p1 L48 | Cadillac) prévue le
p1 L49 | 10/05/2021. Suivi au CSAPA par le Dr [SOIGNANT_3]
p1 L50 | Échographie hépatique
p1 L51 | semestrielle et consultation d'hépatologie.
p1 L52 | Je vous prie de croire, Cher Confrère, à l'expression de mes sentiments
p1 L53 | confraternels.
p1 L54 | Dr [SOIGNANT_2]
p1 L55 | [ETABLISSEMENT_1]
p1 L56 | [ADRESSE]
p1 L57 | [VILLE]
p1 L58 | [VILLE]
