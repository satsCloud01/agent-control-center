"""Streamlit entry point for the Agent Control Center."""

from __future__ import annotations

import streamlit as st

st.set_page_config(
    page_title="Agent Control Center",
    page_icon="\u2699\ufe0f",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Initialize session state
if "config" not in st.session_state:
    from agent_control_center.config import Config

    st.session_state.config = Config.from_env()

if "workflow_running" not in st.session_state:
    st.session_state.workflow_running = False

if "workflow_result" not in st.session_state:
    st.session_state.workflow_result = None

if "current_workflow_id" not in st.session_state:
    st.session_state.current_workflow_id = None

# Sidebar navigation
st.sidebar.title("Agent Control Center")
st.sidebar.markdown("---")
page = st.sidebar.radio(
    "Navigation",
    ["Problem Input", "Agent Dashboard", "Skill Manager", "Audit Logs"],
    index=0,
)

st.sidebar.markdown("---")
st.sidebar.markdown("**Settings**")
provider = st.sidebar.selectbox(
    "Default LLM Provider",
    ["anthropic", "openai"],
    index=0 if st.session_state.config.default_provider == "anthropic" else 1,
)
st.session_state.config.default_provider = provider  # type: ignore[assignment]

# Route to pages
if page == "Problem Input":
    from agent_control_center.ui.pages.problem_input import render

    render()
elif page == "Agent Dashboard":
    from agent_control_center.ui.pages.agent_viewer import render

    render()
elif page == "Skill Manager":
    from agent_control_center.ui.pages.skill_manager import render

    render()
elif page == "Audit Logs":
    from agent_control_center.ui.pages.audit_logs import render

    render()
