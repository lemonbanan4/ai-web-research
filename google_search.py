import os
from serpapi import GoogleSearch

def google_search(query: str, max_results: int = 5):
    """
    Uses SerpAPI to fetch Google search results safely.
    Returns a list of real organic result URLs.
    """
    search = GoogleSearch({
        "q": query,
        "api_key": os.getenv("SERPAPI_KEY"),
        "num": max_results,
        "engine": "google",
    })

    data = search.get_dict()

    urls = []

    if "organic_results" in data:
        for result in data["organic_results"]:
            if "link" in result:
                urls.append(result["link"])

    return urls[:max_results]
