from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, config, sessions
from app.core.settings import settings

app = FastAPI(
    title='Vesy API',
    version='0.1.0-wave1',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_base_url, 'http://localhost:8080', 'http://127.0.0.1:8080'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth.router, prefix=f'{settings.api_prefix}/auth', tags=['auth'])
app.include_router(config.router, prefix=f'{settings.api_prefix}/config', tags=['config'])
app.include_router(sessions.router, prefix=f'{settings.api_prefix}/sessions', tags=['sessions'])


@app.get('/healthz')
def healthz():
    return {'ok': True, 'service': 'vesy-api', 'version': '0.1.0-wave1'}
