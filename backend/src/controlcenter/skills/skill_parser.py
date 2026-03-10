"""Parse .skill.md files into SkillDefinition models."""

from __future__ import annotations

import re
from pathlib import Path

import yaml

from controlcenter.models.skill_models import SkillDefinition

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)", re.DOTALL)

DEFAULT_WORKER_SKILL = SkillDefinition(
    name="general-worker",
    description="A general-purpose worker agent that can handle diverse tasks.",
    system_prompt=(
        "You are a capable general-purpose assistant. Complete the assigned task "
        "thoroughly and accurately. Use available tools when needed. Provide clear, "
        "structured output."
    ),
)


class SkillParser:
    def parse_file(self, path: Path) -> SkillDefinition:
        content = path.read_text(encoding="utf-8")
        match = FRONTMATTER_RE.match(content)
        if not match:
            raise ValueError(f"Invalid skill file: {path} -- missing YAML frontmatter")

        meta = yaml.safe_load(match.group(1))
        body = match.group(2).strip()

        return SkillDefinition(
            name=meta["name"],
            description=meta.get("description", ""),
            provider=meta.get("provider"),
            model=meta.get("model"),
            temperature=meta.get("temperature"),
            max_tokens=meta.get("max_tokens"),
            tools=meta.get("tools", []),
            tags=meta.get("tags", []),
            system_prompt=body,
            source_path=str(path),
            mcp_servers=meta.get("mcp_servers", []),
        )

    def parse_directory(self, directory: Path) -> list[SkillDefinition]:
        skills = []
        for path in sorted(directory.glob("*.skill.md")):
            try:
                skills.append(self.parse_file(path))
            except Exception as e:
                print(f"Warning: Failed to parse skill {path}: {e}")
        return skills

    def parse_text(self, content: str, source: str = "<inline>") -> SkillDefinition:
        match = FRONTMATTER_RE.match(content)
        if not match:
            raise ValueError("Invalid skill format -- missing YAML frontmatter")

        meta = yaml.safe_load(match.group(1))
        body = match.group(2).strip()

        return SkillDefinition(
            name=meta["name"],
            description=meta.get("description", ""),
            provider=meta.get("provider"),
            model=meta.get("model"),
            temperature=meta.get("temperature"),
            max_tokens=meta.get("max_tokens"),
            tools=meta.get("tools", []),
            tags=meta.get("tags", []),
            system_prompt=body,
            source_path=source,
            mcp_servers=meta.get("mcp_servers", []),
        )


class SkillRegistry:
    def __init__(self):
        self._skills: dict[str, SkillDefinition] = {}
        self._parser = SkillParser()

    def load_directory(self, directory: Path):
        for skill in self._parser.parse_directory(directory):
            self._skills[skill.name] = skill

    def register(self, skill: SkillDefinition):
        self._skills[skill.name] = skill

    def remove(self, name: str) -> bool:
        return self._skills.pop(name, None) is not None

    def get(self, name: str) -> SkillDefinition | None:
        return self._skills.get(name)

    def get_all(self) -> list[SkillDefinition]:
        return list(self._skills.values())

    def find_best_match(self, required_skills: list[str]) -> SkillDefinition:
        if not required_skills:
            return DEFAULT_WORKER_SKILL

        best_match = None
        best_score = 0

        for skill in self._skills.values():
            score = 0
            skill_tags = set(skill.tags)
            skill_tools = set(skill.tools)
            for req in required_skills:
                req_lower = req.lower()
                if req_lower in skill.name.lower() or req_lower in skill.description.lower():
                    score += 2
                if req_lower in skill_tags:
                    score += 3
                if req_lower in skill_tools:
                    score += 1
            if score > best_score:
                best_score = score
                best_match = skill

        return best_match if best_match else DEFAULT_WORKER_SKILL
