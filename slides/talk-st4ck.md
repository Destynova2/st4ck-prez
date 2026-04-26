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
## Sans secret en Git, sans shell sur les nœuds.

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

# Combien de **secrets** vivent dans vos repos Git ?

- Tokens cloud collés dans des `values.yaml`
- Certificats régénérés à la main, expirés un dimanche soir
- Un **agent IA** qui tourne avec un token AWS oublié dans un ConfigMap
- L'audit ANSSI dans 3 mois, et toujours pas d'air gap

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
<span class="num">30 min</span>
<span class="label">du bare metal à la prod</span>
<span class="sub">8 stacks séquentiels, un seul <code>make</code></span>
</div>
<div>
<span class="num">0</span>
<span class="label">secret en clair dans le repo</span>
<span class="sub">random_id Terraform → OpenBao → ExternalSecrets</span>
</div>
<div>
<span class="num">−65 %</span>
<span class="label">coût VM → bare metal</span>
<span class="sub"><strong>1715 €</strong> → <strong>599 €/mois</strong><br/>même CPU, +320 GB de RAM</span>
</div>
</div>

<!--
Pacing: 60 s. Pointer chaque carte. Mesurer les chiffres : « 30 min, c'est sur Scaleway,
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

| Couche | Choix | Pourquoi |
|---|---|---|
| **OS** | Talos Linux 1.12 | Immutable, zéro SSH, API only |
| **IaC** | OpenTofu + Flux | 8 stacks séquentiels, GitOps day-2 |
| **Réseau (CNI)** | Cilium 1.17 (eBPF) | Remplace kube-proxy, mTLS *(auth chiffrée)*, L7 policies |
| **Secrets** | OpenBao + ExternalSecrets (ESO) | Random_id Terraform → jamais en clair |
| **Stockage** | Garage (S3) + Velero | ~300 MB RAM, backup/restore validé |

<!--
Pacing: 90 s. Une ligne par brique. Insister sur *séquentiels* (Cilium-first évite les
race conditions CNI) et *random_id* (Terraform génère, ne saisit jamais).
Si Istio : NetworkPolicy + Cilium mTLS suffisent (ADR-013). On y reviendra.
-->

---

# Diff #1 — **Pas de shell sur les nœuds**

```bash
# Le seul accès aux nœuds : une API gRPC mTLS
talosctl -n 10.0.0.10 services
talosctl -n 10.0.0.10 upgrade --image ghcr.io/siderolabs/...
talosctl -n 10.0.0.10 reset   # reproductible, pas de drift
```

- **Zéro `ssh root@`** — la surface d'attaque s'effondre
- **Zéro patch manuel** — l'OS se redéploie, il ne se modifie pas
- Conformité PCI/HDS plus simple à défendre devant un auditeur
- Courbe d'apprentissage `talosctl` : ~1 heure

<!--
Pacing: 90 s. Anecdote : la première fois qu'on essaie SSH et qu'on découvre qu'il n'y a même pas de sshd.
ROI sécurité immédiat. Si quelqu'un demande « comment je débugge un nœud cassé ? » :
`talosctl support` produit un bundle. Si vraiment cassé, on `reset` le nœud — 5 min.
-->

---

# Diff #2 — **Les secrets ne touchent pas le disque dev**

```hcl
# Terraform génère, OpenBao stocke, ESO injecte dans K8s
resource "random_id" "admin_token" { byte_length = 32 }
resource "vault_kv_secret_v2" "admin" {
  name = "admin", data_json = jsonencode({
    token = random_id.admin_token.b64_url
  })
}
```

- État Terraform chiffré dans **vault-backend** (KV v2)
- ExternalSecrets matérialise les `Secret` K8s à la volée
- **Aucun humain** ne voit ni ne saisit le secret initial
- `gitleaks detect` → **0 fuite** · scan en CI à chaque PR

<!--
Pacing: 90 s. C'est LE slide « souveraineté ».
Démo live possible : ouvrir le repo, `gitleaks detect` → 0 fuite. Effet garanti (vrai scanner, pas un grep naïf).
Anti-pattern qu'on évite : Helm values avec `password: changeme` qui finissent
en commit. Ici Terraform génère, on ne saisit jamais rien.
-->

---

<!-- _class: divider -->

## Acte 2
# **Et l'IA dans tout ça ?**

---

# La stack **cible** pour **héberger des agents** (LLM, RAG, scoring sentiment)

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

# Roadmap — **Kamaji, Karpenter, grob**

- ✅ **Gate 1** — 8 stacks fondations *(2026-Q1, livré)*
- 🚧 **Gate 2** — CloudNativePG, Ollama CPU, DecapCMS *(2026-Q2)*
- 🎯 **Kamaji** : un control plane par tenant/agent (ADR-020)
- 🎯 **Karpenter** + CAPI : GPU à la demande, bare metal mensuel >2h soutenu
  - **EM-I620E 599 €/mois (64C/576GB) vs POP2 1715 €/mois → −65 %** (ADR-024)
- 🎯 **grob** : proxy LLM frontal (audit, DLP *(prévention de fuite)*, routing multi-provider)
- 🎯 vLLM + Mixtral 8x22B sur GPU dédié, RAG souverain *(2026-Q3)*

<!--
Pacing: 90 s.
Recadrage du slide vision : Kamaji + Karpenter sont les briques infra,
grob est la brique gouvernance LLM, et le tout converge vers "héberger des agents en prod".
Si on me demande "vous pouvez me montrer grob ?" : "Volontiers, mais c'est un autre talk —
prochain meetup, sinon github.com/azerozero/grob".
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
- ❌ Service mesh par défaut → **+40 % charge ops** sans bénéfice (NetworkPolicy + Cilium mTLS suffisent — ADR-013)
- ❌ Backup non-testé → **RTO non garanti** (`velero restore` rejoué en CI à chaque PR)

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

# **Ce qui tourne** · ce qui arrive

| | Périmètre | Statut |
|---|---|---|
| ✅ **Aujourd'hui** | 8 stacks fondations · 0 secret · 30 min bare-metal-to-prod · −65 % | Livré, mesuré |
| 🚧 **Q2 2026** | CloudNativePG · Ollama CPU · DecapCMS | En cours |
| 🎯 **Q3 2026** | Kamaji multi-tenant · grob (proxy LLM) · vLLM/Mixtral | Roadmap |

> *Démo live de l'infra dans 2 minutes. La démo **agent** live, c'est pour le prochain meetup.*

<!--
Pacing: 60 s. Slide d'honnêteté qui désamorce LA question Q&A létale : « vous pouvez nous montrer un agent qui tourne ? ».
Réponse : « Pas un agent aujourd'hui. Mais l'infra qui les hébergera, oui — regardons. »
Transition directe vers la slide démo.
-->

---

<!-- _class: divider -->

## Démo
# **Live, depuis zéro**

<hr/>

<!--
Pacing: 5 s. Slide de bascule visuelle vers le terminal. Pas de texte à lire, c'est un signal :
« on quitte les slides, on regarde du vrai ».
-->

---

# Ce qui tourne en direct *(lancé à la slide 1)*

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

# Et si **votre prochain cluster** ne vivait pas dans Git ?

<div class="cta-row">
<div class="cta">

## `git clone` · `make local-up` · feedback en issue

**github.com/Destynova2/st4ck** — étoiles bienvenues
**Prochain meetup** : démo live Kamaji multi-tenant *(Gate 2)*
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
-->
