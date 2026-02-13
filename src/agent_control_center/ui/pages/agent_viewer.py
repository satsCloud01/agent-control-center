"""Agent Dashboard page - view agents, relationships, and status."""

from __future__ import annotations

import streamlit as st

from agent_control_center.core.agent_registry import AgentRegistry
from agent_control_center.ui.components.agent_card import render_agent_card
from agent_control_center.ui.components.graph_viz import render_agent_graph


def render():
    st.header("Agent Dashboard")

    registry = AgentRegistry()
    agents = registry.get_all()

    if not agents:
        st.info(
            "No agents have been spawned yet. Go to **Problem Input** to launch a workflow."
        )
        return

    # Agent relationship graph
    st.subheader("Agent Network")
    render_agent_graph(registry)

    st.markdown("---")

    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    status_counts = {}
    for a in agents:
        status_counts[a.status.value] = status_counts.get(a.status.value, 0) + 1

    col1.metric("Total Agents", len(agents))
    col2.metric("Completed", status_counts.get("completed", 0))
    col3.metric("Running", status_counts.get("running", 0))
    col4.metric("Failed", status_counts.get("failed", 0))

    st.markdown("---")

    # Agent status table
    st.subheader("Agent Details")

    table_data = []
    for a in agents:
        table_data.append({
            "Name": a.name,
            "Skill": a.skill_name,
            "Status": a.status.value,
            "Provider": a.llm_provider,
            "Model": a.llm_model,
            "Task": a.assigned_task[:80] + "..." if len(a.assigned_task) > 80 else a.assigned_task,
        })

    st.dataframe(table_data, use_container_width=True)

    # Expandable agent cards
    st.markdown("---")
    st.subheader("Agent Results")

    for agent in agents:
        render_agent_card(agent)
