use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    let port = std::env::var("PORT").unwrap_or_else(|_| "8000".to_string());
    let temporary = std::env::var("TEMP_STORAGE").is_ok_and(|value| value == "1");
    let pool = minikan::db::connect(temporary)
        .await
        .expect("the database opens");
    let listener = TcpListener::bind(format!("127.0.0.1:{port}"))
        .await
        .expect("the port is free");
    axum::serve(listener, minikan::app(pool))
        .await
        .expect("the server runs");
}
