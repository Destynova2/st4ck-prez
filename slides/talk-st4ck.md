---
marp: true
theme: cncf-lorient
paginate: true
footer: 'st4ck — CNCF Lorient · 2026-04-30'
title: 'st4ck : Kubernetes souverain, du bare metal à la prod'
description: 'Talk 20 min — st4ck, plateforme Kubernetes souveraine sur Talos Linux : architecture, anti-patterns, roadmap.'
author: 'Clément Liard'
---

<!-- _class: title -->

<img class="portrait" src="../assets/clement-portrait-studio.png" alt="Clément Liard" />

# st4ck

## Kubernetes **souverain**, du bare metal à la prod.
## Zéro secret, zéro shell, zéro drift.

CNCF Lorient · 30 avril 2026 · CCI du Morbihan, Lorient

Talk · 20 minutes · Q&A à la fin · démo live en parallèle

<!--
Pacing: 45 s. Présenter, énoncer son nom, son rôle.
Annoncer la structure : « la douleur d'abord, puis 4 actes — architecture, IA, convictions, engagement.
Q&A à la fin, pas de questions techniques pendant les 4 premières minutes. »
**AVANT DE MONTER SUR SCÈNE** : `make scaleway-bootstrap-vm && make scaleway-up ENV=demo INSTANCE=cnclorient REGION=fr-par`
au minimum 3 minutes avant la slide 1. Le cluster fallback (L2) doit être debout en parallèle dans un autre onglet kubectl.
-->

---

<!-- _class: about -->

<img class="portrait" src="../assets/clement-portrait-studio.png" alt="Clément Liard" />

<div class="who">

# Clément Liard

## Tech Lead DevSecOps · Dirigeant **A00** · Brest

- ~10 ans en infrastructures critiques — **Défense**, Fintech (Treezor PCI-DSS), IoT
- Spécialiste **air-gapped**, Zero Trust, IaC (Terraform/OpenTofu) et conteneurisation durcie (Podman/Talos)
- **st4ck** = mon banc d'essai souverain · `github.com/Destynova2/st4ck` · `a00.fr`

</div>

<!--
Pacing: 30 s. Se présenter brièvement. Le sujet, c'est st4ck, pas moi.
« Je dirige A00, je conçois des plateformes K8s pour des environnements où on ne peut pas dépendre d'un hyperscaler — Défense, Fintech, air-gapped. st4ck est ce que j'aurais voulu avoir sur mes 5 dernières missions. »
Si la salle réagit au mot "Défense" : ne pas s'attarder, c'est juste pour positionner le sérieux du contexte.
-->

---

# Combien de **secrets** vivent dans vos repos Git&nbsp;?

- Tokens cloud collés dans des `values.yaml`
- Certificats régénérés à la main, expirés un dimanche soir
- Un **agent IA** qui tourne avec un token AWS oublié dans un ConfigMap

> *Le cloud-native nous a vendu la reproductibilité. On a hérité de l'opacité.*

<!--
Pacing: 90 s. Lever la main « qui a déjà commit un .env par accident ? ».
Anecdote : la fois où j'ai dû régénérer 80 certs à la main parce qu'un teammate
les avait stockés dans un Vault dont personne n'avait la clé d'unseal.
Transition : « st4ck, c'est ce que j'aurais voulu avoir ce jour-là. »
-->

---

<!-- _class: stats -->

# La promesse en **trois chiffres**

<div class="stats">
<div>
<span class="num">30–45 min</span>
<span class="label">du bare metal à la prod</span>
<span class="sub">8 stacks séquentiels, un seul <code>make</code></span>
</div>
<div>
<span class="num">0 fuite</span>
<span class="label">gitleaks scan en CI à chaque PR</span>
<span class="sub">random_id Terraform → OpenBao → Helm</span>
</div>
<div>
<span class="num">−65 %</span>
<span class="label">coût VM → bare metal</span>
<span class="sub"><strong>1715 €</strong> → <strong>599 €/mois</strong><br/>même CPU, +320 GB de RAM (ADR-024)</span>
</div>
</div>

