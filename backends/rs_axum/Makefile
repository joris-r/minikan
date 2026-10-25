.PHONY: setup run check scope

PORT ?= 8000

setup:
	cargo build

# No storage yet: TEMP_STORAGE is accepted and has no effect.
run:
	PORT=$(PORT) cargo run --quiet

check:
	cargo clippy --all-targets -- -D warnings
	cargo fmt --check
	cargo test

scope:
	@echo health
