from fastapi import HTTPException, status


def api_error(code: str, message: str, details: dict | None = None, status_code: int = status.HTTP_400_BAD_REQUEST) -> HTTPException:
    payload = {
        'error': {
            'code': code,
            'message': message,
            'details': details or {},
        }
    }
    return HTTPException(status_code=status_code, detail=payload)
