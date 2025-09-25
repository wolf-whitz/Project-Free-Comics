import Database from "better-sqlite3";

export const db = new Database("user_data.db"); 

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_url TEXT NOT NULL
    )
  `);
  console.log("SQLite database initialized and table created");
}
