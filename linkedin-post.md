# Annonce LinkedIn — CNCF Lorient 2026-04-30

Brouillons de post LinkedIn pour annoncer le talk **st4ck : Kubernetes
souverain, du bare metal à la prod en une commande** au meetup CNCF Lorient
du 30 avril 2026 à la CCI du Morbihan, Lorient.

> Compte d'origine : profil de **Clément Liard** (`linkedin.com/in/clément-liard`).
> Le post est signé Clément, donc l'abstract n'a pas besoin de présenter le
> speaker — il doit cohérer avec son positionnement DevSecOps / infrastructures
> critiques / air-gapped.

---

## Version longue (~140 mots — recommandée)

> **CNCF Lorient · 30 avril 2026 · CCI du Morbihan, Lorient**
>
> Combien de secrets vivent dans vos repos Git ? Tokens collés dans des
> `values.yaml`, certificats régénérés à la main un dimanche soir, agents IA
> qui tournent avec un token AWS oublié dans un ConfigMap…
>
> Talk **20 minutes + démo live Scaleway depuis zéro** : **st4ck**, plateforme
> Kubernetes souveraine et air-gappable. Du bare metal à la prod en une
> commande, **zéro secret en clair** dans le repo, **−65 %** de coût face à
> une VM équivalente sur charge soutenue. Talos Linux, OpenBao, Cilium eBPF,
> OpenTofu — 100 % open-source.
>
> Je présente le banc d'essai de ce que j'aurais voulu avoir sur mes missions
> Défense / Fintech : un cluster K8s qui se redéploie, qui s'audite, et qui
> ne fuit rien.
>
> Roadmap Q3 2026 : Kamaji + Karpenter + grob (proxy LLM audité) pour héberger
> des agents IA en prod **sans leur donner les clés**.
>
> Code : github.com/Destynova2/st4ck
>
> #Kubernetes #DevSecOps #Souveraineté #AirGapped #Talos #OpenBao #Cilium #CNCFLorient

## Version courte (~60 mots — teaser)

> **30 avril, CCI du Morbihan, Lorient.** Je présente **st4ck** au meetup
> CNCF Lorient : Kubernetes souverain, du bare metal à la prod en une
> commande, zéro secret en Git. **Démo live Scaleway depuis zéro** pendant
> les 20 minutes du talk.
>
> Le banc d'essai de ce que j'aurais voulu avoir sur mes missions Défense
> et Fintech.
>
> github.com/Destynova2/st4ck
>
> #CNCFLorient #Kubernetes #DevSecOps #Souveraineté

## Version 3 lignes (réseau pro / story)

> 30 avril · CNCF Lorient · CCI du Morbihan
> Talk + démo live : **st4ck**, Kubernetes souverain de zéro à la prod.
> Mes 5 dernières missions Défense / Fintech tiennent dans une commande.

---

## Visuels à joindre au post

- **Bannière / image principale** : `assets/clement-portrait-studio.png`
  (fond neutre, format carré, recadrable proprement en bandeau)
- **Si visuel narratif souhaité** : `assets/clement-portrait-office.png`
  (fond bureau avec écrans, plus éditorial)
- **Logo CNCF Lorient** : `assets/cnl-icon-color.svg` (utilisable en overlay
  conformément aux *CNCF Trademark Usage Guidelines*)
- **Capture écran du deck** : voir `dist/screenshots/talk-st4ck-slide-04.png`
  (slide stats — la promesse en trois chiffres, lisible en bandeau LinkedIn)

## Variantes de titre déjà discutées

Le titre retenu pour le programme est consigné dans [`sched.md`](sched.md) :

> **st4ck : Kubernetes souverain, du bare metal à la prod en une commande**

Variantes alternatives à proposer si l'orga préfère plus court :

- *st4ck : Kubernetes souverain, sans secret en Git* (47 car.)
- *st4ck : du bare metal à la prod, sans secret en Git* (51 car.)
- *Mettez de la souveraineté dans votre Kubernetes*

Rejet explicite : *« Présentation de st4ck : Kubernetes souverain, du bare
métal à la prod »* — le « Présentation de » dilue l'accroche, l'audience CNCF
préfère du sec.

## Liens utiles à inclure dans les commentaires du post

- Code source : <https://github.com/Destynova2/st4ck>
- Slides (sources) : <https://github.com/Destynova2/st4ck-prez>
- A00 : <https://a00.fr>
- Profil meetup : page CNCF Lorient (à compléter quand l'orga publie)
