import pytest

from apps.profiles.models import PatientProfile


@pytest.mark.django_db
def test_create_family_profiles():
    primary = PatientProfile.objects.create(
        name="John Doe",
        relationship=PatientProfile.Relationship.SELF,
        gender="Male",
        is_primary=True,
    )
    child = PatientProfile.objects.create(
        name="Timmy Doe",
        relationship=PatientProfile.Relationship.CHILD,
        gender="Male",
    )
    parent = PatientProfile.objects.create(
        name="Grandma Mary",
        relationship=PatientProfile.Relationship.PARENT,
        gender="Female",
    )

    assert PatientProfile.objects.count() == 3
    assert primary.is_primary is True
    assert child.relationship == "Child"
    assert parent.relationship == "Parent"
