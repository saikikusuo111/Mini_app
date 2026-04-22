from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = 'development'
    app_host: str = '0.0.0.0'
    app_port: int = 8000

    api_prefix: str = '/api/v1'
    frontend_base_url: str = 'http://localhost:8080'
    api_base_url: str = 'http://localhost:8000/api/v1'

    sqlite_path: str = '../db/vesy.sqlite3'
    session_token_secret: str = 'change_me'
    session_token_ttl_hours: int = 168

    bot_token: str = 'change_me'
    bot_username: str = 'vesy_bot'

    dev_allow_fake_telegram: bool = True
    dev_fake_tg_user_id: int = 999000001
    dev_fake_tg_username: str = 'vesy_local_dev'
    dev_fake_tg_first_name: str = 'Local'

    free_daily_limit: int = 3
    free_history_depth: int = 5
    tiebreaker_threshold_percent: int = 12
    loss_aversion: float = 2.25
    scoring_version: str = 'v1.0.0'

    pro_month_stars: int = 199
    pro_year_stars: int = 1499

    privacy_policy_url: str = 'https://example.com/privacy'
    support_url: str = 'https://t.me/example_support'

    model_config = SettingsConfigDict(
        env_file='../.env',
        env_file_encoding='utf-8',
        extra='ignore',
    )

    @property
    def sqlite_abs_path(self) -> Path:
        backend_dir = Path(__file__).resolve().parents[2]
        return (backend_dir / self.sqlite_path).resolve()


settings = Settings()
