# SPEC — Dossiers longs : 20 à 30 pages, découpage par règles, regroupement des doublons

Contexte : l'outil n'a d'intérêt que sur des dossiers trop longs pour être
relus à chaque consultation. Les quatorze dossiers fictifs de
`data/anonymized/dossiers/` font 2 à 5 pages et commencent rarement par une
observation d'entrée : ils restent des cas de mise en page et de
pseudonymisation. La frise est désormais évaluée sur six dossiers fictifs
**de la taille des vrais** (`data/anonymized/dossiers-longs/`, 21 à 26 pages,
74 à 76 observations, 4 à 9 ans de suivi), et sans appel payant.

## A. Dossiers fictifs longs

Recette, format et calibrage : `data/anonymized/dossiers-longs/README.md`.
L'essentiel :

- une **observation d'entrée** de 700 à 1 400 mots qui retrace tout le
  parcours, presque tout daté par l'âge ou de façon approximative ;
- des **éléments révélés tard** (confiés des années après, retrouvés dans un
  courrier), dont certains corrigent l'observation d'entrée ;
- des rappels d'antécédents recopiés d'une note à l'autre, du bruit
  (rendez-vous manqués, renouvellements) ;
- structure calée sur des **comptes** mesurés sur de vrais exports (pages,
  mots, nombre et longueur des observations) : aucun contenu réel n'a servi ;
- dans `verite.json`, chaque événement porte une origine : `intake`,
  `follow_up` ou `late` ; le rappel est rendu par origine.

Contrôle : `uv run python scripts/check_long_dossier.py [<slug>]` (forme de la
vérité, sources existantes, origines cohérentes, taille).

## B. Découpage par règles

Un export dont la mise en page est connue est découpé en observations **sur le
poste, sans appel** (`web/src/notebook/segment-rules.ts`) : chaque observation
commence par une ligne de titre que des règles reconnaissent.

- Deux mises en page : l'export hospitalier (« Observation médicale de suivi
  du 14/03/2022 », suivie de « Validé par … le … ») et l'historique Word
  (« 14/03/2022 10:30 : Observation de suivi ( … ) »).
- Les titres sont cherchés dans l'ordre de lecture de la page, qui n'est pas
  toujours celui de la couche texte.
- Mise en page non reconnue : le document est découpé par le modèle, comme
  avant (`segmentRulesFirst`). Un enregistrement de démonstration fait avant
  les règles est rejoué avec le découpage par le modèle.
- L'application indique, par document, qui a découpé (`segmentedBy`).

Mesure : 451 observations rendues sur 451 attendues sur les six dossiers longs
(l'historique par règles ; les trois courriers d'une page par le modèle).

## C. Regroupement des doublons d'un dossier long

**Problème mesuré.** La frise est lue par lots indépendants de 24 000
caractères, et le dossier raconte lui-même plusieurs fois le passé (entrée,
synthèses, courriers). Sur les six dossiers : 725 pistes pour 404 attendues,
1 194 événements pour 532 attendus ; le même traitement apparaît sur trois
lignes sous trois intitulés.

**Principe.** Quand la frise a été lue en au moins deux lots, **une demande de
plus** (`regroupement`) montre au modèle les pistes et les événements déjà
trouvés — intitulé, dates, début de la note, dates des sources — **sans aucun
texte d'observation**, et lui demande lesquels désignent la même chose. Le code
fusionne ensuite (`web/src/notebook/consolidate.ts`) ; le modèle n'ajoute ni
ne retire aucun événement.

