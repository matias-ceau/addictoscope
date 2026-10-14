# Pseudonymisation et RGPD : ce que fait addictoscope, et pourquoi

## Pseudonymiser n'est pas anonymiser

Une note clinique dont on a retiré noms, IPP, NIR, adresses et téléphones mais
**gardé les dates de soins** reste une donnée **pseudonymisée**, donc toujours
une donnée personnelle de santé (RGPD, considérant 26 et art. 9). Une vraie
anonymisation suppose qu'aucune réidentification ne soit raisonnablement
possible. C'est presque impossible à garantir pour du texte libre (événements
rares, lieux, entourage, dates), et la frise chronologique a besoin des dates.

Conséquences pour l'outil :

1. **La détection et le masquage se font en local**, dans le navigateur, sur le
   poste de l'utilisateur. Le document d'origine n'est jamais envoyé sur le
   réseau. Le test de bout en bout `web/e2e` vérifie qu'aucune requête externe
   n'est émise.
2. **Le PDF est masqué en place**, sans être réécrit. Le texte sous chaque
   zone est supprimé du fichier, et les pixels des pages scannées sont
   écrasés. Une étiquette (`[PATIENT]`, `[SOIGNANT_2]`, …) est posée au même
   endroit. La mise en page, les encadrés et les sauts de page sont conservés,
   pour que les modèles d'IA lisent la page telle qu'un clinicien la voit.
3. **Le résultat est relu avant toute sortie.** Le texte du PDF produit est
   ré-extrait, et ré-océrisé pour les scans. Aucune valeur masquée ne doit y
   réapparaître, et aucun motif fort (NIR, IPP, téléphone, e-mail, date de
   naissance) ne doit subsister. L'outil écrit un manifeste
   (`verified: true/false`).
4. **La table de correspondance** (pseudonyme → identité) n'est exportée que
   chiffrée (AES-GCM, clé dérivée d'un mot de passe). Elle doit rester sur un
   support sécurisé de l'établissement.

## Et l'IA en ligne ?

Toute requête vers un modèle distant passe par `web/src/cloud/guard.ts`. Ce
module refuse un document qui n'a pas été pseudonymisé, relu par un humain et
vérifié sans fuite.

**OpenRouter avec ZDR** (`provider: { zdr: true, data_collection: "deny" }`)
est une bonne mesure de réduction du risque. Aucune conservation chez le
fournisseur, ce qui écarte l'essentiel de la question de l'hébergement HDS. Sur
des données pseudonymisées et vérifiées, la jurisprudence *CEPD c. CRU*
(CJUE, C-413/23 P, 2025) permet de soutenir que les données ne sont pas
personnelles pour un destinataire incapable de réidentifier.

**Ce n'est pas suffisant seul pour un usage hospitalier réel.** Il faut en plus :

- une base légale et une inscription au registre des traitements de
  l'établissement (étude interne, ou MR-004 s'il s'agit de recherche) ;
- l'information des patients (non-opposition) ;
- un contrat de sous-traitance couvrant OpenRouter *et* le fournisseur du
  modèle, ainsi qu'un mécanisme de transfert hors UE (Data Privacy Framework) ;
- **la validation du DPO** de l'établissement.

Alternative plus simple à faire valider : un point d'accès certifié HDS et
hébergé en France, par exemple Claude via AWS Bedrock (région Paris) ou Azure
France. Vérifier que le service exact figure dans le périmètre du certificat.

## Limites actuelles

- La détection combine des règles, un dictionnaire de prénoms et un **modèle
  d'IA local** de reconnaissance des noms (CamemBERT-NER, quantifié, exécuté
  dans le navigateur). Ce modèle lit chaque page après les règles, en
  arrière-plan. Il retrouve des noms sans indice de contexte (« Inès Faraud »,
  « Gisèle MOREL »). Il propose aussi les lieux, non masqués par défaut,
  à confirmer. Il reste aveugle aux noms tapés en minuscules (« vu par dr
  lemercier ») : c'est le rôle des règles. **La relecture humaine reste
  obligatoire.** La vérification finale garantit qu'un nom repéré une fois est
  masqué partout. Elle ne peut pas trouver un nom qu'aucun détecteur n'a
  repéré.
- L'OCR ne tourne que sur les pages sans couche texte. Une image collée dans
  une page qui a du texte n'est pas lue.
