"""Tests for controlcenter.persistence.database."""

from controlcenter.persistence.database import Database


class TestDatabaseCreation:
    def test_creates_file(self, tmp_path):
        db_path = str(tmp_path / "test.db")
        db = Database(db_path)
        assert (tmp_path / "test.db").exists()
        db.close()

    def test_creates_parent_dirs(self, tmp_path):
        db_path = str(tmp_path / "sub" / "dir" / "test.db")
        db = Database(db_path)
        assert (tmp_path / "sub" / "dir" / "test.db").exists()
        db.close()

    def test_schema_tables_exist(self, tmp_db):
        rows = tmp_db.fetchall(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        names = {r["name"] for r in rows}
        assert "audit_events" in names
        assert "agent_messages" in names
        assert "workflow_runs" in names


class TestExecute:
    def test_insert_and_fetchall(self, tmp_db):
        tmp_db.execute(
            "INSERT INTO audit_events (event_type, detail) VALUES (?, ?)",
            ("test_event", '{"key":"value"}'),
        )
        rows = tmp_db.fetchall("SELECT * FROM audit_events")
        assert len(rows) == 1
        assert rows[0]["event_type"] == "test_event"

    def test_fetchone(self, tmp_db):
        tmp_db.execute(
            "INSERT INTO audit_events (event_type, detail) VALUES (?, ?)",
            ("evt", "{}"),
        )
        row = tmp_db.fetchone("SELECT * FROM audit_events WHERE event_type=?", ("evt",))
        assert row is not None
        assert row["event_type"] == "evt"

    def test_fetchone_no_match(self, tmp_db):
        row = tmp_db.fetchone("SELECT * FROM audit_events WHERE event_type=?", ("nope",))
        assert row is None

    def test_multiple_inserts(self, tmp_db):
        for i in range(5):
            tmp_db.execute(
                "INSERT INTO audit_events (event_type, detail) VALUES (?, ?)",
                (f"evt_{i}", "{}"),
            )
        rows = tmp_db.fetchall("SELECT * FROM audit_events")
        assert len(rows) == 5

    def test_row_factory_dict_access(self, tmp_db):
        tmp_db.execute(
            "INSERT INTO audit_events (event_type, agent_id, detail, level) VALUES (?, ?, ?, ?)",
            ("test", "agent-1", "{}", "INFO"),
        )
        row = tmp_db.fetchone("SELECT * FROM audit_events")
        assert row["agent_id"] == "agent-1"
        assert row["level"] == "INFO"
