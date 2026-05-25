from pydantic import BaseModel
from typing import Optional, List, Dict, Any




class HistoryMessage(BaseModel):
    role: str
    content: str


class HistoryWebPage(BaseModel):
    id: str
    args: Dict[str, Any]
    result: Any


class HistoryResponse(BaseModel):
    messages: List[HistoryMessage]
    web_pages: List[HistoryWebPage]