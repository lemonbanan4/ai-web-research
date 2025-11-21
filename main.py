from dotenv import load_dotenv
load_dotenv()

import os
import uuid
import asyncio
from typing import Any, Dict, List, Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from openai import OpenAI
from pydantic import BaseModel
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from browser import fetch_page
from llm import summarize_sources
from search import search_duckduckgo
from reliability import score_source


tasks: Dict[str, Dict[str, Any]] = {}

async def run_research_task(task_id: str, query: str):
    tasks[task_id]["status"] = "Searching web..."

    # 1. Search
    urls = await search_duckduckgo(query, limit=5)
    tasks[task_id]["steps"].append(f"Found {len(urls)} results")

    extracted = []

    # 2. Visit each URL
    for i, url in enumerate(urls, start=1):
        tasks[task_id]["status"] = f"Visiting page {i}/{len(urls)}: {url}"
        tasks[task_id]["steps"].append(tasks[task_id]["status"])

        try:
            page = await fetch_page(url)
            page["reliability_score"] = score_source(page)
            extracted.append(page)
        except Exception as ex:
            tasks[task_id]["steps"].append(f"Error loading {url}")

    tasks[task_id]["status"] = "Summarizing with LLM..."
    tasks[task_id]["steps"].append("LLM starting...")

    summary: str
    if not OPENAI_API_KEY:
        summary = "Summarization disabled: missing OPENAI_API_KEY. Showing gathered sources only."
    else:
        try:
            summary = await summarize_sources(query, extracted)
        except Exception as ex:
            print("ERROR summarizing sources:", ex)
            summary = "LLM summarization failed. Showing gathered sources only."

    # Save result
    tasks[task_id]["status"] = "Done"
    tasks[task_id]["result"] = {
        "summary": summary,
        "sources": extracted,
    }





OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/reports", StaticFiles(directory="reports"), name="reports")

class ResearchRequest(BaseModel):
    query: str

class SourceSummary(BaseModel):
    url: str
    title: str
    snippet: str
    screenshot: Optional[str] = None

class ResearchResponse(BaseModel):
    task_id: str
    query: str
    summary: str
    sources: List[SourceSummary]


def build_fallback_summary(query: str, sources: list) -> str:
    if not sources:
        return f"No sources could be fetched for '{query}'."
    lines = [f"Fetched {len(sources)} sources for '{query}' but LLM summary failed."]
    for idx, src in enumerate(sources[:5], start=1):
        title = src.get("title") or src.get("url") or "Untitled"
        lines.append(f"{idx}. {title} — {src.get('url', '')}")
    return "\n".join(lines)


@app.post("/research")
async def start_research(req: ResearchRequest, background: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks[task_id] = {
        "status": "Starting…",
        "steps": [],
        "result": None,
        "query": req.query,
    }

    # Launch background task
    async def _runner():
        await run_research_task(task_id, req.query)

    asyncio.create_task(_runner())

    return {"task_id": task_id}


@app.get("/research/{task_id}")
async def get_research(task_id: str):
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.post("/export_pdf")
async def export_pdf(req: ResearchResponse):
    os.makedirs("reports", exist_ok=True)
    filename = f"report-{req.task_id}.pdf"
    path = os.path.join("reports", filename)

    c = canvas.Canvas(path, pagesize=letter)
    text = c.beginText(40, 750)

    text.textLine("AI Research Report")
    text.textLine(f"Topic: {req.query}")
    text.textLine("")

    text.textLine("Summary:")
    for line in req.summary.split("\n"):
        text.textLine(line)

    text.textLine("")
    text.textLine("Sources:")
    for src in req.sources:
        text.textLine(f"- {src.title}")
        text.textLine(f"  {src.url}")
        reliability = getattr(src, "reliability", None)
        if reliability is not None:
            text.textLine(f"  Reliability: {reliability}/100")

    c.drawText(text)
    c.save()

    return {"url": f"/reports/{filename}"}

@app.post("/chat")
async def chat(req: dict):
    history = req["history"]
    query = req["query"]

    messages = [
        {"role": "system", "content": "You are a reseaerch assistant."}
    ] + history + [
        {"role": "user", "content": query}
    ]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )

    return {"reply": response.choices[0].message.content}
