"""Refill predictions end to end: stock changes, alerts, access, accuracy."""

from __future__ import annotations

from datetime import time, timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.common.choices import DoseSlot, DoseStatus, NotificationCategory
from apps.medications.models import MedicationSchedule, Medicine
from apps.notifications.models import NotificationLog
from apps.refills.models import RefillPrediction, StockEvent
from apps.refills.services import alerts, backtest, prediction, stock
from apps.reminders.models import DoseEvent
from apps.reminders.services import actions

pytestmark = pytest.mark.django_db


def make_medicine(patient, *, stock_units="30", per_day=1, name="Metformin", **extra):
    medicine = Medicine.objects.create(
        patient=patient.patient_profile,
        name=name,
        category="DIABETES",
        quantity_remaining=Decimal(stock_units),
        **extra,
    )
    slots = [DoseSlot.MORNING, DoseSlot.AFTERNOON, DoseSlot.EVENING, DoseSlot.NIGHT]
    for i in range(per_day):
        MedicationSchedule.objects.create(
            medicine=medicine,
            slot=slots[i],
            time_of_day=time(8 + 4 * i, 0),
            quantity_per_dose=Decimal("1"),
        )
    return medicine


def make_dose(medicine, when, status, taken=None):
    return DoseEvent.objects.create(
        schedule=medicine.schedules.first(),
        medicine=medicine,
        patient=medicine.patient,
        scheduled_for=when,
        slot=DoseSlot.MORNING,
        quantity_expected=Decimal("1"),
        quantity_taken=taken,
        status=status,
    )


@pytest.fixture
def medicine_30(patient):
    return make_medicine(patient, stock_units="30", per_day=1)


class TestPrediction:
    def test_it_uses_the_schedule_before_there_is_history(self, medicine_30):
        obj = prediction.recompute(medicine_30)

        assert obj.status == "OK"
        assert obj.average_daily == Decimal("1")
        assert obj.observed_weight == 0
        today = timezone.localdate()
        assert obj.depletion_date == today + timedelta(days=30)
        assert obj.recommended_refill_date == today + timedelta(days=25)

    def test_no_schedule_means_no_forecast_rather_than_a_wrong_one(self, patient):
        medicine = Medicine.objects.create(
            patient=patient.patient_profile, name="Loose", quantity_remaining=Decimal("20")
        )
        obj = prediction.recompute(medicine)
        assert obj.status == "UNKNOWN"
        assert obj.depletion_date is None

    def test_a_stopped_medicine_has_no_prediction(self, medicine_30):
        prediction.recompute(medicine_30)
        medicine_30.is_active = False
        medicine_30.save()

        assert prediction.recompute(medicine_30) is None
        assert not RefillPrediction.objects.filter(medicine=medicine_30).exists()

    def test_real_history_pulls_the_forecast_off_the_schedule(self, patient):
        """Scheduled 2/day, but the patient really takes about 1/day."""
        medicine = make_medicine(patient, stock_units="40", per_day=2)
        today = timezone.now().replace(hour=8, minute=0, second=0, microsecond=0)
        for day in range(1, 15):
            when = today - timedelta(days=day)
            make_dose(medicine, when, DoseStatus.TAKEN, Decimal("1"))
            make_dose(medicine, when + timedelta(hours=4), DoseStatus.MISSED)

        obj = prediction.recompute(medicine)
        assert Decimal("1") <= obj.average_daily < Decimal("2")
        assert obj.observed_weight > 0.5
        assert obj.confidence > 0.75


