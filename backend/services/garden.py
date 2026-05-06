from schemas import GardenState

LEVEL_NAMES = [
    "Zari'",
    "Nabat",
    "Warad",
    "Zahir",
    "Janna",
    "Bustaan",
    "Riyad",
    "Adn",
]


def compute_garden(total_verses: int, streak_count: int, longest_streak: int) -> GardenState:
    petals = total_verses % 10
    flowers = total_verses // 10
    branches = total_verses // 100

    # Bonus golden flowers: 1 per 7-day milestone in streaks
    streak_flowers = longest_streak // 7

    level = min(len(LEVEL_NAMES) - 1, total_verses // 50)
    level_name = LEVEL_NAMES[level]

    return GardenState(
        total_verses=total_verses,
        petals=petals,
        flowers=flowers,
        branches=branches,
        streak_flowers=streak_flowers,
        level=level,
        level_name=level_name,
    )


def compute_risk_score(days_since: int, avg_7d: float, avg_prev_7d: float) -> tuple[float, str]:
    """Return (risk_score 0-1, trend)."""
    # Base score from days since last read
    if days_since == 0:
        base = 0.0
    elif days_since == 1:
        base = 0.1
    elif days_since == 2:
        base = 0.3
    elif days_since <= 4:
        base = 0.5
    elif days_since <= 7:
        base = 0.7
    else:
        base = min(1.0, 0.7 + (days_since - 7) * 0.05)

    # Adjust for trend
    if avg_prev_7d > 0:
        ratio = avg_7d / avg_prev_7d
    else:
        ratio = 1.0

    if ratio >= 1.1:
        trend = "improving"
        base = max(0.0, base - 0.15)
    elif ratio >= 0.9:
        trend = "stable"
    else:
        trend = "declining"
        base = min(1.0, base + 0.15)

    risk_score = round(base, 2)
    if risk_score < 0.35:
        risk_level = "low"
    elif risk_score < 0.65:
        risk_level = "medium"
    else:
        risk_level = "high"

    return risk_score, risk_level, trend
