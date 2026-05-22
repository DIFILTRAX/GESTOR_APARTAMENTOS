from rest_framework.permissions import BasePermission
from rest_framework_simplejwt.tokens import AccessToken, TokenError
from .models import Permiso


class TienePermiso(BasePermission):
    """
    ✅ Uso en cualquier View:

        class EdificioListCreateView(APIView):
            formulario_nombre = "EDIFICIOS"
            permission_classes = [TienePermiso]
    """

    def has_permission(self, request, view):
        # 1. Validar header
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return False

        try:
            # 2. Decodificar token
            token_str = auth.split(' ')[1]
            decoded = AccessToken(token_str)
            perfil_id = decoded.get('perfil')

            if not perfil_id:
                return False

            # 3. Obtener nombre del formulario definido en la view
            formulario_nombre = getattr(view, 'formulario_nombre', None)
            if not formulario_nombre:
                # Si la view no declara formulario_nombre, se niega acceso
                return False

            # 4. Buscar permiso con una sola query optimizada
            permiso = (
                Permiso.objects
                .select_related('formulario')
                .get(
                    perfil_id=perfil_id,
                    formulario__nombre_formulario=formulario_nombre
                )
            )

            # 5. Delegar lógica al modelo ✅
            return permiso.puede(request.method)

        except (Permiso.DoesNotExist, TokenError, KeyError, IndexError):
            return False



"""

from rest_framework.permissions import BasePermission
from rest_framework_simplejwt.authentication import JWTAuthentication
from usuarios.models import Permiso, Usuario


class TienePermiso(BasePermission):

    def has_permission(self, request, view):

        try:
            # 🔥 Obtener token real
            token = request.auth

            if not token:
                return False

            user_id = token.get('user_id')

            if not user_id:
                return False

            # 🔥 Buscar usuario real
            usuario = Usuario.objects.get(identificacion=user_id)

            perfil = usuario.id_perfil

            # 🔥 nombre del endpoint
            nombre_formulario = view.__class__.__name__

            permiso = Permiso.objects.get(
                perfil_id=perfil,   # 👈 _id para que Django lo trate como entero
                formulario__nombre_formulario=nombre_formulario
            )

            # 🔥 Validación por método HTTP
            if request.method == 'GET':
                return permiso.leer == 'S'

            if request.method == 'POST':
                return permiso.crear == 'S'

            if request.method in ['PUT', 'PATCH']:
                return permiso.editar == 'S'

            if request.method == 'DELETE':
                return permiso.eliminar == 'S'

            return False

        except (Permiso.DoesNotExist, Usuario.DoesNotExist):
            return False
         
"""