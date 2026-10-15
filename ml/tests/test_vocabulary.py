"""Tests for the shared medicine vocabulary / fuzzy matcher.

Run from the repository root:
    python -m pytest ml/tests/test_vocabulary.py
"""

from ml.src.ocr.vocabulary import get_vocabulary


def test_vocabulary_loads_names_from_all_three_datasets():
    vocab = get_vocabulary()
    # 10 printed generics + 78 handwritten brand names + the reference
    # dataset's ~64 unique names, minus a handful of overlaps.
    assert len(vocab) > 100


def test_exact_medicine_name_matches_with_high_confidence():
    vocab = get_vocabulary()
    match = vocab.match("Amoxicillin")
    assert match is not None
    assert match.name == "Amoxicillin"
    assert match.score >= 95


def test_ocr_typos_still_resolve_to_the_correct_medicine():
    vocab = get_vocabulary()
    cases = {
        "Paracetamal": "Paracetamol",
        "TabOmeprazcte": "Omeprazole",
        "Pantopra role": "Pantoprazole",
        "TabOiclofenac": "Diclofenac",
    }
    for noisy_text, expected in cases.items():
        match = vocab.match(noisy_text)
        assert match is not None, f"expected a match for {noisy_text!r}"
        assert match.name == expected


def test_doctor_and_boilerplate_text_never_matches():
    vocab = get_vocabulary()
    for line in ["Dr S Patel", "MBBS, MD", "Rx", "Date: 12/05/2024", "Patient: John Doe"]:
        assert vocab.match(line) is None, f"{line!r} should not match a medicine"


def test_short_medicine_names_do_not_hijack_unrelated_longer_words():
    """Regression test: partial-substring matching used to let short names
    like "Aceta"/"Ace" claim a 100% match against any longer word that
    happened to contain those letters in sequence (e.g. "Paracetamal")."""
    vocab = get_vocabulary()
    match = vocab.match("Paracetamal")
    assert match is not None
    assert match.name == "Paracetamol"
