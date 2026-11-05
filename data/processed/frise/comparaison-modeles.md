# Comparaison de modèles sur les 14 dossiers fictifs

Même chemin que l'application (masquage, vérification, images des pages masquées, découpage, frise), même prompt, un seul passage par modèle ; tous les appels passent par OpenRouter avec zéro conservation (`provider.zdr`, `data_collection: deny`). Notation contre `verite.json` (`scripts/score_frise.py`). Un dossier en échec compte pour 0 événement trouvé.

Coût d'un dossier réel : estimé par proportion à partir du coût du modèle de référence sur les 6 dossiers réels (1.17 $ par dossier, 04/11/2026).

| Modèle | Dossiers | Rappel | Rappel (dossiers réussis) | Précision (borne basse) | Antécédents par l'âge | Fins compatibles | Observations (dates justes) | Coût / dossier fictif | ≈ Coût / dossier réel | Durée / dossier |
|---|---|---|---|---|---|---|---|---|---|---|
| `anthropic/claude-sonnet-5.5` | 14/14 | 88 % (281/320) | 88 % | 70 % | 17/20 | 72 % | 100 % | 0.147 $ | 1.17 $ | – |
| `anthropic/claude-sonnet-5.5 (découpage : anthropic/claude-haiku-5.5)` | 14/14 | 86 % (275/320) | 86 % | 69 % | 17/20 | 75 % | 100 % | 0.093 $ | 0.74 $ | 67 s |
| `deepseek/deepseek-v4.1-flash` | 14/14 | 81 % (258/320) | 81 % | 62 % | 17/20 | 61 % | 100 % | 0.042 $ | 0.33 $ | 65 s |
| `openai/gpt-6-luna` | 14/14 | 79 % (254/320) | 79 % | 71 % | 17/20 | 61 % | 100 % | 0.005 $ | 0.04 $ | 77 s |
| `openai/gpt-5.6-luna-pro` | 14/14 | 78 % (248/320) | 78 % | 68 % | 18/20 | 58 % | 100 % | 0.035 $ | 0.28 $ | 92 s |
| `openai/gpt-6-luna-pro` | 14/14 | 77 % (246/320) | 77 % | 68 % | 17/20 | 58 % | 100 % | 0.012 $ | 0.10 $ | 116 s |
| `anthropic/claude-haiku-5.5 (texte seul, sans images)` | 14/14 | 76 % (242/320) | 76 % | 72 % | 17/20 | 61 % | 100 % | 0.010 $ | 0.08 $ | 65 s |
| `xiaomi/mimo-v2.6-flash` | 14/14 | 75 % (239/320) | 75 % | 60 % | 14/20 | 59 % | 100 % | 0.008 $ | 0.06 $ | 242 s |
| `anthropic/claude-haiku-5.5` | 14/14 | 75 % (239/320) | 75 % | 74 % | 16/20 | 65 % | 100 % | 0.009 $ | 0.07 $ | 63 s |
| `openai/gpt-5.6-luna` | 14/14 | 74 % (238/320) | 74 % | 69 % | 18/20 | 57 % | 100 % | 0.011 $ | 0.09 $ | 48 s |
| `qwen/qwen3.8-27b` | 13/14 | 71 % (226/320) | 74 % | 54 % | 16/20 | 50 % | 100 % | 0.120 $ | 0.95 $ | 441 s |
| `google/gemini-3.8-flash` | 14/14 | 70 % (225/320) | 70 % | 82 % | 17/20 | 59 % | 100 % | 0.055 $ | 0.43 $ | 97 s |
| `z-ai/glm-5.3-flash` | 14/14 | 64 % (205/320) | 64 % | 69 % | 15/20 | 63 % | 98 % | 0.009 $ | 0.07 $ | 180 s |
| `deepseek/deepseek-v4.1-flash (texte seul, sans images)` | 13/14 | 62 % (199/320) | 68 % | 62 % | 11/20 | 69 % | 92 % | 0.028 $ | 0.22 $ | 312 s |
| `openai/gpt-5-mini` | 14/14 | 62 % (198/320) | 62 % | 70 % | 16/20 | 66 % | 96 % | 0.032 $ | 0.25 $ | 112 s |
| `google/gemma-4-31b-it` | 14/14 | 61 % (195/320) | 61 % | 76 % | 14/20 | 50 % | 100 % | 0.004 $ | 0.03 $ | 98 s |
| `deepseek/deepseek-v4.1-flash-1017` | 13/14 | 59 % (190/320) | 66 % | 62 % | 15/20 | 66 % | 98 % | 0.028 $ | 0.22 $ | 298 s |
| `mistralai/mistral-small-2603` | 14/14 | 54 % (173/320) | 54 % | 63 % | 13/20 | 40 % | 98 % | 0.005 $ | 0.04 $ | 24 s |
| `google/gemini-3.5-flash-lite` | 14/14 | 47 % (150/320) | 47 % | 77 % | 12/20 | 45 % | 100 % | 0.016 $ | 0.12 $ | 13 s |
| `openai/gpt-oss-120b (texte seul, sans images)` | 12/14 | 41 % (130/320) | 47 % | 58 % | 11/20 | 40 % | 95 % | 0.009 $ | 0.07 $ | 27 s |
| `moonshotai/kimi-k3` | 7/14 | 41 % (130/320) | 83 % | 68 % | 5/20 | 72 % | 100 % | 0.343 $ | 2.72 $ | 369 s |
| `google/gemini-3.1-flash-lite` | 14/14 | 40 % (127/320) | 40 % | 85 % | 12/20 | 54 % | 100 % | 0.009 $ | 0.07 $ | 13 s |
| `minimax/minimax-m3.1-flash` | 5/14 | 27 % (85/320) | 70 % | 56 % | 2/20 | 37 % | 100 % | 0.027 $ | 0.22 $ | 1024 s |
| `inclusionai/ling-3.0-flash` | 2/14 | 9 % (29/320) | 71 % | 78 % | 2/20 | 44 % | 100 % | 0.040 $ | 0.31 $ | 828 s |
| `qwen/qwen3-vl-235b-a22b-instruct` | 1/14 | 6 % (20/320) | 71 % | 22 % | 1/20 | 33 % | 100 % | 0.030 $ | 0.24 $ | 365 s |
| `mistralai/mistral-medium-3.1` | 1/14 | 6 % (19/320) | 68 % | 56 % | 2/20 | 36 % | 94 % | 0.021 $ | 0.17 $ | 3 s |

