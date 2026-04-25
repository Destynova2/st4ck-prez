---
marp: true
theme: cncf-lorient
paginate: true
footer: 'st4ck — pitch · 2 min'
title: 'st4ck : Kubernetes souverain en une commande'
description: 'Pitch flash 2 minutes — st4ck, plateforme Kubernetes souveraine sur Talos Linux.'
author: 'Ludwig'
---

<!-- _class: title -->

# st4ck

## Le Kubernetes **souverain** pour vos **agents IA**.

<!--
Pacing: 20 s. Hook unique, une seule phrase.
« st4ck, c'est le Kubernetes pour faire tourner des agents IA — trading, LLM, RAG —
sans leur donner les clés du royaume. » Marquer le silence 2 secondes.
Le pitch est un format flash : 3 slides, pas de digression.
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
<span class="label">coût bare metal vs cloud</span>
<span class="sub">EM-I620E vs POP2 64C/256G</span>
</div>
</div>

> Talos zéro-shell + OpenBao + Cilium eBPF + **grob** (proxy LLM audité). **Vos agents tournent ici, vos secrets restent ailleurs.**

<!--
Pacing: 70 s. Pointer chaque chiffre, marquer un silence.
30 min mesuré sur Scaleway. 0 secret = `git grep -i token` → 0. −65 % = break-even à 2h/jour.
Le tooling : Talos (zéro SSH), OpenBao (PKI + secrets), Cilium (eBPF + mTLS), grob (egress LLM audité).
Si on me demande « pourquoi pas k3s ? » : « k3s est un binaire, Talos est un OS. »
-->

---

<!-- _class: invert -->

# **Et si votre prochain cluster** ne vivait pas dans Git ?

## `git clone` · `make local-up` · **5 min** pour tester

**st4ck** — `github.com/azerozero/st4ck`
**grob** — `github.com/azerozero/grob`

<!--
Pacing: 30 s. Callback explicite slide 1 : « secret en Git » → « ne vit pas dans Git ».
3 verbes : essayer, contribuer, étoiler.
Mentionner grob comme suite logique : « la même logique appliquée au trafic LLM. »
Q&A possibles : « k3s ? » (différent niveau), « comment intégrer Kamaji ? » (Q3 2026).
-->