**Règles locales** (rien de ce que le modèle répond n'est pris sans contrôle) :

- un groupe ne réunit que des pistes de la **même catégorie**, des événements
  d'une même piste (après regroupement des pistes) et du même mode ; un
  identifiant inconnu ou cité deux fois est ignoré ;
- l'**intitulé** gardé est toujours l'un de ceux qui ont été lus : celui que
  le modèle a recopié, sinon celui de la piste qui porte le plus
  d'événements. Les autres restent sur la piste (`aliases`), affichés au
  survol (« aussi lu : … ») et ré-identifiés en local comme le reste ;
- le **début** et la **fin** gardés sont ceux d'une des mentions regroupées ;
  les sources sont réunies ;
- chaque mention regroupée reste sur l'événement (`tellings`) : « 3 mentions
  regroupées », et **« dates discordantes selon les observations »** quand
  deux mentions donnent des débuts incompatibles (2013 et 14/10/2014) ;
- un événement dont aucun lot n'a lu le début est dessiné en pointillé
  (`startUnknown`, « début non précisé dans le texte ») ;
- la demande échoue ou sa réponse est inutilisable : la frise reste telle que
  lue, et l'application le dit (« doublons non regroupés »).

**Interfaces.** `consolidateTimeline(read, input, lots)` ;
`analyse(…, consolidate = true)` ; `Timeline.consolidation` (`lots`,
`tracksBefore`, `tracksAfter`, `eventsBefore`, `eventsAfter`, `discordant`, `failed`) ;
`Track.aliases`, `TimelineEvent.tellings`, `TimelineEvent.startUnknown`.
Étape affichée : « Regroupement des doublons… » ; journal : « Regroupement des
doublons (sans texte d'observation) ». Un enregistrement de démonstration sans
réponse `regroupement` est rejoué sans cette demande.

**Mesure** (`data/processed/frise/rapport-longs.md`, section « Regroupement des
doublons », frise lue → frise regroupée) :

| | Lue | Regroupée |
|---|---|---|
| Pistes (404 attendues) | 725 | 553 |
| Événements produits | 1 194 | 852 |
| Événements attendus trouvés | 477/532 (90 %) | 468/532 (88 %) |
| Précision (borne basse) | 40 % | 55 % |
| Fin compatible | 201/307 | 207/307 |
| « En cours » juste | 408/477 | 418/468 |

Neuf événements ne sont plus « trouvés » : quatre ont leur date attendue parmi
les mentions regroupées (le début d'un trouble et son diagnostic des années
plus tard), deux sont des faits proches fusionnés à tort (une séparation et le
divorce qui suit), les autres n'étaient justes que par chance dans la frise
lue. 69 événements portent un signalement de dates discordantes. La demande
coûte environ 0,05 $ par dossier.

## D. Passages sans appel payant

`npx vite-node scripts/run-frise.ts --root=dossiers-longs --answers=<dossier>
--consolidate --out=longs/<nom>` (depuis `web/`) : chaque demande que
l'application enverrait est écrite dans `<hash>.request.md` (consigne, schéma
de réponse, message ; texte seul, sans image de page) et sa réponse lue dans
`<hash>.answer.json` (`web/scripts/file-transport.ts`).

- Le hash couvre le modèle, le schéma et tout le texte : la même demande
  retrouve sa réponse, tout changement de consigne ou de texte redemande.
- Une demande sans réponse reçoit une réponse vide et est listée ; on relance
  une fois les réponses écrites — par un agent à qui l'on ne donne que ce
  fichier, ou par une personne.
- Le passage enregistre les caractères échangés par type de demande ; le
  rapport en tire un **coût estimé** (÷ 3 caractères par jeton envoyé, ÷ 1,47
  par jeton reçu, prix du modèle par défaut) : environ **0,57 $ par dossier
  long**, 3,40 $ les six. Une estimation, pas une facture.
- **Relecture simulée** : les détections automatiques sont acceptées telles
  quelles, et les identifiants plantés que les règles ont laissés lisibles
  sont masqués à la main avant l'envoi, comme le ferait le relecteur ; ils
  sont comptés (1 sur les six dossiers).

L'application, elle, continue d'appeler le modèle par l'API ; seuls les
passages d'évaluation et de démonstration passent par des fichiers.

## E. Notation

`uv run python scripts/score_frise.py --root=dossiers-longs
data/processed/frise/longs/<nom>` → `rapport-longs.md` et `rapport-longs.json`
(trouvés, attendus et coût estimé par dossier, lus par les constructeurs de la
démonstration et de la bibliothèque).

- Appariement un pour un : même piste, intitulé proche, début compatible.
- Sur une piste de consommation, une molécule opioïde vaut pour sa classe.
  Les rapports des dossiers courts datent d'avant cette règle : elle y
  ajouterait un événement trouvé (282/320 au lieu de 281 pour `age1`).
- Une piste regroupée répond à tous les intitulés sous lesquels elle a été lue.
- Rappel par origine (entrée 104/119, suivi 304/344, révélé tard 60/69) et par
  piste ; les événements « en plus » sont listés pour relecture (la précision
  est une borne basse).

## F. Démonstration et bibliothèque

- Démonstration : un dossier long (`opiaces-parcours`, 26 pages) en tête de
  l'accueil ; l'application refait tout sur le poste et rejoue les quatre
  lots puis le regroupement. Coût affiché « ≈ », estimé.
- Bibliothèque : deux groupes, « Dossiers longs (20 à 30 pages) » puis
  « Dossiers courts » ; pages et événements dans la barre latérale ;
  « coût estimé » pour un passage sans appel payant.

## Tests (données fictives)

`web/tests/consolidate.test.ts` (règles de fusion, intitulés, mentions,
échecs), `web/tests/segment-rules.test.ts` (les deux mises en page, ordre de
lecture, repli sur le modèle), `tests/test_frise_eval.py` (pistes regroupées,
dates sous la barre), `tests/test_render_frise.py`, `web/e2e/demo.spec.ts`
(dossier long rejoué avec regroupement), `web/e2e/library.spec.ts`.

## Non-objectifs

- Pas de seconde lecture du texte par la demande de regroupement : elle ne
  voit que ce qui a été trouvé.
- Pas de fusion par règles seules (intitulés trop variables), ni de seuil
  d'écart de dates : un traitement re-mentionné des années plus tard est le
  même traitement.
- Les contradictions plantées ne sont pas notées automatiquement ; les dates
  discordantes signalées en sont une première trace.
- Les dossiers réels ne sont pas rejoués ici.

# SPEC — Bibliothèque de dossiers : toutes les étapes, préremplies

Statut : validée et implémentée le 06/11/2026 (branche `dev/demo-library`).

Objectif : montrer en une seule interface tout le processus sur plusieurs
dossiers déjà traités. C'est l'application elle-même, ouverte avec une
bibliothèque de dossiers dans une barre latérale. Pour chaque dossier, on voit
la pseudonymisation, le découpage en observations, les événements et périodes,
puis la frise. Le code est générique et public ; le contenu d'une bibliothèque
(dossiers et analyses) vient d'un dossier servi à côté de l'application, privé
si besoin.

## Ouverture

- `?library=<chemin>/library.json` : l'application s'ouvre en mode
  bibliothèque, sans écran d'accueil. Sans ce paramètre, rien ne change.
- `library.json` : `{ title, groups: [{ title, dossiers: [{ slug, title,
  summary, docs: [{ file, title }], analysis: "<fichier>", key?: "<fichier>"
  }] }] }`. Les fichiers sont relatifs à `library.json`. Une analyse a le format
  de « Enregistrer l'analyse » (`kind: "analysis"`) ; la table, le format de
  la table de ré-identification (noms réels → pseudonymes).

## Barre latérale

- Les groupes (par exemple « Dossiers réels » et « Dossiers fictifs »), puis
  pour chaque dossier son titre, son résumé, le nombre de documents et
  d'événements, et un état (« à ouvrir », « en cours », « prêt »).
- Cliquer un dossier l'affiche. Le premier dossier s'ouvre au chargement.
  Un dossier déjà ouvert garde son état dans la session : y revenir est
  immédiat.
- La barre se replie pour laisser la place à la frise.

## Pour chaque dossier

1. **Documents et pseudonymisation** : les fichiers passent par le chemin
   normal de l'application, sur le poste : lecture, détection par règles
   (comme pour les passages enregistrés ; le modèle local n'est pas lancé),
   toutes les détections acceptées,
   masquage, relecture et vérification. Le panneau de relecture et le
   parcours en six étapes restent visibles : on voit ce qui a été masqué
   et pourquoi.
2. **Observations** (nouvel onglet, à côté de « Document » et « Frise ») :
   la liste des observations découpées, par document et dans l'ordre
   chronologique (date, type, rôle de l'auteur, résumé, page et ligne).
   Cliquer une observation ouvre la page pseudonymisée, surlignée.
   L'onglet sert aussi hors bibliothèque, après une analyse.
3. **Événements et périodes, frise** : l'analyse enregistrée est chargée à la
   place de l'appel au modèle, comme « Rouvrir une analyse ». La frise et sa
   vue tableau sont celles de l'application. Un bandeau indique « Analyse
   enregistrée : <modèle>, <date>, <coût> ». Rien ne part en ligne :
   l'indicateur reste sur « Tout reste sur ce poste ».
4. **Noms réels** : avec une table fournie, la bascule « Noms réels /
   Pseudonymes » remet les vrais noms sur le poste, comme après
   « Rouvrir une analyse » avec sa table. Sans table, c'est la table issue
   des détections de la session.

## Cas limites

- Un document illisible ou absent : le dossier s'ouvre avec les autres, une
  erreur est affichée sur le document manquant.
- Une analyse qui cite une observation d'un document absent : l'événement
  reste affiché, sans lien vers la source (comportement de « Rouvrir »).
- Un `library.json` illisible : message d'erreur et écran d'accueil normal.

## Tests

- Unitaires : lecture et validation de `library.json` (groupes, chemins
  relatifs, erreurs) ; ordre et regroupement de la liste des observations.
- e2e (données fictives) : bibliothèque de deux dossiers fictifs construite
  depuis `data/anonymized`. On vérifie la barre latérale, l'ouverture
  automatique du premier dossier, la détection faite, les onglets
  Observations et Frise remplis, le passage au second dossier et le retour,
  et aucun appel réseau.
- `scripts/build-library.ts` construit la bibliothèque fictive
  (`--runs=age1`) ; le constructeur des dossiers réels reste dans le dépôt
  privé.

## Non-objectifs

- Pas d'appel au modèle en mode bibliothèque (analyses enregistrées seulement).
- Pas de modification des dossiers depuis l'interface (pas d'ajout ni de
  retrait de document).
- Pas de nouveau calcul de la frise : c'est celle du passage enregistré.

---

# SPEC — Frise par consensus : plusieurs lectures, arbitrage des désaccords

Statut : validée et implémentée le 06/11/2026 (branche `dev/frise-consensus`) ;
résultats mesurés ci-dessous (« Résultats »).

Objectif : approcher la frise du modèle de référence (Sonnet) pour environ
0,20 à 0,30 $ par dossier au lieu d'environ 1,20 $. Plusieurs modèles bon
marché lisent le dossier ; ce qu'ils trouvent ensemble est gardé ; un modèle
plus fort tranche **seulement les désaccords**, en ne voyant que les
observations concernées.

Pourquoi : sur 6 dossiers réels, GPT-6 Luna seul retrouve 45 % de la frise de
référence, Haiku seul 50 %, **leur réunion 63 %** et quatre modèles 73 %. Ne
garder que ce que la majorité trouve fait tomber à 31 % : les modèles se
trompent différemment, il faut réunir puis trier, pas voter. (Simulation hors
ligne sur les passages existants ; accord avec la référence, pas rappel.)

## Principe

1. **Segmentation une seule fois** (modèle de segmentation actuel). Toutes les
   lectures portent sur les mêmes observations : c'est ce qui permet de les
   comparer par leurs sources.
2. **Lectures** : la frise est produite par chacun des modèles « lecteurs »
   (par défaut 2 : GPT-6 Luna et Haiku 5.5), avec le prompt et le schéma
   actuels (`TIMELINE_SYSTEM`, `TIMELINE_SCHEMA`), indépendamment, en
   parallèle.
3. **Rapprochement, en local** : les événements bruts (`RawEvent`, avant
   `assembleTimeline`) des lectures sont appariés un à un. Chaque groupe
   d'événements appariés est :
   - **accord** : trouvé par toutes les lectures, et compatible (même piste,
     dates compatibles à la précision commune, même mode) → gardé tel quel,
     sources réunies, date la plus précise ;
   - **désaccord** : trouvé par une partie des lectures seulement, ou trouvé
     par toutes mais incompatible (dates, mode, piste) → envoyé à l'arbitre.
4. **Arbitrage** : un modèle plus fort (par défaut Sonnet 5.5) reçoit, pour
   chaque désaccord, les variantes proposées (piste, libellé, dates, mode,
   note) et **le texte des seules observations citées** par ces variantes. Il
   répond pour chaque désaccord : `keep` (une variante, éventuellement
   corrigée) ou `drop` (non étayé par les observations). Les observations qui
   ne portent aucun désaccord ne lui sont jamais envoyées.
5. **Assemblage** : accords + désaccords gardés passent par
   `assembleTimeline` (validation, âges, pistes), comme aujourd'hui.

Limite assumée : ce qu'aucune lecture ne trouve, l'arbitre ne le rattrape pas
(il ne voit que les désaccords). Plafond mesuré : 63 % à deux lecteurs, 73 %
à quatre.

## Rapprochement (règle)

Deux événements de lectures différentes sont candidats à l'appariement si :
- même `kind` (sinon : candidat « autre piste », traité comme désaccord) ;
- libellés proches (même normalisation que `normaliseLabel`, puis similarité
  de libellé comme `label_similarity` de `frise_eval.py`, seuil 0,5) ;
- au moins une observation source en commun, **ou** des dates de début
  compatibles.

Appariement glouton un à un, meilleur score d'abord (libellé, date, mode,
sources communes), comme `match_timeline`. Un groupe contient au plus un
événement par lecture. Antécédents datés par l'âge : comparés sur
`start_age`.

## Arbitrage (requête)

- Passe par `chatJson` : garde `assertSendable` sur les manifestes des
  documents dont une observation est envoyée, journal des envois, ZDR. Le
  journal distingue les appels : « lecture 1/2 », « lecture 2/2 »,
  « arbitrage ».
- Lots bornés comme les lectures (`CHARS_PER_CALL`) : désaccords groupés par
  observations, une observation n'est envoyée qu'une fois par lot.
- Schéma : `{ decisions: [{ id, verdict: "keep" | "drop", event: RawEvent | null }] }`
  ; `id` = identifiant court du désaccord (« d1 »…). Un désaccord sans
  décision valide est **gardé** dans la variante la plus fréquente, marqué
  non arbitré (on ne perd pas un événement sur une panne).
- Prompt : « Pour chaque désaccord, dis si l'événement est écrit dans les
  observations ; garde la variante fidèle au texte, corrige-la au besoin ;
  n'invente rien. »

## Interfaces

```ts
// src/notebook/consensus.ts
export interface ConsensusPolicy { readers: CloudPolicy[]; arbiter: CloudPolicy }
export interface EventGroup { id: string; members: (RawEvent | null)[]; agreed: boolean }
export function groupEvents(runs: RawEvent[][]): EventGroup[];          // pur, testé
export async function buildConsensusTimeline(input: TimelineInput & { consensus: ConsensusPolicy }): Promise<Timeline & { consensus: ConsensusStats }>;
export interface ConsensusStats { readers: number; agreed: number; disputed: number; kept: number; dropped: number; unarbitrated: number }
```

`buildTimeline` est découpée pour exposer `readEvents(input): Promise<RawEvent[]>`
(une lecture, sans assemblage) ; son comportement ne change pas.

## Application

- Réglages : « Frise » → « Un modèle » (actuel) ou « Consensus » ; en
  consensus, choix des lecteurs (2 ou 3, parmi les modèles mesurés) et de
  l'arbitre. Coût estimé affiché à partir des moyennes mesurées.
- Frise : un événement venu d'un arbitrage porte la mention « arbitré » au
  survol ; en-tête : « N lectures, X accords, Y désaccords arbitrés ».
- Parcours et journal : chaque lecture et l'arbitrage sont des envois
  distincts, avec leur coût.
- Par défaut : inchangé (un modèle). Le consensus devient le défaut
  seulement si la mesure le justifie (décision de l'utilisateur).

## Mesure

- Dossiers fictifs (14, `verite.json`) : **rappel vrai**, sans dépendre de
  la référence → c'est la mesure qui tranche. Comparer : Sonnet seul,
  Luna seul, Luna + Haiku réunis sans arbitre, Luna + Haiku + arbitre Sonnet,
  idem avec arbitre Haiku.
- Dossiers réels (6, dépôt privé) : accord avec la frise de référence, coût
  par dossier, nombre de désaccords, part gardée par l'arbitre.
- Taille des lots : `CHARS_PER_CALL` actuel (24 000) puis 8 000, pour voir
  si des lots plus petits améliorent les lectures bon marché.
- Scripts : `run-frise.ts` et `run_frise_real.ts` acceptent
  `--readers=<id>,<id> --arbiter=<id>` ; enregistrent les lectures brutes,
  les groupes et les décisions (identifiants et comptes ; le texte reste
  dans le fichier privé, jamais affiché).

## Résultats (06/11/2026)

Segmentation partagée (Haiku), lecteurs GPT-6 Luna et Claude Haiku 5.5.
Détail : `data/processed/frise/comparaison-consensus.md` (fictifs) ; dépôt
privé pour les réels.

Dossiers fictifs, rappel vrai (320 événements ; Sonnet seul sur la même
segmentation : 86 %) :

| Passage | Luna | Haiku | Union | Consensus | Coût frise (14 dossiers) |
|---|---|---|---|---|---|
| lots de 24 000, arbitre Sonnet | 78 % | 75 % | 83 % | 80 % | 0,71 $ |
| lots de 24 000, arbitre Haiku | 74 % | 78 % | 83 % | 81 % | 0,16 $ |
| lots de 8 000, arbitre Sonnet | 81 % | 79 % | 85 % | 82 % | 1,00 $ |

Dossiers réels (6, part de la frise de référence retrouvée, 688 événements) :

| Passage | Luna | Haiku | Union | Consensus | Coût frise par dossier |
|---|---|---|---|---|---|
| lots de 24 000, arbitre Sonnet | 49 % | 50 % | 58 % | 58 % | 0,45 $ |
| lots de 8 000, arbitre Haiku | 60 % | 61 % | 68 % | 67 % | 0,13 $ |

Constats :

- L'arbitre ne fait pas mieux que la simple réunion des lectures (« union ») :
  il écarte peu (5 à 10 % des désaccords) et ne retrouve rien. L'arbitre
  Sonnet coûte dix fois les lectures pour aucun gain ; l'arbitre Haiku est
  presque gratuit et revient à l'union.
- Les lots plus petits (8 000 caractères) sont le vrai levier : chaque
  lecteur bon marché gagne environ 11 points sur les dossiers réels, et 3 à
  4 points sur les fictifs (de l'ordre de la variation d'un passage à
  l'autre). Ils produisent aussi plus d'événements (sur les
  réels, 334 hors référence au lieu de 109 : vrais détails ou bruit, la
  référence ne permet pas de trancher).
- Meilleur compromis mesuré : Luna + Haiku en lots de 8 000, arbitre Haiku,
  ≈ 0,13 $ de frise par dossier réel (plus la segmentation Haiku), 67 % de la
  frise de Sonnet ; Sonnet seul coûte 1,17 $.
- Défaut de l'application inchangé (un modèle, lots de 24 000) : passer au
  consensus ou aux lots de 8 000 par défaut reste une décision de
  l'utilisateur.

## Tests (données fictives)

- `groupEvents` : accord exact ; même événement daté à des précisions
  différentes (accord, date la plus précise) ; dates incompatibles
  (désaccord) ; événement d'une seule lecture (désaccord) ; même libellé sur
  deux pistes (désaccord « autre piste ») ; un groupe ne prend jamais deux
  événements d'une même lecture ; antécédent par l'âge.
- Arbitrage (fetch simulé) : seules les observations des désaccords sont
  dans la requête (aucune autre) ; `drop` retire ; `keep` avec correction
  remplace ; réponse vide ou incomplète → désaccords gardés non arbitrés ;
  aucun désaccord → aucun appel à l'arbitre.
- Garde : un document non vérifié bloque lectures et arbitrage.

## Non-objectifs

- Pas de vote à la majorité seul (mesuré : il fait perdre la moitié).
- Pas de consensus pour la segmentation (une seule, partagée).
- Pas d'enregistrement de démonstration en consensus dans ce lot (plus tard,
  si le mode est retenu).
- L'arbitre ne relit pas le dossier entier : ce serait refaire la frise au
  prix de Sonnet.

---

# SPEC — Démonstration de bout en bout et transparence des envois

Statut : en cours (branche `dev/demo-and-cheaper-models`), 05/11/2026.

Objectif : montrer l'outil entier à un directeur de mémoire, sur des données
**fictives**, sans clé d'API et sans réseau, et rendre visible à chaque
instant ce qui reste sur le poste et ce qui part vers un modèle en ligne.

## A. Mode démonstration

- L'accueil propose, à côté du dépôt de fichiers, 3 dossiers fictifs (tirés de
  `data/anonymized/dossiers`, déjà publics) : résumé clinique, documents,
  nombre de pages. Un clic les charge comme des fichiers déposés : lecture,
  détection (règles + IA locale), relecture, masquage et vérification
  s'exécutent pour de vrai, dans le navigateur.
- Bandeau permanent « Dossier fictif — démonstration » tant qu'un dossier de
  démonstration est ouvert.
- Analyse IA : par défaut, **réponses enregistrées** d'un vrai passage du
  modèle (aucun envoi). Le code de l'application tourne en entier (garde
  `assertSendable`, construction de la requête, contrôles, calcul des âges,
  ré-identification) ; seul `fetch` est remplacé. Trois enregistrements par
  dossier : le modèle par défaut et deux modèles économiques, pour comparer
  les frises et les coûts. « En direct » reste possible si l'IA en ligne est
  configurée.