<!--
Pacing: 60 s. Pointer chaque carte. Mesurer les chiffres : « 30 à 45 min, c'est sur Scaleway,
incluant le provisioning des serveurs. 0 secret, c'est `gitleaks detect` → 0 fuite. −65 %,
c'est l'écart mensuel entre une POP2 64C/256G à 1715 € et une EM-I620E 64C/576G à 599 €
(références Scaleway, ADR-024). Break-even dès 2 h/jour de charge soutenue, hors coût ops. »
Transition : « Le reste de ce talk = la preuve de ces trois chiffres. »
-->

---

<!-- _class: divider -->

## Acte 1
# **L'architecture**

---

# st4ck en **5 briques**

| Couche | Choix | Géré par |
|---|---|---|
| **OS** | Talos Linux 1.12 — immutable, zéro SSH | TF |
| **CNI** | Cilium 1.17 (eBPF) — kube-proxy-less, mTLS | TF + Flux |
| **Secrets** | OpenBao Raft + `templatefile()` *(ESO ciblé)* | TF |
| **Stockage** | Garage S3 + Velero — ~300 MB RAM | TF + Flux |
| **GitOps** | Flux v2 — 14 stacks réconciliés en continu | Flux |

> *TF = bootstrap & ordering strict · Flux = drift detection day-2 (ADR-004)*

<!--
Pacing: 80 s. Une ligne par brique. Insister sur la frontière TF/Flux (ADR-004) : TF déploie en ordering strict (chicken-egg Cilium, Helm initial release), Flux gère la dérive jour-2 (drift detection, reconciliation continue).
ESO (External Secrets Operator) n'est PAS le chemin par défaut chez nous (ADR-007 amendé). La majorité des secrets passent par `templatefile()` Terraform → Helm values directes. ESO ne sert que pour identity (Kratos/Hydra OIDC) et cosign — workloads qui consomment OpenBao hors TF.
Si Istio dans la salle : NetworkPolicy + Cilium mTLS suffisent (ADR-013). Pas de mesh par défaut.
-->

---

# Le pod qui démarre **avant K8s**

```
make bootstrap   # pod Podman, local OU sur la VM CI Scaleway
```

- **OpenBao 3-node Raft** — state backend + secrets KV v2
- **vault-backend** (mTLS) — proxy HTTP pour OpenTofu
- **Gitea** — source Flux (manifestes + values)
- **Woodpecker CI** — runner `tofu apply`, `kubectl apply`
- **Matchbox** — PXE / iPXE pour bare-metal Day 1

> *Le cluster K8s peut être wipé : **ce pod survit**.*
> *Re-bootstrap ~30-45 min · tfstate chiffré Transit AES256-GCM96.*

<div class="warn">

**⚠️ HA OpenBao** — workaround scale 1→3 séquentiel · Helm-native HA reverté 2026-04-29 (split-brain Raft, ADR-026).

</div>

<!--
Pacing: 90 s. Slide meta-infra qui répond à la question piège : « où vit le tfstate avant que K8s n'existe ? ».
5 conteneurs dans un pod Podman (Quadlet, ADR-005) — OpenBao + vault-backend + Gitea + Woodpecker + Matchbox.
Le state TF est chiffré dans OpenBao via Transit AES256-GCM96, exporté via mTLS vers OpenTofu.
4 stages Scaleway : IAM (1) → image Talos (2) → cluster K8s (3) → CI VM (4).
Migration tunnel SSH local → distant : `tofu init -migrate-state` bascule backend file → HTTP.
Le pod SURVIT à un wipe complet du cluster K8s — c'est la chicken-and-egg résolue (ADR-009 state backend).

Honnêteté assumée : HA Raft OpenBao a souffert d'un split-brain Phase F-bis-2 (commit 78a301f, 2026-04-29). Workaround actuel = TF auto-recovery script (scale 1 → wait → scale 3). Pas glamour, mais ça marche. ADR-026 documente le risque accepté (static-seal avant migration KMS Scaleway).
-->

---

# **Les deux gros diffs** — l'OS et les secrets

<div class="two-col">
<div>

## Pas de shell sur les nœuds

```bash
talosctl -n 10.0.0.10 services
talosctl -n 10.0.0.10 upgrade --image …
talosctl -n 10.0.0.10 reset
```

