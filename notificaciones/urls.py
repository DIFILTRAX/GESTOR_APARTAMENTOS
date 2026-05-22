from django.urls import path
from .views import (
    TipoNotificacionListCreateView,
    TipoNotificacionDetailView,
    NotificacionListCreateView,
    NotificacionDetailView,
    EnviarRecordatorioView,
    SchedulerConfigView,
)

urlpatterns = [
    # Tipos
    path('tipos/', TipoNotificacionListCreateView.as_view()),
    path('tipos/<int:pk>/', TipoNotificacionDetailView.as_view()),

    # Notificaciones
    path('', NotificacionListCreateView.as_view()),
    path('<int:pk>/', NotificacionDetailView.as_view()),

    # Correo masivo manual
    path('enviar-recordatorio/', EnviarRecordatorioView.as_view()),

    # Scheduler ON/OFF
    path('scheduler/', SchedulerConfigView.as_view()),
]





"""
from django.urls import path
from .views import (
    TipoNotificacionListCreateView,
    TipoNotificacionDetailView,
    NotificacionListCreateView,
    NotificacionDetailView
)

urlpatterns = [
    # TIPOS
    path('tipos-notificaciones/', TipoNotificacionListCreateView.as_view()),
    path('tipos-notificaciones/<int:pk>/', TipoNotificacionDetailView.as_view()),

    # NOTIFICACIONES
    path('notificaciones/', NotificacionListCreateView.as_view()),
    path('notificaciones/<int:pk>/', NotificacionDetailView.as_view()),
]
"""