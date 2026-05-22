from django.urls import path
from .views import PagoListCreateView, PagoDetailView, TipoPagoListCreateView, TipoPagoDetailView, EstadoPagoListCreateView, EstadoPagoDetailView

urlpatterns = [
    path('', PagoListCreateView.as_view()),
    path('<int:pk>/', PagoDetailView.as_view()),

     # TIPOS DE PAGO
    path('tipos-pagos/', TipoPagoListCreateView.as_view()),
    path('tipos-pagos/<int:pk>/', TipoPagoDetailView.as_view()),
    #estados de pago
    path('estados-pagos/', EstadoPagoListCreateView.as_view()),
    path('estados-pagos/<int:pk>/', EstadoPagoDetailView.as_view()),
]