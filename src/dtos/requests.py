from typing import Dict, List, Optional

from pydantic import BaseModel, field_validator, Field


class GenerationRequest(BaseModel):
    thread_id: str = "thread_id"
    messages: List[Dict]