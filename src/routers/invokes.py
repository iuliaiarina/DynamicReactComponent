from fastapi import APIRouter

from graph import agent
from src.dtos.requests import GenerationRequest
from src.dtos.responses import HistoryResponse
from src.services.invoke_service import invoke_service

from fastapi.responses import StreamingResponse
import json

router = APIRouter()


@router.post("/generation/stream", tags=["chat"])
async def chat_stream_endpoint(request: GenerationRequest):
    async def event_generator():
        async for event in invoke_service.stream_generation(
            request.thread_id,
            request.messages,
        ):
            yield f"data: {json.dumps(event)}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )


@router.get("/threads/{thread_id}/history", tags=["chat"], response_model=HistoryResponse)
async def get_thread_history(thread_id: str) -> HistoryResponse:
    return await invoke_service.get_thread_data(thread_id)


    