class TestStatusesAndAlerts:
    def test_stock_that_will_not_last_the_lead_time_is_flagged_and_alerted_once(self, patient):
        medicine = make_medicine(patient, stock_units="4", per_day=1)
        obj = alerts.after_stock_change(medicine, notify=True)

        assert obj.status in {"LOW", "CRITICAL"}
        sent = NotificationLog.objects.filter(
            category=NotificationCategory.REFILL_DUE, channel="PUSH"
        )
        assert sent.count() == 1

        alerts.after_stock_change(medicine, notify=True)
        alerts.after_stock_change(medicine, notify=True)
        assert sent.count() == 1  # not repeated

    def test_it_escalates_as_the_stock_gets_worse(self, patient):
        medicine = make_medicine(patient, stock_units="5", per_day=1)
        alerts.after_stock_change(medicine, notify=True)
        first = NotificationLog.objects.filter(category=NotificationCategory.REFILL_DUE).count()

        stock.adjust(medicine, Decimal("0"), patient)
        assert (
            NotificationLog.objects.filter(category=NotificationCategory.REFILL_DUE).count() > first
        )
        assert RefillPrediction.objects.get(medicine=medicine).status == "OUT"

    def test_a_refill_resets_the_alert_so_the_next_shortage_is_announced(self, patient):
        medicine = make_medicine(patient, stock_units="3", per_day=1)
        alerts.after_stock_change(medicine, notify=True)
        assert RefillPrediction.objects.get(medicine=medicine).alert_level > 0

        stock.restock(medicine, Decimal("60"), patient)
        assert RefillPrediction.objects.get(medicine=medicine).alert_level == 0

        stock.adjust(medicine, Decimal("2"), patient)
        assert (
            NotificationLog.objects.filter(
                category=NotificationCategory.REFILL_DUE, channel="PUSH"
            ).count()
            == 2
        )

    def test_a_caregiver_is_told_too(self, patient, caregiver, active_assignment):
        medicine = make_medicine(patient, stock_units="2", per_day=1)
        alerts.after_stock_change(medicine, notify=True)

        assert NotificationLog.objects.filter(
            recipient=caregiver, category=NotificationCategory.REFILL_DUE
        ).exists()

    def test_a_caregiver_who_opted_out_of_alerts_is_not(
        self, patient, caregiver, active_assignment
    ):
        active_assignment.can_receive_alerts = False
        active_assignment.save()
        medicine = make_medicine(patient, stock_units="2", per_day=1)
        alerts.after_stock_change(medicine, notify=True)

        assert not NotificationLog.objects.filter(recipient=caregiver).exists()

    def test_taking_a_dose_triggers_the_check(self, patient):
        medicine = make_medicine(patient, stock_units="6", per_day=1)
        dose = make_dose(medicine, timezone.now(), DoseStatus.PENDING)
        dose.quantity_taken = None
        dose.save()

        actions.mark_taken(dose)
        assert RefillPrediction.objects.filter(medicine=medicine).exists()

    def test_the_message_is_the_specification_example(self, patient):
        medicine = make_medicine(patient, stock_units="4", per_day=1, brand_name="Glycomet")
        obj = alerts.after_stock_change(medicine, notify=False)
        assert "expected to finish in" in prediction.message_for(medicine, obj) or (
            "will run out in" in prediction.message_for(medicine, obj)
        )
        assert "Glycomet" in prediction.message_for(medicine, obj)


class TestStockLedger:
    def test_creating_a_medicine_writes_the_starting_stock(self, patient_client, patient):
        response = patient_client.post(
            reverse("v1:medicine-list"),
            {
                "patient": str(patient.patient_profile.id),
                "name": "Metformin",
                "quantity_remaining": "30",
                "schedules": [
                    {"slot": "MORNING", "time_of_day": "08:00", "quantity_per_dose": "1"}
                ],
            },
            format="json",
        )
        assert response.status_code == 201, response.data
        event = StockEvent.objects.get(medicine_id=response.data["id"])
        assert event.kind == "INITIAL" and event.quantity_after == Decimal("30")
        assert RefillPrediction.objects.filter(medicine_id=response.data["id"]).exists()

    def test_refill_is_recorded(self, patient_client, medicine_30):
        patient_client.post(
            reverse("v1:medicine-refill", args=[medicine_30.id]), {"quantity": "10"}, format="json"
        )
        event = medicine_30.stock_events.get(kind="REFILL")
        assert event.quantity_delta == Decimal("10")
        assert event.quantity_after == Decimal("40")

    def test_adjust_stock_overrules_the_running_total_and_keeps_the_history(
        self, patient_client, medicine_30
    ):
        response = patient_client.post(
            reverse("v1:medicine-adjust-stock", args=[medicine_30.id]),
            {"quantity": "12", "reason": "Counted the box"},
            format="json",
        )
        assert response.status_code == 200
        event = medicine_30.stock_events.get(kind="ADJUSTMENT")
        assert event.quantity_delta == Decimal("-18")
        assert event.reason == "Counted the box"

    def test_negative_stock_is_refused(self, patient_client, medicine_30):
        response = patient_client.post(
            reverse("v1:medicine-adjust-stock", args=[medicine_30.id]),
            {"quantity": "-1"},
            format="json",
        )
        assert response.status_code == 400

    def test_stock_cannot_be_silently_overwritten_with_a_patch(self, patient_client, medicine_30):
        response = patient_client.patch(
            reverse("v1:medicine-detail", args=[medicine_30.id]),
            {"quantity_remaining": "999"},
            format="json",
        )
        assert response.status_code == 400
        medicine_30.refresh_from_db()
        assert medicine_30.quantity_remaining == Decimal("30")

    def test_other_fields_can_still_be_patched(self, patient_client, medicine_30):
        response = patient_client.patch(
            reverse("v1:medicine-detail", args=[medicine_30.id]),
            {"instructions": "After food", "quantity_remaining": "30"},
            format="json",
        )
        assert response.status_code == 200

    def test_history_lists_the_ledger(self, patient_client, medicine_30):
        stock.record_initial(medicine_30)
        stock.restock(medicine_30, Decimal("5"))
        response = patient_client.get(reverse("v1:medicine-stock-history", args=[medicine_30.id]))
        assert [e["kind"] for e in response.data] == ["REFILL", "INITIAL"]

    def test_editing_the_schedule_moves_the_forecast(self, patient_client, medicine_30):
        prediction.recompute(medicine_30)
        schedule = medicine_30.schedules.first()
        patient_client.patch(
            reverse("v1:schedule-detail", args=[schedule.id]),
            {"quantity_per_dose": "3"},
            format="json",
        )
        obj = RefillPrediction.objects.get(medicine=medicine_30)
        assert obj.scheduled_daily == Decimal("3")

    def test_stopping_a_medicine_clears_its_forecast(self, patient_client, medicine_30):
        prediction.recompute(medicine_30)
        patient_client.delete(reverse("v1:medicine-detail", args=[medicine_30.id]))
        assert not RefillPrediction.objects.filter(medicine=medicine_30).exists()


