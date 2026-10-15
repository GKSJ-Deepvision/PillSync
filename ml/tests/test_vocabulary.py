"""Tests for the shared medicine vocabulary / fuzzy matcher.

Run from the repository root:
    python -m pytest ml/tests/test_vocabulary.py
"""

from ml.src.ocr import vocabulary


def test_vocabulary_includes_bundled_names_without_raw_datasets(monkeypatch, tmp_path):
    monkeypatch.setattr(vocabulary, "HANDWRITTEN_LABEL_FILES", [])
    monkeypatch.setattr(vocabulary, "REFERENCE_CSV", tmp_path / "missing.csv")
    vocab = vocabulary.MedicineVocabulary()
    assert len(vocab) > 100
    match = vocab.match("Telfast")
    assert match is not None
    assert match.name == "Telfast"


def test_exact_medicine_name_matches_with_high_confidence():
    vocab = vocabulary.get_vocabulary()
    match = vocab.match("Amoxicillin")
    assert match is not None
    assert match.name == "Amoxicillin"
    assert match.score >= 95


def test_ocr_typos_still_resolve_to_the_correct_medicine():
    vocab = vocabulary.get_vocabulary()
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
    vocab = vocabulary.get_vocabulary()
    for line in ["Dr S Patel", "MBBS, MD", "Rx", "Date: 12/05/2024", "Patient: John Doe"]:
        assert vocab.match(line) is None, f"{line!r} should not match a medicine"


def test_short_medicine_names_do_not_hijack_unrelated_longer_words():
    """Regression test: partial-substring matching used to let short names
    like "Aceta"/"Ace" claim a 100% match against any longer word that
    happened to contain those letters in sequence (e.g. "Paracetamal")."""
    vocab = vocabulary.get_vocabulary()
    match = vocab.match("Paracetamal")
    assert match is not None
    assert match.name == "Paracetamol"
