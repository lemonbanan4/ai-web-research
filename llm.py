from dotenv import load_dotenv
load_dotenv()

import os
from openai import OpenAI



client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def summarize_sources(query: str, sources: list):
    """
    Generates a final research report from multiple sources.
    """

    # Format all extracted text into a big prompt input
    sources_text = ""
    for src in sources:
        sources_text += (
            f"\n\n### Source: {src['url']}\n"
            f"Title: {src['title']}\n"
            f"Content:\n{src['text'][:8000]}\n"
        )

    prompt = f"""
You are a world-class research analyst.

The user asked: "{query}"

You have extracted the following information from multiple real web sources:

{sources_text}

---

### TASK

1. Provide a clear, concise **final answer** to the user's query.
2. Provide a **5-bullet summary** of the key findings.
3. Provide a **comparison table** with:
   - Source URL
   - Perspective
   - Strengths
   - Weaknesses
4. Provide **conflicting viewpoints** between sources.
5. Provide **citation markers** like [1], [2], matching the order of sources above.
6. Provide **recommended further reading**.

Respond in clean Markdown.
"""

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert research aggregator."},
            {"role": "user", "content": prompt}
        ]
    )

    return completion.choices[0].message.content
