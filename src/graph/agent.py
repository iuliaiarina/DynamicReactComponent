import logging
from pathlib import Path
from typing import Any
from langgraph.checkpoint.memory import InMemorySaver
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langgraph.types import Command
from datetime import datetime
from langchain_core.messages.base import BaseMessage
from src.utils.llm import get_llm
from src.graph.prompts import SYSTEM_PROMPT
from src.graph.tools import internet_search_tool, load_skill
from langchain.agents import create_agent
from src.graph.MCPmodule.servers import GMAIL_SERVER, CALENDAR_SERVER, LANGCHAIN_SERVER, Crawl4AI_SERVER
from src.graph.MCPmodule.client import MCPManager
from langchain.agents.middleware import HumanInTheLoopMiddleware 


logger = logging.getLogger(__name__)


class AgentService:
    def __init__(self):
        self.project_root = Path(__file__).resolve().parents[2]
        self.db_path = str(self.project_root / "checkpoints.sqlite")
        self.servers = []
        self.http_servers = [Crawl4AI_SERVER]
        self.agent = None
        self.checkpointer = None
        self.db_conn = None
        self.mcp_tools = None

    async def initialize(self):
        self.checkpointer = InMemorySaver()
        mcp = MCPManager(self.http_servers)
        self.mcp_tools = await mcp.get_tools()
        self.agent= self._build_agent()

    def _build_agent(self):
        llm = get_llm()
        tools = [ internet_search_tool] + self.mcp_tools
        logger.info(f"Agent initialized with {len(tools)} tools")
        return create_agent(
            model=llm,
            tools=tools,
            system_prompt=SYSTEM_PROMPT,
            checkpointer=self.checkpointer,
        )
    
    async def _process_events(self, events):
        async for event in events:
            etype = event.get("event")
            data = event.get("data") or {}

            if etype == "on_tool_start":
                tool_call = {
                    "id": event.get("run_id"),
                    "name": event.get("name"),
                    "input": str(data.get("input")),
                    "output": None,
                }
                yield {
                    "type": "tool_start",
                    "tool": tool_call,
                }

            elif etype == "on_tool_end":
                tool_call = {
                    "id": event.get("run_id"),
                    "name": event.get("name"),
                    "input": str(data.get("input")),
                    "output": data.get("output").content,
                }
                yield {
                    "type": "tool_end",
                    "tool": tool_call,
                }


            elif etype == "on_chat_model_stream":
                chunk = data.get("chunk")
                for block in chunk.content_blocks:
                    if block["type"] == "reasoning":
                        if "reasoning" in block:
                            yield {
                                "type": "reasoning",
                                "reasoning": block["reasoning"],
                            }
                    if block["type"] == "text":
                        if "text" in block:
                            yield {
                                "type": "token",
                                "content": block["text"],
                            }

    async def stream(
        self,
        thread_id: str,
        messages: list[BaseMessage] | None = None,
        decisions: list[dict] | None = None,
    ):
        
        if decisions:
            input_ = (
                Command(resume={"decisions": decisions})
            )
        else:
            input_ = ( {"messages": messages} )
            await self.checkpointer.adelete_thread(thread_id)
            # delte checkpointer

        events = self.agent.astream_events(
            input_,
            config={"configurable": {"thread_id": thread_id}},
            version="v2",
        )

        async for item in self._process_events(events):
            yield item


    async def get_thread_data(self, thread_id: str) -> dict[str, Any]:
            # state = await self.agent.aget_state(
            #     {"configurable": {"thread_id": thread_id}}
            # )

            # messages = state.values.get("messages", []) if state else []
            # extracted_messages = []
            # for m in messages:
            #     if isinstance(m, HumanMessage):
            #         role = "user"
            #     elif isinstance(m, AIMessage):
            #         role = "assistant"
            #     else:
            #         continue
            #     extracted_messages.append(
            #         {"role": role, "content": str(m.content)}
            #     )

            # tool_calls_ids = []
            # tool_calls_args = []
            # for msg in messages:
            #     if isinstance(msg, AIMessage):
            #         tool_calls = msg.lc_attributes["tool_calls"]
            #         for call in tool_calls:
            #             if call["name"] == "scrape_url":
            #                 tool_calls_ids.append(call["id"])
            #                 tool_calls_args.append(call["args"])

            # scrape_results = []
            # for msg in messages:
            #     if isinstance(msg, ToolMessage) and msg.tool_call_id in tool_calls_ids:
            #         if isinstance(msg.content, str):
            #             scrape_results.append(msg.content)
            #         else:
            #             scrape_results.append(msg.content[0]["text"])

            # scraping_results = []
            # for idx in range(len(tool_calls_ids)):
            #     scraping_results.append({
            #         "id": tool_calls_ids[idx],
            #         "args": tool_calls_args[idx],
            #         "result": scrape_results[idx]
            #     })

            # return {
            #     "messages": extracted_messages,
            #     "web_pages": scraping_results
            # }

            return {
                "messages": [],
                "web_pages": []
            }

    async def shutdown(self):
        if self.db_conn is not None:
            await self.db_conn.close()
            self.db_conn = None


agent_service = AgentService()