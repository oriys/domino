SHELL := /bin/sh

.DEFAULT_GOAL := help

PNPM ?= pnpm
NODE ?= node
COMPOSE ?= docker compose
PORT ?= 3001
ENV_FILE ?= .env
ENV_EXAMPLE ?= .env.example
PROJECT_DIR := $(CURDIR)

.PHONY: help env install setup dev build start lint check db-up db-down db-logs db-shell db-generate db-migrate db-studio seed clean

help: ## Show available commands
	@awk 'BEGIN { FS = ":.*##"; printf "\nUsage:\n  make <target>\n\nTargets:\n" } /^[a-zA-Z0-9_.-]+:.*##/ { printf "  %-14s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

env: ## Create .env from .env.example if it is missing
	@if [ -f "$(ENV_FILE)" ]; then \
		echo "$(ENV_FILE) already exists"; \
	elif [ -f "$(ENV_EXAMPLE)" ]; then \
		cp "$(ENV_EXAMPLE)" "$(ENV_FILE)"; \
		echo "Created $(ENV_FILE) from $(ENV_EXAMPLE)"; \
	else \
		echo "Missing $(ENV_EXAMPLE)"; \
		exit 1; \
	fi

install: ## Install dependencies with pnpm
	$(PNPM) install

setup: env install ## Prepare the local workspace
	@echo "Workspace is ready."

dev: env ## Start the Next.js dev server on PORT (default: 3001)
	@LOCK_PID="$$(lsof -t $(PROJECT_DIR)/.next/dev/lock 2>/dev/null | head -n 1)"; \
	if [ -n "$$LOCK_PID" ]; then \
		RUNNING_PORT="$$(lsof -Pan -p $$LOCK_PID -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR==2 { split($$9, parts, ":"); print parts[length(parts)] }')"; \
		if [ -n "$$RUNNING_PORT" ]; then \
			echo "Next.js dev is already running for this project on http://localhost:$$RUNNING_PORT (PID $$LOCK_PID)."; \
		else \
			echo "Next.js dev is already running for this project (PID $$LOCK_PID)."; \
		fi; \
		exit 0; \
	fi; \
	PORT_PID="$$(lsof -tiTCP:$(PORT) -sTCP:LISTEN 2>/dev/null | head -n 1)"; \
	if [ -n "$$PORT_PID" ]; then \
		PORT_CWD="$$(lsof -a -p $$PORT_PID -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1)"; \
		if [ "$$PORT_CWD" = "$(PROJECT_DIR)" ]; then \
			echo "Next.js is already running for this project on http://localhost:$(PORT) (PID $$PORT_PID)."; \
			exit 0; \
		fi; \
		echo "Port $(PORT) is already in use by PID $$PORT_PID. Stop it or run 'make dev PORT=<port>'."; \
		exit 1; \
	fi; \
	$(PNPM) exec next dev --port $(PORT)

build: ## Build the production app
	$(PNPM) run build

start: env ## Start the production app on PORT (default: 3001)
	@PORT_PID="$$(lsof -tiTCP:$(PORT) -sTCP:LISTEN 2>/dev/null | head -n 1)"; \
	if [ -n "$$PORT_PID" ]; then \
		PORT_CWD="$$(lsof -a -p $$PORT_PID -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1)"; \
		if [ "$$PORT_CWD" = "$(PROJECT_DIR)" ]; then \
			echo "Next.js is already running for this project on http://localhost:$(PORT) (PID $$PORT_PID)."; \
			exit 0; \
		fi; \
		echo "Port $(PORT) is already in use by PID $$PORT_PID. Stop it or run 'make start PORT=<port>'."; \
		exit 1; \
	fi; \
	$(PNPM) exec next start --port $(PORT)

lint: ## Run ESLint
	$(PNPM) run lint

check: lint build ## Run the standard validation checks

db-up: ## Start PostgreSQL with Docker Compose
	$(COMPOSE) up -d postgres

db-down: ## Stop PostgreSQL containers
	$(COMPOSE) down

db-logs: ## Tail PostgreSQL logs
	$(COMPOSE) logs -f postgres

db-shell: ## Open a psql shell in the PostgreSQL container
	$(COMPOSE) exec postgres psql -U domino -d domino

db-generate: env ## Generate Drizzle migration files
	$(PNPM) run db:generate

db-migrate: env ## Run Drizzle migrations
	$(PNPM) run db:migrate

db-studio: env ## Open Drizzle Studio
	$(PNPM) run db:studio

seed: ## Seed demo content (expects the app to be running on port 3001)
	@if [ "$(PORT)" != "3001" ]; then \
		echo "The seed script is hardcoded to http://localhost:3001. Run make with PORT=3001."; \
		exit 1; \
	fi
	$(NODE) scripts/seed-ecommerce-docs.mjs

clean: ## Remove local build artifacts
	rm -rf .next tsconfig.tsbuildinfo
