"""Multi-provider LLM factory."""

from __future__ import annotations

from langchain_core.language_models import BaseChatModel

from agent_control_center.config import Config


class LLMProvider:
    def __init__(self, config: Config):
        self._config = config

    def get_llm(
        self,
        provider: str | None = None,
        model: str | None = None,
        temperature: float | None = None,
    ) -> BaseChatModel:
        provider = provider or self._config.default_provider
        model = model or self._config.default_model
        temp = temperature if temperature is not None else self._config.temperature

        if provider == "openai":
            from langchain_openai import ChatOpenAI

            return ChatOpenAI(
                model=model,
                api_key=self._config.openai_api_key,
                temperature=temp,
                max_tokens=self._config.max_tokens,
            )
        elif provider == "anthropic":
            from langchain_anthropic import ChatAnthropic

            return ChatAnthropic(
                model=model,
                api_key=self._config.anthropic_api_key,
                temperature=temp,
                max_tokens=self._config.max_tokens,
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")
