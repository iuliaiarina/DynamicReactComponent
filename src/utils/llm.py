from functools import lru_cache
from typing import Any

from langchain_openai import AzureChatOpenAI

from src.utils.settings import settings
from src.utils.middlewares import prompt_logging_middleware


@lru_cache()
def get_llm() -> Any:
    return AzureChatOpenAI(
                azure_deployment=settings.AZURE_OPENAI_MODEL_NAME,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                model=settings.AZURE_OPENAI_MODEL_NAME,
                temperature=settings.MODEL_TEMPERATURE,
                api_version=settings.OPENAI_API_VERSION,
                api_key=settings.AZURE_OPENAI_API_KEY,
                reasoning={
                                "effort": "low",    # 'low', 'medium', or 'high'
                                "summary": "auto",   # 'auto', 'concise', or 'detailed'
                            },
 #               callbacks=[prompt_logging_middleware],
    )
