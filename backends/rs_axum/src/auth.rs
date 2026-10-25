use axum::extract::FromRequestParts;
use axum::http::header::AUTHORIZATION;
use axum::http::request::Parts;
use sqlx::SqlitePool;

use crate::error::AppError;

/// The user named by the request's Bearer token.
pub struct CurrentUser {
    pub id: String,
}

impl FromRequestParts<SqlitePool> for CurrentUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, pool: &SqlitePool) -> Result<Self, AppError> {
        let name = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("Bearer "))
            .ok_or(AppError::Unauthorized)?;
        let id = sqlx::query_scalar("SELECT id FROM users WHERE name = ?")
            .bind(name)
            .fetch_optional(pool)
            .await?
            .ok_or(AppError::Unauthorized)?;
        Ok(CurrentUser { id })
    }
}
