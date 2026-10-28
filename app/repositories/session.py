"""Request-scoped database session — the repository layer's session door.

The ONE place a request obtains a SQLAlchemy `Session`. It lives in the REPOSITORY
layer (not infrastructure) on purpose: the layering contract is boundary -> service
-> repository, and ONLY the repository (and the engine in `app.database`) touches the
session. So a service-backed feature's route NEVER imports the session from
`app.database`; instead a service exposes `get_session` (re-exporting it) and the route
depends on that. A simple, non-layered feature may depend on `get_session` directly —
it is still outside infrastructure, so the boundary stays clean either way.

The engine + `SessionLocal` are built once in `app.database` (runtime-minted Lakebase
token per connection); this module only hands out and closes a session.
"""

from collections.abc import Iterator

from sqlalchemy.orm import Session

from app.database import SessionLocal


def get_session() -> Iterator[Session]:
    """Yield a database session and always close it (FastAPI `Depends` / `with` use)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
