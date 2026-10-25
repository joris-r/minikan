use std::collections::HashMap;

use axum::Json;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqliteConnection, SqlitePool};

use crate::auth::CurrentUser;
use crate::db::new_id;
use crate::error::{AppError, JsonBody};

const MAX_TITLE_CHARS: usize = 100;

/// A board, column or card, as listed or created.
#[derive(Serialize, FromRow)]
pub struct Titled {
    id: String,
    title: String,
}

#[derive(Serialize)]
pub struct BoardDetail {
    id: String,
    title: String,
    columns: Vec<ColumnDetail>,
}

#[derive(Serialize)]
pub struct ColumnDetail {
    id: String,
    title: String,
    cards: Vec<Titled>,
}

#[derive(FromRow)]
struct CardRow {
    id: String,
    title: String,
    column_id: String,
}

#[derive(Deserialize)]
pub struct TitleBody {
    title: String,
}

#[derive(Deserialize)]
pub struct MoveColumnBody {
    position: i64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveCardBody {
    column_id: String,
    position: i64,
}

/// A column or card in its ordered list: the list is identified by `parent`.
#[derive(FromRow)]
struct Placed {
    parent: String,
    position: i64,
}

/// The ordered lists: columns in a board, cards in a column.
#[derive(Clone, Copy)]
enum List {
    Columns,
    Cards,
}

/// The SQL of one list's operations, static so that sqlx accepts it as safe.
struct ListSql {
    len: &'static str,
    append: &'static str,
    close_gap: &'static str,
    open_gap: &'static str,
    place: &'static str,
}

const COLUMNS_SQL: ListSql = ListSql {
    len: "SELECT COUNT(*) FROM columns WHERE board_id = ?",
    append: "INSERT INTO columns (id, board_id, title, position)
             SELECT ?, ?, '', COALESCE(MAX(position), 0) + 1 FROM columns WHERE board_id = ?
             RETURNING id, title",
    close_gap: "UPDATE columns SET position = position - 1 WHERE board_id = ? AND position > ?",
    open_gap: "UPDATE columns SET position = position + 1 WHERE board_id = ? AND position >= ?",
    place: "UPDATE columns SET board_id = ?, position = ? WHERE id = ?",
};

const CARDS_SQL: ListSql = ListSql {
    len: "SELECT COUNT(*) FROM cards WHERE column_id = ?",
    append: "INSERT INTO cards (id, column_id, title, position)
             SELECT ?, ?, '', COALESCE(MAX(position), 0) + 1 FROM cards WHERE column_id = ?
             RETURNING id, title",
    close_gap: "UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?",
    open_gap: "UPDATE cards SET position = position + 1 WHERE column_id = ? AND position >= ?",
    place: "UPDATE cards SET column_id = ?, position = ? WHERE id = ?",
};

impl List {
    fn sql(self) -> &'static ListSql {
        match self {
            List::Columns => &COLUMNS_SQL,
            List::Cards => &CARDS_SQL,
        }
    }

    async fn append(self, db: &mut SqliteConnection, parent: &str) -> Result<Titled, sqlx::Error> {
        sqlx::query_as(self.sql().append)
            .bind(new_id())
            .bind(parent)
            .bind(parent)
            .fetch_one(db)
            .await
    }

    /// Shifts the elements after `position` back by one, closing the gap left there.
    async fn close_gap(
        self,
        db: &mut SqliteConnection,
        parent: &str,
        position: i64,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(self.sql().close_gap)
            .bind(parent)
            .bind(position)
            .execute(db)
            .await?;
        Ok(())
    }

    /// Moves an element from its place to `position` in the list `to`, its own or another.
    async fn move_to(
        self,
        db: &mut SqliteConnection,
        id: &str,
        from: &Placed,
        to: &str,
        position: i64,
    ) -> Result<(), sqlx::Error> {
        let sql = self.sql();
        let len: i64 = sqlx::query_scalar(sql.len)
            .bind(to)
            .fetch_one(&mut *db)
            .await?;
        // R8: the length counts the moved element in its target list.
        let position = position.clamp(1, len + i64::from(from.parent != to));
        self.close_gap(&mut *db, &from.parent, from.position)
            .await?;
        sqlx::query(sql.open_gap)
            .bind(to)
            .bind(position)
            .execute(&mut *db)
            .await?;
        sqlx::query(sql.place)
            .bind(to)
            .bind(position)
            .bind(id)
            .execute(&mut *db)
            .await?;
        Ok(())
    }
}

async fn owned_board(
    db: &mut SqliteConnection,
    user: &CurrentUser,
    id: &str,
) -> Result<Titled, AppError> {
    sqlx::query_as("SELECT id, title FROM boards WHERE id = ? AND user_id = ?")
        .bind(id)
        .bind(&user.id)
        .fetch_optional(db)
        .await?
        .ok_or(AppError::NotFound)
}

