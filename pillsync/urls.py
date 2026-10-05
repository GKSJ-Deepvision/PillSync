"""
URL configuration for pillsync project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from backend.apps.ocr.views import PrescriptionOCRWebView

urlpatterns = [
    # Admin Interface
    path('admin/', admin.site.urls),
    
    # OAuth2 Endpoints (django-oauth-toolkit)
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider')),
    
    # Authentication API Endpoints
    path('api/auth/', include('authentication.urls')),

    # Milestone 3 — OCR & Prescription API Endpoints
    path('api/ocr/', include('backend.apps.ocr.urls')),
    path('api/prescription/ocr/', include('backend.apps.ocr.urls')),

    # OCR Web Interface (Direct Access)
    path('ocr/', PrescriptionOCRWebView.as_view(), name='prescription_ocr_web'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

