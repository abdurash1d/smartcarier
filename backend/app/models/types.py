"""
Database column types shared across models.

Why this exists:
- Our production DB is PostgreSQL (native UUID type).
- Tests (and sometimes local dev) use SQLite, which can't compile PostgreSQL's UUID type.
This GUID type keeps one model definition that works in both.
"""

from __future__ import annotations

import uuid

from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import CHAR, TypeDecorator


class GUID(TypeDecorator):
    """
    Platform-independent GUID/UUID type.

    - PostgreSQL: uses native UUID (as_uuid=True)
    - SQLite/others: stores as CHAR(36)
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None

        # Normalize anything UUID-like into uuid.UUID.
        if not isinstance(value, uuid.UUID):
            value = uuid.UUID(str(value))

        if dialect.name == "postgresql":
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))