async fn owned_column(
    db: &mut SqliteConnection,
    user: &CurrentUser,
    id: &str,
) -> Result<Placed, AppError> {
    sqlx::query_as(
        "SELECT c.board_id AS parent, c.position FROM columns c
         JOIN boards b ON b.id = c.board_id
         WHERE c.id = ? AND b.user_id = ?",
    )
    .bind(id)
    .bind(&user.id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound)
}

async fn owned_card(
    db: &mut SqliteConnection,
    user: &CurrentUser,
    id: &str,
) -> Result<Placed, AppError> {
    sqlx::query_as(
        "SELECT k.column_id AS parent, k.position FROM cards k
         JOIN columns c ON c.id = k.column_id
         JOIN boards b ON b.id = c.board_id
         WHERE k.id = ? AND b.user_id = ?",
    )
    .bind(id)
    .bind(&user.id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound)
}

fn checked_title(body: TitleBody) -> Result<String, AppError> {
    if body.title.chars().count() > MAX_TITLE_CHARS {
        return Err(AppError::BadRequest(format!(
            "title: at most {MAX_TITLE_CHARS} characters"
        )));
    }
    Ok(body.title)
}

pub async fn list_boards(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
) -> Result<Json<Vec<Titled>>, AppError> {
    let boards = sqlx::query_as("SELECT id, title FROM boards WHERE user_id = ?")
        .bind(&user.id)
        .fetch_all(&pool)
        .await?;
    Ok(Json(boards))
}

pub async fn create_board(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
) -> Result<(StatusCode, Json<Titled>), AppError> {
    let board = sqlx::query_as(
        "INSERT INTO boards (id, user_id, title) VALUES (?, ?, '') RETURNING id, title",
    )
    .bind(new_id())
    .bind(&user.id)
    .fetch_one(&pool)
    .await?;
    Ok((StatusCode::CREATED, Json(board)))
}

pub async fn get_board(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
    Path(id): Path<String>,
) -> Result<Json<BoardDetail>, AppError> {
    let mut tx = pool.begin().await?;
    let board = owned_board(&mut tx, &user, &id).await?;
    let columns: Vec<Titled> =
        sqlx::query_as("SELECT id, title FROM columns WHERE board_id = ? ORDER BY position")
            .bind(&id)
            .fetch_all(&mut *tx)
            .await?;
    let cards: Vec<CardRow> = sqlx::query_as(
        "SELECT k.id, k.title, k.column_id FROM cards k
         JOIN columns c ON c.id = k.column_id
         WHERE c.board_id = ? ORDER BY k.position",
    )
    .bind(&id)
    .fetch_all(&mut *tx)
    .await?;
    tx.commit().await?;

    let mut cards_by_column: HashMap<String, Vec<Titled>> = HashMap::new();
    for card in cards {
        cards_by_column
            .entry(card.column_id)
            .or_default()
            .push(Titled {
                id: card.id,
                title: card.title,
            });
    }
    let columns = columns
        .into_iter()
        .map(|column| ColumnDetail {
            cards: cards_by_column.remove(&column.id).unwrap_or_default(),
            id: column.id,
            title: column.title,
        })
        .collect();
    Ok(Json(BoardDetail {
        id: board.id,
        title: board.title,
        columns,
    }))
}

pub async fn set_board_title(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
    Path(id): Path<String>,
    JsonBody(body): JsonBody<TitleBody>,
) -> Result<Json<Titled>, AppError> {
    let title = checked_title(body)?;
    let board = sqlx::query_as(
        "UPDATE boards SET title = ? WHERE id = ? AND user_id = ? RETURNING id, title",
    )
    .bind(title)
    .bind(&id)
    .bind(&user.id)
    .fetch_optional(&pool)
    .await?
    .ok_or(AppError::NotFound)?;
    Ok(Json(board))
}

