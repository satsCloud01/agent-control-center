"""Audit Logs page - view workflow history and event logs."""

from __future__ import annotations

import json

import streamlit as st

from agent_control_center.config import Config
from agent_control_center.persistence.audit_logger import AuditLogger
from agent_control_center.persistence.database import Database


def render():
    st.header("Audit Logs")

    config: Config = st.session_state.config

    try:
        db = Database(config.audit_db_path)
        audit_logger = AuditLogger(db)
    except Exception as e:
        st.error(f"Could not connect to audit database: {e}")
        return

    # Workflow history
    st.subheader("Workflow History")
    workflows = audit_logger.get_workflows(limit=20)

    if not workflows:
        st.info("No workflows have been run yet.")
        return

    for wf in workflows:
        status_icon = {
            "completed": "\u2705",
            "running": "\u23f3",
            "failed": "\u274c",
        }.get(wf.get("status", ""), "\u2753")

        problem = wf.get("problem_statement", "Unknown")
        if len(problem) > 100:
            problem = problem[:100] + "..."

        with st.expander(f"{status_icon} {problem}"):
            col1, col2, col3 = st.columns(3)
            col1.markdown(f"**Status:** {wf.get('status', 'unknown')}")
            col2.markdown(f"**Started:** {wf.get('started_at', 'N/A')}")
            col3.markdown(f"**Subtasks:** {wf.get('subtask_count', 0)}")

            if wf.get("completed_at"):
                st.markdown(f"**Completed:** {wf['completed_at']}")

            if wf.get("final_result"):
                st.markdown("**Final Result:**")
                st.markdown(wf["final_result"])

            # Show events for this workflow
            workflow_id = wf.get("id", "")
            events = audit_logger.get_events(workflow_id=workflow_id, limit=50)
            if events:
                st.markdown("**Events:**")
                event_data = []
                for e in events:
                    detail = e.get("detail", "{}")
                    try:
                        detail_parsed = json.loads(detail) if isinstance(detail, str) else detail
                        detail_str = json.dumps(detail_parsed, indent=2)[:200]
                    except (json.JSONDecodeError, TypeError):
                        detail_str = str(detail)[:200]

                    event_data.append({
                        "Time": e.get("timestamp", ""),
                        "Event": e.get("event_type", ""),
                        "Agent": e.get("agent_name", "-"),
                        "Level": e.get("level", "INFO"),
                        "Detail": detail_str,
                    })
                st.dataframe(event_data, use_container_width=True)

    # Recent events (all)
    st.markdown("---")
    st.subheader("Recent Events (All Workflows)")

    limit = st.slider("Number of events", 10, 200, 50)
    all_events = audit_logger.get_events(limit=limit)

    if all_events:
        event_table = []
        for e in all_events:
            event_table.append({
                "Time": e.get("timestamp", ""),
                "Event": e.get("event_type", ""),
                "Agent": e.get("agent_name", "-"),
                "Workflow": (e.get("workflow_id", "") or "")[:8],
                "Level": e.get("level", "INFO"),
            })
        st.dataframe(event_table, use_container_width=True)
    else:
        st.info("No events recorded yet.")
