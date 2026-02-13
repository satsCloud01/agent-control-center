"""Problem Input page - enter a problem statement and launch agent infrastructure."""

from __future__ import annotations

import asyncio
from pathlib import Path
from uuid import uuid4

import streamlit as st

from agent_control_center.config import Config
from agent_control_center.core.agent_factory import AgentFactory
from agent_control_center.core.agent_registry import AgentRegistry
from agent_control_center.core.communication_bus import CommunicationBus
from agent_control_center.core.llm_provider import LLMProvider
from agent_control_center.core.tool_manager import ToolManager
from agent_control_center.orchestration.supervisor import build_supervisor_graph
from agent_control_center.persistence.audit_logger import AuditLogger
from agent_control_center.persistence.database import Database
from agent_control_center.skills.skill_parser import SkillParser, SkillRegistry


def _get_or_create_components(config: Config):
    """Initialize all framework components (cached in session state)."""
    if "components" not in st.session_state:
        db = Database(config.audit_db_path)
        audit_logger = AuditLogger(db)
        llm_provider = LLMProvider(config)
        tool_manager = ToolManager(config)
        agent_factory = AgentFactory(config, llm_provider, tool_manager)
        registry = AgentRegistry()
        skill_registry = SkillRegistry()
        bus = CommunicationBus()

        # Load skills from directory
        skills_dir = config.resolve_path(config.skills_dir)
        if skills_dir.exists():
            skill_registry.load_directory(skills_dir)

        st.session_state.components = {
            "db": db,
            "audit_logger": audit_logger,
            "llm_provider": llm_provider,
            "tool_manager": tool_manager,
            "agent_factory": agent_factory,
            "registry": registry,
            "skill_registry": skill_registry,
            "bus": bus,
        }

    return st.session_state.components


def render():
    st.header("Launch Agent Infrastructure")
    st.markdown(
        "Describe your problem below. The system will decompose it into subtasks, "
        "spin up specialized agents, and synthesize the results."
    )

    config: Config = st.session_state.config
    components = _get_or_create_components(config)
    skill_registry: SkillRegistry = components["skill_registry"]

    # Problem statement input
    problem = st.text_area(
        "Problem Statement",
        height=150,
        placeholder="e.g., Research the top 3 Python web frameworks, compare their features, "
        "and write a recommendation report...",
    )

    # Skill selection
    available_skills = skill_registry.get_all()
    if available_skills:
        skill_names = [s.name for s in available_skills]
        selected_skills = st.multiselect(
            "Available Skills (agents will be matched automatically)",
            skill_names,
            default=skill_names,
            help="Select which agent skills should be available for this workflow.",
        )
    else:
        st.info("No skill files found. Add .skill.md files to the skills/ directory.")
        selected_skills = []

    # Advanced settings
    with st.expander("Advanced Settings"):
        col1, col2 = st.columns(2)
        with col1:
            provider = st.selectbox(
                "Supervisor LLM Provider",
                ["anthropic", "openai"],
                index=0 if config.default_provider == "anthropic" else 1,
            )
        with col2:
            model = st.text_input("Supervisor Model", value=config.default_model)

    # Launch button
    col_launch, col_clear = st.columns([1, 1])

    with col_launch:
        launch = st.button(
            "Launch Agent Infrastructure",
            type="primary",
            disabled=not problem.strip(),
        )

    with col_clear:
        if st.button("Clear / Reset"):
            AgentRegistry.reset()
            st.session_state.pop("components", None)
            st.session_state.workflow_running = False
            st.session_state.workflow_result = None
            st.session_state.current_workflow_id = None
            st.rerun()

    if launch and problem.strip():
        workflow_id = str(uuid4())
        st.session_state.current_workflow_id = workflow_id
        st.session_state.workflow_running = True

        audit_logger: AuditLogger = components["audit_logger"]
        audit_logger.start_workflow(workflow_id, problem)

        # Build the supervisor graph
        supervisor = build_supervisor_graph(
            config=config,
            llm_provider=components["llm_provider"],
            tool_manager=components["tool_manager"],
            agent_factory=components["agent_factory"],
            registry=components["registry"],
            skill_registry=skill_registry,
            bus=components["bus"],
            audit_logger=audit_logger,
        )

        initial_state = {
            "problem_statement": problem,
            "messages": [],
            "subtasks": [],
            "active_agents": [],
            "final_result": "",
            "iteration": 0,
            "next_action": "decompose",
            "workflow_id": workflow_id,
        }

        # Run the workflow
        with st.spinner("Decomposing problem and spawning agents..."):
            try:
                loop = asyncio.new_event_loop()
                result = loop.run_until_complete(supervisor.ainvoke(initial_state))
                loop.close()

                st.session_state.workflow_result = result
                st.session_state.workflow_running = False

                subtask_count = len(result.get("subtasks", []))
                audit_logger.complete_workflow(
                    workflow_id,
                    result.get("final_result", ""),
                    subtask_count,
                )

                st.success(
                    f"Workflow completed! {subtask_count} subtask(s) processed. "
                    "Switch to Agent Dashboard to see details."
                )
            except Exception as e:
                st.session_state.workflow_running = False
                audit_logger.fail_workflow(workflow_id, str(e))
                st.error(f"Workflow failed: {e}")

    # Display results if available
    if st.session_state.workflow_result:
        result = st.session_state.workflow_result
        st.markdown("---")
        st.subheader("Results")

        # Show subtask breakdown
        subtasks = result.get("subtasks", [])
        if subtasks:
            st.markdown("**Subtask Breakdown:**")
            for st_item in subtasks:
                status_icon = {
                    "completed": "\u2705",
                    "failed": "\u274c",
                    "running": "\u23f3",
                    "assigned": "\ud83d\udce4",
                    "pending": "\u23f8\ufe0f",
                }.get(st_item.get("status", ""), "\u2753")

                with st.expander(
                    f"{status_icon} {st_item.get('description', 'Unknown task')}"
                ):
                    st.markdown(f"**Status:** {st_item.get('status', 'unknown')}")
                    st.markdown(f"**Agent:** {st_item.get('assigned_agent', 'N/A')}")
                    if st_item.get("result"):
                        st.markdown("**Result:**")
                        st.markdown(st_item["result"])

        # Show final synthesized result
        final = result.get("final_result")
        if final:
            st.markdown("---")
            st.subheader("Synthesized Answer")
            st.markdown(final)
