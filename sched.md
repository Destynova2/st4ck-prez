# Soumission CNCF Lorient — st4ck

Format conforme aux abstracts publiés sur `cncflorient/talks` (paragraphe unique, 80–150 mots, FR) et aux listings sched.com (titre court, abstract paragraphe).

---

## Titre court (pour le programme — < 70 caractères)

**st4ck : Kubernetes souverain, du bare metal à la prod en une commande**

## Variantes de titre (à choisir selon l'humeur du meetup)

- *st4ck : Kubernetes souverain, sans secret en Git*
- *st4ck : du bare metal à la prod, sans secret en Git*
- *Mettez de la souveraineté dans votre Kubernetes*

## Format

- **Type** : Talk
- **Durée** : 20 minutes (Q&A à la fin) + démo live en parallèle
- **Niveau** : Intermédiaire à avancé (SRE / Ops / DevOps)
- **Démo** : oui — `make scaleway-up` lancé live au début du talk depuis un IAM dédié,
  cluster pré-staged en backup (L2), asciinema en backup ultime (L1).

## Abstract (paragraphe unique, ~150 mots)

st4ck est une plateforme Kubernetes souveraine et air-gappable, déployée en
une commande du bare metal jusqu'à la production. Construite sur Talos Linux
(zéro SSH, zéro patch manuel) et OpenTofu (8 stacks séquentiels + Flux
GitOps), elle adresse une douleur partagée par toute équipe Ops sérieuse :
combien de secrets vivent dans nos repos Git ? La réponse de st4ck : zéro.
Tous les tokens, certificats et clés sont générés par Terraform via
`random_id`, stockés dans OpenBao, et matérialisés à la volée par
ExternalSecrets. Cilium eBPF remplace kube-proxy, Garage fournit S3 en
300 MB de RAM, et la roadmap intègre Kamaji (control planes mutualisés) et
Karpenter (consolidation VM cloud → bare metal mensuel, −65 % de coût). Démo
live d'un cluster Scaleway provisionné depuis zéro pendant la présentation,
retour d'expérience honnête, et discussion ouverte sur ce qui reste à faire.

## Mots-clés (tags sched)

`#kubernetes` `#souveraineté` `#talos` `#opentofu` `#openbao`
`#cilium` `#kamaji` `#karpenter` `#gitops` `#airgap`

## Speaker bio (60 mots, à adapter)

> **Clément Liard** — Tech Lead DevSecOps & Dirigeant d'A00 (Brest).
> ~10 ans à l'intersection cloud / sécurité d'infrastructures critiques :
> Défense (mission air-gapped en cours), Fintech (Treezor / Société Générale,
> PCI-DSS), IoT. Stack signature : Terraform/OpenTofu, Podman/Talos, OpenBao,
> Zero Trust. **st4ck** est mon banc d'essai pour une plateforme K8s 100 %
> open-source, reproductible et auditable. `a00.fr`

## Liens

- Code : `github.com/Destynova2/st4ck`
- Slides (sources) : `github.com/Destynova2/st4ck-prez`
- Roadmap : `docs/roadmap.md` dans le repo st4ck

## Visuels

- **Headshot sched.com / profil meetup** : `assets/clement-portrait-studio.png` (fond neutre, format carré, idéal upload sched)
- **Visuel narratif Acte 2 / agents IA** : `assets/clement-portrait-office.png` (fond bureau avec écrans, utilisé sur le divider talk)
