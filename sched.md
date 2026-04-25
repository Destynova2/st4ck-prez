# Soumission CNCF Lorient — st4ck

Format conforme aux abstracts publiés sur `cncflorient/talks` (paragraphe unique, 80–150 mots, FR) et aux listings sched.com (titre court, abstract paragraphe).

---

## Titre court (pour le programme — < 70 caractères)

**st4ck : Kubernetes souverain en une commande, sans secret en Git**

## Variantes de titre (à choisir selon l'humeur du meetup)

- *st4ck : du bare metal à la prod en `make scaleway-up`*
- *st4ck : 8 stacks Terraform, zéro secret en Git*
- *Mettez de la souveraineté dans votre Kubernetes*

## Format

- **Type** : Lightning talk
- **Durée** : 6 minutes + 2 minutes Q&A
- **Niveau** : Intermédiaire à avancé (SRE / Ops / DevOps)
- **Démo** : oui (live `git grep token` → 0 résultats, fallback asciinema)

## Abstract (paragraphe unique, 142 mots)

st4ck est une plateforme Kubernetes souveraine et air-gappable, déployée en
une seule commande de bare metal jusqu'à la production. Construite sur Talos
Linux (zéro SSH, zéro patch manuel) et OpenTofu (8 stacks séquentiels +
Flux GitOps), elle adresse une douleur partagée par toute équipe Ops
sérieuse : combien de secrets vivent dans nos repos Git ? La réponse de
st4ck : zéro. Tous les tokens, certificats et clés sont générés par
Terraform via `random_id`, stockés dans OpenBao, et matérialisés à la
volée par ExternalSecrets. Cilium eBPF remplace kube-proxy, Garage fournit
S3 en 300 MB de RAM, et la roadmap intègre Kamaji (control planes
mutualisés) et Karpenter (consolidation VM cloud → bare metal mensuel,
−65 % de coût). Retour d'expérience honnête, démo live, et discussion
ouverte sur ce qui reste à faire.

## Mots-clés (tags sched)

`#kubernetes` `#souveraineté` `#talos` `#opentofu` `#openbao`
`#cilium` `#kamaji` `#karpenter` `#gitops` `#airgap`

## Speaker bio (60 mots, à adapter)

> Architecte cloud-native indépendant, je construis et opère des
> plateformes Kubernetes pour des équipes qui ne peuvent pas se permettre
> de dépendre d'un hyperscaler. st4ck est mon banc d'essai pour une stack
> 100 % open-source, 100 % reproductible, et conçue pour être auditée.
> Contributeur Talos, OpenBao, et Cilium.

## Liens

- Code : `github.com/azerozero/st4ck`
- Slides (sources) : `github.com/<user>/st4ck-prez`
- Roadmap : `docs/roadmap.md` dans le repo st4ck

## Visuels

- **Headshot sched.com / profil meetup** : `assets/ludwig-portrait-studio.png` (fond neutre, format carré, idéal upload sched)
- **Visuel narratif Acte 2 / agents IA** : `assets/ludwig-portrait-office.png` (fond bureau avec écrans, utilisé sur le divider talk)
