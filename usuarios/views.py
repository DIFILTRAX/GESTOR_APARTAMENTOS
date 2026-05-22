from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken, TokenError

from .models import Rol, Perfil, Formulario, Permiso, Usuario
from .serializers import (
    RolSerializer, PerfilSerializer, FormularioSerializer,
    PermisoSerializer, UsuarioSerializer, LoginSerializer
)
from .permissions import TienePermiso


# ──────────────────────────────────────────────────────
# AUTH
# ──────────────────────────────────────────────────────

class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        identificacion = serializer.validated_data['identificacion']
        contrasenna = serializer.validated_data['contrasenna']

        try:
            user = Usuario.objects.select_related('perfil').get(
                identificacion=identificacion
            )
        except Usuario.DoesNotExist:
            return Response({"error": "Credenciales inválidas"}, status=401)

        if user.contrasenna != contrasenna:
            return Response({"error": "Credenciales inválidas"}, status=401)

        refresh = RefreshToken()
        refresh['user_id'] = user.identificacion
        refresh['perfil'] = user.perfil.id_perfil

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        })


class MisPermisosView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return Response({"error": "Token no enviado"}, status=401)

        try:
            decoded = AccessToken(auth.split(' ')[1])
            perfil_id = decoded.get('perfil')

            if not perfil_id:
                return Response({"error": "Token sin perfil"}, status=401)

            permisos = (
                Permiso.objects
                .filter(perfil_id=perfil_id)
                .select_related('formulario', 'formulario__dependencia')
                .order_by('formulario__orden')
            )

            data = [
                {
                    "formulario": p.formulario.nombre_formulario,
                    "redirect": p.formulario.redirect,
                    "icono": p.formulario.icono,
                    "orden": p.formulario.orden,
                    "nodo_principal": p.formulario.nodo_principal,
                    "crear": p.crear,
                    "editar": p.editar,
                    "leer": p.leer,
                    "eliminar": p.eliminar,
                }
                for p in permisos
                if p.leer == 'S'
            ]
            return Response(data)

        except TokenError as e:
            return Response({"error": "Token inválido", "detalle": str(e)}, status=401)
        except Exception as e:
            return Response({"error": "Error al cargar permisos", "detalle": str(e)}, status=500)


# ──────────────────────────────────────────────────────
# USUARIOS
# ──────────────────────────────────────────────────────

class UsuarioListCreateView(APIView):
    formulario_nombre = "USUARIOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        usuarios = Usuario.objects.select_related('perfil').all()
        return Response(UsuarioSerializer(usuarios, many=True).data)

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class UsuarioDetailView(APIView):
    formulario_nombre = "USUARIOS"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(
            Usuario.objects.select_related('perfil'), pk=pk
        )

    def get(self, request, pk):
        return Response(UsuarioSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = UsuarioSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)


# ──────────────────────────────────────────────────────
# ROLES
# ──────────────────────────────────────────────────────

class RolListCreateView(APIView):
    formulario_nombre = "ROLES"
    permission_classes = [TienePermiso]

    def get(self, request):
        roles = Rol.objects.all().order_by('id_rol')
        return Response(RolSerializer(roles, many=True).data)

    def post(self, request):
        serializer = RolSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class RolDetailView(APIView):
    formulario_nombre = "ROLES"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(Rol, pk=pk)

    def get(self, request, pk):
        return Response(RolSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = RolSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)


# ──────────────────────────────────────────────────────
# PERFILES
# ──────────────────────────────────────────────────────

class PerfilListCreateView(APIView):
    formulario_nombre = "PERFILES"
    permission_classes = [TienePermiso]

    def get(self, request):
        perfiles = Perfil.objects.select_related('rol').all().order_by('id_perfil')
        return Response(PerfilSerializer(perfiles, many=True).data)

    def post(self, request):
        serializer = PerfilSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class PerfilDetailView(APIView):
    formulario_nombre = "PERFILES"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(Perfil.objects.select_related('rol'), pk=pk)

    def get(self, request, pk):
        return Response(PerfilSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = PerfilSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)


# ──────────────────────────────────────────────────────
# FORMULARIOS
# ──────────────────────────────────────────────────────

class FormularioListCreateView(APIView):
    formulario_nombre = "FORMULARIOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        forms = (
            Formulario.objects
            .select_related('dependencia')
            .all()
            .order_by('orden')
        )
        return Response(FormularioSerializer(forms, many=True).data)

    def post(self, request):
        serializer = FormularioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class FormularioDetailView(APIView):
    formulario_nombre = "FORMULARIOS"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(
            Formulario.objects.select_related('dependencia'), pk=pk
        )

    def get(self, request, pk):
        return Response(FormularioSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = FormularioSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)


# ──────────────────────────────────────────────────────
# PERMISOS
# ──────────────────────────────────────────────────────

