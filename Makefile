SHELL := /bin/bash
.DEFAULT_GOAL := help

C_SECTION := \033[1;33m
C_TARGET  := \033[36m
C_OK      := \033[32m
C_WARN    := \033[33m
C_ERR     := \033[31m
C_RESET   := \033[0m

RUN_DIR   := .run
WEB_PORT  ?= 4321
API_PORT  ?= 8787

# First free TCP port starting at $(1).
free_port = p=$(1); while lsof -nP -iTCP:$$p -sTCP:LISTEN >/dev/null 2>&1; do p=$$((p+1)); done; echo $$p

# Kill a process and all its descendants (portable: no setsid, no fuser).
define kill_tree
kill_tree() { local c; for c in $$(pgrep -P $$1 2>/dev/null); do kill_tree $$c; done; kill $$1 2>/dev/null; }
endef

# ─── Install / Setup ─────────────────────────────────────────────────────────

.PHONY: install
install: ## Install dependencies for the root and every workspace (bun)
	@bun install
	@printf "$(C_OK)[make] dependencies installed$(C_RESET)\n"

# ─── Dev servers ─────────────────────────────────────────────────────────────

.PHONY: dev
dev: ## Start Astro (web) and Hono (api) in the background on free ports
	@mkdir -p $(RUN_DIR)
	@if { [ -f $(RUN_DIR)/web.pid ] && kill -0 $$(cat $(RUN_DIR)/web.pid) 2>/dev/null; } || \
		{ [ -f $(RUN_DIR)/web.port ] && lsof -nP -iTCP:$$(cat $(RUN_DIR)/web.port) -sTCP:LISTEN >/dev/null 2>&1; }; then \
		printf "$(C_WARN)[make] already running, use make stop first$(C_RESET)\n"; exit 0; fi; \
	[ -d node_modules ] || bun install; \
	web=$$($(call free_port,$(WEB_PORT))); \
	api=$$($(call free_port,$(API_PORT))); \
	[ "$$web" = "$$api" ] && api=$$($(call free_port,$$((api+1)))); \
	( cd apps/server && { PORT=$$api NODE_ENV=development LOG_LEVEL=debug \
		nohup ./node_modules/.bin/tsx watch src/index.ts > ../../$(RUN_DIR)/api.log 2>&1 & echo $$! > ../../$(RUN_DIR)/api.pid; } ); \
	( cd apps/web && { nohup ./node_modules/.bin/astro dev --host 127.0.0.1 --port $$web \
		> ../../$(RUN_DIR)/web.log 2>&1 & echo $$! > ../../$(RUN_DIR)/web.pid; } ); \
	echo $$web > $(RUN_DIR)/web.port; echo $$api > $(RUN_DIR)/api.port; \
	printf "$(C_OK)[make] web  http://127.0.0.1:$$web/$(C_RESET)\n"; \
	printf "$(C_OK)[make] api  http://127.0.0.1:$$api/$(C_RESET)\n"; \
	printf "[make] logs $(RUN_DIR)/web.log $(RUN_DIR)/api.log (make logs)\n"

.PHONY: stop
stop: ## Stop the dev servers started by make dev
	@$(kill_tree); stopped=0; \
	for name in web api; do f=$(RUN_DIR)/$$name.pid; port=$(RUN_DIR)/$$name.port; pids=""; \
		[ -f $$f ] && pids=$$(cat $$f); \
		[ -f $$port ] && pids="$$pids $$(lsof -t -nP -iTCP:$$(cat $$port) -sTCP:LISTEN 2>/dev/null)"; \
		if [ -n "$${pids// }" ]; then for p in $$pids; do kill_tree $$p; done; stopped=1; \
			printf "$(C_OK)[make] $$name stopped$(C_RESET)\n"; fi; \
		rm -f $$f $$port; \
	done; \
	[ $$stopped = 1 ] || printf "$(C_WARN)[make] nothing to stop$(C_RESET)\n"

.PHONY: status
status: ## Show whether the dev servers are running and on which ports
	@for name in web api; do f=$(RUN_DIR)/$$name.pid; \
		port=$(RUN_DIR)/$$name.port; \
		if { [ -f $$f ] && kill -0 $$(cat $$f) 2>/dev/null; } || \
			{ [ -f $$port ] && lsof -nP -iTCP:$$(cat $$port) -sTCP:LISTEN >/dev/null 2>&1; }; then \
			printf "$(C_OK)[make] $$name running on :$$(cat $$port)$(C_RESET)\n"; \
		else printf "$(C_WARN)[make] $$name not running$(C_RESET)\n"; fi; \
	done

.PHONY: logs
logs: ## Follow the dev server logs
	@tail -f $(RUN_DIR)/web.log $(RUN_DIR)/api.log

# ─── Build / Check ───────────────────────────────────────────────────────────

.PHONY: typecheck
typecheck: ## Typecheck every workspace
	@bun run typecheck

.PHONY: test
test: ## Run the backend and shared tests (vitest)
	@bun run test

# ─── Help ────────────────────────────────────────────────────────────────────

.PHONY: help
help: ## List targets grouped by section
	@awk 'BEGIN {FS = ":.*?## "} \
		/^# ─── / { s = $$0; gsub(/^# ─── | ─+$$/, "", s); printf "\n$(C_SECTION)%s$(C_RESET)\n", s; next } \
		/^[a-zA-Z_-]+:.*?## / { printf "  $(C_TARGET)%-12s$(C_RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