Notes : un seul passage par modèle (DeepSeek : deux, 81 % chaque fois sur les dossiers réussis), l'écart d'un passage à l'autre est de quelques points. Les modèles qui raisonnent (DeepSeek, Luna Pro) produisent beaucoup de jetons de sortie, d'où leur coût. Le compte utilise des clés fournisseur (BYOK) pour certains fournisseurs : le coût compté est alors le coût amont. Qwen3 VL (plus de 6 minutes par dossier) a été arrêté ; Mistral Medium n'est servi que par Mistral, où la clé fournisseur enregistrée est refusée.

Échecs : `qwen/qwen3.8-27b` : tabac-infarctus ; `deepseek/deepseek-v4.1-flash (texte seul, sans images)` : chemsex-prep ; `deepseek/deepseek-v4.1-flash-1017` : crack-rue ; `openai/gpt-oss-120b (texte seul, sans images)` : alcool-tspt, cannabis-justice ; `moonshotai/kimi-k3` : cannabis-justice, chemsex-prep, crack-rue, jeu-bipolaire, methadone-schizophrenie, opiaces-tso, tabac-infarctus ; `minimax/minimax-m3.1-flash` : bzd-anxiete, cannabis-jeune, cannabis-justice, chemsex-prep, crack-rue, jeu-bipolaire, methadone-schizophrenie, opiaces-tso, tabac-infarctus ; `inclusionai/ling-3.0-flash` : alcool-cirrhose, alcool-depression, alcool-tspt, antalgiques-opioides, bzd-anxiete, cannabis-justice, chemsex-prep, crack-rue, jeu-bipolaire, methadone-schizophrenie, opiaces-tso, tabac-infarctus ; `qwen/qwen3-vl-235b-a22b-instruct` : alcool-depression, alcool-tspt, antalgiques-opioides, bupre-grossesse, bzd-anxiete, cannabis-jeune, cannabis-justice, chemsex-prep, crack-rue, jeu-bipolaire, methadone-schizophrenie, opiaces-tso, tabac-infarctus ; `mistralai/mistral-medium-3.1` : alcool-depression, alcool-tspt, antalgiques-opioides, bupre-grossesse, bzd-anxiete, cannabis-jeune, cannabis-justice, chemsex-prep, crack-rue, jeu-bipolaire, methadone-schizophrenie, opiaces-tso, tabac-infarctus.
