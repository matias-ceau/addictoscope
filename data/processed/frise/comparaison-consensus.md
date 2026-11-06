# Frise par consensus — dossiers fictifs (06/11/2026)

Segmentation partagée : celle de Claude Haiku 5.5 (`bench/anthropic__claude-haiku-5.5`). Lecteurs : GPT-6 Luna et Claude Haiku 5.5. Rappel contre `verite.json` (320 événements attendus). Sonnet seul sur la même segmentation : 86 % (`bench/hybrid__haiku-segment__sonnet-frise`). « union » : accords et désaccords tous gardés, sans arbitre. Le même modèle varie de 3 à 4 points d'un passage à l'autre.

    uv run python scripts/score_consensus.py data/processed/frise/consensus/<passage>

## luna-haiku__sonnet (14 dossiers, 320 événements attendus)

| Frise | Rappel | Événements produits |
|---|---|---|
| consensus | 257/320 (80 %) | 367 |
| openai/gpt-6-luna | 248/320 (78 %) | 347 |
| anthropic/claude-haiku-5.5 | 240/320 (75 %) | 325 |
| union | 265/320 (83 %) | 398 |

Coût de l'étape frise : openai/gpt-6-luna frise 0.036 $, anthropic/claude-haiku-5.5 frise 0.087 $, anthropic/claude-sonnet-5.5 arbitrage 0.592 $ ; total 0.714 $
Consensus : readers 28, agreed 240, disputed 180, kept 151, dropped 22, unarbitrated 7

## luna-haiku__haiku (14 dossiers, 320 événements attendus)

| Frise | Rappel | Événements produits |
|---|---|---|
| consensus | 260/320 (81 %) | 396 |
| openai/gpt-6-luna | 236/320 (74 %) | 332 |
| anthropic/claude-haiku-5.5 | 249/320 (78 %) | 340 |
| union | 266/320 (83 %) | 406 |

Coût de l'étape frise : openai/gpt-6-luna frise 0.035 $, anthropic/claude-haiku-5.5 frise 0.083 $, anthropic/claude-haiku-5.5 arbitrage 0.040 $ ; total 0.159 $
Consensus : readers 28, agreed 233, disputed 197, kept 191, dropped 5, unarbitrated 0

## luna-haiku__sonnet__8k (14 dossiers, 320 événements attendus)

| Frise | Rappel | Événements produits |
|---|---|---|
| consensus | 263/320 (82 %) | 404 |
| openai/gpt-6-luna | 260/320 (81 %) | 378 |
| anthropic/claude-haiku-5.5 | 253/320 (79 %) | 355 |
| union | 271/320 (85 %) | 427 |

Coût de l'étape frise : anthropic/claude-haiku-5.5 frise 0.088 $, openai/gpt-6-luna frise 0.043 $, anthropic/claude-sonnet-5.5 arbitrage 0.866 $ ; total 0.996 $
Consensus : readers 28, agreed 269, disputed 195, kept 174, dropped 21, unarbitrated 0


## Constats

- L'arbitre ne fait pas mieux que l'union des deux lectures. L'arbitre Sonnet coûte dix fois les lectures pour aucun gain ; l'arbitre Haiku coûte 0,04 $ et revient à l'union.
- Les lots de 8 000 caractères (`--chars=8000`) font gagner 3 à 4 points à chaque lecteur sur les fictifs, de l'ordre de la variation d'un passage à l'autre. Sur les 6 dossiers réels (dépôt privé), le gain est d'environ 11 points par lecteur : Luna + Haiku en lots de 8 000 avec arbitre Haiku retrouvent 67 % de la frise de Sonnet pour 0,13 $ de frise par dossier, contre 58 % pour 0,45 $ en lots de 24 000 avec arbitre Sonnet.
