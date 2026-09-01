"""
URL configuration for pillsync project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Admin Interface
    path('admin/', admin.site.urls),
    
    # OAuth2 Endpoints (django-oauth-toolkit)
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider')),
    
    # Authentication API Endpoints
    path('api/auth/', include('authentication.urls')),
]
