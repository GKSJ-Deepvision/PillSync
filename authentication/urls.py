from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView,
    MeView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    SessionLoginView,
    SessionLogoutView,
    LogoutView,
)

urlpatterns = [
    # JWT Authentication Endpoints
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth_token_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    
    # User Profile Endpoint
    path('me/', MeView.as_view(), name='auth_me'),
    
    # Password Management Endpoints
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='auth_password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='auth_password_reset_confirm'),
    
    # Django Session Management Endpoints
    path('session/login/', SessionLoginView.as_view(), name='auth_session_login'),
    path('session/logout/', SessionLogoutView.as_view(), name='auth_session_logout'),
]
