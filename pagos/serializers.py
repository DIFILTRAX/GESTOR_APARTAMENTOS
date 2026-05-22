from rest_framework import serializers
from .models import Pago, TipoPago, EstadoPago

class TipoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPago
        fields = ['id_tipo_pago', 'nombre']


class EstadoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoPago
        fields = ['id_estado_pago', 'nombre']


class PagoSerializer(serializers.ModelSerializer):
    estado_pago_nombre = serializers.CharField(
        source='estado_pago.nombre', read_only=True
    )
    tipo_pago_nombre = serializers.CharField(
        source='tipo_pago.nombre', read_only=True
    )
    edificio_nombre = serializers.CharField(
        source='edificio.nombre', read_only=True
    )
    apartamento = serializers.IntegerField()
    piso        = serializers.IntegerField()

    class Meta:
        model = Pago
        fields = [
            'id_pago', 'fecha_pago', 'fecha_limite', 'valor', 'descripcion',
            'estado_pago', 'estado_pago_nombre',
            'tipo_pago',  'tipo_pago_nombre',
            'apartamento', 'piso',
            'edificio',   'edificio_nombre',
        ]




"""

from rest_framework import serializers
from .models import Pago
from .models import TipoPago
from .models import EstadoPago



class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = '__all__'

class TipoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPago
        fields = '__all__'



class EstadoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoPago
        fields = '__all__'



--------------------------------------- version 2 ---------------------------------------
class TipoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPago
        fields = ['id_tipo_pago', 'nombre']


class EstadoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoPago
        fields = ['id_estado_pago', 'nombre']


class PagoSerializer(serializers.ModelSerializer):
    # ✅ Info legible en GET, no rompe el POST
    estado_pago_nombre = serializers.CharField(
        source='estado_pago.nombre', read_only=True
    )
    tipo_pago_nombre = serializers.CharField(
        source='tipo_pago.nombre', read_only=True
    )
    edificio_nombre = serializers.CharField(
        source='edificio.nombre', read_only=True
    )

    class Meta:
        model = Pago
        fields = [
            'id_pago',
            'fecha_pago',
            'fecha_limite',
            'valor',
            'descripcion',
            'estado_pago',
            'estado_pago_nombre',
            'tipo_pago',
            'tipo_pago_nombre',
            'apartamento',
            'piso',
            'edificio',
            'edificio_nombre',
        ]        

--------------------------------version 3 ---------------------------------------

"""