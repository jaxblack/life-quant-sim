"""Score a LifeOutcome on a 0-100 scale using configurable dimension weights."""
from typing import Optional, Dict


DEFAULT_WEIGHTS = {
    "money": 0.25,
    "social": 0.25,
    "meaning": 0.30,
    "lifespan": 0.20,
}


def _norm_money(v):
    # bounded log-ish curve so absurd millions don't dominate.
    if v <= 0:
        return 0.0
    # 0 -> 0, 1e6 -> ~100. saturates beyond.
    import math
    return max(0.0, min(100.0, math.log10(v + 1.0) / 6.0 * 100.0))


def _norm_social(v):
    if v <= 0:
        return 0.0
    return max(0.0, min(100.0, v))  # social_capital already roughly 0-100


def _norm_meaning(v):
    if v <= 0:
        return 0.0
    return max(0.0, min(100.0, v))


def _norm_lifespan(years):
    # 0..101 healthy years -> 0..100
    if years <= 0:
        return 0.0
    return max(0.0, min(100.0, (years / 101.0) * 100.0))


def score_outcome(outcome, weights=None):
    # type: (object, Optional[Dict[str, float]]) -> float
    """Return a 0-100 quality-of-life score for a LifeOutcome.

    weights: dict with keys money / social / meaning / lifespan.
    Must sum to 1.0 (within 1e-6) — raises ValueError otherwise.
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS
    required = {"money", "social", "meaning", "lifespan"}
    missing = required - set(weights.keys())
    if missing:
        raise ValueError("missing weight keys: " + ",".join(sorted(missing)))
    total = sum(float(weights[k]) for k in required)
    if abs(total - 1.0) > 1e-6:
        raise ValueError("weights must sum to 1.0, got %.6f" % total)

    money_s = _norm_money(getattr(outcome, "total_money_value", 0.0))
    social_s = _norm_social(getattr(outcome, "total_social_value", 0.0))
    meaning_s = _norm_meaning(getattr(outcome, "self_meaning", 0.0))
    lifespan_s = _norm_lifespan(getattr(outcome, "healthy_lifespan", 0.0))

    score = (
        weights["money"] * money_s
        + weights["social"] * social_s
        + weights["meaning"] * meaning_s
        + weights["lifespan"] * lifespan_s
    )
    if score < 0.0:
        score = 0.0
    if score > 100.0:
        score = 100.0
    return float(score)
