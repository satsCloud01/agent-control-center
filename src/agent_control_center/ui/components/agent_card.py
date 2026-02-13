"""Agent status card widget for the dashboard."""

from __future__ import annotations

import streamlit as st

from agent_control_center.models.agent_models import AgentRecord


STATUS_COLORS = {
    "idle": "\u26aa",
    "running": "\ud83d\udfe1",
    "completed": "\ud83d\udfe2",
    "failed": "\ud83d\udd34",
    "waiting": "\ud83d\udfe1",
}


def render_agent_card(agent: AgentRecord):
    icon = STATUS_COLORS.get(agent.status.value, "\u2753")
    with st.expander(f"{icon} {agent.name} [{agent.status.value}]"):
        col1, col2 = st.columns(2)
        with col1:
            st.markdown(f"**Agent ID:** `{agent.agent_id[:12]}...`")
            st.markdown(f"**Skill:** {agent.skill_name}")
            st.markdown(f"**Provider:** {agent.llm_provider}")
            st.markdown(f"**Model:** {agent.llm_model}")
        with col2:
            st.markdown(f"**Status:** {agent.status.value}")
            st.markdown(f"**Created:** {agent.created_at.strftime('%H:%M:%S')}")
            if agent.parent_id:
                st.markdown(f"**Parent:** `{agent.parent_id[:12]}...`")

        st.markdown("**Assigned Task:**")
        st.info(agent.assigned_task)

        if agent.result:
            st.markdown("**Result:**")
            st.markdown(agent.result)

        if agent.error:
            st.markdown("**Error:**")
            st.error(agent.error)
