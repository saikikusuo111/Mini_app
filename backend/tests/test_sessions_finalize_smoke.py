import sqlite3
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app.core.settings import settings
from app.main import app


class SessionFinalizeSmokeTest(unittest.TestCase):
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

    def test_finalize_returns_preliminary_result_from_stored_answers(self):
        conn = sqlite3.connect(str(self.db_path))
        try:
            conn.execute('DELETE FROM session_answers')
            conn.execute('DELETE FROM decision_sessions')
            conn.execute('DELETE FROM users')

            conn.execute(
                '''
                INSERT INTO users (id, tg_user_id, username, first_name, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ''',
                ('usr_test_1', 123456789, 'test_user', 'Test', '2026-01-01T00:00:00+00:00', '2026-01-01T00:00:00+00:00'),
            )
            conn.execute(
                '''
                INSERT INTO decision_sessions (
                  id, user_id, flow_type, item_name, item_price, status,
                  current_question_order, started_at, updated_at, scoring_version
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    'ses_test_1',
                    'usr_test_1',
                    'purchase_v1',
                    'Laptop',
                    1200,
                    'draft',
                    4,
                    '2026-01-01T00:00:00+00:00',
                    '2026-01-01T00:00:00+00:00',
                    'v1.0.0',
                ),
            )
            conn.execute(
                '''
                INSERT INTO session_answers (
                  id, session_id, question_id, question_order, answer_value,
                  contribution, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                ('ans_1', 'ses_test_1', 'desire', 1, 8, None, '2026-01-01T00:00:00+00:00', '2026-01-01T00:00:00+00:00'),
            )
            conn.execute(
                '''
                INSERT INTO session_answers (
                  id, session_id, question_id, question_order, answer_value,
                  contribution, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                ('ans_2', 'ses_test_1', 'utility', 2, 6, None, '2026-01-01T00:00:00+00:00', '2026-01-01T00:00:00+00:00'),
            )
            conn.execute(
                '''
                INSERT INTO session_answers (
                  id, session_id, question_id, question_order, answer_value,
                  contribution, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                ('ans_3', 'ses_test_1', 'financial_pain', 3, 4, None, '2026-01-01T00:00:00+00:00', '2026-01-01T00:00:00+00:00'),
            )
            conn.commit()
        finally:
            conn.close()

        response = self.client.post('/api/v1/sessions/ses_test_1/finalize')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                'session_id': 'ses_test_1',
                'score_for': 15.8,
                'score_against': 6.0,
                'diff': 9.8,
                'diff_percent': 44.95,
                'needs_tiebreaker': False,
                'preliminary_verdict': 'buy',
            },
        )

    def test_finalize_returns_error_when_answers_missing(self):
        conn = sqlite3.connect(str(self.db_path))
        try:
            conn.execute('DELETE FROM session_answers')
            conn.execute('DELETE FROM decision_sessions')
            conn.execute('DELETE FROM users')

            conn.execute(
                '''
                INSERT INTO users (id, tg_user_id, username, first_name, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ''',
                ('usr_test_2', 223456789, 'test_user_2', 'Test2', '2026-01-01T00:00:00+00:00', '2026-01-01T00:00:00+00:00'),
            )
            conn.execute(
                '''
                INSERT INTO decision_sessions (
                  id, user_id, flow_type, item_name, item_price, status,
                  current_question_order, started_at, updated_at, scoring_version
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    'ses_test_2',
                    'usr_test_2',
                    'purchase_v1',
                    'Phone',
                    900,
                    'draft',
                    3,
                    '2026-01-01T00:00:00+00:00',
                    '2026-01-01T00:00:00+00:00',
                    'v1.0.0',
                ),
            )
            conn.execute(
                '''
                INSERT INTO session_answers (
                  id, session_id, question_id, question_order, answer_value,
                  contribution, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                ('ans_4', 'ses_test_2', 'desire', 1, 9, None, '2026-01-01T00:00:00+00:00', '2026-01-01T00:00:00+00:00'),
            )
            conn.commit()
        finally:
            conn.close()

        response = self.client.post('/api/v1/sessions/ses_test_2/finalize')
        self.assertEqual(response.status_code, 409)

        payload = response.json()
        self.assertEqual(payload['detail']['error']['code'], 'SESSION_INCOMPLETE')
        self.assertEqual(len(payload['detail']['error']['details']['missing_questions']), 2)


if __name__ == '__main__':
    unittest.main()
