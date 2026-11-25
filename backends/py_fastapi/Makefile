.PHONY: setup run check scope

PORT ?= 8000

setup:
	uv sync

run:
	uv run uvicorn minikan.app:app --reload --port $(PORT)

check:
	uv run ruff check .
	uv run ruff format --check .
	uv run pytest

# Partial backend: the names of the shared tests that apply to it.
scope:
	@echo health
