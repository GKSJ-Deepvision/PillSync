from apps.ocr.engine.parser import parse_prescription

KNOWN = [
    "Metformin",
    "Amlodipine",
    "Telmisartan",
    "Atorvastatin",
    "Levothyroxine",
    "Amoxicillin",
    "Paracetamol",
    "Vitamin D3",
]

SAMPLE = """\
Dr. Ramesh Rao, MBBS MD
City Care Clinic
Date: 12/09/2026
Patient: Test Patient   Age: 54
Rx
1. Tab. Metformin 500 mg
   1-0-1 after food x 30 days
2) Tab Amlodipine 5mg  OD  for 30 days
3. Cap. Amoxicillin 500 mg  TDS x 5 days
4. Tab. Levothyroxine 50 mcg 1-0-0 before breakfast x 1 month
5. Tab. Atorvastatin 10mg at night x 15 days
6. Tab. Paracetamol 650 mg SOS
"""


def by_name(res):
    return {m["name"]: m for m in res["medicines"]}


def test_multiple_medicines_extracted():
    res = parse_prescription(SAMPLE, KNOWN)
    assert res["medicine_count"] == 6
    assert res["doctor"].startswith("Dr. Ramesh Rao")
    assert res["prescription_date"] == "12/09/2026"


def test_metformin_multiline_block():
    m = by_name(parse_prescription(SAMPLE, KNOWN))["Metformin"]
    assert m["strength"] == "500mg"
    assert m["doses_per_day"] == 2 and m["times_of_day"] == ["morning", "night"]
    assert (
        m["duration_days"] == 30 and m["quantity"] == 60
    )  # spec example: 60 tabs @ 2/day = 30 days
    assert m["quantity_source"] == "calculated"


def test_frequency_abbreviations_and_duration_units():
    r = by_name(parse_prescription(SAMPLE, KNOWN))
    assert r["Amlodipine"]["doses_per_day"] == 1 and r["Amlodipine"]["quantity"] == 30
    assert r["Amoxicillin"]["doses_per_day"] == 3 and r["Amoxicillin"]["quantity"] == 15
    assert (
        r["Levothyroxine"]["duration_days"] == 30
        and r["Levothyroxine"]["food_instruction"] == "before breakfast"
    )
    assert r["Atorvastatin"]["times_of_day"] == ["night"]


def test_sos_has_no_fixed_schedule():
    m = by_name(parse_prescription(SAMPLE, KNOWN))["Paracetamol"]
    assert m["as_needed"] and m["doses_per_day"] is None


def test_ocr_typo_corrected_against_known_list():
    res = parse_prescription("1. Tab. Metformln 500 mg BD x 10 days", KNOWN)
    assert res["medicines"][0]["name"] == "Metformin"


def test_printed_quantity_wins_over_calculated():
    m = parse_prescription("1. Tab. Amlodipine 5mg OD x 30 days Qty: 28", KNOWN)["medicines"][0]
    assert m["quantity"] == 28 and m["quantity_source"] == "printed"


def test_combination_drug_and_unknown_marked_for_review():
    res = parse_prescription(
        "1. Tab. Amlodipine 5mg + Telmisartan 40mg OD x 30 days\n2. Tab. Zzq", KNOWN
    )
    assert "+" in res["medicines"][0]["strength"]
    assert res["needs_review"] is True


def test_empty_text_needs_review():
    assert parse_prescription("", KNOWN)["needs_review"] is True