- L'analyse de démonstration demande que tous les documents du dossier soient
  vérifiés (les réponses enregistrées portent sur le dossier entier).
- `scripts/build-demo.ts` produit `web/public/demo/` (PDF + réponses
  enregistrées) depuis `data/anonymized/dossiers` et
  `data/processed/frise/<passage>/`.

## B. Où sont les données

- **Parcours** (sous la barre du haut) : Dépôt → Détection → Relecture →
  Masquage et vérification → Analyse IA → Frise. Chaque étape porte son lieu :
  « ce poste » ou « en ligne (OpenRouter, ZDR) » ; l'étape courante est mise en
  avant ; l'étape en ligne indique ce qui part (texte et images des pages
  pseudonymisées) et ce qui ne part jamais (originaux, table de
  correspondance, date de naissance complète).
- **Indicateur d'état** dans la barre du haut, calculé à partir du journal :
  « Tout reste sur ce poste » ; « Envoi en cours vers … » ; « N envois
  pseudonymisés » ; en démonstration, « Aucun envoi : réponses enregistrées ».
- **Journal des envois** (tiroir) : chaque requête du modèle, envoyée ou
  rejouée : heure, destination, modèle, ZDR, documents, taille, nombre
  d'images, durée, coût s'il est connu. Contenu exact consultable (texte et
  vignettes des pages). Contrôle local de chaque envoi : nombre de valeurs
  réelles (détections acceptées) retrouvées dans la requête ; attendu : 0.
  Le journal vit en mémoire, il n'est ni stocké ni envoyé.
