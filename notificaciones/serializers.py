from rest_framework import serializers
from .models import TipoNotificacion, Notificacion


class TipoNotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoNotificacion
        fields = ['id_tipo_notificacion', 'nombre', 'descripcion']


class NotificacionSerializer(serializers.ModelSerializer):
    # ✅ Info legible en GET
    tipo_notificacion_nombre = serializers.CharField(
        source='tipo_notificacion.nombre', read_only=True
    )
    pago_descripcion = serializers.CharField(
        source='pago.descripcion', read_only=True
    )
    pago_valor = serializers.DecimalField(
        source='pago.valor',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = Notificacion
        fields = [
            'id_notificacion',
            'descripcion',
            'pago',
            'pago_descripcion',
            'pago_valor',
            'tipo_notificacion',
            'tipo_notificacion_nombre',
        ]


"""
from rest_framework import serializers
from .models import Notificacion, TipoNotificacion


class TipoNotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoNotificacion
        fields = '__all__'


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = '__all__'

"""