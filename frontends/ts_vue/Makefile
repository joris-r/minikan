.PHONY: setup run check

PORT ?= 5173

setup:
	npm install

run:
	PORT=$(PORT) npm run dev

check:
	npm run type-check
	npx oxlint .
	npx eslint .
	npx prettier --check src/ vite.config.ts
	npx vitest run
