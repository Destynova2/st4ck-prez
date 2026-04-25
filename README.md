# st4ck-prez

Decks Marp pour présenter [st4ck](https://github.com/Destynova2/st4ck) — la
plateforme Kubernetes souveraine, air-gappable, **conçue pour héberger des
agents IA** (trading, LLM, RAG) avec [grob](https://github.com/azerozero/grob)
en proxy LLM frontal.

> *« Combien de secrets vivent dans vos repos Git ? La réponse de st4ck : zéro. »*

## Decks disponibles

| Format | Slides | Durée | Pour |
|---|---|---|---|
| [`pitch-st4ck.md`](slides/pitch-st4ck.md) | 3 | 2 min | Elevator, recruteur, démo flash |
| [`lightning-st4ck.md`](slides/lightning-st4ck.md) | 8 | 6 min | **CNCF Lorient — 30 avril 2026** |
| [`talk-st4ck.md`](slides/talk-st4ck.md) | 13 | 20 min | Conf longue (avec dividers et acte IA) |

Les trois decks partagent **un thème unique** ([`cncf-lorient.css`](themes/cncf-lorient.css))
calé sur la palette CNCF officielle (`#0086FF` / `#93EAFF` / `#D62293`) et la
police corporate **Clarity City** (fallback Montserrat).

## Démarrage rapide

```sh
# 1. Pré-requis (Node ≥ 20, géré par fnm via .node-version)
make install-check

# 2. Build HTML (les 3 decks d'un coup)
make html

# 3. Live preview pendant la rédaction
make preview DECK=lightning-st4ck

# 4. Export PDF (Marp télécharge Chromium au 1er run)
make pdf

# 5. Validation Playwright (overflow + overlap + screenshots HiDPI)
make validate
```

Sortie dans `dist/` (HTML + PDF) et `dist/screenshots/` (PNG par slide).

## Structure du repo

```
st4ck-prez/
├── slides/
│   ├── pitch-st4ck.md         # 3 slides, 2 min
│   ├── lightning-st4ck.md     # 8 slides, 6 min  (CNCF Lorient)
│   └── talk-st4ck.md          # 13 slides, 20 min
├── themes/
│   └── cncf-lorient.css       # thème CNCF + Clarity City
├── assets/
│   └── cnl-icon-color.svg     # logo CNCF Lorient (cncflorient/artwork)
├── tools/
│   └── validate.mjs           # Playwright: overflow + overlap detection
├── .github/workflows/
│   └── build-slides.yml       # CI: HTML + PDF en artefacts
├── _analysis/                 # screenshots de decks CNCF Lorient passés (audit visuel)
├── sched.md                   # soumission meetup (titre, abstract, bio)
├── Makefile                   # html, pdf, preview, clean, validate
├── package.json               # playwright (dev dep)
├── .node-version              # lts/* (fnm)
└── README.md
```

## Identité visuelle

Le thème reproduit fidèlement la charte CNCF actuelle (palette + Clarity City),
avec quelques classes Marp utilitaires :

| Classe | Usage | Layout |
|---|---|---|
| `<!-- _class: title -->` | Slide de couverture | Bloc bleu top-left + titre noir bold gauche |
| `<!-- _class: stats -->` | "Data Results" CNCG signature | 3 cartes blue/pink/cyan |
| `<!-- _class: lead -->` | Assertion forte centrée | Titre 64 px centré |
| `<!-- _class: divider -->` | Transition entre sections (talk) | "Acte N" + titre massif |
| `<!-- _class: invert -->` | Fond noir, accent cyan (closing) | Look KubeCon dramatic |

## Conventions CNCF Lorient

D'après l'audit Playwright de 4 decks passés (`_analysis/`) :

- **100 % français** — titres, body, code commentaires
- **Fond blanc dominant** — pas de gradient corner-to-corner (look 2018)
- **Titre aligné gauche** en bold noir (pas centré)
- **Date + lieu** en sous-titre gris
- **Footer discret** : numéro de page + nom du deck
- **Abstract sched.com** : 80–150 mots, un seul paragraphe

## Validation

`make validate` ouvre chaque deck dans Chromium headless à la résolution Marp
native (1280 × 720), puis :

1. parcourt chaque slide via le hash `#N`
2. mesure le bounding box de chaque élément
3. flag les **overflows** (élément qui sort de la `<section>`)
4. flag les **overlaps** entre enfants directs de la slide
5. screenshote en HiDPI dans `dist/screenshots/`

Tolérance 2 px (sub-pixel rounding). Le validateur **exit 1** sur issue, ce qui
peut être branché sur un git hook ou la CI.

## CI

Le workflow `.github/workflows/build-slides.yml` build les HTML + PDF via le
container `marpteam/marp-cli` (zéro install Node sur le runner) et upload les
artefacts. Si tu veux un Pages auto-publish, ajoute un `peaceiris/actions-gh-pages`
en fin de workflow.

## Sources et inspirations

- **Charte CNCF officielle** — palette + police : <https://www.cncf.io/brand-guidelines/>
- **Template CNCG slide deck** — layouts (stats, divider, closing) : Google Slides public
- **Audit visuel cncflorient/talks** — 4 decks 2024-2026 (Kyverno, Réseaux K8S, AI entreprise, Pulsar)
- **Marp** — moteur de rendu : <https://marp.app/>
- **Clarity City** — police open-source VMware via `@clr/city@1.1.0` sur jsDelivr
- **Playwright** — validation overflow/overlap

## Licence

[MIT](LICENSE) — code, thème et contenu des decks. Les éléments visuels CNCF
et CNCF Lorient appartiennent à leurs propriétaires respectifs et sont utilisés
en conformité avec la *CNCF Trademark Usage Guidelines*.
