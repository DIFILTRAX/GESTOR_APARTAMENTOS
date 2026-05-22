from rest_framework import serializers
from .models import Edificio, Piso, Apartamento, Propietario


class EdificioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Edificio
        fields = ['id_edificio', 'nombre', 'direccion']


class PisoSerializer(serializers.ModelSerializer):
    edificio_nombre = serializers.CharField(
        source='edificio.nombre', read_only=True
    )

    class Meta:
        model = Piso
        fields = ['id_piso', 'edificio', 'edificio_nombre']
        extra_kwargs = {
            'id_piso': {'validators': []}
        }

    def validate(self, data):
        if not self.instance:
            existe = Piso.objects.filter(
                id_piso=data.get('id_piso'),
                edificio=data.get('edificio')
            ).exists()
            if existe:
                raise serializers.ValidationError(
                    'Este piso ya existe en ese edificio.'
                )
        return data

    def create(self, validated_data):
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO PISOS (ID_PISO, ID_EDIFICIO)
                VALUES (%s, %s)
                """,
                [
                    validated_data['id_piso'],
                    validated_data['edificio'].id_edificio
                ]
            )
        return Piso.objects.filter(
            id_piso=validated_data['id_piso'],
            edificio=validated_data['edificio']
        ).first()

    def update(self, instance, validated_data):
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE PISOS
                SET ID_EDIFICIO = %s
                WHERE ID_PISO = %s AND ID_EDIFICIO = %s
                """,
                [
                    validated_data.get('edificio', instance.edificio).id_edificio
                    if hasattr(validated_data.get('edificio', instance.edificio), 'id_edificio')
                    else instance.edificio_id,
                    instance.id_piso,
                    instance.edificio_id
                ]
            )
        return Piso.objects.filter(
            id_piso=instance.id_piso,
            edificio=instance.edificio
        ).first()
    

class ApartamentoSerializer(serializers.ModelSerializer):
    edificio_nombre = serializers.CharField(
        source='edificio.nombre', read_only=True
    )
    piso = serializers.IntegerField()

    class Meta:
        model = Apartamento
        fields = ['id_apartamento', 'piso', 'edificio', 'edificio_nombre']
        extra_kwargs = {
            'id_apartamento': {'validators': []}
        }

    def validate(self, data):
        if not self.instance:
            # ✅ SQL directo para evitar propiedades_apartamento
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT COUNT(*) FROM APARTAMENTOS
                    WHERE ID_APARTAMENTO = %s
                    AND ID_PISO = %s
                    AND ID_EDIFICIO = %s
                    """,
                    [
                        data.get('id_apartamento'),
                        data.get('piso'),
                        data.get('edificio').id_edificio
                        if hasattr(data.get('edificio'), 'id_edificio')
                        else data.get('edificio')
                    ]
                )
                count = cursor.fetchone()[0]
            if count > 0:
                raise serializers.ValidationError(
                    'Este apartamento ya existe en ese piso y edificio.'
                )
        return data

    def to_representation(self, instance):
        if isinstance(instance, dict):
            return instance

        # ✅ Objeto simple creado con type()
        if not hasattr(instance, '_meta'):
            return {
                'id_apartamento':  getattr(instance, 'id_apartamento', None),
                'piso':            getattr(instance, 'piso', None),
                'edificio':        getattr(instance, 'edificio', None),
                'edificio_nombre': getattr(instance, 'edificio_nombre', ''),
            }

        # Objeto ORM normal
        return {
            'id_apartamento': instance.id_apartamento,
            'piso':           instance.piso_id,
            'edificio':       instance.edificio_id,
            'edificio_nombre': instance.edificio.nombre
                            if hasattr(instance, 'edificio') and instance.edificio
                            else '',
        }

    def create(self, validated_data):
        from django.db import connection
        id_apto     = validated_data['id_apartamento']
        id_piso     = validated_data['piso']
        edificio    = validated_data['edificio']
        id_edificio = edificio.id_edificio

        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO APARTAMENTOS (ID_APARTAMENTO, ID_PISO, ID_EDIFICIO) VALUES (%s, %s, %s)",
                [id_apto, id_piso, id_edificio]
            )

        # ✅ Devuelve strings/ints, no objetos Django
        return type('Apartamento', (), {
            'id_apartamento':  id_apto,
            'piso':            id_piso,
            'edificio':        id_edificio,        # ← string, no objeto
            'edificio_nombre': edificio.nombre,    # ← string, no objeto
        })()

    def update(self, instance, validated_data):
        from django.db import connection
        edificio = validated_data.get('edificio', instance.edificio)
        id_edificio = edificio.id_edificio if hasattr(edificio, 'id_edificio') else instance.edificio_id

        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE APARTAMENTOS
                SET ID_PISO = %s, ID_EDIFICIO = %s
                WHERE ID_APARTAMENTO = %s
                """,
                [
                    validated_data.get('piso', instance.piso_id),
                    id_edificio,
                    instance.id_apartamento
                ]
            )
        instance.refresh_from_db()
        return instance


