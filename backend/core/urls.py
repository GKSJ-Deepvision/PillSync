from django.urls import path

from . import views

urlpatterns = [
    path('auth/login/', views.LoginView.as_view()),
    path('auth/register/', views.RegisterView.as_view()),
    path('auth/forgot-password/', views.ForgotPasswordView.as_view()),
    path('auth/reset-password/', views.ResetPasswordView.as_view()),
    path('auth/me/', views.MeView.as_view()),
    path('profile/', views.ProfileView.as_view()),
    path('patient/dashboard/', views.PatientDashboardView.as_view()),
    path('patient/medications/', views.MedicationListCreateView.as_view()),
    path('patient/medications/<int:medication_id>/', views.MedicationDetailView.as_view()),
    path('patient/medications/<int:medication_id>/refill/', views.MedicationRefillView.as_view()),
    path('patient/schedule/', views.ScheduleListView.as_view()),
    path('patient/schedule/<int:schedule_id>/status/', views.ScheduleStatusView.as_view()),
    path('patient/adherence/', views.AdherenceView.as_view()),
    path('patient/notifications/', views.NotificationListView.as_view()),
    path('patient/notifications/<int:notification_id>/', views.NotificationDetailView.as_view()),
    path('patient/intelligence/', views.MedicationIntelligenceView.as_view()),
    path('patient/medications/ocr/', views.MedicationOcrView.as_view()),
    path('caregiver/patients/', views.PatientListView.as_view()),
    path('caregiver/patients/<int:patient_id>/', views.PatientDetailView.as_view()),
    path('caregiver/alerts/', views.AlertListView.as_view()),
    path('caregiver/alerts/<int:alert_id>/resolve/', views.AlertResolveView.as_view()),
    path('caregiver/alerts/create/', views.AlertCreateView.as_view()),
    path('admin/users/', views.AdminUserListView.as_view()),
    path('admin/users/<int:user_id>/', views.AdminUserDetailView.as_view()),
    path('admin/users/<int:user_id>/status/', views.AdminUserStatusView.as_view()),
    path('admin/activity-logs/', views.ActivityLogListView.as_view()),
    path('patient/adherence/risk/', views.AdherenceRiskView.as_view()),
]
