from typing import Any, Dict, List, Optional
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.messages import BaseMessage


class PromptLoggingMiddleware(BaseCallbackHandler):
    """Middleware that logs prompts sent to the LLM."""

    def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        *,
        run_id: Optional[Any] = None,
        **kwargs: Any,
    ) -> None:
        print("\n" + "=" * 60)
        print("PROMPT SENT TO LLM:")
        print("=" * 60)
        for message_list in messages:
            for msg in message_list:
                role = msg.__class__.__name__.replace("Message", "")
                content = msg.content if hasattr(msg, "content") else str(msg)
                if len(content) > 500:
                    content = content[:500] + "... [truncated]"
                print(f"\n[{role}]:")
                print(content)
        print("=" * 60 + "\n")

    def on_llm_end(self, response: Any, **kwargs: Any) -> None:
        print("\n" + "-" * 60)
        print("LLM RESPONSE:")
        print("-" * 60)
        if hasattr(response, "generations"):
            for gen_list in response.generations:
                for gen in gen_list:
                    text = gen.text if hasattr(gen, "text") else str(gen)
                    if len(text) > 500:
                        text = text[:500] + "... [truncated]"
                    print(text)
        print("-" * 60 + "\n")


prompt_logging_middleware = PromptLoggingMiddleware()
