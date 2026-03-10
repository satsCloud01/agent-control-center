"""Tests for controlcenter.config."""

from pathlib import Path

from controlcenter.config import Config


class TestConfigDefaults:
    def test_default_provider(self):
        c = Config()
        assert c.default_provider == "anthropic"

    def test_default_model(self):
        c = Config()
        assert c.default_model == "claude-sonnet-4-20250514"

    def test_default_max_tokens(self):
        c = Config()
        assert c.max_tokens == 4096

    def test_default_temperature(self):
        c = Config()
        assert c.temperature == 0.3

    def test_api_keys_empty_by_default(self):
        c = Config()
        assert c.openai_api_key == ""
        assert c.anthropic_api_key == ""
        assert c.tavily_api_key == ""


class TestConfigCustom:
    def test_custom_values(self):
        c = Config(default_provider="openai", default_model="gpt-4o", max_tokens=8192, temperature=0.7)
        assert c.default_provider == "openai"
        assert c.default_model == "gpt-4o"
        assert c.max_tokens == 8192
        assert c.temperature == 0.7


class TestWithApiKeys:
    def test_returns_new_instance(self):
        c = Config()
        c2 = c.with_api_keys(anthropic_api_key="sk-test")
        assert c2 is not c

    def test_copies_settings(self):
        c = Config(default_provider="openai", max_tokens=1000)
        c2 = c.with_api_keys()
        assert c2.default_provider == "openai"
        assert c2.max_tokens == 1000

    def test_sets_api_keys(self):
        c = Config()
        c2 = c.with_api_keys(openai_api_key="ok", anthropic_api_key="ak", tavily_api_key="tk")
        assert c2.openai_api_key == "ok"
        assert c2.anthropic_api_key == "ak"
        assert c2.tavily_api_key == "tk"

    def test_original_unchanged(self):
        c = Config()
        c.with_api_keys(anthropic_api_key="sk-test")
        assert c.anthropic_api_key == ""


class TestResolvePath:
    def test_relative_path(self):
        c = Config()
        p = c.resolve_path("data")
        assert p.is_absolute()
        assert p.name == "data"

    def test_absolute_path_unchanged(self):
        c = Config()
        p = c.resolve_path("/tmp/test")
        assert p == Path("/tmp/test")

    def test_audit_db_path(self, tmp_path):
        c = Config(data_dir=str(tmp_path / "data"))
        assert c.audit_db_path.endswith("audit.db")
        assert str(tmp_path) in c.audit_db_path