- Zéro `ssh root@` — surface d'attaque s'effondre
- Zéro patch manuel — l'OS se **redéploie**
- PCI/HDS plus simple à défendre
- Courbe `talosctl` : ~1 h

</div>
<div>

## Les secrets ne touchent pas le disque

```hcl
resource "random_id" "admin_token" {
  byte_length = 32
}
resource "vault_kv_secret_v2" "admin" {
  data_json = jsonencode({
    token = random_id.admin_token.b64_url
  })
}
```

- tfstate chiffré dans OpenBao (Transit AES256-GCM96)
- Helm `templatefile()` injecte (ESO ciblé : identity, cosign)
- **Aucun humain** ne saisit le secret initial
- `gitleaks detect` → **0 fuite**

</div>
</div>

<!--
Pacing: 150 s (ex 90+90). Slide pivot : les deux choix d'archi qui font la souveraineté.
À gauche : Talos zéro shell. La première fois qu'on essaie ssh et qu'on découvre qu'il n'y a même pas de sshd.
ROI sécurité immédiat. Si on demande « comment débugger un nœud cassé ? » → `talosctl support` produit un bundle ; si vraiment cassé, `reset` le nœud — 5 min.
À droite : random_id Terraform + ESO. Aucun humain ne voit ni ne saisit le secret initial.
Démo live possible : ouvrir le repo, `gitleaks detect` → 0 fuite. Effet garanti (vrai scanner, pas un grep naïf).
Anti-pattern qu'on évite : Helm values avec `password: changeme` qui finissent en commit.
-->

---

<!-- _class: divider -->

## Acte 2
# **Et l'IA dans tout ça ?**

---

# La stack **cible** pour **héberger des agents**

```
  agents → st4ck (Talos · OpenBao · Tetragon) → grob → LLM externes
```

