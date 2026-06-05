"""Unit tests for engine.life_sim and engine.scoring (stdlib unittest only)."""
import os
import sys
import unittest

# Make sibling imports work whether tests run as engine.test_life_sim or directly.
HERE = os.path.dirname(os.path.abspath(__file__))
PARENT = os.path.dirname(HERE)
if PARENT not in sys.path:
    sys.path.insert(0, PARENT)

from engine.life_sim import (  # noqa: E402
    InitialConditions,
    LifeOutcome,
    LifeSimulator,
    LifeState,
    _stage_for_age,
)
from engine.scoring import DEFAULT_WEIGHTS, score_outcome  # noqa: E402


def _make_ic(seed=42):
    return InitialConditions(
        family_ses=1.0,
        birth_region="us-west",
        big_five={
            "openness": 0.5,
            "conscientiousness": 0.5,
            "extraversion": 0.5,
            "agreeableness": 0.5,
            "neuroticism": 0.5,
        },
        health_baseline=1.0,
        luck_seed=seed,
    )


class TestInitialConditions(unittest.TestCase):
    def test_initial_conditions(self):
        ic = _make_ic(seed=7)
        self.assertEqual(ic.luck_seed, 7)
        self.assertEqual(ic.birth_region, "us-west")
        self.assertAlmostEqual(ic.family_ses, 1.0)
        self.assertEqual(set(ic.big_five.keys()), {
            "openness", "conscientiousness", "extraversion",
            "agreeableness", "neuroticism",
        })
        # LifeState defaults are coherent.
        s = LifeState()
        self.assertEqual(s.age, 0)
        self.assertEqual(s.history, [])


class TestSimulatorRunsTo100(unittest.TestCase):
    def test_simulator_runs_to_100(self):
        ic = _make_ic(seed=42)
        # No yaml path -> empty events list; must not raise.
        sim = LifeSimulator(ic, events_yaml_path=None)
        outcome = sim.run()
        self.assertIsInstance(outcome, LifeOutcome)
        # 0..100 inclusive = 101 history entries.
        self.assertEqual(len(sim.state.history), 101)
        self.assertEqual(sim.state.age, 100)
        # missing yaml file should also be tolerated.
        sim2 = LifeSimulator(ic, events_yaml_path="/tmp/does-not-exist-events.yaml")
        outcome2 = sim2.run()
        self.assertIsInstance(outcome2, LifeOutcome)


class TestStageBoundaries(unittest.TestCase):
    def test_stage_boundaries(self):
        cases = [
            (0, "childhood"),
            (12, "childhood"),
            (13, "adolescence"),
            (19, "adolescence"),
            (20, "early_adult"),
            (39, "early_adult"),
            (40, "mid_adult"),
            (59, "mid_adult"),
            (60, "late_adult"),
            (79, "late_adult"),
            (80, "old_age"),
            (100, "old_age"),
        ]
        for age, expected in cases:
            self.assertEqual(_stage_for_age(age), expected, "age=%d" % age)


class TestScoringWeightsSumTo1(unittest.TestCase):
    def test_scoring_weights_sum_to_1(self):
        # default weights sum to 1.
        self.assertAlmostEqual(sum(DEFAULT_WEIGHTS.values()), 1.0, places=6)
        outcome = LifeOutcome(
            total_money_value=10000.0,
            total_social_value=50.0,
            self_meaning=40.0,
            healthy_lifespan=80.0,
            network_density=0.5,
        )
        score = score_outcome(outcome)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 100.0)
        # bad weights raise.
        with self.assertRaises(ValueError):
            score_outcome(outcome, weights={"money": 0.5, "social": 0.5,
                                            "meaning": 0.5, "lifespan": 0.5})
        with self.assertRaises(ValueError):
            score_outcome(outcome, weights={"money": 1.0})  # missing keys


if __name__ == "__main__":
    unittest.main(verbosity=2)
