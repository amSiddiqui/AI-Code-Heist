import os
from typing import AsyncIterable, List, Union

import asyncio
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware


from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain.callbacks import AsyncIteratorCallbackHandler


from pydantic import BaseModel

with open('keys', 'r', encoding='utf-8') as f:
    openai_key = f.read()

os.environ['OPENAI_API_KEY'] = openai_key


class Message(BaseModel):
    id: int
    message: str
    user: bool

    def to_message(self):
        return HumanMessage(content=self.message) if self.user else AIMessage(content=self.message)


class ChatRequest(BaseModel):
    messages: List[Message]



app = FastAPI()

origins = [
    "http://localhost:5173",  # React app
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


def getSystemMessage():
    return SystemMessage(content="You are a helpful assistant. You are here to help user with their queries. Please answer the user's queries to the best of your knowledge.")


async def send_message(all_messages: List[Union[AIMessage, HumanMessage]]) -> AsyncIterable[str]:
    callback = AsyncIteratorCallbackHandler()
    model = ChatOpenAI(
        streaming=True,
        verbose=True,
        model='gpt-3.5-turbo',
        callbacks=[callback]
    )

    task = asyncio.create_task(
        model.agenerate(messages=[[
            getSystemMessage(),
            *all_messages
        ]])
    )

    try:
        async for token in callback.aiter():
            yield token
    except Exception as e:
        print(f'Caught Exception: {e}')
    finally:
        callback.done.set()
    
    await task


@app.post("/stream_chat/")
async def stream_chat(req: ChatRequest):
    generator = send_message([message.to_message() for message in req.messages])
    return StreamingResponse(generator, media_type="text/event-stream")
