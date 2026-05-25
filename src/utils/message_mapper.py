
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.messages.base import BaseMessage


def map_messages(messages: list[dict]) -> list[BaseMessage]:
    mapped: list[BaseMessage] = []

    for msg in messages or []:
        # Accept both request formats: role/content and type/message.
        role = msg.get("role") or msg.get("type")
        content = msg.get("content")
        if content is None:
            content = msg.get("message", "")

        if not isinstance(content, str):
            content = str(content)

        if role == "user":
            mapped.append(HumanMessage(content=content))
        elif role in ("assistant", "ai"):
            mapped.append(AIMessage(content=content))

    return mapped