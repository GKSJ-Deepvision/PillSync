"""Account and access-control routes."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    AdminUserViewSet,
    CaregiverAssignmentViewSet,
    GoogleLoginView,
    LoginView,
    LogoutView,
    MeView,
    PasswordChangeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
)

router = DefaultRouter()
router.register(
    "caregiver-assignments", CaregiverAssignmentViewSet, basename="caregiver-assignment"
)
router.register("admin/users", AdminUserViewSet, basename="admin-user")

auth_patterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("google/", GoogleLoginView.as_view(), name="google-login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token-verify"),
    path("password/change/", PasswordChangeView.as_view(), name="password-change"),
    path("password/reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path(
        "password/reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
]

urlpatterns = [
    path("auth/", include((auth_patterns, "auth"))),
    path("users/me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