- Frise en vrais noms : mention « noms remis sur ce poste, jamais envoyés ».

## C. Modèle et coût

- Banc d'essai de modèles moins chers, tous via OpenRouter avec ZDR, sur les
  14 dossiers fictifs (`--out=bench/<modèle>`), noté par
  `scripts/compare_models.py` → `data/processed/frise/comparaison-modeles.md`.
- Les réglages proposent les modèles mesurés (rappel, coût par dossier) ;
  l'identifiant reste modifiable.

## Non-objectifs

- Pas de nouvelle donnée réelle dans addictoscope : la démonstration n'utilise
  que les dossiers fictifs.
- Le journal ne remplace pas la garde : il montre, `assertSendable` décide.

---

# SPEC — Ré-identification locale et dates calculées depuis l'âge

Statut : validée le 04/11/2026, implémentée (branche `dev/local-reidentification`).

Points tranchés à la réconciliation :
- un âge illisible ou hors de 0–110 ans est écarté (comme une date illisible) ;
  un âge lisible sans année de naissance, ou qui tombe après la dernière
  observation, va dans « Antécédents non datés » ;
- une fin donnée en intervalle d'âge prend sa borne haute (« jusqu'à
  l'adolescence » = 17 ans) ; un début, sa borne basse ; la borne « dernière
  observation » porte sur l'année de début ;
