import tldextract


TRUSTED_REGISTERED = {
    "wikipedia.org",
    "nature.com",
    "reuters.com",
    "bbc.co.uk",
    "bbc.com",
    "aftonbladet.se",
    "flashscore.com",
}
TRUSTED_SUFFIXES = {"gov", "gov.uk", "edu"}

BLACKLISTED_REGISTERED = {
    # Example low-quality domains; adjust to your data.
    "clickbait.com",
    "fake-news.net",
    "rumorsite.org",
}


def score_source(src):
    """
    Reliability scoring system.
    Scale: 0–100
    - Strong penalty for blacklisted domains.
    - Reward trusted registrable domains/TLDs.
    - Penalize HTTP; reward HTTPS.
    - Very short content yields 0.
    """

    if not isinstance(src, dict):
        return 0

    url = src.get("url") or ""
    text = src.get("text") or ""

    if not isinstance(url, str) or not isinstance(text, str):
        return 0

    url = url.strip()
    text = text.strip()

    if not url:
        return 0
    
    # Try parsing URL with tldextract
    try:
        parsed = tldextract.extract(url)
        suffix = parsed.suffix.lower()
        registered = parsed.registered_domain.lower()
    except Exception:
        suffix = ""
        registered = ""

    score = 50
    
    # Blacklisted > auto 0
    if registered in BLACKLISTED_REGISTERED:
        return 0
    
    # If article too short > 0
    if len(text) < 800:
        return 0
    

    # Length of article: longer = better; very short => 0
    if len(text) > 2000:
        score += 10
    if len(text) > 6000:
        score += 10

    # Trusted domains and suffixes
    if registered in TRUSTED_REGISTERED:
        score += 20
    if suffix in TRUSTED_SUFFIXES:
        score += 10

    # HTTPS preference
    if url.startswith("https://"):
        score += 5
    else:
        score -= 10

    return max(0, min(100, score))