class PermisoListCreateView(APIView):
    formulario_nombre = "PERMISOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        permisos = (
            Permiso.objects
            .select_related('perfil', 'formulario')
            .all()
            .order_by('perfil_id', 'formulario_id')
        )
        return Response(PermisoSerializer(permisos, many=True).data)

    def post(self, request):
        serializer = PermisoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class PermisoDetailView(APIView):
    formulario_nombre = "PERMISOS"
    permission_classes = [TienePermiso]

    def get_object(self, perfil_id, formulario_id):
        return get_object_or_404(
            Permiso.objects.select_related('perfil', 'formulario'),
            perfil_id=perfil_id,
            formulario_id=formulario_id
        )

    def get(self, request, perfil_id, formulario_id):
        return Response(PermisoSerializer(
            self.get_object(perfil_id, formulario_id)
        ).data)

    def put(self, request, perfil_id, formulario_id):
        serializer = PermisoSerializer(
            self.get_object(perfil_id, formulario_id),
            data=request.data
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, perfil_id, formulario_id):
        self.get_object(perfil_id, formulario_id).delete()
        return Response(status=204)

class MiPerfilView(APIView):
    """
    Devuelve los datos del usuario autenticado.
    Si es propietario, devuelve TODOS sus apartamentos.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return Response({"error": "Token no enviado"}, status=401)

        try:
            decoded = AccessToken(auth.split(' ')[1])
            user_id = decoded.get('user_id')

            usuario = (
                Usuario.objects
                .select_related('perfil')
                .get(identificacion=user_id)
            )

            # ✅ SQL directo para evitar problemas con PKs compuestas
            # Devuelve TODOS los apartamentos del propietario
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        p.ID_APARTAMENTO,
                        p.ID_PISO,
                        p.ID_EDIFICIO,
                        e.NOMBRE
                    FROM PROPIETARIOS p
                    JOIN EDIFICIOS e ON e.ID_EDIFICIO = p.ID_EDIFICIO
                    WHERE p.IDENTIFICACION = %s
                    ORDER BY p.ID_EDIFICIO, p.ID_PISO, p.ID_APARTAMENTO
                """, [user_id])
                rows = cursor.fetchall()

            apartamentos = [
                {
                    'apartamento':     row[0],
                    'piso':            row[1],
                    'edificio':        row[2],
                    'edificio_nombre': row[3],
                }
                for row in rows
            ]

            # Primer apartamento como principal (compatibilidad con frontend actual)
            principal = apartamentos[0] if apartamentos else {}

            return Response({
                "identificacion":  usuario.identificacion,
                "primer_nombre":   usuario.primer_nombre,
                "primer_apellido": usuario.primer_apellido,
                "correo":          usuario.correo,
                "perfil":          usuario.perfil.id_perfil,
                # ✅ Datos del primer apartamento para compatibilidad
                "apartamento":     principal.get('apartamento'),
                "piso":            principal.get('piso'),
                "edificio":        principal.get('edificio'),
                "edificio_nombre": principal.get('edificio_nombre'),
                # ✅ Lista completa de apartamentos
                "apartamentos":    apartamentos,
            })

        except TokenError:
            return Response({"error": "Token inválido o expirado"}, status=401)
        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)



