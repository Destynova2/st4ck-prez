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

## Kubernetes **souverain** en une commande.
## Du bare metal à la prod, **sans secret en Git**.

Pitch · 2 minutes

<!--
Pacing: 30 s. Une phrase d'introduction : « st4ck, c'est ma réponse à la question
‹combien de secrets vivent dans nos repos Git ?› ». Énoncer son nom, marquer le silence.
Le pitch est un format flash, pas un talk : 3 slides, pas de wandering.
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
<span class="sub">EM-I620E vs POP2 64C/256G</span>
</div>
</div>

> Talos + OpenTofu + Cilium + OpenBao. Air-gappable. **Pensé pour héberger vos agents.**

<!--
Pacing: 60 s. Pointer chaque chiffre, marquer un silence après chaque.
Mentionner les 4 outils-clés en une phrase : Talos, OpenTofu, Cilium, OpenBao.
Si on me demande « pourquoi pas k3s ? » : « k3s est un binaire, Talos est un OS — pas le même niveau de promesse ».
-->

---

<!-- _class: invert -->

# **Et si votre prochain cluster** ne vivait pas dans Git ?

## `git clone` · `make local-up` · feedback en issue

**github.com/azerozero/st4ck**

<!--
Pacing: 30 s. Callback à la slide 1 « sans secret en Git » → « ne vit pas dans Git ».
3 verbes : essayer, contribuer, étoiler. Si question, donner mon mail/GitHub.
-->
