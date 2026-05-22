from django.urls import path
from .views import (
    LoginView,
    MisPermisosView,
    UsuarioListCreateView,
    UsuarioDetailView,
    RolListCreateView,
    RolDetailView,
    PerfilListCreateView,
    PerfilDetailView,
    FormularioListCreateView,
    FormularioDetailView,
    PermisoListCreateView,
    PermisoDetailView,
    MiPerfilView,
)

urlpatterns = [
    # Auth
    path('login/', LoginView.as_view()),
    path('mis-permisos/', MisPermisosView.as_view()),

    # Usuarios
    path('usuarios/', UsuarioListCreateView.as_view()),
    path('usuarios/<str:pk>/', UsuarioDetailView.as_view()),

    # Roles
    path('roles/', RolListCreateView.as_view()),
    path('roles/<int:pk>/', RolDetailView.as_view()),

    # Perfiles
    path('perfiles/', PerfilListCreateView.as_view()),
    path('perfiles/<int:pk>/', PerfilDetailView.as_view()),

    # Formularios
    path('formularios/', FormularioListCreateView.as_view()),
    path('formularios/<int:pk>/', FormularioDetailView.as_view()),

    # Permisos (PK compuesta)
    path('permisos/', PermisoListCreateView.as_view()),
    path('permisos/<int:perfil_id>/<int:formulario_id>/', PermisoDetailView.as_view()),

    path('mi-perfil/', MiPerfilView.as_view()),
]



"""from django.urls import path
from .views import UsuarioListCreateView
from .views import LoginView
from .views import MisPermisosView
from .views import RolListCreateView
from .views import PermisoListCreateView
from .views import FormularioListCreateView
from .views import PerfilListCreateView

urlpatterns = [
    path('', UsuarioListCreateView.as_view()),
    path('login/', LoginView.as_view()),
    path('mis-permisos/', MisPermisosView.as_view()),
    path('roles/', RolListCreateView.as_view()),
    path('perfiles/', PerfilListCreateView.as_view()),
    path('formularios/', FormularioListCreateView.as_view()),
    path('permisos/', PermisoListCreateView.as_view()),
]
"""