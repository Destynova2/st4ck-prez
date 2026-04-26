SLIDES_DIR := slides
THEME      := themes/cncf-lorient.css
DIST       := dist
MARP       := npx --yes @marp-team/marp-cli@latest

.PHONY: all html pdf preview clean install-check validate assets

all: html pdf

# Playwright validator: overflow + overlap + screenshots
validate: html
	node tools/validate.mjs

html: assets
	$(MARP) --input-dir $(SLIDES_DIR) --theme $(THEME) --html -o $(DIST)/
	@# Rewrite ../assets/ → assets/ so dist/ HTML works in Safari (no parent traversal on file://).
	@sed -i.bak 's|"../assets/|"assets/|g' $(DIST)/*.html && rm -f $(DIST)/*.html.bak

pdf:
	$(MARP) --input-dir $(SLIDES_DIR) --theme $(THEME) --pdf --allow-local-files -o $(DIST)/

assets:
	@mkdir -p $(DIST)/assets
	@cp -R assets/. $(DIST)/assets/

# Live preview. Usage: make preview DECK=lightning-st4ck
preview:
	@if [ -z "$(DECK)" ]; then echo "Usage: make preview DECK=lightning-st4ck"; exit 1; fi
	$(MARP) $(SLIDES_DIR)/$(DECK).md --theme $(THEME) --preview

clean:
	rm -rf $(DIST)

install-check:
	@command -v node >/dev/null 2>&1 || { echo "node not found — install Node.js 20+ first"; exit 1; }
	@command -v npx >/dev/null 2>&1 || { echo "npx not found — comes with Node.js"; exit 1; }
	@echo "Node $$(node --version) and npx detected. Ready to build."
