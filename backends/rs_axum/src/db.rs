use sqlx::SqlitePool;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use uuid::Uuid;

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users (id),
    title TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS columns (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    column_id TEXT NOT NULL REFERENCES columns (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL
);
";

const SEEDED_USERS: [&str; 2] = ["demo", "other"];

/// Opens the database, in memory or in `minikan.db`, with its schema and seeded users.
///
/// The pool holds a single connection, kept open forever: an in-memory
/// database lives only as long as its connection, and one writer at a time
/// spares SQLite's busy errors between concurrent transactions.
pub async fn connect(temporary: bool) -> Result<SqlitePool, sqlx::Error> {
    let options = if temporary {
        SqliteConnectOptions::new().in_memory(true)
    } else {
        SqliteConnectOptions::new()
            .filename("minikan.db")
            .create_if_missing(true)
    }
    .foreign_keys(true);
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .idle_timeout(None)
        .max_lifetime(None)
        .connect_with(options)
        .await?;

    sqlx::raw_sql(SCHEMA).execute(&pool).await?;
    for name in SEEDED_USERS {
        sqlx::query("INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)")
            .bind(new_id())
            .bind(name)
            .execute(&pool)
            .await?;
    }
    Ok(pool)
}

pub fn new_id() -> String {
    Uuid::now_v7().to_string()
}