- année de naissance sur deux chiffres : siècle courant jusqu'à l'année en
  cours, sinon le précédent (« 08 » = 2008, « 61 » = 1961), aussi dans le
  libellé `[NE(E) EN AAAA]` ;
- une étiquette hors personnes partagée par des valeurs différentes (`[TEL]`
  pour deux numéros) n'est pas remplacée : elle reste une étiquette. Les
  personnes sont regroupées par le détecteur ; leurs variantes sont sûres ;
- import d'un `.axkey` dans l'interface et export ré-identifié de la frise :
  reportés, l'application ne rouvre pas encore une analyse et n'exporte pas
  encore la frise (`keyTableFromEntries` est prêt).

Décisions de l'utilisateur (04/11/2026) :
- l'année de naissance reste dans le texte envoyé (`[NE(E) EN 1972]`) ;
- dans l'application, la frise s'ouvre avec les vrais noms ;
- les frises réelles ré-identifiées de fst-2026 sont commitées (dépôt privé).

## Principe

Le modèle en ligne ne voit que des étiquettes (`[PATIENT]`, `[SOIGNANT_2]`…)
et des âges. **Le poste** remet ensuite les vraies valeurs et calcule les
dates, automatiquement. La table de correspondance et la date de naissance ne
quittent jamais le navigateur ; `cloud/guard.ts` continue de refuser tout
envoi non vérifié.

