import httpx
import random
import re
from typing import Optional

# alquran.cloud — reliable, returns Arabic + English in one request
ALQURAN_BASE = "https://api.alquran.cloud/v1"
ARABIC_EDITION = "quran-uthmani"
ENGLISH_EDITION = "en.sahih"

# qurancdn — kept only for tafsir (still works there)
QDC_BASE = "https://api.qurancdn.com/api/qdc"
TAFSIR_ID = 169        # Tafsir Ibn Kathir (English, abridged)

SURAH_NAMES = {}  # lazy cache: {surah_number: name}


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text).strip()


async def _get_surah_names() -> dict:
    global SURAH_NAMES
    if SURAH_NAMES:
        return SURAH_NAMES
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{ALQURAN_BASE}/surah")
        r.raise_for_status()
        for s in r.json().get("data", []):
            SURAH_NAMES[s["number"]] = s["englishName"]
    return SURAH_NAMES


async def get_random_verse() -> dict:
    surah = random.randint(1, 114)
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{ALQURAN_BASE}/surah/{surah}/editions/{ARABIC_EDITION},{ENGLISH_EDITION}"
        )
        r.raise_for_status()
        data = r.json().get("data", [])

    arabic_ayahs = data[0]["ayahs"]
    english_ayahs = data[1]["ayahs"]
    surah_name = data[0].get("englishName", f"Surah {surah}")

    idx = random.randrange(len(arabic_ayahs))
    ar = arabic_ayahs[idx]
    en = english_ayahs[idx]

    return {
        "verse_key": f"{surah}:{ar['numberInSurah']}",
        "surah_number": surah,
        "ayah_number": ar["numberInSurah"],
        "surah_name": surah_name,
        "text_arabic": ar["text"],
        "text_translation": en["text"],
        "audio_url": None,
    }


async def get_verse(verse_key: str) -> Optional[dict]:
    """Fetch a specific verse by key like '2:255'."""
    parts = verse_key.split(":")
    if len(parts) != 2:
        return None
    surah, ayah = parts
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{ALQURAN_BASE}/ayah/{verse_key}/editions/{ARABIC_EDITION},{ENGLISH_EDITION}"
        )
        if r.status_code != 200:
            return None
        editions = r.json().get("data", [])
    ar = editions[0]
    en = editions[1]
    return {
        "verse_key": verse_key,
        "text_arabic": ar["text"],
        "text_translation": en["text"],
    }


async def get_tafsir(verse_key: str) -> str:
    """Fetch tafsir text for a verse key (still uses qurancdn)."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{QDC_BASE}/tafsirs/{TAFSIR_ID}/by_ayah/{verse_key}")
        if r.status_code != 200:
            return ""
        data = r.json()
        tafsir = data.get("tafsir", {})
        return _strip_html(tafsir.get("text", ""))


async def get_chapters() -> list[dict]:
    """Return chapter list (name_simple + id) — for compatibility."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{ALQURAN_BASE}/surah")
        r.raise_for_status()
        return [
            {"id": s["number"], "name_simple": s["englishName"]}
            for s in r.json().get("data", [])
        ]
