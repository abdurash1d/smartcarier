"""
=============================================================================
CONFIGURATION TESTS
=============================================================================

Focused tests for backend settings parsing and startup stability.
"""

import importlib


def test_settings_normalize_loose_bool_env_values(monkeypatch):
    """Settings should tolerate non-boolean env strings without crashing."""
    monkeypatch.setenv("DEBUG", "release")
    monkeypatch.setenv("REDIS_ENABLED", "yes")
    monkeypatch.setenv("SMTP_USE_TLS", "0")

    import app.config as config

    importlib.reload(config)

    assert config.settings.DEBUG is False
    assert config.settings.REDIS_ENABLED is True
    assert config.settings.SMTP_USE_TLS is False

