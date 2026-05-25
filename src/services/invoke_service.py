import logging
from src.graph.agent import agent_service
from src.utils.message_mapper import map_messages

logger = logging.getLogger(__name__)


class InvokeService:

    async def stream_generation(self, thread_id: str, messages: list[dict], decisions: list[dict] | None = None):
        try:
            langchain_messages = map_messages(messages) if not decisions else []
            async for event in agent_service.stream(
                thread_id=thread_id,
                messages=langchain_messages,
                decisions=decisions,
            ):
                yield event

        except Exception as e:
            logger.error(f"Error during stream invocation: {e}", exc_info=True)
            yield {
                "type": "error",
                "content": str(e)
            }

    async def get_thread_data(self, thread_id: str):
        try:
            data = await agent_service.get_thread_data(thread_id)
            return data

        except Exception as e:
            logger.error(f"Error fetching history: {e}", exc_info=True)
            return []

invoke_service = InvokeService()