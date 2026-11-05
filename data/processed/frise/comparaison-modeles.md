# Comparaison de modèles sur les 14 dossiers fictifs

Même chemin que l'application (masquage, vérification, images des pages masquées, découpage, frise), même prompt, un seul passage par modèle ; tous les appels passent par OpenRouter avec zéro conservation (`provider.zdr`, `data_collection: deny`). Notation contre `verite.json` (`scripts/score_frise.py`). Un dossier en échec compte pour 0 événement trouvé.

Coût d'un dossier réel : estimé par proportion à partir du coût du modèle de référence sur les 6 dossiers réels (1.17 $ par dossier, 04/11/2026).

| Modèle | Dossiers | Rappel | Rappel (dossiers réussis) | Précision (borne basse) | Antécédents par l'âge | Fins compatibles | Observations (dates justes) | Coût / dossier fictif | ≈ Coût / dossier réel | Durée / dossier |
|---|---|---|---|---|---|---|---|---|---|---|
| `anthropic/claude-sonnet-5.5` | 14/14 | 88 % (281/320) | 88 % | 70 % | 17/20 | 72 % | 100 % | 0.147 $ | 1.17 $ | – |
| `deepseek/deepseek-v4.1-flash` | 13/14 | 77 % (246/320) | 81 % | 62 % | 18/20 | 62 % | 100 % | non rapporté | – | 84 s |
| `anthropic/claude-haiku-5.5` | 14/14 | 75 % (239/320) | 75 % | 74 % | 16/20 | 65 % | 100 % | 0.009 $ | 0.07 $ | 63 s |
| `openai/gpt-5.6-luna` | 14/14 | 74 % (238/320) | 74 % | 69 % | 18/20 | 57 % | 100 % | 0.011 $ | 0.09 $ | 48 s |
| `google/gemini-3.8-flash` | 12/14 | 60 % (193/320) | 70 % | 82 % | 11/20 | 56 % | 100 % | 0.059 $ | 0.46 $ | 107 s |
| `mistralai/mistral-small-2603` | 14/14 | 54 % (173/320) | 54 % | 63 % | 13/20 | 40 % | 98 % | 0.005 $ | 0.04 $ | 24 s |
| `google/gemini-3.5-flash-lite` | 14/14 | 47 % (150/320) | 47 % | 77 % | 12/20 | 45 % | 100 % | 0.016 $ | 0.12 $ | 13 s |
| `openai/gpt-5.6-luna-pro` | 5/14 | 31 % (99/320) | 81 % | 66 % | 3/20 | 60 % | 100 % | 0.039 $ | 0.31 $ | 101 s |
| `openai/gpt-5-mini` | 4/14 | 18 % (59/320) | 59 % | 65 % | 2/20 | 73 % | 90 % | 0.034 $ | 0.27 $ | 123 s |
| `qwen/qwen3-vl-235b-a22b-instruct` | 1/14 | 6 % (20/320) | 71 % | 22 % | 1/20 | 33 % | 100 % | 0.030 $ | 0.24 $ | 365 s |
| `mistralai/mistral-medium-3.1` | 1/14 | 6 % (19/320) | 68 % | 56 % | 2/20 | 36 % | 94 % | 0.021 $ | 0.17 $ | 3 s |

Échecs : `deepseek/deepseek-v4.1-flash` : bzd-anxiete ; `google/gemini-3.8-flash` : opiaces-tso, tabac-infarctus ; `openai/gpt-5.6-luna-pro` : bzd-anxiete, cannabis-jeune, cannabis-justice, chemsex-prep, crack-rue, jeu-bipolaire, methadone-schizophrenie, opiaces-tso, tabac-infarctus ; `openai/gpt-5-mini` : bupre-grossesse, bzd-anxiete, cannabis-jeune, cannabis-justice, chemsex-prep, crack-rue, jeu-bipolaire, methadone-schizophrenie, opiaces-tso, tabac-infarctus ; `qwen/qwen3-vl-235b-a22b-instruct` : alcool-depression, alcool-tspt, antalgiques-opioides, bupre-grossesse, bzd-anxiete, cannabis-jeune, cannabis-justice, chemsex-prep, crack-rue, jeu-bipolaire, methadone-schizophrenie, opiaces-tso, tabac-infarctus ; `mistralai/mistral-medium-3.1` : alcool-depression, alcool-tspt, antalgiques-opioides, bupre-grossesse, bzd-anxiete, cannabis-jeune, cannabis-justice, chemsex-prep, crack-rue, jeu-bipolaire, methadone-schizophrenie, opiaces-tso, tabac-infarctus.
