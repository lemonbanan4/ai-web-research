import tldextract

def score_source(src):
    """
    Basic reliability scoring system.
    Scale: 0–100
    """

    url = src["url"]
    text = src["text"]
    domain = tldextract.extract(url).domain

    score = 50

    # Length of article: longer = better
    if len(text) > 2000:
        score += 10
    if len(text) > 6000:
        score += 10

    # Trusted domains
    trusted = ["wikipedia", "nature", "gov", "edu", "reuters", "bbc"]
    if any(t in url for t in trusted):
        score += 20

    # Penalize short / trash content
    if len(text) < 800:
        score -= 15

    # HTTPS
    if url.startswith("https://"):
        score += 5

    return max(0, min(100, score))
