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
  ré-identification) ; seul `fetch` est remplacé. Deux enregistrements par
  dossier : le modèle par défaut et le modèle économique, pour comparer les
  frises et les coûts. « En direct » reste possible si l'IA en ligne est
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