"""
version 1
# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Usuario
from .serializers import UsuarioSerializer
from .serializers import LoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import Permiso
from .serializers import PermisoSerializer

from usuarios.permissions import TienePermiso
from usuarios.models import Usuario, Permiso
from rest_framework_simplejwt.tokens import AccessToken

class UsuarioListCreateView(APIView):

    def get(self, request):
        usuarios = Usuario.objects.all()
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    


class LoginView(APIView):

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            identificacion = serializer.validated_data['identificacion']
            contrasenna = serializer.validated_data['contrasenna']

            try:
                user = Usuario.objects.get(identificacion=identificacion)

                if user.contrasenna != contrasenna:
                    return Response({"error": "Contraseña incorrecta"}, status=400)

                # 🔥 TOKEN MANUAL
                refresh = RefreshToken()
                refresh['user_id'] = user.identificacion

                return Response({
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "usuario": {
                        "id": user.identificacion,
                        "nombre": user.primer_nombre,
                        "rol": user.id_perfil
                    }
                })

            except Usuario.DoesNotExist:
                return Response({"error": "Usuario no existe"}, status=404)

        return Response(serializer.errors, status=400)

class MisPermisosView(APIView):

    def get(self, request):

        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return Response({"error": "Token no enviado"}, status=401)

        try:
            # 🔥 formato: Bearer token
            token = auth_header.split(' ')[1]

            decoded = AccessToken(token)
            user_id = decoded['user_id']

            usuario = Usuario.objects.get(identificacion=user_id)

            permisos = Permiso.objects.filter(
                perfil_id=usuario.id_perfil          # 👈 _id para pasar el int directo
            ).select_related('formulario')           # 👈 evita N+1 queries

            data = [
                {
                    "formulario": p.formulario.nombre_formulario,
                    "redirect": p.formulario.redirect,   # opcional, útil para Angular
                    "crear": p.crear,
                    "editar": p.editar,
                    "leer": p.leer,
                    "eliminar": p.eliminar,
                }
                for p in permisos
            ]

            return Response(data)

        except Exception as e:
            return Response({"error": "Token inválido", "detalle": str(e)}, status=401)

class EdificioListCreateView(APIView):
    authentication_classes = []
    permission_classes = []


version 2

from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken, TokenError
from .models import Usuario, Permiso
from .serializers import UsuarioSerializer, LoginSerializer
from .permissions import TienePermiso
from .models import Rol, Perfil, Formulario
from .serializers import RolSerializer, PerfilSerializer, FormularioSerializer, PermisoSerializer

class LoginView(APIView):
    Sin autenticación requerida
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        identificacion = serializer.validated_data['identificacion']
        contrasenna = serializer.validated_data['contrasenna']

        try:
            # ✅ select_related para traer perfil en la misma query
            user = (
                Usuario.objects
                .select_related('perfil')
                .get(identificacion=identificacion)
            )
        except Usuario.DoesNotExist:
            return Response({"error": "Credenciales inválidas"}, status=401)

        if user.contrasenna != contrasenna:
            # ✅ Mismo mensaje para no revelar si existe o no el usuario
            return Response({"error": "Credenciales inválidas"}, status=401)

        # ✅ Token con datos mínimos necesarios
        refresh = RefreshToken()
        refresh['user_id'] = user.identificacion
        refresh['perfil'] = user.perfil.id_perfil

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        })


class MisPermisosView(APIView):
    
    Devuelve todos los permisos del perfil del usuario autenticado.
    Usado por Angular para construir el menú dinámico.
    
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        auth = request.headers.get('Authorization', '')

        if not auth.startswith('Bearer '):
            return Response({"error": "Token no enviado"}, status=401)

        try:
            token_str = auth.split(' ')[1]
            decoded = AccessToken(token_str)
            perfil_id = decoded.get('perfil')

            if not perfil_id:
                return Response({"error": "Token sin perfil"}, status=401)

            # ✅ Una sola query con join a formulario
            permisos = (
                Permiso.objects
                .filter(perfil_id=perfil_id)
                .select_related('formulario', 'formulario__dependencia')
                .order_by('formulario__orden')
            )

            data = [
                {
                    "formulario": p.formulario.nombre_formulario,
                    "redirect": p.formulario.redirect,
                    "icono": p.formulario.icono,
                    "orden": p.formulario.orden,
                    "nodo_principal": p.formulario.nodo_principal,
                    "crear": p.crear,
                    "editar": p.editar,
                    "leer": p.leer,
                    "eliminar": p.eliminar,
                }
                for p in permisos
                if p.leer == 'S'   # ✅ Solo muestra lo que puede ver
            ]

            return Response(data)

        except TokenError as e:
            return Response({"error": "Token inválido", "detalle": str(e)}, status=401)


class UsuarioListCreateView(APIView):
    formulario_nombre = "USUARIOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        usuarios = Usuario.objects.select_related('perfil').all()
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


# ✅ Ejemplo de cómo crear cualquier view nueva
class EdificioListCreateView(APIView):
    formulario_nombre = "EDIFICIOS"   # debe coincidir con NOMBRE_FORMULARIO en BD
    permission_classes = [TienePermiso]

    def get(self, request):
        return Response({"mensaje": "lista de edificios"})

    def post(self, request):
        return Response({"mensaje": "edificio creado"}, status=201)



class RolListCreateView(APIView):

    def get(self, request):
        roles = Rol.objects.all()
        serializer = RolSerializer(roles, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RolSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class PerfilListCreateView(APIView):

    def get(self, request):
        perfiles = Perfil.objects.all()
        serializer = PerfilSerializer(perfiles, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PerfilSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)




class FormularioListCreateView(APIView):

    def get(self, request):
        forms = Formulario.objects.all()
        serializer = FormularioSerializer(forms, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = FormularioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class PermisoListCreateView(APIView):

    def get(self, request):
        permisos = Permiso.objects.all()
        serializer = PermisoSerializer(permisos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PermisoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)



--------------------------version 2--------------------------
class MiPerfilView(APIView):
    
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return Response({"error": "Token no enviado"}, status=401)

        try:
            decoded = AccessToken(auth.split(' ')[1])
            user_id = decoded.get('user_id')

            usuario = (
                Usuario.objects
                .select_related('perfil')
                .get(identificacion=user_id)
            )

            # Buscar apartamento si es propietario
            from propiedades.models import Propietario
            try:
                prop = (
                    Propietario.objects
                    .select_related('apartamento', 'piso', 'edificio')
                    .get(identificacion=usuario.identificacion)
                )
                apartamento  = prop.apartamento.id_apartamento
                piso         = prop.piso.id_piso
                edificio     = prop.edificio.id_edificio
                edificio_nom = prop.edificio.nombre
            except Propietario.DoesNotExist:
                apartamento  = None
                piso         = None
                edificio     = None
                edificio_nom = None

            return Response({
                "identificacion":  usuario.identificacion,
                "primer_nombre":   usuario.primer_nombre,
                "primer_apellido": usuario.primer_apellido,
                "correo":          usuario.correo,
                "perfil":          usuario.perfil.id_perfil,
                "apartamento":     apartamento,
                "piso":            piso,
                "edificio":        edificio,
                "edificio_nombre": edificio_nom,
            })

        except Exception as e:
            return Response({"error": str(e)}, status=401)



"""