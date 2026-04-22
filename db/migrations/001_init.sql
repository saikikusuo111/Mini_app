PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tg_user_id INTEGER NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT,
  is_premium INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_seen_at TEXT
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS decision_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  flow_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_price REAL NOT NULL,
  status TEXT NOT NULL,
  current_question_order INTEGER DEFAULT 0,
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  scoring_version TEXT NOT NULL,
  needs_tiebreaker INTEGER DEFAULT 0,
  preliminary_score_for REAL,
  preliminary_score_against REAL,
  preliminary_diff REAL,
  preliminary_diff_percent REAL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS session_answers (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  answer_value INTEGER NOT NULL,
  contribution REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(session_id, question_id),
  FOREIGN KEY(session_id) REFERENCES decision_sessions(id)
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  flow_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_price REAL NOT NULL,
  verdict TEXT NOT NULL,
  verdict_label TEXT NOT NULL,
  score_for REAL NOT NULL,
  score_against REAL NOT NULL,
  diff REAL NOT NULL,
  diff_percent REAL NOT NULL,
  used_tiebreaker INTEGER DEFAULT 0,
  tiebreaker_value INTEGER,
  scoring_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(session_id) REFERENCES decision_sessions(id)
);

CREATE TABLE IF NOT EXISTS decision_top_factors (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL,
  category TEXT NOT NULL,
  direction TEXT NOT NULL,
  contribution_value REAL NOT NULL,
  label TEXT NOT NULL,
  rank_order INTEGER NOT NULL,
  FOREIGN KEY(decision_id) REFERENCES decisions(id)
);

CREATE TABLE IF NOT EXISTS decision_outcomes (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL UNIQUE,
  outcome_status TEXT NOT NULL,
  marked_at TEXT NOT NULL,
  note TEXT,
  FOREIGN KEY(decision_id) REFERENCES decisions(id)
);

CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_code TEXT NOT NULL,
  status TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  plan_code TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  raw_payload TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_id TEXT,
  decision_id TEXT,
  event_name TEXT NOT NULL,
  event_payload TEXT,
  created_at TEXT NOT NULL
);
