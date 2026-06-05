"""Life simulator engine: stage-based state machine driven by life events."""
from typing import Optional, Dict, List
from dataclasses import dataclass, field
import os
import random


# Stage boundaries used by _stage_for_age and tests.
_STAGES = (
    (0, 12, "childhood"),
    (13, 19, "adolescence"),
    (20, 39, "early_adult"),
    (40, 59, "mid_adult"),
    (60, 79, "late_adult"),
    (80, 200, "old_age"),
)


def _stage_for_age(age):
    for lo, hi, name in _STAGES:
        if lo <= age <= hi:
            return name
    return "old_age"


@dataclass
class InitialConditions:
    family_ses: float
    birth_region: str
    big_five: Dict[str, float]
    health_baseline: float
    luck_seed: int


@dataclass
class LifeState:
    age: int = 0
    money: float = 0.0
    social_capital: float = 0.0
    meaning: float = 0.0
    energy: float = 1.0
    current_stage: str = "childhood"
    history: list = field(default_factory=list)


@dataclass
class LifeOutcome:
    total_money_value: float
    total_social_value: float
    self_meaning: float
    healthy_lifespan: float
    network_density: float


class LifeSimulator:
    """Simulate one life from age 0 to 100 by drawing events per year."""

    def __init__(self, ic, events_yaml_path=None):
        # type: (InitialConditions, Optional[str]) -> None
        self.ic = ic
        self.events_yaml_path = events_yaml_path
        self.events = self._load_events(events_yaml_path)
        self.rng = random.Random(ic.luck_seed)
        self.state = LifeState(
            age=0,
            money=float(ic.family_ses),
            social_capital=0.0,
            meaning=0.0,
            energy=float(ic.health_baseline),
            current_stage="childhood",
            history=[],
        )

    @staticmethod
    def _load_events(path):
        # type: (Optional[str]) -> List[dict]
        if not path:
            return []
        if not os.path.exists(path):
            # events-taxonomy may not be ready yet; degrade silently.
            return []
        try:
            import yaml  # lazy import so tests run without pyyaml
        except ImportError:
            return []
        try:
            with open(path, "r") as fh:
                data = yaml.safe_load(fh)
        except Exception:
            return []
        if not data:
            return []
        if isinstance(data, dict) and "events" in data:
            data = data["events"]
        if not isinstance(data, list):
            return []
        return data

    def _stage(self, age):
        # type: (int) -> str
        return _stage_for_age(age)

    def _eligible(self, event, age, stage):
        # type: (dict, int, str) -> bool
        # accept events that either (a) match by stage, (b) match by age range,
        # or (c) declare no constraints at all.
        ev_stages = event.get("stages") or event.get("stage")
        if ev_stages:
            if isinstance(ev_stages, str):
                ev_stages = [ev_stages]
            if stage not in ev_stages:
                return False
        age_min = event.get("age_min")
        age_max = event.get("age_max")
        if age_min is not None and age < age_min:
            return False
        if age_max is not None and age > age_max:
            return False
        return True

    def step(self, age):
        # type: (int) -> List[dict]
        """Advance simulation by one year; return list of events that fired."""
        stage = self._stage(age)
        self.state.age = age
        self.state.current_stage = stage
        fired = []  # type: List[dict]
        for ev in self.events:
            if not self._eligible(ev, age, stage):
                continue
            prob = float(ev.get("probability", ev.get("prob", 0.0)))
            if prob <= 0.0:
                continue
            if self.rng.random() < prob:
                impact = ev.get("impact_dims") or ev.get("impact") or {}
                self.state.money += float(impact.get("money", 0.0))
                self.state.social_capital += float(impact.get("social", 0.0))
                self.state.meaning += float(impact.get("meaning", 0.0))
                self.state.energy += float(impact.get("energy", 0.0))
                fired.append({
                    "age": age,
                    "stage": stage,
                    "event": ev.get("name", "event"),
                    "impact": dict(impact),
                })
        self.state.history.append({
            "age": age,
            "stage": stage,
            "money": self.state.money,
            "social": self.state.social_capital,
            "meaning": self.state.meaning,
            "energy": self.state.energy,
            "events": [f["event"] for f in fired],
        })
        return fired

    def run(self):
        # type: () -> LifeOutcome
        """Simulate ages 0..100 inclusive and produce a LifeOutcome."""
        for age in range(0, 101):
            self.step(age)
        # healthy_lifespan: how long energy stayed above 0.5
        healthy = sum(1 for h in self.state.history if h["energy"] >= 0.5)
        # network_density: rough proxy from social_capital normalised to 0-1
        density = max(0.0, min(1.0, self.state.social_capital / 100.0))
        return LifeOutcome(
            total_money_value=float(self.state.money),
            total_social_value=float(self.state.social_capital),
            self_meaning=float(self.state.meaning),
            healthy_lifespan=float(healthy),
            network_density=float(density),
        )
