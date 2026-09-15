from datetime import date, timedelta

from fastapi.testclient import TestClient

from config.main import app

client = TestClient(app)


def _daily_logs(start, n_days, status):
    return [
        {"scheduled_for": (start + timedelta(days=i)).isoformat(), "status": status, "dose_quantity": 2}
        for i in range(n_days)
    ]


def test_health_reports_model_status():
    r = client.get("/api/v1/refills/health")
    assert r.status_code == 200
    body = r.json()
    assert "model_loaded" in body
    assert "version" in body


def test_predict_matches_spec_worked_example():
    payload = {
        "medication": {"id": "m1", "name": "BP tablet", "stock_quantity": 60, "refill_lead_days": 5},
        "schedules": [{"dose_quantity": 2, "days_of_week": list(range(7)), "is_active": True}],
        "dose_logs": [],
        "as_of": "2026-01-01",
    }
    r = client.post("/api/v1/refills/predict", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["prescribed_daily_dose"] == 2
    assert body["days_remaining"] == 30
    assert body["stock_status"] == "ok"


def test_predict_batch_sorts_by_urgency_and_summarizes():
    payload = {
        "as_of": "2026-01-01",
        "cases": [
            {
                "medication": {"id": "urgent", "stock_quantity": 4, "refill_lead_days": 5},
                "schedules": [{"dose_quantity": 2, "days_of_week": list(range(7)), "is_active": True}],
                "dose_logs": [],
            },
            {
                "medication": {"id": "fine", "stock_quantity": 100, "refill_lead_days": 5},
                "schedules": [{"dose_quantity": 1, "days_of_week": list(range(7)), "is_active": True}],
                "dose_logs": [],
            },
        ],
    }
    r = client.post("/api/v1/refills/predict/batch", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["summary"]["total"] == 2
    assert body["summary"]["urgent_count"] == 1
    assert body["predictions"][0]["medication_id"] == "urgent"  # soonest first


def test_predict_caregiver_ranks_patients_by_urgency():
    start = date(2025, 11, 1)
    declining_logs = _daily_logs(start, 20, "taken") + _daily_logs(start + timedelta(days=20), 6, "missed")
    payload = {
        "as_of": (start + timedelta(days=26)).isoformat(),
        "patients": [
            {
                "patient_id": "p-calm",
                "patient_name": "Calm Patient",
                "cases": [
                    {
                        "medication": {"id": "m1", "stock_quantity": 200, "refill_lead_days": 5},
                        "schedules": [{"dose_quantity": 1, "days_of_week": list(range(7)), "is_active": True}],
                        "dose_logs": [],
                    }
                ],
            },
            {
                "patient_id": "p-risk",
                "patient_name": "At Risk Patient",
                "cases": [
                    {
                        "medication": {"id": "m2", "stock_quantity": 3, "refill_lead_days": 5},
                        "schedules": [{"dose_quantity": 2, "days_of_week": list(range(7)), "is_active": True}],
                        "dose_logs": declining_logs,
                    }
                ],
            },
        ],
    }
    r = client.post("/api/v1/refills/predict/caregiver", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["patients"][0]["patient_id"] == "p-risk"  # more urgent patient ranked first
    assert body["urgent_total"] >= 1


def test_predict_no_schedule_returns_no_schedule_status():
    payload = {
        "medication": {"id": "m1", "stock_quantity": 10},
        "schedules": [],
        "dose_logs": [],
    }
    r = client.post("/api/v1/refills/predict", json=payload)
    body = r.json()
    assert body["stock_status"] == "no-schedule"
    assert body["days_remaining"] is None
