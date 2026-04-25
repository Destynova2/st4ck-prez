---
marp: true
theme: cncf-lorient
paginate: true
footer: 'st4ck — CNCF Lorient · 2026-04-30'
title: 'st4ck : Kubernetes souverain en une commande'
description: 'Lightning talk CNCF Lorient — st4ck, plateforme Kubernetes souveraine et air-gappable sur Talos Linux.'
author: 'Ludwig'
---

<!-- _class: title -->

<img class="portrait" src="../assets/ludwig-portrait-studio.png" alt="Ludwig" />

# st4ck

## Kubernetes **souverain** en une commande.
## Du bare metal à la prod, **sans secret en Git**.

CNCF Lorient · 30 avril 2026 · Queven, Bretagne

<!--
Pacing: 30 s. Poser le décor en 3 mots clés : souverain, une commande, sans secret en Git.
Énoncer son nom, et préciser tout de suite : « 6 minutes, démo à la fin si on a le temps ».
Callback ouvert → ferme sur slide 8.
-->

---

# Combien de **secrets** vivent dans vos repos Git ?

- Tokens cloud collés dans des `values.yaml`
- Certificats régénérés à la main, expirés un dimanche soir
- Un **agent IA** qui tourne avec un token AWS oublié dans un ConfigMap
- L'audit ANSSI dans 3 mois, et toujours pas d'air gap

> *Le cloud-native nous a vendu la reproductibilité. On a hérité de l'opacité.*

<!--
Pacing: 60 s. Le hook : on ne parle pas d'outil, on parle de douleur.
Lever la main « qui a déjà commit un .env par accident ? » — ça réveille la salle.
Transition : « st4ck, c'est ma réponse à ces 4 lignes-là. »
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
<span class="label">coût bare metal vs cloud (charge soutenue)</span>
<span class="sub">EM-I620E 599€ (64C/576G) vs POP2 1715€ (64C/256G) · hors coût ops · ADR-024</span>
</div>
</div>

<!--
Pacing: 30 s. Slide signature CNCG (3 stats). Pointer chaque chiffre, marquer un silence.
30 min : c'est mesuré sur Scaleway, pas une projection. Inclut le temps de provisioning des serveurs.
0 secret : `git grep -i token` → 0 résultat. Démo possible si demande.
−65 % : sur 64 vCPU + 256 GB RAM soutenus 24/7. Le break-even est à ~2h/jour.
Le reste du deck = la preuve de ces trois nombres.
-->

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
Pacing: 50 s. Une ligne par brique, ne pas lire — pointer du doigt.
Insister sur deux mots : *séquentiels* (Cilium-first évite les race conditions CNI) et *random_id*
(les secrets sont générés par Terraform, jamais saisis, jamais stockés).
Si on me demande Istio : NetworkPolicy + Cilium mTLS suffisent (ADR-013).
-->

---

# Différenciateur #1 — **Pas de shell sur les nœuds**

```bash
# Le seul accès aux nœuds : une API gRPC mTLS
talosctl -n 10.0.0.10 services
talosctl -n 10.0.0.10 upgrade --image ghcr.io/siderolabs/...
talosctl -n 10.0.0.10 reset   # reproductible, pas de drift
```

- **Zéro `ssh root@`** — la surface d'attaque s'effondre
- **Zéro patch manuel** — l'OS se redéploie, il ne se modifie pas
- Conformité PCI/HDS plus simple à défendre devant un auditeur

<!--
Pacing: 50 s. C'est le slide « what's new ». Beaucoup d'opérateurs débarquent ici.
Anecdote : la première fois qu'on essaie de SSH et qu'on découvre qu'il n'y a même pas de sshd.
Courbe d'apprentissage talosctl ≈ 1h. Le ROI sécurité est immédiat.
-->

---

# Différenciateur #2 — **Les secrets ne touchent pas le disque dev**

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

<!--
Pacing: 60 s. C'est LA promesse "souveraineté".
Démo possible : `git grep -i token` sur le repo → 0 résultat. Effet garanti.
Anti-pattern qu'on évite : Helm values avec des `password: changeme`.
-->

---

# Vers la **souveraineté de vos agents IA**

- ✅ **Gate 1 livré** *(Q1 2026)* — 8 stacks fondations
- 🎯 **Isolation par agent** — Kamaji (1 control plane / tenant) + Karpenter (GPU à la demande, **−65 %**)
- 🎯 **Gouvernance LLM** — grob : proxy frontal audité, DLP *(prévention de fuite)*, multi-provider

<!--
Pacing: 60 s. Le slide « destination ». 3 bullets = 3 piliers : socle livré, isolation par agent, gouvernance trafic LLM.
Recadrage : Kamaji + Karpenter ne sont pas le but, ils sont le moyen. Le but, c'est
de faire tourner des agents IA (trading, LLM, RAG) dans un environnement audité.
grob, c'est le complément côté trafic LLM : un agent ne peut pas exfiltrer ce qu'il ne voit pas.
Backup à mentionner si questions IA : vLLM + Mixtral 8x22B sur GPU dédié, RAG souverain prévu Q3 2026.
Si la salle mord (questions IA), basculer sur grob en Q&A. Sinon rester sur l'angle infra.
-->

---

<!-- _class: invert -->

# Et si **votre prochain cluster** ne vivait pas dans Git ?

## `git clone` · `make local-up` · feedback en issue

**github.com/Destynova2/st4ck** — étoiles bienvenues
**Prochain meetup** : démo live Kamaji multi-tenant *(visée si Gate 2 livré)*

<!--
Pacing: 30 s. Callback explicite au slide 2 : on parlait des secrets dans Git, on ferme avec
"votre prochain cluster ne vit pas dans Git". Effet miroir.
3 CTA empilés : essayer (clone), contribuer (issue), revenir (prochain meetup).
Q&A : laisser 1 minute. Si question Talos vs k3s, répondre "k3s est un binaire,
Talos est un OS — ce n'est pas le même niveau de promesse".
-->
