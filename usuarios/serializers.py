from rest_framework import serializers
from rest_framework import serializers
from .models import Usuario, Permiso, Rol, Perfil, Formulario


class LoginSerializer(serializers.Serializer):
    identificacion = serializers.CharField()
    contrasenna = serializers.CharField()


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id_rol', 'nombre']


class PerfilSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)

    class Meta:
        model = Perfil
        fields = ['id_perfil', 'rol', 'rol_nombre', 'nombre']


class FormularioSerializer(serializers.ModelSerializer):
    dependencia_nombre = serializers.CharField(
        source='dependencia.nombre_formulario',
        read_only=True,
        default=None
    )

    class Meta:
        model = Formulario
        fields = [
            'id_formulario', 'nombre_formulario', 'nodo_principal',
            'dependencia', 'dependencia_nombre',
            'orden', 'icono', 'redirect'
        ]


class PermisoSerializer(serializers.ModelSerializer):
    perfil_nombre = serializers.CharField(source='perfil.nombre', read_only=True)
    formulario_nombre = serializers.CharField(
        source='formulario.nombre_formulario', read_only=True
    )

    class Meta:
        model = Permiso
        fields = [
            'perfil', 'perfil_nombre',
            'formulario', 'formulario_nombre',
            'crear', 'editar', 'leer', 'eliminar'
        ]


class UsuarioSerializer(serializers.ModelSerializer):
    perfil_nombre = serializers.CharField(source='perfil.nombre', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'identificacion', 'id_tipo_documento', 'correo', 'celular',
            'primer_nombre', 'segundo_nombre',
            'primer_apellido', 'segundo_apellido',
            'contrasenna', 'perfil', 'perfil_nombre'
        ]
        extra_kwargs = {
            'contrasenna': {'write_only': True}
        }



"""
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'



class LoginSerializer(serializers.Serializer):
    identificacion = serializers.CharField()
    contrasenna = serializers.CharField()



class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = '__all__'


class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = '__all__'

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class FormularioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Formulario
        fields = '__all__'
"""