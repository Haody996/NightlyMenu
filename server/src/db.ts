import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'data.db');

const db = new Database(DB_PATH);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password   TEXT    NOT NULL,
    created_at TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS households (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    invite_code TEXT    NOT NULL UNIQUE,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS household_members (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id      INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    joined_at    TEXT    DEFAULT (datetime('now')),
    UNIQUE(user_id)
  );

  CREATE TABLE IF NOT EXISTS dishes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    name         TEXT    NOT NULL,
    description  TEXT    DEFAULT '',
    category     TEXT    DEFAULT 'Main',
    servings     INTEGER DEFAULT 2,
    created_at   TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    dish_id  INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    name     TEXT    NOT NULL,
    quantity TEXT    DEFAULT '',
    unit     TEXT    DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS meal_plan (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    date         TEXT    NOT NULL,
    dish_id      INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    UNIQUE(household_id, date, dish_id)
  );
`);

// Idempotent migrations for existing DBs that pre-date household_id columns
const migrate = (sql: string) => { try { db.exec(sql); } catch { /* column already exists */ } };
migrate('ALTER TABLE dishes    ADD COLUMN household_id INTEGER REFERENCES households(id) ON DELETE CASCADE');
migrate('ALTER TABLE meal_plan ADD COLUMN household_id INTEGER REFERENCES households(id) ON DELETE CASCADE');

migrate('ALTER TABLE users ADD COLUMN google_id TEXT');
migrate('ALTER TABLE dishes ADD COLUMN image TEXT');

export default db;
