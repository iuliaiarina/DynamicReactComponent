from contextlib import AsyncExitStack
from typing import Dict, List
from langchain_mcp_adapters.client import MultiServerMCPClient  
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain_core.tools import StructuredTool


class MCPManager:
    def __init__(self, http_servers):
        self.http_servers = http_servers
        self.http_clients: List[MultiServerMCPClient] = []

    async def get_tools(self) -> List[StructuredTool]:
        tools = []
        
        print(f"Getting tools from HTTP servers {self.http_servers}")
        for http_server in self.http_servers:
            client = MultiServerMCPClient(http_server)
            self.http_clients.append(client)
            server_tools = await client.get_tools()
            
            filtered_tools = [tool for tool in server_tools if getattr(tool, 'name', None) != 'smart_extract']
            tools.extend(filtered_tools)

        return tools