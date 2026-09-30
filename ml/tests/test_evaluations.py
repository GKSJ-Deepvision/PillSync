"""The two evaluation harnesses double as regression gates.

`ml/src/ocr/evaluate.py` and `ml/src/refill_prediction/evaluate.py` produce the
figures in docs/reports/. Running them here, on a small seeded set, means a change
that quietly makes the parser or the predictor worse fails CI instead of surfacing
in the next report.

Only the parser-only OCR run is exercised: CI's ML job has no Tesseract binary.
The full OCR evaluation is run in the backend image (see docs/reports/ocr-evaluation.md).
"""

from __future__ import annotations

import importlib.util
import random
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "backend"))


def load(name: str, relative: str):
    spec = importlib.util.spec_from_file_location(name, REPO_ROOT / relative)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module  # dataclasses look the module up by name while it loads
    spec.loader.exec_module(module)
    return module


ocr_eval = load("ocr_evaluate", "ml/src/ocr/evaluate.py")
refill_eval = load("refill_evaluate", "ml/src/refill_prediction/evaluate.py")


class TestOcrParserRegressionGate:
    def report(self) -> str:
        return ocr_eval.run(count=25, meds=3, seed=3, ocr=False)

    def test_clean_text_is_read_perfectly(self):
        """Every field of every medicine, across all seven prescribing styles."""
        row = next(line for line in self.report().splitlines() if line.startswith("| text only"))
        cells = [c.strip() for c in row.strip("|").split("|")]
        assert cells[1:7] == ["100.0%"] * 6, row

    def test_it_never_attaches_the_wrong_drug_automatically(self):
        lines = self.report().splitlines()
        matching = [line for line in lines if line.startswith("| text only")][1]
        assert "0 (0.0%)" in matching, matching

    def test_nothing_is_invented(self):
        matching = [line for line in self.report().splitlines() if line.startswith("| text only")][1]
        assert matching.rstrip(" |").endswith("| 0"), matching

    def test_the_generated_set_covers_every_style_and_is_deterministic(self):
        first = ocr_eval.build_set(25, 3, random.Random(3))
        second = ocr_eval.build_set(25, 3, random.Random(3))
        assert [t for t, _ in first] == [t for t, _ in second]
        assert len(first) == 25 and all(len(truths) == 3 for _t, truths in first)


class TestRefillPredictorRegressionGate:
    def cohort(self):
        rng = random.Random(5)
        return [refill_eval.simulate(kind, rng) for kind in refill_eval.ARCHETYPES for _ in range(40)]

    def mean_error(self, weight):
        errors = refill_eval.date_error(self.cohort(), weight)
        assert errors, "no forecasts were made"
        return sum(abs(e) for e in errors) / len(errors)

    def test_learning_from_history_beats_trusting_the_schedule(self):
        assert self.mean_error(refill_eval.USED) < self.mean_error(None) * 0.8

    def test_the_used_weight_is_not_worse_than_a_much_larger_one(self):
        assert self.mean_error(refill_eval.USED) <= self.mean_error(40)

    def test_warnings_reach_almost_everyone_before_they_run_out(self):
        result = refill_eval.alert_timing(self.cohort(), refill_eval.USED)
        assert result["warned_before_running_out_percent"] >= 95

    def test_warnings_are_not_so_early_they_are_ignored(self):
        result = refill_eval.alert_timing(self.cohort(), refill_eval.USED)
        assert result["warned_too_early_percent"] <= 5

    def test_the_simulation_is_deterministic(self):
        a = refill_eval.simulate("typical", random.Random(1))
        b = refill_eval.simulate("typical", random.Random(1))
        assert a.taken == b.taken and a.stock == b.stock
