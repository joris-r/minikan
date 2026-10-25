mod auth;
mod boards;
pub mod db;
mod error;
mod health;

use axum::Router;
use axum::routing::{get, patch, post};
use sqlx::SqlitePool;

use crate::error::AppError;

/// Assembles the app: every route, under `/api`, sharing the database pool.
pub fn app(pool: SqlitePool) -> Router {
    Router::new()
        .route("/api/health", get(health::health))
        .route(
            "/api/boards",
            get(boards::list_boards).post(boards::create_board),
        )
        .route(
            "/api/boards/{id}",
            get(boards::get_board)
                .patch(boards::set_board_title)
                .delete(boards::delete_board),
        )
        .route("/api/boards/{id}/columns", post(boards::create_column))
        .route(
            "/api/columns/{id}",
            patch(boards::set_column_title).delete(boards::delete_column),
        )
        .route("/api/columns/{id}/cards", post(boards::create_card))
        .route("/api/columns/{id}/move", post(boards::move_column))
        .route(
            "/api/cards/{id}",
            patch(boards::set_card_title).delete(boards::delete_card),
        )
        .route("/api/cards/{id}/move", post(boards::move_card))
        .fallback(async || AppError::NotFound)
        .with_state(pool)
}

#[cfg(test)]
pub(crate) async fn test_app() -> Router {
    app(db::connect(true).await.unwrap())
}
