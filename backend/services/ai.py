import os
import anthropic

_api_key = os.getenv("ANTHROPIC_API_KEY", "")
client = anthropic.Anthropic(api_key=_api_key) if _api_key else None

SYSTEM_PROMPT = """You are a compassionate and knowledgeable Islamic scholar assistant within a Quran engagement app called Bloom.
Your role is to gently guide users in their understanding of Quranic verses.
When a user shares their personal interpretation of a verse, you:
1. Warmly acknowledge their reflection
2. Highlight what they got right or a meaningful insight they had
3. Gently expand or correct using the tafsir
4. End with an encouraging, personal message

Keep your tone warm, feminine, and encouraging — like a knowledgeable friend.
Keep the response concise (3-4 paragraphs max)."""


async def compare_interpretation(
    verse_key: str,
    verse_text: str,
    user_interpretation: str,
    tafsir_text: str,
) -> str:
    if client is None:
        return (
            "Beautiful reflection! AI-powered tafsir feedback is not configured yet. "
            "Here is the scholarly tafsir for your reference:\n\n"
            + (tafsir_text[:800] if tafsir_text else "No tafsir available for this verse.")
        )

    prompt = f"""The user is reflecting on this Quranic verse ({verse_key}):

Arabic/Translation: {verse_text}

The user wrote this interpretation:
"{user_interpretation}"

The scholarly tafsir (Ibn Kathir) says:
"{tafsir_text[:1500] if tafsir_text else 'No tafsir available for this verse.'}"

Please provide warm, encouraging feedback comparing their interpretation to the tafsir."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


async def generate_nudge(
    username: str,
    days_since_last_read: int,
    streak: int,
    total_verses: int,
) -> str:
    """Generate a personalized re-engagement message."""
    if client is None:
        return f"Your garden misses you, {username}! Come back and let it bloom."

    prompt = f"""Generate a single short, warm, personalized nudge message for a Quran app user named {username}.
Context: They haven't read in {days_since_last_read} days. Their best streak was {streak} days. They've read {total_verses} verses total.
The app has a 3D garden that grows with each reading session.
Keep it under 2 sentences. Warm, gentle, motivating. No emoji."""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text