class TestApi:
    def test_list_puts_the_most_urgent_first(self, patient_client, patient):
        healthy = make_medicine(patient, stock_units="90", name="Healthy")
        urgent = make_medicine(patient, stock_units="2", name="Urgent")
        for m in (healthy, urgent):
            prediction.recompute(m)

        response = patient_client.get(reverse("v1:refill-list"))
        assert [r["medicine_name"] for r in response.data] == ["Urgent", "Healthy"]
        assert response.data[0]["message"]

    def test_summary_counts_what_needs_attention(self, patient_client, patient):
        prediction.recompute(make_medicine(patient, stock_units="90", name="A"))
        prediction.recompute(make_medicine(patient, stock_units="1", name="B"))

        response = patient_client.get(reverse("v1:refill-summary"))
        assert response.data["needs_attention"] == 1

    def test_projection_gives_a_daily_series(self, patient_client, medicine_30):
        obj = prediction.recompute(medicine_30)
        response = patient_client.get(reverse("v1:refill-projection", args=[obj.id]))

        points = response.data["points"]
        assert len(points) >= 30
        assert points[0]["remaining"] == 30.0
        assert points[-1]["remaining"] <= points[0]["remaining"]

    def test_you_cannot_see_another_patients_forecasts(
        self, patient_client, auth_client, other_patient
    ):
        theirs = make_medicine(other_patient, stock_units="2")
        obj = prediction.recompute(theirs)

        assert patient_client.get(reverse("v1:refill-list")).data == []
        assert patient_client.get(reverse("v1:refill-detail", args=[obj.id])).status_code == 404

    def test_a_caregiver_sees_an_assigned_patients_forecasts(
        self, caregiver_client, patient, active_assignment
    ):
        prediction.recompute(make_medicine(patient, stock_units="2"))
        assert len(caregiver_client.get(reverse("v1:refill-list")).data) == 1

    def test_anonymous_callers_are_refused(self, api_client):
        assert api_client.get(reverse("v1:refill-list")).status_code == 401

    def test_recompute_endpoint_refreshes_everything(self, patient_client, medicine_30):
        response = patient_client.post(reverse("v1:refill-recompute"))
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_the_nightly_task_recomputes_and_alerts(self, patient):
        from apps.refills.tasks import recompute_predictions

        make_medicine(patient, stock_units="2")
        assert recompute_predictions() == 1
        assert NotificationLog.objects.filter(category=NotificationCategory.REFILL_DUE).exists()


class TestBacktest:
    def steady_patient(self, patient, days=30):
        medicine = make_medicine(patient, stock_units="200", per_day=1)
        base = timezone.now().replace(hour=8, minute=0, second=0, microsecond=0)
        for day in range(1, days + 1):
            make_dose(medicine, base - timedelta(days=day), DoseStatus.TAKEN, Decimal("1"))
        return medicine

    def test_a_steady_patient_is_forecast_accurately(self, patient):
        medicine = self.steady_patient(patient)
        result = backtest.consumption_backtest([medicine], timezone.localdate())

        assert result["medicines_scored"] == 1
        assert result["accuracy_percent"] >= 95
        assert result["within_tolerance_percent"] == 100

    def test_too_little_history_is_reported_not_scored(self, patient):
        medicine = self.steady_patient(patient, days=5)
        result = backtest.consumption_backtest([medicine], timezone.localdate())

        assert result["medicines_scored"] == 0
        assert result["accuracy_percent"] is None
        assert result["note"]

    def test_the_accuracy_endpoint(self, patient_client, patient):
        self.steady_patient(patient)
        response = patient_client.get(reverse("v1:refill-accuracy"))
        assert response.status_code == 200
        assert response.data["horizon_days"] == 7


class TestBacktestScales:
    def test_the_number_of_queries_does_not_grow_with_the_number_of_medicines(
        self, patient, django_assert_max_num_queries
    ):
        """The first version issued ~7 queries per medicine; 200 medicines took five seconds."""
        base = timezone.now().replace(hour=8, minute=0, second=0, microsecond=0)
        medicines = []
        for i in range(12):
            medicine = make_medicine(patient, stock_units="100", per_day=1, name=f"M{i}")
            for day in range(1, 31):
                make_dose(medicine, base - timedelta(days=day), DoseStatus.TAKEN, Decimal("1"))
            medicines.append(medicine)

        # Callers prefetch schedules, as the API view and the admin overview do.
        prefetched = Medicine.objects.filter(pk__in=[m.pk for m in medicines]).prefetch_related(
            "schedules"
        )
        with django_assert_max_num_queries(6):
            result = backtest.consumption_backtest(prefetched, timezone.localdate())
        assert result["medicines_scored"] == 12
