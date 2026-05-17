"""
AI service replaced with direct tafsir — no external API key required.
The compare_interpretation function returns a structured response using
the Ibn Kathir tafsir text fetched from qurancdn.
"""


async def compare_interpretation(
    verse_key: str,
    verse_text: str,
    user_interpretation: str,
    tafsir_text: str,
) -> str:
    if not tafsir_text:
        return (
            "JazakAllahu khayran for your beautiful reflection!\n\n"
            "Unfortunately, the scholarly tafsir for this verse is not available right now. "
            "Your personal reflection is a wonderful first step — keep pondering the meanings of Allah's words."
        )

    # Truncate tafsir to a readable length
    display_tafsir = tafsir_text[:1200].rsplit(" ", 1)[0] + ("…" if len(tafsir_text) > 1200 else "")

    return (
        f"JazakAllahu khayran for your heartfelt reflection on verse {verse_key}.\n\n"
        f"**Your Reflection:**\n{user_interpretation}\n\n"
        f"**Scholarly Tafsir (Ibn Kathir):**\n{display_tafsir}"
    )


async def generate_nudge(
    username: str,
    days_since_last_read: int,
    streak: int,
    total_verses: int,
) -> str:
    """Return a simple static nudge — no AI required."""
    if days_since_last_read == 0:
        return f"MashaAllah {username}, keep up the beautiful consistency!"
    if days_since_last_read == 1:
        return f"Your garden is waiting for you, {username} — even one verse today will make it bloom."
    return f"Your garden misses you, {username}! {total_verses} verses read so far — come back and keep growing."
