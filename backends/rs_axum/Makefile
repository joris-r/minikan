.PHONY: setup run check

PORT ?= 8000

setup:
	cargo build

run:
	PORT=$(PORT) TEMP_STORAGE=$(TEMP_STORAGE) cargo run --quiet

check:
	cargo clippy --all-targets -- -D warnings
	cargo fmt --check
	cargo test
