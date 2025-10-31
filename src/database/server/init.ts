import Database from "better-sqlite3";

export const db = new Database("user_data.db");

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_url TEXT NOT NULL,
      auth_token TEXT,
      user_token TEXT
    )
  `);
  console.log("SQLite database initialized and table created");
}
