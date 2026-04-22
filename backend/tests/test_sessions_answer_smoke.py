import sqlite3
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app.core.settings import settings
from app.main import app


class SessionAnswerSmokeTest(unittest.TestCase):
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

    def test_post_answer_persists_and_advances_question_order(self):
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
                    1,
                    '2026-01-01T00:00:00+00:00',
                    '2026-01-01T00:00:00+00:00',
                    'v1.0.0',
                ),
            )
            conn.commit()
        finally:
            conn.close()

        response = self.client.post(
            '/api/v1/sessions/ses_test_1/answer',
            json={
                'question_id': 'desire',
                'question_order': 1,
                'answer_value': 8,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                'ok': True,
                'session_id': 'ses_test_1',
                'current_question_order': 2,
            },
        )

        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            answer_row = conn.execute(
                '''
                SELECT session_id, question_id, question_order, answer_value
                FROM session_answers
                WHERE session_id = ? AND question_id = ?
                ''',
                ('ses_test_1', 'desire'),
            ).fetchone()
            session_row = conn.execute(
                'SELECT current_question_order FROM decision_sessions WHERE id = ?',
                ('ses_test_1',),
            ).fetchone()
        finally:
            conn.close()

        self.assertIsNotNone(answer_row)
        self.assertEqual(answer_row['question_order'], 1)
        self.assertEqual(answer_row['answer_value'], 8)
        self.assertEqual(session_row['current_question_order'], 2)


if __name__ == '__main__':
    unittest.main()
