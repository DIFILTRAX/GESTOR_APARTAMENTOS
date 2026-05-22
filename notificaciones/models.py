from django.db import models
from pagos.models import Pago


class TipoNotificacion(models.Model):
    id_tipo_notificacion = models.AutoField(
        primary_key=True, db_column='ID_TIPO_NOTIFICACION'
    )
    nombre = models.CharField(max_length=100, db_column='NOMBRE')
    descripcion = models.CharField(max_length=200, db_column='DESCRIPCION')

    class Meta:
        db_table = 'TIPOS_NOTIFICACIONES'
        managed = False

    def __str__(self):
        return self.nombre


class Notificacion(models.Model):
    id_notificacion = models.AutoField(
        primary_key=True, db_column='ID_NOTIFICACION'
    )
    descripcion = models.CharField(max_length=200, db_column='DESCRIPCION')

    # ✅ FKs reales con select_related disponible
    pago = models.ForeignKey(
        Pago,
        on_delete=models.CASCADE,
        db_column='ID_PAGO',
        related_name='notificaciones'
    )
    tipo_notificacion = models.ForeignKey(
        TipoNotificacion,
        on_delete=models.CASCADE,
        db_column='ID_TIPO_NOTIFICACION',
        related_name='notificaciones'
    )

    class Meta:
        db_table = 'NOTIFICACIONES'
        managed = False
        ordering = ['-id_notificacion']

    def __str__(self):
        return self.descripcion


"""
from django.db import models
from pagos.models import Pago 
# Create your models here.
class TipoNotificacion(models.Model):

    id_tipo_notificacion = models.AutoField(
        primary_key=True,
        db_column='ID_TIPO_NOTIFICACION'
    )

    nombre = models.CharField(
        max_length=100,
        db_column='NOMBRE'
    )

    descripcion = models.CharField(
        max_length=200,
        db_column='DESCRIPCION'
    )

    class Meta:
        db_table = 'TIPOS_NOTIFICACIONES'
        managed = False

    def __str__(self):
        return self.nombre
    
 # 👈 IMPORTANTE

class Notificacion(models.Model):

    id_notificacion = models.AutoField(
        primary_key=True,
        db_column='ID_NOTIFICACION'
    )

    descripcion = models.CharField(
        max_length=200,
        db_column='DESCRIPCION'
    )

    pago = models.ForeignKey(
        Pago,
        on_delete=models.CASCADE,
        db_column='ID_PAGO'
    )

    tipo_notificacion = models.ForeignKey(
        TipoNotificacion,
        on_delete=models.CASCADE,
        db_column='ID_TIPO_NOTIFICACION'
    )

    class Meta:
        db_table = 'NOTIFICACIONES'
        managed = False

    def __str__(self):
        return self.descripcion
"""