- **Talos zéro shell** → un agent compromis ne peut pas pivoter sur l'OS
- **OpenBao + ExternalSecrets** → il ne voit que les secrets de son tenant
- **Kamaji** → un control plane par agent, *blast radius* (rayon d'impact) contenu
- **Tetragon (eBPF)** → chaque syscall de l'agent est tracé

> *Cas cible : scoring sentiment financier sub-2 min sur news FR/EN — bare metal Scaleway pour la latence d'inférence, grob pour la gouvernance LLM, OpenBao pour les clés API. **Cible Q3 2026.***

<!--
Pacing: 120 s. C'est le slide qui repositionne st4ck pour 2026.
Pas "encore un K8s stack", mais "le substrat sûr pour vos agents".
- Talos zéro shell : un agent compromis ne peut pas pivoter sur l'OS
- OpenBao + ESO : il ne voit que les secrets dont il a besoin (least privilege par CRD)
- Tetragon : runtime detection eBPF, on voit chaque syscall qu'il fait
- Kamaji : un control plane par agent → blast radius contenu
- grob : le seul chemin sortant pour le trafic LLM, audité
Si la salle se réveille ici, c'est l'occasion de mentionner grob plus longuement.
-->

---

<!-- _class: divider -->

## Acte 3
# **Convictions**

---

# **Anti-patterns** que st4ck refuse

- ❌ Secrets dans des `values.yaml` Helm → **fuite garantie**, audit ANSSI échoue
- ❌ `kubectl apply -f` pour bootstrap → impératif, **non-rejouable** (DR impossible)
- ❌ Empiler les CRDs sans ADR → **dette d'archi** (maturité Sandbox vs Graduated à évaluer)
- ❌ Service mesh par défaut → **charge ops significative** sans bénéfice mesuré (NetworkPolicy + Cilium mTLS suffisent — ADR-013)
- ❌ Backup non-testé → **RTO non garanti** (`velero restore` validé manuellement, automation CI roadmap Q2)

> *« Si ça marche en dev, ça marche en prod » : la phrase qui coûte le plus cher en post-incident.*

<!--
Pacing: 90 s. Slide opinion. Chaque ❌ est défendable, j'invite à challenger.
Anti-pattern le plus polémique : pas de service mesh par défaut. Beaucoup d'opérateurs
en mettent un par réflexe. ADR-013 explique pourquoi on attend un besoin réel.
-->

---

<!-- _class: divider -->

## Acte 4
# **Engagement**

---

# **Ce qui reste à faire** (et où vous pouvez aider)

- 🔬 **Mutation testing** sur les modules Terraform critiques
- 📚 **Documentation Diátaxis** complète (tutorials encore légers)
- 🧪 **Provider Karpenter CAPI** : tester sur 3 providers (Scaleway, OVH, Hetzner)
- 🌐 **Air-gap install** : valider transfert offline complet (Harbor mirror)
- 🤝 **Contributeurs bienvenus** : issues étiquetées `good-first-issue`

> *Un OSS vit par ses contributeurs. Bienvenue.*

<!--
Pacing: 80 s. Slide humilité. Lister ce qui n'est pas fini, pas vendre du rêve.
L'audience CNCF Lorient est mid-deep, ils détectent le bullshit en 30 secondes.
Plus on est honnête sur les gaps, plus on gagne leur confiance.
-->

---

# st4ck est lui-même **construit par des agents**

**Brigade de Cuisine** — orchestration multi-agent Claude Code

- **Chef** · plan, dispatch, ADRs
- **Sous-Chef Merge** · seul autorisé à push/PR
- **Commis** × N · code en parallèle, write-set isolé
- **3 voters** (qualité · scope · sécu) · quorum avant merge
- **10 worktrees git** : isolation, pas de stomping

> *Pas encore d'agents en prod chez des clients —*
> *st4ck a 1 utilisateur (moi). Mais déjà, des agents la construisent.*

<!--
Pacing: 75 s. Slide différenciateur. L'audience CNCF Lorient est mid-deep — leur montrer que tu shippes vite ET avec rigueur via une brigade Claude Code multi-agent les calme sur le « solo qui réinvente K8s ».
Honnêteté assumée : aujourd'hui 1 user (moi), pas de clients. Mais les agents sont déjà au taquet sur la fabrication. Boucle narrative : Acte 2 vendait « héberger des agents », ici on prouve qu'on en utilise déjà pour produire.
Si on demande « combien de tokens ? » → coût marginal vs gain de focus + parallélisme. Si on demande « où c'est documenté ? » → `.claude/shared-state.md` dans le repo.
-->

---

# **Ce qui tourne** · ce qui arrive

| | Périmètre | Statut |
|---|---|---|
| ✅ **Aujourd'hui** | 8 stacks fondations · 0 secret · 30–45 min · −65&nbsp;% (ADR-024) | Livré,&nbsp;mesuré |
| 🚧 **Q2 2026** | Phase A KaaS — Kamaji + CAPI + Karpenter (ADR-020) · CloudNativePG · Ollama CPU | En cours |
| 🎯 **Q3 2026** | Kamaji multi-tenant prod · grob (proxy LLM, audit, DLP) · vLLM + Mixtral 8x22B · RAG souverain | Roadmap |

> *Démo live de l'infra dans 2 minutes. La démo **agent** live viendra quand grob sera prêt.*

<!--
Pacing: 60 s. Slide d'honnêteté qui désamorce LA question Q&A létale : « vous pouvez nous montrer un agent qui tourne ? ».
Réponse : « Pas un agent aujourd'hui. Mais l'infra qui les hébergera, oui — regardons. »
Q2 = Phase A KaaS scaffolded sur main (branches `chore/phase-a-kaas-scaffold`, `feat/kamaji-karpenter`), pas encore de control plane prod.
Q3 = grob mature + vLLM/Mixtral GPU + RAG souverain. ADR-020 (Kamaji), ADR-024 (Karpenter EM-I620E vs POP2) dispos sur le repo.
Transition directe vers la slide démo.
-->

---

<!-- _class: divider -->

## Démo
# **Live, depuis zéro**

<!--
Pacing: 5 s. Slide de bascule visuelle vers le terminal. Pas de texte à lire, c'est un signal :
« on quitte les slides, on regarde du vrai ».
-->

---

# Ce qui tourne en direct *(lancé en parallèle depuis le début)*

```bash
# Sur Scaleway, en parallèle de mon talk
make scaleway-bootstrap-vm    # ~5 min : VM + vault-backend + Gitea
make scaleway-up               # ~25 min : Talos cluster + 8 stacks
```

- **VM Scaleway** : `ssh root@…` → `podman ps` (vault-backend + Gitea + Woodpecker)
- **Cluster Talos** : `talosctl health` → 6 nœuds (3 CP + 3 workers)
- **Preuve souveraineté** : `gitleaks detect` sur le repo → **0 fuite détectée**
- **Headlamp** : pods running, Garage S3 OK, Flux reconcile vert

> *Si quelque chose foire en live → bascule sur le cluster pré-staged, même preuves, même effet.*

<!--
Pacing: 150 s. C'EST le climax du talk. Ne pas lire les bullets, exécuter les commandes.

PROTOCOLE DÉMO (à dérouler dans cet ordre) :
1. Terminal 1 (Scaleway live) : `tail` du log de provisioning. Montrer l'avancement réel.
2. Terminal 2 (proof) : `gitleaks detect --source .` → **0 fuite**. Effet garanti (scanner réel, pas un grep).
3. Terminal 3 (cluster pré-staged L2) : déjà connecté. `kubectl get nodes`, `kubectl get pods -A | head`.
4. Browser : Headlamp ouvert sur le pré-staged → cliquer 1 deployment, montrer ESO en action.
5. Si live a fini = bonus : `talosctl -n <ip> services` sur le cluster fraîchement né.

PROCÉDURE DE BASCULE FAIL :
- Si le live échoue (Wi-Fi salle / Scaleway API / IAM) : NE PAS PANIQUER.
- Dire : « Live foiré, voici le même cluster déjà debout — c'est exactement ce que la démo aurait produit. »
- Continuer sur Terminal 3 + Browser. Le public retient l'honnêteté, pas le fail.

BACKUP L1 : asciinema pré-enregistré dans `~/demo/scaleway-up.cast` — `asciinema play -s 10`.
BACKUP L4 : screenshots embarqués dans dist/ (cluster + Headlamp) si projecteur lui-même HS.
-->

---

<!-- _class: invert -->

# Et si **vos secrets** ne vivaient pas dans Git&nbsp;?

## Pas en clair. Pas sur le disque dev. Pas en commit.

<div class="cta-row">
<div class="cta">

## `git clone` · `make local-up` · feedback issue

**github.com/Destynova2/st4ck** — étoiles bienvenues
**Contact** : issues GitHub · Slack CNCF Lorient

</div>
<div class="qr">

<img src="../assets/linkedin-qr.png" alt="LinkedIn Clément Liard" />

<span>Connectons-nous sur LinkedIn</span>

</div>
</div>

<!--
Pacing: 60 s. Callback explicite à la slide 2 (« secrets dans Git ») → « ne vit pas dans Git ».
3 CTA empilés : essayer, contribuer, revenir. Inviter Q&A.
QR LinkedIn affiché tout le long du Q&A → la salle peut scanner pendant les questions.
Q&A possibles : « k3s vs Talos », « comment vous gérez le DR ? », « cost réel à l'usage ».
Réponses prêtes : ADR-013 (mesh), ADR-018 (DR), ADR-024 (cost).
Annexes A/B/C disponibles pour Q&A — naviguer avec Page Down si besoin de schémas.
-->

---

<!-- _class: divider -->
<!-- _footer: 'st4ck — Annexes · CNCF Lorient · 2026-04-30' -->

## Q&A · annexes
# **Schémas de référence**

<!--
Pacing: skip en flux normal. Slide servant de séparateur visuel entre la close du talk
et les schémas pour Q&A. Si un participant demande l'archi : Page Down vers Annexe A.
-->

---

<!-- _footer: 'st4ck — Annexe A · CNCF Lorient · 2026-04-30' -->

# Annexe A — **Architecture st4ck**

```
┌─ Workstation OR Scaleway CI VM ─────────────────────────────┐
│ Pod Podman (Quadlet · 5 conteneurs)                         │
│   • OpenBao 3-node Raft  ←─ KV v2 + Transit AES256-GCM96    │
│   • vault-backend (mTLS) ←─ HTTP proxy pour OpenTofu        │
│   • Gitea                ←─ source Flux (manifests + values)│
│   • Woodpecker CI        ←─ runner tofu / kubectl           │
│   • Matchbox             ←─ PXE / iPXE bare-metal Day 1     │
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼  tofu apply (state chiffré dans OpenBao)
┌─ Talos cluster · K8s 1.35 ──────────────────────────────────┐
│ 3 control planes + 3 workers · zéro SSH · API mTLS          │
│ CNI Cilium 1.17 (eBPF) · CD Flux v2 · S3 Garage + Velero    │
│ 14 stacks · 8 fondations live + 6 KaaS (Phase A en cours)   │
│ PKI · monitoring · identity · security · storage · ...      │
└─────────────────────────────────────────────────────────────┘
```

<!--
Pacing: ouvrir uniquement sur Q&A « montre l'archi ».
Points clés à pointer : (1) tout le bootstrap vit dans le pod Podman, (2) le state TF est chiffré
dans OpenBao via Transit, donc même `cat tfstate` ne fuite rien, (3) la flèche descendante
marque la chicken-and-egg résolue : OpenTofu écrit dans OpenBao AVANT que K8s n'existe.
-->

---

<!-- _footer: 'st4ck — Annexe B · CNCF Lorient · 2026-04-30' -->

# Annexe B — **Bootstrap from zero**

```
T+0:00  make scaleway-bootstrap-vm
        ├ tofu apply IAM (clés R/W + readonly)
        ├ build Talos image (factory.talos.dev)
        └ scw instance create CI VM (DEV1-M, cloud-init)
T+0:05  Pod Podman lance · OpenBao 1-node + vault-backend
        ├ PKI 3-tier (root → infra → app CA)
        └ Gitea API + Woodpecker OAuth seed
T+0:10  scaleway-fetch-creds && scaleway-tunnel-start
        └ scp kms-output/* + ssh -L 8080 -L 8200 (bg)
T+0:12  tofu init -migrate-state    # file → HTTP distant
T+0:15  make scaleway-up · cluster Talos + 8 stacks séquentiels
        Cilium → PKI → monitoring → identity → security → storage → flux
T+0:35  make scaleway-headlamp · token clipboard → dashboard ✓
```

<!--
Pacing: pour Q&A « combien de temps réellement ? ». Insister sur le séquentiel : on ne paralllise
pas car chaque stack a une dépendance forte sur la précédente (PKI avant identity, identity
avant security policies, etc.). 30-45 min mesuré sur Scaleway POP2-4C-16G.
Si question « pourquoi 1-node OpenBao au début ? » : split-brain Raft Phase F-bis-2 reverté hier
(commit 78a301f), workaround scale-up séquentiel 1 → 3 après pod 0 leader établi.
-->

---

<!-- _footer: 'st4ck — Annexe C · CNCF Lorient · 2026-04-30' -->

# Annexe C — **Chaîne secret end-to-end**

```
TF random_id / random_password
        │
        ▼
vault-backend (HTTP proxy, mTLS)
        │
        ▼
OpenBao KV v2 (Raft 3-node)  ←─ tfstate chiffré Transit AES256-GCM96
        │
        ├──── Helm templatefile()  →  HelmRelease (Flux)  →  K8s Secret  →  Pod
        │      « chemin défaut » · 12 stacks · synchrone Terraform
        │
        └──── ClusterSecretStore  →  ExternalSecret CRD  →  K8s Secret  →  Pod
              « chemin ESO ciblé » · identity (Kratos/Hydra) + cosign
```

> *ADR-007 (OpenBao + ESO amendé) · ADR-008 (random_id) · ADR-009 (state backend OpenBao)*

<!--
Pacing: Q&A « comment exactement vous évitez les secrets en clair ? ».
8 hops réels. Le tfstate vit chiffré dans OpenBao via le moteur Transit (AES256-GCM96), donc
même un dump du tfstate ne fuite rien. ESO n'est PAS le chemin par défaut (ADR-007 amendé) —
il sert pour identity (Kratos/Hydra) qui consomme OpenBao hors-Terraform et pour cosign.
Pour les 12 autres stacks : Helm templatefile() injecte directement les valeurs depuis le tfstate
décodé en mémoire (jamais sur disque dev).
-->
