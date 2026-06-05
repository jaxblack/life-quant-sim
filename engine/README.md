# engine

Python life-simulation engine for life-quant-sim.

- `life_sim.py` — `InitialConditions`, `LifeState`, `LifeOutcome` dataclasses
  and the `LifeSimulator` state machine that walks a person from age 0 to 100,
  drawing yearly events from a YAML taxonomy (events file optional).
- `scoring.py` — `score_outcome(outcome, weights=None) -> float` mapping a
  `LifeOutcome` onto a 0-100 quality-of-life score (default weights:
  money 0.25 / social 0.25 / meaning 0.30 / lifespan 0.20).
- `test_life_sim.py` — stdlib `unittest` suite (no third-party deps).

Run tests from the repo root:

    python3 -m unittest engine.test_life_sim -v

Optional runtime dep for loading the events YAML: `pip install -r engine/requirements.txt`.
Targets Python 3.9+ (no `X | None` syntax).
