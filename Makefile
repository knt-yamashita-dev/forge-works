PLUGIN_NAME := forge-works
VAULT_BASE := /Users/yamashita/Library/Mobile Documents/iCloud~md~obsidian/Documents
VAULT_DIR := $(VAULT_BASE)/vault-default
PLUGIN_DIR := $(VAULT_DIR)/.obsidian/plugins/$(PLUGIN_NAME)
SITE_RELEASE_DIR := $(CURDIR)/../promotion/public/releases/$(PLUGIN_NAME)

ALL_VAULTS := vault-default vault-ssi

.PHONY: build dev install uninstall deploy deploy-all publish-site clean

## Production build (type-check + minified bundle)
build:
	npm run build

## Watch mode for development
dev:
	npm run dev

## Create symlink to Obsidian vault
install:
	@mkdir -p "$(PLUGIN_DIR)"
	@ln -sf "$(CURDIR)/main.js" "$(PLUGIN_DIR)/main.js"
	@ln -sf "$(CURDIR)/manifest.json" "$(PLUGIN_DIR)/manifest.json"
	@[ -f styles.css ] && ln -sf "$(CURDIR)/styles.css" "$(PLUGIN_DIR)/styles.css" || true
	@echo "Installed to $(PLUGIN_DIR)"

## Remove symlink from Obsidian vault
uninstall:
	@rm -rf "$(PLUGIN_DIR)"
	@echo "Uninstalled from $(PLUGIN_DIR)"

## Build and copy to vault (no symlink, for iCloud-safe deploy)
deploy: build
	@mkdir -p "$(PLUGIN_DIR)"
	@cp main.js "$(PLUGIN_DIR)/main.js"
	@cp manifest.json "$(PLUGIN_DIR)/manifest.json"
	@[ -f styles.css ] && cp styles.css "$(PLUGIN_DIR)/styles.css" || true
	@echo "Deployed to $(PLUGIN_DIR)"

## Build and deploy to all vaults
deploy-all: build
	@for vault in $(ALL_VAULTS); do \
		dir="$(VAULT_BASE)/$$vault/.obsidian/plugins/$(PLUGIN_NAME)"; \
		mkdir -p "$$dir"; \
		cp main.js "$$dir/main.js"; \
		cp manifest.json "$$dir/manifest.json"; \
		[ -f styles.css ] && cp styles.css "$$dir/styles.css" || true; \
		echo "Deployed to $$dir"; \
	done

## Copy build artifacts to promotion site
publish-site: build
	@mkdir -p "$(SITE_RELEASE_DIR)"
	@cp main.js "$(SITE_RELEASE_DIR)/main.js"
	@cp manifest.json "$(SITE_RELEASE_DIR)/manifest.json"
	@[ -f styles.css ] && cp styles.css "$(SITE_RELEASE_DIR)/styles.css" || true
	@echo "Published to $(SITE_RELEASE_DIR)"

## Remove build artifacts
clean:
	@rm -f main.js
	@echo "Cleaned build artifacts"
