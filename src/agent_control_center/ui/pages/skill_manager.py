"""Skill Manager page - view, add, and manage agent skills."""

from __future__ import annotations

from pathlib import Path

import streamlit as st

from agent_control_center.config import Config
from agent_control_center.skills.skill_parser import SkillParser


def render():
    st.header("Skill Manager")
    st.markdown(
        "Manage agent skills defined as `.skill.md` files. "
        "Each skill specifies an agent's capabilities, LLM configuration, and system prompt."
    )

    config: Config = st.session_state.config
    skills_dir = config.resolve_path(config.skills_dir)
    parser = SkillParser()

    # Display existing skills
    st.subheader("Loaded Skills")
    skill_files = sorted(skills_dir.glob("*.skill.md")) if skills_dir.exists() else []

    if not skill_files:
        st.info("No skill files found. Add `.skill.md` files to the `skills/` directory.")
    else:
        for path in skill_files:
            try:
                skill = parser.parse_file(path)
                with st.expander(f"{skill.name} - {skill.description}"):
                    col1, col2, col3 = st.columns(3)
                    col1.markdown(f"**Provider:** {skill.provider or 'default'}")
                    col2.markdown(f"**Model:** {skill.model or 'default'}")
                    col3.markdown(f"**Tools:** {', '.join(skill.tools) or 'all'}")

                    st.markdown(f"**Tags:** {', '.join(skill.tags) or 'none'}")
                    st.markdown("**System Prompt:**")
                    st.code(skill.system_prompt, language="markdown")
                    st.caption(f"Source: `{path.name}`")
            except Exception as e:
                st.error(f"Failed to parse {path.name}: {e}")

    st.markdown("---")

    # Add new skill via text input
    st.subheader("Add Custom Skill")
    st.markdown(
        "Paste a skill definition below or upload a `.skill.md` file. "
        "See the format reference in `skills/` for examples."
    )

    tab_paste, tab_upload = st.tabs(["Paste Definition", "Upload File"])

    with tab_paste:
        skill_text = st.text_area(
            "Skill Definition (YAML frontmatter + Markdown body)",
            height=300,
            placeholder='---\nname: my-custom-agent\ndescription: "Does something useful"\n'
            "tools:\n  - web_search\ntags:\n  - custom\n---\n\n"
            "# My Custom Agent\n\nYou are a specialized agent that...",
        )

        if st.button("Save Skill", key="save_paste"):
            if skill_text.strip():
                try:
                    skill = parser.parse_text(skill_text)
                    dest = skills_dir / f"{skill.name}.skill.md"
                    skills_dir.mkdir(parents=True, exist_ok=True)
                    dest.write_text(skill_text, encoding="utf-8")
                    st.success(f"Saved skill '{skill.name}' to `{dest.name}`")
                    # Reload components on next run
                    st.session_state.pop("components", None)
                    st.rerun()
                except Exception as e:
                    st.error(f"Invalid skill format: {e}")

    with tab_upload:
        uploaded = st.file_uploader(
            "Upload .skill.md file",
            type=["md"],
            help="Upload a .skill.md file to add to the skills directory.",
        )

        if uploaded and st.button("Save Uploaded Skill", key="save_upload"):
            content = uploaded.read().decode("utf-8")
            try:
                skill = parser.parse_text(content)
                dest = skills_dir / f"{skill.name}.skill.md"
                skills_dir.mkdir(parents=True, exist_ok=True)
                dest.write_text(content, encoding="utf-8")
                st.success(f"Saved skill '{skill.name}' to `{dest.name}`")
                st.session_state.pop("components", None)
                st.rerun()
            except Exception as e:
                st.error(f"Invalid skill format: {e}")

    # Skill format reference
    st.markdown("---")
    st.subheader("Skill Format Reference")
    st.code(
        """---
name: my-agent-name
description: "What this agent does"
provider: anthropic          # or openai (optional, uses default)
model: claude-sonnet-4-20250514  # optional, uses default
temperature: 0.2             # optional
max_tokens: 4096             # optional
tools:                       # optional, defaults to all tools
  - web_search
  - code_execute
  - file_read
  - file_write
  - api_call
tags:                        # used for skill matching
  - research
  - analysis
mcp_servers:                 # optional external MCP servers
  - name: postgres
    command: uvx mcp-server-postgres
    args: ["postgresql://localhost/mydb"]
---

# Agent System Prompt

Everything below the frontmatter becomes the agent's system prompt.
Write detailed instructions for how the agent should behave.""",
        language="yaml",
    )
