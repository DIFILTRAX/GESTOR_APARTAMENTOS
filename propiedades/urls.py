from django.urls import path
from .views import (
    EdificioListCreateView, EdificioDetailView,
    PisoListCreateView, PisoDetailView,
    ApartamentoListCreateView, ApartamentoDetailView,
    PropietarioListCreateView, PropietarioDetailView,
)

urlpatterns = [
    # Edificios
    path('edificios/', EdificioListCreateView.as_view()),
    path('edificios/<str:pk>/', EdificioDetailView.as_view()),

    # Pisos
    path('pisos/', PisoListCreateView.as_view()),
    path('pisos/<int:pk>/', PisoDetailView.as_view()),

    # Apartamentos
    path('apartamentos/', ApartamentoListCreateView.as_view()),
    path('apartamentos/<int:pk>/', ApartamentoDetailView.as_view()),

    # Propietarios
    path('propietarios/', PropietarioListCreateView.as_view()),
    path('propietarios/<str:identificacion>/', PropietarioDetailView.as_view()),
]




"""
from django.urls import path
from .views import EdificioListCreateView, EdificioDetailView
from .views import PisoListCreateView, PisoDetailView
from .views import ApartamentoListCreateView, ApartamentoDetailView
from .views import PropietarioListCreateView, PropietarioDetailView

urlpatterns = [
    path('edificios/', EdificioListCreateView.as_view()),
    path('edificios/<str:pk>/', EdificioDetailView.as_view()),
    #path('edificios/<int:pk>/', EdificioDetailView.as_view()),
    path('pisos/', PisoListCreateView.as_view()),
    path('pisos/<int:pk>/', PisoDetailView.as_view()),
    path('apartamentos/', ApartamentoListCreateView.as_view()),
    path('apartamentos/<int:pk>/', ApartamentoDetailView.as_view()),
    path('propietarios/', PropietarioListCreateView.as_view()),
    path('propietarios/<str:identificacion>/', PropietarioDetailView.as_view()),
]
"""