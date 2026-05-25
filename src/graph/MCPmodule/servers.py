from dataclasses import dataclass
from typing import Optional

from src.utils.settings import settings


@dataclass
class MCPServer:
    name: str
    server_cwd: str
    command: str
    args: tuple[str, ...]
    env: Optional[dict[str, str]] = None


GMAIL_SERVER = MCPServer(
    name="gmail",
    server_cwd=settings.GMAIL_MCP_SERVER_PATH,
    command="node",
    args=("dist/index.js",),
)

CALENDAR_SERVER = MCPServer(
    name="calendar",
    server_cwd=settings.CALENDAR_MCP_SERVER_PATH,
    command="node",
    args=("build/index.js",),
)

LANGCHAIN_SERVER = {
        "langchain_docs": {
            "transport": "http",
            "url": "https://docs.langchain.com/mcp",
        }
    }

BRIGHTDATA_SERVER = {
    "brightdata": {
      "transport": "http",
      "url": "https://mcp.brightdata.com/mcp?token=8ac679c8-84a2-46f1-a061-480f119c13de"
    }
  
}

Crawl4AI_SERVER = {
    "crawl4ai": {
        "transport": "sse",
        "url": "http://127.0.0.1:8002/sse"
    }
}