## A. Dates exprimées en âge (« à 14 ans », « à l'adolescence »)

Aujourd'hui, le prompt fait ignorer un antécédent raconté par l'âge quand
l'année n'est pas calculable. C'est le premier point faible de la frise.

- **Prompt** : pour un antécédent daté par l'âge ou une période de vie, le
  modèle renvoie `start_age` / `end_age` à la place de `start` / `end` :
  - un nombre (`14`) ;
  - un intervalle (`[12, 17]`) ;
  - ou une période nommée : `enfance` = 6–11 ans, `adolescence` = 12–17 ans,
    `jeune adulte` = 18–25 ans ; « vers 20 ans » = 19–21 ans.
- **Résolution locale** (`notebook/age.ts`), à partir de la date de naissance
  complète trouvée par la détection (catégorie NAISSANCE, texte d'origine) ;
  à défaut, l'année du libellé `[NE(E) EN AAAA]`, avec une précision moindre :
  - un âge exact `n` donne la période [naissance + n ans, naissance + n + 1 ans[,
    précision « année » ;
  - un intervalle donne la période correspondante, précision « approximative » ;
  - la note garde la formulation d'origine (« à 14 ans »).
- **Sans date de naissance connue**, l'événement n'est plus écarté : il va dans
  une liste « Antécédents non datés », sous la frise, avec son âge.
- **Validation** : âge de 0 à 110 ans ; une date résolue ne peut pas dépasser
  la dernière observation. Sinon, l'événement rejoint la liste non datée.

## B. Ré-identification de l'affichage

- **Source de la table** : les détections de la session (étiquette → valeurs),
  ou un fichier `.axkey` importé (déchiffré localement avec son mot de passe)
  pour rouvrir une analyse plus tard.
- **Ce qui est remplacé** : notes et libellés de la frise, texte des
  observations, vue tableau. Quand une étiquette a plusieurs variantes
  (« LEROY », « LEROY Martine »), l'affichage prend la plus complète.
- **Bascule** « Noms réels / Pseudonymes », bien visible sur la frise ;
  ouverture sur les vrais noms.
- **Exports** (HTML de la frise, .txt) : pseudonymisés par défaut. Un export
  ré-identifié est possible, mais explicite et marqué « contient des données
  identifiantes ».
- **`scripts/render_frise.py --key <table.json>`** : même remplacement, hors
  navigateur. Les scripts privés de fst-2026 écrivent la table et la date de
  naissance de chaque dossier réel (`data/processed/frise/<slug>.key.json`),
  puis produisent `interactive/<slug>.reel.html`, commitées dans le dépôt
  privé, à côté des versions pseudonymisées.

## Interfaces (contrat entre tests et implémentation)

`web/src/notebook/age.ts` :

```ts
/** Inclusive range of ages in years, e.g. [14, 14] or [12, 17]. */
export type AgeRange = [number, number];
/** 14 | "14" -> [14,14]; [12,17] -> [12,17]; "enfance" -> [6,11];
 *  "adolescence" -> [12,17]; "jeune adulte" -> [18,25] (accents and case
 *  ignored). Out of 0..110, reversed or unreadable -> null. */
export function parseAge(v: unknown): AgeRange | null;
/** Birth year known locally: the NAISSANCE detection's original text
 *  ("03/04/1961", "03/04/61" -> 1961), else its label "[NE(E) EN 1961]";
 *  the first accepted NAISSANCE detection wins; none -> null. */
export function birthYearFromDetections(dets: { category: string; text: string; label: string; accepted: boolean }[]): number | null;
```

`web/src/notebook/model.ts` :
- `TimelineEvent` gagne `fromAge?: { start: AgeRange | null; end: AgeRange | null }`
  (présent si une borne vient d'un âge ; la frise la dessine comme approximative).
- `Timeline` gagne `undated: UndatedEvent[]`, avec
  `UndatedEvent = Omit<TimelineEvent, "start" | "end" | "fromAge"> & { startAge: AgeRange; endAge: AgeRange | null }`.

`web/src/notebook/timeline.ts` :
- Le schéma et le prompt acceptent `start` null avec `start_age` (et `end_age`)
  au format accepté par `parseAge`.
- `assembleTimeline(raw, knownObservations, birthYear: number | null = null, lastObservation: string | null = null)` :
  - `lastObservation` : date (partielle) de la dernière observation datée,
    borne haute des années résolues ; omise ou null, pas de borne (appels
    existants inchangés) ;
  - `start` daté : inchangé ; un `end_age` `[a, b]` est résolu de la même
    façon que `start_age` (`end = String(birthYear + a)`), gardé seulement
    s'il ne précède pas `start` ni ne dépasse la borne (sinon `end` reste
    null, l'événement reste daté) ;
  - `start` null et `start_age` lisible, `birthYear` connu : âge `[a, b]` →
    `start = String(birthYear + a)` ; si `a < b`, que l'événement n'a pas d'`end`
    et n'est pas en cours, `end = String(birthYear + b)`, ramené à l'année de
    `lastObservation` si elle est dépassée. `fromAge` est rempli ;
  - année résolue de `start_age` ou de `end_age` > année de `lastObservation`,
    ou `birthYear` null → `undated` (identifiants `u1`, `u2`… ; la piste est
    créée pour son libellé, la frise ne dessine que les pistes ayant un
    événement daté) ;
  - ni date ni âge lisible → écarté (comme aujourd'hui).
- `buildTimeline(input)` : `input.birthYear?: number | null`, transmis à
  `assembleTimeline` avec la date de la dernière observation datée de
  `input.observations`. Le modèle ne reçoit jamais `birthYear`.
- `Timeline.undated` manque dans les sorties antérieures : le lire comme `[]`
  (`withUndated(t)` dans `model.ts`).

`web/src/core/reidentify.ts` :

```ts
/** label ("[PATIENT]", "[SOIGNANT_2]", "[NE(E) EN 1961]") -> value shown. */
export type KeyTable = Map<string, string>;
/** Accepted detections only. Per label, the most complete value: most
 *  words, then longest, then first seen. */
export function keyTableFromDetections(dets: Detection[]): KeyTable;
/** From a decrypted .axkey (KeyEntry[]): same choice among `values`. */
export function keyTableFromEntries(entries: KeyEntry[]): KeyTable;
/** Every occurrence of a known label replaced; unknown labels kept. */
export function reidentify(text: string, table: KeyTable): string;
/** Notes, track labels and undated notes re-identified; ids, dates untouched. */
export function reidentifyTimeline(t: Timeline, table: KeyTable): Timeline;
```

Application : `analysis.ts` calcule `birthYear` à partir des détections (en
local) ; la frise affiche une bascule « Noms réels / Pseudonymes », ouverte
sur les vrais noms dès qu'une table existe. En mode vrais noms, « voir la
source » ouvre la page d'origine (locale) au lieu de la page masquée. Liste
« Antécédents non datés » sous la frise.

Scripts : `run-frise.ts` passe `birthYear` (détections) et garde
`timeline.undated` dans sa sortie. `render_frise.py --key <table.json>`, avec
`{"labels": {"[PATIENT]": "…"}}`, remplace les étiquettes dans tout le texte
de la page ; la page dessine `fromAge` comme approximatif et liste `undated`.
`--banner synthetic|real|<texte>` règle le bandeau : « Données synthétiques
(dossier entièrement inventé) » par défaut, « Dossier réel pseudonymisé
(usage privé, ne pas diffuser) » pour `real` ; avec `--key`, « Dossier réel
ré-identifié (usage privé, ne pas diffuser) ».

## Non-objectifs

- Aucune ré-identification côté serveur ; la table n'est jamais envoyée.
- Pas de changement du masquage ni de la vérification.

## Tests et mesure

- Tests unitaires du calcul (âges exacts, intervalles, périodes, bornes,
  naissance inconnue) et du remplacement (variantes, étiquettes absentes).
- Test de garde : aucune requête sortante ne contient une valeur réelle ni la
  date de naissance (dossiers fictifs).
- Frise relancée sur les 14 dossiers fictifs : le rappel des antécédents
  datés par l'âge doit monter. Aujourd'hui, c'est le premier point faible
  (88 % au total).

## Frise : parcours entier, corrections à la main, vue « Essentiel » (11/11/2026)

Demande : la période d'avant le suivi est essentielle et ne doit pas être mise de
côté ; la frise doit pouvoir être corrigée, y compris sur téléphone ; une vue
courte doit pouvoir être montrée en réunion.

- **Parcours entier.** La frise s'ouvre toujours sur toute l'histoire. Quand
  l'histoire est longue devant le suivi, l'axe est en deux parties, chacune à son
  échelle : l'avant-suivi (25 à 45 % de la largeur, fond teinté) et le suivi,
  séparés par un trait au premier document. « Suivi seul » reste à un clic.
- **Fiche d'un événement.** Toucher un événement ouvre sa fiche : rubrique, ligne,
  début, fin (2013, 05/2013 ou 12/05/2013), en cours, nature, perte de contrôle,
  note ; observations d'origine avec lien vers la page ; supprimer ; fusionner
  avec un autre événement de la même ligne. « + » en tête de ligne et
  « + Événement » ajoutent. La fiche écrit toujours dans la frise pseudonymisée :
  un vrai nom affiché n'est jamais enregistré.
- **Liste à vérifier** (onglet Tableau) : Juste, Faux, Corriger par événement,
  compteur « n vérifiés sur N », champ « Il manque… ». Sur téléphone, une carte
  par événement.
- **Essentiel.** Une dizaine de repères choisis par règles simples (premier usage
  de chaque produit ou comportement, perte de contrôle, événements de vie,
  premiers soins ; au plus 60 % d'un seul côté du début du suivi), que la fiche
  permet de forcer ou d'exclure. Âge affiché si l'année de naissance est connue
  sur le poste. Export en image PNG.
- **Corrections conservées.** Elles vivent dans la frise (`edited`, `verdict`,
  `key`, `removed`, `missing`) : « Enregistrer l'analyse » les garde, et une
  relecture des mêmes documents les remet (`carryCorrections` : suppressions
  maintenues, événements ajoutés ou modifiés remis à la place de ceux lus à la
  même ligne et à la même date). Un événement corrigé porte un contour noir.
- **Agrandir** : la frise sur toute la fenêtre.
- La rubrique « Consommations » s'appelle « Usages et comportements » à l'écran ;
  la demande de regroupement garde l'ancien intitulé pour que les réponses
  enregistrées se rejouent.

Non-objectifs : glisser-déposer sur la frise, historique d'annulation, édition
des antécédents non datés, stockage automatique dans le navigateur.
