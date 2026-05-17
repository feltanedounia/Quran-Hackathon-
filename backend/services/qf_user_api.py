"""
Quran Foundation User API integration.
Docs: https://api-docs.quran.foundation/docs/user_related_apis_versioned/1.0.0/user-related-apis/

All endpoints require two headers:
  x-auth-token  — user's QF OAuth access token
  x-client-id   — our registered QF client ID
"""
import os
import httpx

QF_API_BASE = "https://apis.quran.foundation"
QF_AUTH_BASE = "https://auth.quran.foundation"
QF_CLIENT_ID = os.getenv("QF_CLIENT_ID", "")
QF_CLIENT_SECRET = os.getenv("QF_CLIENT_SECRET", "")


def _headers(access_token: str) -> dict:
    return {
        "x-auth-token": access_token,
        "x-client-id": QF_CLIENT_ID,
        "Content-Type": "application/json",
    }


def is_configured() -> bool:
    return bool(QF_CLIENT_ID)


async def exchange_code(code: str, redirect_uri: str) -> dict | None:
    """Exchange authorization code for access + refresh tokens."""
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{QF_AUTH_BASE}/oauth2/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": QF_CLIENT_ID,
                "client_secret": QF_CLIENT_SECRET,
            },
        )
        if r.status_code == 200:
            return r.json()
    return None


async def refresh_token(refresh_tok: str) -> dict | None:
    """Refresh an expired access token."""
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{QF_AUTH_BASE}/oauth2/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_tok,
                "client_id": QF_CLIENT_ID,
                "client_secret": QF_CLIENT_SECRET,
            },
        )
        if r.status_code == 200:
            return r.json()
    return None


async def add_bookmark(access_token: str, verse_key: str, surah_number: int, ayah_number: int) -> dict | None:
    """POST a new bookmark to the QF User API."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            f"{QF_API_BASE}/auth/v1/bookmarks",
            headers=_headers(access_token),
            json={
                "verse_key": verse_key,
                "chapter_number": surah_number,
                "verse_number": ayah_number,
            },
        )
        if r.status_code in (200, 201):
            return r.json()
    return None


async def delete_bookmark(access_token: str, qf_bookmark_id: str) -> bool:
    """DELETE a bookmark from the QF User API."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.delete(
            f"{QF_API_BASE}/auth/v1/bookmarks/{qf_bookmark_id}",
            headers=_headers(access_token),
        )
        return r.status_code in (200, 204)


async def list_bookmarks(access_token: str) -> list[dict]:
    """GET all bookmarks from the QF User API (cursor-paginated, up to 50)."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{QF_API_BASE}/auth/v1/bookmarks",
            headers=_headers(access_token),
            params={"first": 50},
        )
        if r.status_code == 200:
            return r.json().get("data", [])
    return []
