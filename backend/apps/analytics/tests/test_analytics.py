import pytest

from apps.analytics.models import AdherenceAnalyticsReport
from apps.profiles.models import PatientProfile


@pytest.mark.django_db
def test_adherence_analytics_report():
    profile = PatientProfile.objects.create(name="Analytics User", relationship="Self")
    report = AdherenceAnalyticsReport.objects.create(
        patient_profile=profile,
        period=AdherenceAnalyticsReport.Period.WEEKLY,
        taken_doses=14,
        missed_doses=1,
        adherence_percentage=93.3,
    )

    assert report.patient_profile == profile
    assert report.period == "Weekly"
    assert report.adherence_percentage == 93.3
