import sqlite3
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app.core.settings import settings
from app.main import app


class SessionTiebreakerSmokeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._original_sqlite_path = settings.sqlite_path
        cls._tmpdir = tempfile.TemporaryDirectory()
        cls.db_path = Path(cls._tmpdir.name) / 'test.sqlite3'

        migration_path = Path(__file__).resolve().parents[2] / 'db' / 'migrations' / '001_init.sql'
        conn = sqlite3.connect(str(cls.db_path))
        try:
            conn.executescript(migration_path.read_text(encoding='utf-8'))
            conn.commit()
        finally:
            conn.close()

        settings.sqlite_path = str(cls.db_path)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        settings.sqlite_path = cls._original_sqlite_path
        cls._tmpdir.cleanup()

    def test_submit_tiebreaker_returns_final_payload(self):
        conn = sqlite3.connect(str(self.db_path))
        try:
            conn.execute('DELETE FROM decisions')
            conn.execute('DELETE FROM decision_sessions')
            conn.execute('DELETE FROM users')

            conn.execute(
                '''
                INSERT INTO users (id, tg_user_id, username, first_name, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ''',
                ('usr_tb_1', 323456789, 'test_tb_user', 'TestTB', '2026-01-01T00:00:00+00:00', '2026-01-01T00:00:00+00:00'),
            )
            conn.execute(
                '''
                INSERT INTO decision_sessions (
                  id, user_id, flow_type, item_name, item_price, status,
                  current_question_order, started_at, updated_at, scoring_version,
                  needs_tiebreaker, preliminary_score_for, preliminary_score_against,
                  preliminary_diff, preliminary_diff_percent
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    'ses_tb_1',
                    'usr_tb_1',
                    'purchase_v1',
                    'Headphones',
                    200,
                    'pre_result',
                    4,
                    '2026-01-01T00:00:00+00:00',
                    '2026-01-01T00:00:00+00:00',
                    'v1.0.0',
                    1,
                    10.1,
                    9.8,
                    0.3,
                    1.51,
                ),
            )
            conn.commit()
        finally:
            conn.close()

        response = self.client.post('/api/v1/sessions/ses_tb_1/tiebreaker', json={'option_id': 'wait_24h'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                'session_id': 'ses_tb_1',
                'score_for': 10.1,
                'score_against': 9.8,
                'diff': 0.3,
                'diff_percent': 1.51,
                'needs_tiebreaker': False,
                'preliminary_verdict': 'buy',
                'tiebreaker_option_id': 'wait_24h',
            },
        )


if __name__ == '__main__':
    unittest.main()
