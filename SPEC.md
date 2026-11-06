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
