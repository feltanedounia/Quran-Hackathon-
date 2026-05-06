import httpx
import random
from typing import Optional

BASE_URL = "https://api.qurancdn.com/api/qdc"
TRANSLATION_ID = 131   # Dr. Mustafa Khattab (The Clear Quran) — English
TAFSIR_ID = 169        # Tafsir Ibn Kathir (English, abridged)
RECITER_ID = 7         # Mishary Rashid Al-Afasy


async def get_chapters() -> list[dict]:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{BASE_URL}/chapters", params={"language": "en"})
        r.raise_for_status()
        return r.json().get("chapters", [])


async def get_random_verse() -> dict:
    # Pick a random surah (weighted toward shorter ones for daily use)
    surah = random.randint(1, 114)
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{BASE_URL}/verses/by_chapter/{surah}",
            params={
                "language": "en",
                "words": "false",
                "translations": TRANSLATION_ID,
                "audio": RECITER_ID,
                "fields": "text_uthmani",
                "per_page": 50,
                "page": 1,
            },
        )
        r.raise_for_status()
        data = r.json()
        verses = data.get("verses", [])
        if not verses:
            return await get_random_verse()

        verse = random.choice(verses)
        translation = ""
        if verse.get("translations"):
            translation = verse["translations"][0].get("text", "")
        # Strip HTML tags from translation
        translation = _strip_html(translation)

        audio_url = None
        if verse.get("audio") and verse["audio"].get("recitations"):
            audio_url = verse["audio"]["recitations"][0].get("audio_url")

        chapters = await get_chapters()
        chapter_name = next(
            (c["name_simple"] for c in chapters if c["id"] == surah), f"Surah {surah}"
        )

        return {
            "verse_key": verse["verse_key"],
            "surah_number": surah,
            "ayah_number": verse["verse_number"],
            "surah_name": chapter_name,
            "text_arabic": verse.get("text_uthmani", ""),
            "text_translation": translation,
            "audio_url": audio_url,
        }


async def get_verse(verse_key: str) -> Optional[dict]:
    """Fetch a specific verse by key like '2:255'."""
    parts = verse_key.split(":")
    if len(parts) != 2:
        return None
    surah, ayah = parts
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{BASE_URL}/verses/by_key/{verse_key}",
            params={
                "language": "en",
                "translations": TRANSLATION_ID,
                "fields": "text_uthmani",
            },
        )
        if r.status_code != 200:
            return None
        data = r.json()
        verse = data.get("verse", {})
        translation = ""
        if verse.get("translations"):
            translation = _strip_html(verse["translations"][0].get("text", ""))
        return {
            "verse_key": verse_key,
            "text_arabic": verse.get("text_uthmani", ""),
            "text_translation": translation,
        }


async def get_tafsir(verse_key: str) -> str:
    """Fetch tafsir text for a verse key."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{BASE_URL}/tafsirs/{TAFSIR_ID}/by_ayah/{verse_key}")
        if r.status_code != 200:
            return ""
        data = r.json()
        tafsir = data.get("tafsir", {})
        return _strip_html(tafsir.get("text", ""))


def _strip_html(text: str) -> str:
    import re
    return re.sub(r"<[^>]+>", "", text).strip()
