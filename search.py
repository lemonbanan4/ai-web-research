import httpx
from typing import List

DUCKDUCKGO_API = "https://api.duckduckgo.com/"

async def search_duckduckgo(query: str, limit: int = 5) -> List[str]:
    """
    Uses DuckDuckGo Instant Answer API to find relevant URLs.
    This is not full search results, but gives disambiguation + related links.
    Good enough for a research agent starting point.
    """

    params = {
        "q": query,
        "format": "json",
        "pretty": "1",
        "no_redirect": "1",
        "no_html": "1",
    }

    async with httpx.AsyncClient() as client:
        r = await client.get(DUCKDUCKGO_API, params=params, timeout=10)
        data = r.json()

    urls = []

    # 1. Main "AbstractURL"
    if "AbstractURL" in data and data["AbstractURL"]:
        urls.append(data["AbstractURL"])

    # 2. Related topics (often Wikipedia, news, info pages)
    related = data.get("RelatedTopics", [])
    for item in related:
        # Sometimes items are dictionaries with "Topics"
        if "FirstURL" in item:
            urls.append(item["FirstURL"])
        elif "Topics" in item:
            for sub in item["Topics"]:
                if "FirstURL" in sub:
                    urls.append(sub["FirstURL"])

    # Remove duplicates & truncate to limit
    clean = []
    for url in urls:
        if url not in clean:
            clean.append(url)

    return clean[:limit]
