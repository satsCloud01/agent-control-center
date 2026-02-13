"""Creates agent instances from SkillDefinition + tools + LLM."""

from __future__ import annotations

from agent_control_center.config import Config
from agent_control_center.core.llm_provider import LLMProvider
from agent_control_center.core.tool_manager import ToolManager
from agent_control_center.models.agent_models import AgentRecord, AgentStatus
from agent_control_center.models.skill_models import SkillDefinition


class AgentFactory:
    def __init__(self, config: Config, llm_provider: LLMProvider, tool_manager: ToolManager):
        self._config = config
        self._llm_provider = llm_provider
        self._tool_manager = tool_manager

    def create_agent(
        self,
        skill: SkillDefinition,
        task_description: str,
        parent_id: str | None = None,
    ) -> AgentRecord:
        provider = skill.provider or self._config.default_provider
        model = skill.model or self._config.default_model

        record = AgentRecord(
            name=f"{skill.name}-agent",
            skill_name=skill.name,
            assigned_task=task_description,
            llm_provider=provider,
            llm_model=model,
            parent_id=parent_id,
            status=AgentStatus.IDLE,
        )
        return record

    def get_agent_llm(self, record: AgentRecord):
        return self._llm_provider.get_llm(
            provider=record.llm_provider,
            model=record.llm_model,
        )

    def get_agent_tools(self, skill: SkillDefinition):
        if skill.tools:
            return self._tool_manager.get_tools(allowed=skill.tools)
        return self._tool_manager.get_tools()
