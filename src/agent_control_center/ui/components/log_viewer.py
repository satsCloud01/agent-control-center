"""Real-time audit log stream component."""

from __future__ import annotations

import json

import streamlit as st

from agent_control_center.persistence.audit_logger import AuditLogger


def render_log_viewer(audit_logger: AuditLogger, workflow_id: str | None = None):
    """Render a log viewer showing recent audit events."""
    events = audit_logger.get_events(workflow_id=workflow_id, limit=50)

    if not events:
        st.info("No log events yet.")
        return

    for event in events:
        level = event.get("level", "INFO")
        event_type = event.get("event_type", "unknown")
        timestamp = event.get("timestamp", "")
        agent_name = event.get("agent_name", "")

        # Format detail
        detail_raw = event.get("detail", "{}")
        try:
            detail = json.loads(detail_raw) if isinstance(detail_raw, str) else detail_raw
        except (json.JSONDecodeError, TypeError):
            detail = {"raw": str(detail_raw)}

        # Color-coded log line
        if level == "ERROR":
            st.error(f"`{timestamp}` **{event_type}** {agent_name or ''}")
        elif event_type in ("workflow_started", "workflow_completed"):
            st.success(f"`{timestamp}` **{event_type}**")
        else:
            st.text(f"{timestamp} | {event_type} | {agent_name or '-'}")

        if detail:
            summary = json.dumps(detail, indent=2)[:300]
            st.caption(summary)
