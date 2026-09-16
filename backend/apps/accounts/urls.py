from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CurrentUserView, LoginView, LogoutView, RegisterView

urlpatterns = [
    path("register", RegisterView.as_view(), name="auth-register"),
    path("register/", RegisterView.as_view(), name="auth-register-slash"),
    path("login", LoginView.as_view(), name="auth-login"),
    path("login/", LoginView.as_view(), name="auth-login-slash"),
    path("me", CurrentUserView.as_view(), name="auth-me"),
    path("me/", CurrentUserView.as_view(), name="auth-me-slash"),
    path("logout", LogoutView.as_view(), name="auth-logout"),
    path("logout/", LogoutView.as_view(), name="auth-logout-slash"),
    path("refresh", TokenRefreshView.as_view(), name="token-refresh"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh-slash"),
]
