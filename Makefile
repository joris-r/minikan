.PHONY: setup backend frontend check check-backend check-frontend test-api test-e2e

BACKEND ?= py_litestar
FRONTEND ?= ts_vue
API_PORT ?= 8000
WEB_PORT ?= 5173

setup:
	$(MAKE) -C backends/$(BACKEND) setup
	$(MAKE) -C frontends/$(FRONTEND) setup
	cd tests/api && uv sync
	cd tests/e2e && npm install && npx playwright install chromium

backend:
	$(MAKE) -C backends/$(BACKEND) run PORT=$(API_PORT)

frontend:
	MINIKAN_API_URL=http://localhost:$(API_PORT) $(MAKE) -C frontends/$(FRONTEND) run PORT=$(WEB_PORT)

check: check-backend check-frontend test-api test-e2e

check-backend:
	$(MAKE) -C backends/$(BACKEND) check

check-frontend:
	$(MAKE) -C frontends/$(FRONTEND) check

test-api:
	cd tests/api && uv run ruff check . && uv run ruff format --check .
	scripts/with-backend.sh $(BACKEND) $(API_PORT) uv run --project tests/api pytest tests/api

test-e2e:
	cd tests/e2e && npx tsc -p .
	cd tests/e2e && BACKEND=$(BACKEND) FRONTEND=$(FRONTEND) API_PORT=$(API_PORT) WEB_PORT=$(WEB_PORT) npx playwright test
