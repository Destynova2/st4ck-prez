---
marp: true
theme: cncf-lorient
paginate: true
footer: 'st4ck — talk · 20 min'
title: 'st4ck : Kubernetes souverain, du bare metal à la prod'
description: 'Talk 20 min — st4ck, plateforme Kubernetes souveraine sur Talos Linux : architecture, anti-patterns, roadmap.'
author: 'Ludwig'
---

<!-- _class: title -->

# st4ck

## Kubernetes **souverain**, du bare metal à la prod.
## Sans secret en Git, sans shell sur les nœuds.

Talk · 20 minutes · Q&A à la fin

<!--
Pacing: 45 s. Présenter, énoncer son nom, son rôle.
Annoncer la structure : « 4 actes — la douleur, la solution, l'architecture, la roadmap.
Q&A à la fin, pas de questions techniques pendant les 4 premières minutes. »
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
<span class="sub">random_id Terraform → OpenBao → ESO</span>
</div>
<div>
<span class="num">−65 %</span>
<span class="label">coût bare metal vs cloud</span>
<span class="sub">EM-I620E vs POP2 64C/256G — ADR-024</span>
</div>
</div>

<!--
Pacing: 60 s. Pointer chaque carte. Mesurer les chiffres : « 30 min, c'est sur Scaleway,
incluant le provisioning des serveurs. 0 secret, c'est `git grep -i token` → 0. −65 %,
c'est break-even à 2h/jour de charge soutenue. »
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
| **CNI** | Cilium 1.17 (eBPF) | Remplace kube-proxy, mTLS, L7 policies |
| **Secrets** | OpenBao + ESO | Random_id Terraform → jamais en clair |
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
- `git grep -i token` → 0 résultat (démo possible)

<!--
Pacing: 90 s. C'est LE slide « souveraineté ».
Démo live possible : ouvrir le repo, `git grep -i token` → 0. Effet garanti.
Anti-pattern qu'on évite : Helm values avec `password: changeme` qui finissent
en commit. Ici Terraform génère, on ne saisit jamais rien.
-->

---

<!-- _class: divider -->

## Acte 2
# **Et l'IA dans tout ça ?**

---

# La stack pour **héberger des agents** (trading, LLM, RAG)

```
  agents → st4ck (Talos · OpenBao · Tetragon) → grob → LLM externes
```

- **Talos zéro shell** → un agent compromis ne peut pas pivoter sur l'OS
- **OpenBao + ESO** → il ne voit que les secrets de son tenant
- **Kamaji** → un control plane par agent, blast radius contenu
- **Tetragon (eBPF)** → chaque syscall de l'agent est tracé
- **grob** → un seul chemin sortant audité pour le trafic LLM

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
- 🎯 **grob** : proxy LLM frontal (audit, DLP, routing multi-provider)
- 🎯 vLLM + Mixtral 8x22B sur GPU dédié, RAG souverain *(2026-Q3)*

<!--
Pacing: 90 s.
Recadrage du slide vision : Kamaji + Karpenter sont les briques infra,
grob est la brique gouvernance LLM, et le tout converge vers "héberger des agents en prod".
Si on me demande "vous pouvez me montrer grob ?" : "Volontiers, mais c'est un autre talk —
prochain meetup, sinon github.com/azerozero/grob".
-->

---

# **Anti-patterns** que st4ck refuse

- ❌ Stocker des secrets dans des `values.yaml` Helm
- ❌ Faire du `kubectl apply -f` pour bootstrap (impératif, non-rejouable)
- ❌ Empiler les CRDs sans ADR (CNCF Sandbox ≠ engagement à long terme)
- ❌ Service mesh par défaut (NetworkPolicy + Cilium mTLS suffisent — ADR-013)
- ❌ Backup non-testé (`velero restore` est rejoué en CI à chaque PR)

> *« Si ça marche en dev, ça marche en prod » est le mensonge le plus cher de l'industrie.*

<!--
Pacing: 90 s. Slide opinion. Chaque ❌ est défendable, j'invite à challenger.
Anti-pattern le plus polémique : pas de service mesh par défaut. Beaucoup d'opérateurs
en mettent un par réflexe. ADR-013 explique pourquoi on attend un besoin réel.
-->

---

# **Ce qui reste à faire** (et où vous pouvez aider)

- 🔬 **Mutation testing** sur les modules Terraform critiques
- 📚 **Documentation Diátaxis** complète (tutorials encore légers)
- 🧪 **Provider Karpenter CAPI** : tester sur 3 providers (Scaleway, OVH, Hetzner)
- 🌐 **Air-gap install** : valider transfert offline complet (Harbor mirror)
- 🤝 **Contributeurs bienvenus** : issues étiquetées `good-first-issue`

<!--
Pacing: 80 s. Slide humilité. Lister ce qui n'est pas fini, pas vendre du rêve.
L'audience CNCF Lorient est mid-deep, ils détectent le bullshit en 30 secondes.
Plus on est honnête sur les gaps, plus on gagne leur confiance.
-->

---

<!-- _class: invert -->

# Et si **votre prochain cluster** ne vivait pas dans Git ?

## `git clone` · `make local-up` · feedback en issue

**github.com/azerozero/st4ck** — étoiles bienvenues
**Prochain meetup** : démo live Kamaji multi-tenant
**Contact** : issues GitHub, Slack CNCF Lorient

<!--
Pacing: 60 s. Callback explicite à la slide 2 (« secrets dans Git ») → « ne vit pas dans Git ».
3 CTA empilés : essayer, contribuer, revenir. Inviter Q&A.
Q&A possibles : « k3s vs Talos », « comment vous gérez le DR ? », « cost réel à l'usage ».
Réponses prêtes : ADR-013 (mesh), ADR-018 (DR), ADR-024 (cost).
-->