class PropietarioSerializer(serializers.ModelSerializer):
    nombre_usuario  = serializers.SerializerMethodField(read_only=True)
    edificio_nombre = serializers.CharField(
        source='edificio.nombre', read_only=True
    )

    class Meta:
        model = Propietario
        fields = [
            'identificacion', 'nombre_usuario',
            'apartamento', 'piso', 'edificio', 'edificio_nombre'
        ]
        extra_kwargs = {
            'identificacion': {'validators': []},
            'apartamento':    {'validators': []},
            'piso':           {'validators': []},
        }

    def get_nombre_usuario(self, obj):
        try:
            u = obj.identificacion
            return f"{u.primer_nombre} {u.primer_apellido}"
        except Exception:
            return ''

    def to_internal_value(self, data):
        from usuarios.models import Usuario
        # ✅ Solo valida identificacion y edificio via ORM
        # apartamento y piso los manejamos como enteros
        result = {
            'apartamento': data.get('apartamento'),
            'piso':        data.get('piso'),
        }

        # Edificio via ORM (es FK simple)
        from .models import Edificio
        edificio_id = data.get('edificio')
        if not edificio_id:
            raise serializers.ValidationError({'edificio': 'Este campo es requerido.'})
        try:
            result['edificio'] = Edificio.objects.get(pk=edificio_id)
        except Edificio.DoesNotExist:
            raise serializers.ValidationError({'edificio': 'Edificio no encontrado.'})

        # Usuario via ORM
        identificacion = data.get('identificacion')
        if not identificacion:
            raise serializers.ValidationError({'identificacion': 'Este campo es requerido.'})
        try:
            result['identificacion'] = Usuario.objects.get(identificacion=identificacion)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError({'identificacion': 'Usuario no encontrado.'})

        return result

    def validate(self, data):
        if not self.instance:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT COUNT(*) FROM PROPIETARIOS
                    WHERE IDENTIFICACION = %s
                    AND ID_APARTAMENTO = %s
                    AND ID_PISO = %s
                    AND ID_EDIFICIO = %s
                    """,
                    [
                        data['identificacion'].identificacion,
                        data.get('apartamento'),
                        data.get('piso'),
                        data['edificio'].id_edificio,
                    ]
                )
                count = cursor.fetchone()[0]
            if count > 0:
                raise serializers.ValidationError(
                    'Este propietario ya tiene asignado ese apartamento.'
                )
        return data
    
    def create(self, validated_data):
        from django.db import connection
        identificacion = validated_data['identificacion'].identificacion
        apartamento    = validated_data['apartamento']
        piso           = validated_data['piso']
        edificio_obj   = validated_data['edificio']
        edificio       = edificio_obj.id_edificio

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO PROPIETARIOS
                (IDENTIFICACION, ID_APARTAMENTO, ID_PISO, ID_EDIFICIO)
                VALUES (%s, %s, %s, %s)
                """,
                [identificacion, apartamento, piso, edificio]
            )
            # ✅ Obtener el nombre del usuario recién insertado
            cursor.execute(
                "SELECT PRIMER_NOMBRE, PRIMER_APELLIDO FROM USUARIOS WHERE IDENTIFICACION = %s",
                [identificacion]
            )
            row = cursor.fetchone()
            nombre = f"{row[0]} {row[1]}" if row else ''

        return type('Propietario', (), {
            'identificacion':  identificacion,
            'nombre_usuario':  nombre,       # ✅ nombre real
            'apartamento':     apartamento,
            'piso':            piso,
            'edificio':        edificio,
            'edificio_nombre': edificio_obj.nombre,
        })()
    
    
    def to_representation(self, instance):
        if not hasattr(instance, '_meta'):
            return {
                'identificacion':  getattr(instance, 'identificacion', None),
                'nombre_usuario':  getattr(instance, 'nombre_usuario', ''),
                'apartamento':     getattr(instance, 'apartamento', None),
                'piso':            getattr(instance, 'piso', None),
                'edificio':        getattr(instance, 'edificio', None),
                'edificio_nombre': getattr(instance, 'edificio_nombre', ''),
            }
        try:
            u = instance.identificacion
            nombre = f"{u.primer_nombre} {u.primer_apellido}"
        except Exception:
            nombre = ''
        return {
            'identificacion':  instance.identificacion_id,
            'nombre_usuario':  nombre,
            'apartamento':     instance.apartamento_id,
            'piso':            instance.piso_id,
            'edificio':        instance.edificio_id,
            'edificio_nombre': instance.edificio.nombre if hasattr(instance.edificio, 'nombre') else '',
        }

    def validate(self, data):
        """
        ✅ Valida que no exista ya esa combinación exacta (PK compuesta)
        """
        identificacion = data.get('identificacion')
        apartamento    = data.get('apartamento')
        piso           = data.get('piso')
        edificio       = data.get('edificio')

        # Solo valida en creación (no en actualización)
        if not self.instance:
            existe = Propietario.objects.filter(
                identificacion=identificacion,
                apartamento=apartamento,
                piso=piso,
                edificio=edificio
            ).exists()
            if existe:
                raise serializers.ValidationError(
                    'Este propietario ya tiene asignado ese apartamento.'
                )
        return data
"""


from rest_framework import serializers
from .models import Edificio
from .models import Piso
from .models import Apartamento
from rest_framework import serializers
from .models import Propietario

class EdificioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Edificio
        fields = '__all__'



class PisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Piso
        fields = '__all__'

class ApartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Apartamento
        fields = '__all__'



class PropietarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Propietario
        fields = '__all__'





def create(self, validated_data):
        from django.db import connection
        identificacion = validated_data['identificacion'].identificacion
        apartamento    = validated_data['apartamento']
        piso           = validated_data['piso']
        edificio       = validated_data['edificio'].id_edificio

        with connection.cursor() as cursor:
            cursor.execute(
                
                INSERT INTO PROPIETARIOS
                (IDENTIFICACION, ID_APARTAMENTO, ID_PISO, ID_EDIFICIO)
                VALUES (%s, %s, %s, %s)
                ,
                [identificacion, apartamento, piso, edificio]
            )

        return type('Propietario', (), {
            'identificacion':  identificacion,
            'nombre_usuario':  '',
            'apartamento':     apartamento,
            'piso':            piso,
            'edificio':        edificio,
            'edificio_nombre': validated_data['edificio'].nombre,
        })()

"""