"""Repository layer: the ONLY layer that touches the ORM / database session.

Each feature's repositories (data access for one aggregate) live here, alongside
the shared request-session door `session.get_session`. Business logic lives in the
service layer above; persistence lives only here. A service-backed feature's
boundary (routes) therefore never imports the DB session from infrastructure
(`app.database`) — it depends on a session the service exposes, sourced here.
"""
