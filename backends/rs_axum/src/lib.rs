mod health;

use axum::{Router, routing::get};

/// Assembles the app: every route, under `/api`.
pub fn app() -> Router {
    Router::new().route("/api/health", get(health::health))
}
