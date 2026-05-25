from pydantic import BaseModel
from typing import Optional


class GraphState(BaseModel):
    state:str
    question: str
    response: Optional[str] = None