pub async fn delete_board(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    let deleted = sqlx::query("DELETE FROM boards WHERE id = ? AND user_id = ?")
        .bind(&id)
        .bind(&user.id)
        .execute(&pool)
        .await?;
    if deleted.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn create_column(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
    Path(board_id): Path<String>,
) -> Result<(StatusCode, Json<Titled>), AppError> {
    let mut tx = pool.begin().await?;
    owned_board(&mut tx, &user, &board_id).await?;
    let column = List::Columns.append(&mut tx, &board_id).await?;
    tx.commit().await?;
    Ok((StatusCode::CREATED, Json(column)))
}

pub async fn set_column_title(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
    Path(id): Path<String>,
    JsonBody(body): JsonBody<TitleBody>,
) -> Result<Json<Titled>, AppError> {
    let title = checked_title(body)?;
    let mut tx = pool.begin().await?;
    owned_column(&mut tx, &user, &id).await?;
    let column = sqlx::query_as("UPDATE columns SET title = ? WHERE id = ? RETURNING id, title")
        .bind(title)
        .bind(&id)
        .fetch_one(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(Json(column))
}

pub async fn delete_column(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    let mut tx = pool.begin().await?;
    let column = owned_column(&mut tx, &user, &id).await?;
    sqlx::query("DELETE FROM columns WHERE id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await?;
    List::Columns
        .close_gap(&mut tx, &column.parent, column.position)
        .await?;
    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn move_column(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
    Path(id): Path<String>,
    JsonBody(body): JsonBody<MoveColumnBody>,
) -> Result<StatusCode, AppError> {
    let mut tx = pool.begin().await?;
    let column = owned_column(&mut tx, &user, &id).await?;
    List::Columns
        .move_to(&mut tx, &id, &column, &column.parent, body.position)
        .await?;
    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn create_card(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
    Path(column_id): Path<String>,
) -> Result<(StatusCode, Json<Titled>), AppError> {
    let mut tx = pool.begin().await?;
    owned_column(&mut tx, &user, &column_id).await?;
    let card = List::Cards.append(&mut tx, &column_id).await?;
    tx.commit().await?;
    Ok((StatusCode::CREATED, Json(card)))
}

pub async fn set_card_title(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
    Path(id): Path<String>,
    JsonBody(body): JsonBody<TitleBody>,
) -> Result<Json<Titled>, AppError> {
    let title = checked_title(body)?;
    let mut tx = pool.begin().await?;
    owned_card(&mut tx, &user, &id).await?;
    let card = sqlx::query_as("UPDATE cards SET title = ? WHERE id = ? RETURNING id, title")
        .bind(title)
        .bind(&id)
        .fetch_one(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(Json(card))
}

pub async fn delete_card(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    let mut tx = pool.begin().await?;
    let card = owned_card(&mut tx, &user, &id).await?;
    sqlx::query("DELETE FROM cards WHERE id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await?;
    List::Cards
        .close_gap(&mut tx, &card.parent, card.position)
        .await?;
    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn move_card(
    State(pool): State<SqlitePool>,
    user: CurrentUser,
    Path(id): Path<String>,
    JsonBody(body): JsonBody<MoveCardBody>,
) -> Result<StatusCode, AppError> {
    let mut tx = pool.begin().await?;
    let card = owned_card(&mut tx, &user, &id).await?;
    owned_column(&mut tx, &user, &body.column_id).await?;
    List::Cards
        .move_to(&mut tx, &id, &card, &body.column_id, body.position)
        .await?;
    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

#[cfg(test)]
mod tests {
    use axum::Router;
    use axum::body::{Body, to_bytes};
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    async fn send(app: &Router, method: &str, uri: &str, body: &str) -> (StatusCode, String) {
        let request = Request::builder()
            .method(method)
            .uri(uri)
            .header("Authorization", "Bearer demo")
            .header("Content-Type", "application/json")
            .body(Body::from(body.to_string()))
            .unwrap();
        let response = app.clone().oneshot(request).await.unwrap();
        let status = response.status();
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        (status, String::from_utf8(body.to_vec()).unwrap())
    }

    /// Creates an element and returns its id, read from the `{"id":"…","title":""}` body.
    async fn create(app: &Router, uri: &str) -> String {
        let (status, body) = send(app, "POST", uri, "").await;
        assert_eq!(status, StatusCode::CREATED);
        body[7..43].to_string()
    }

    #[tokio::test]
    async fn moving_a_card_to_another_column_closes_and_opens_gaps() {
        let app = crate::test_app().await;
        let board = create(&app, "/api/boards").await;
        let todo = create(&app, &format!("/api/boards/{board}/columns")).await;
        let done = create(&app, &format!("/api/boards/{board}/columns")).await;
        let [a, b] = [
            create(&app, &format!("/api/columns/{todo}/cards")).await,
            create(&app, &format!("/api/columns/{todo}/cards")).await,
        ];
        let c = create(&app, &format!("/api/columns/{done}/cards")).await;

        let body = format!(r#"{{"columnId":"{done}","position":1}}"#);
        let (status, _) = send(&app, "POST", &format!("/api/cards/{a}/move"), &body).await;

        assert_eq!(status, StatusCode::NO_CONTENT);
        let (_, board) = send(&app, "GET", &format!("/api/boards/{board}"), "").await;
        let order: Vec<usize> = [&b, &a, &c]
            .map(|id| board.find(id.as_str()).unwrap())
            .into();
        assert!(order.is_sorted(), "expected b, then a, then c in {board}");
        let todo_cards = &board[board.find(&todo).unwrap()..board.find(&done).unwrap()];
        assert!(!todo_cards.contains(&a));
    }

    #[tokio::test]
    async fn a_malformed_body_is_a_json_error() {
        let app = crate::test_app().await;
        let board = create(&app, "/api/boards").await;

        let (status, body) = send(&app, "PATCH", &format!("/api/boards/{board}"), "{").await;

        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(body.starts_with(r#"{"error":""#), "{body}");
    }

    #[tokio::test]
    async fn an_unknown_route_is_a_json_error() {
        let app = crate::test_app().await;

        let (status, body) = send(&app, "GET", "/api/nothing", "").await;

        assert_eq!(status, StatusCode::NOT_FOUND);
        assert_eq!(body, r#"{"error":"not found"}"#);
    }
}
