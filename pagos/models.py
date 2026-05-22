from django.db import models
from propiedades.models import Apartamento, Piso, Edificio


from django.db import models


class TipoPago(models.Model):
    id_tipo_pago = models.AutoField(primary_key=True, db_column='ID_TIPO_PAGO')
    nombre = models.CharField(max_length=100, db_column='NOMBRE')

    class Meta:
        db_table = 'TIPOS_PAGOS'
        managed = False

    def __str__(self):
        return self.nombre


class EstadoPago(models.Model):
    id_estado_pago = models.AutoField(primary_key=True, db_column='ID_ESTADO_PAGO')
    nombre = models.CharField(max_length=100, db_column='NOMBRE')

    class Meta:
        db_table = 'ESTADOS_PAGOS'
        managed = False

    def __str__(self):
        return self.nombre


class Pago(models.Model):
    id_pago      = models.BigAutoField(primary_key=True, db_column='ID_PAGO')
    fecha_pago   = models.DateField(db_column='FECHA_PAGO')
    fecha_limite = models.DateField(db_column='FECHA_LIMITE')
    valor        = models.DecimalField(max_digits=10, decimal_places=2, db_column='VALOR')
    descripcion  = models.CharField(max_length=200, db_column='DESCRIPCION')

    estado_pago = models.ForeignKey(
        EstadoPago,
        on_delete=models.PROTECT,
        db_column='ID_ESTADO_PAGO',
        related_name='pagos'
    )
    tipo_pago = models.ForeignKey(
        TipoPago,
        on_delete=models.PROTECT,
        db_column='ID_TIPO_PAGO',
        related_name='pagos'
    )

    # ✅ Enteros simples — sin FK a Apartamento/Piso
    apartamento = models.SmallIntegerField(db_column='ID_APARTAMENTO')
    piso        = models.SmallIntegerField(db_column='ID_PISO')

    edificio = models.ForeignKey(
        'propiedades.Edificio',
        on_delete=models.PROTECT,
        db_column='ID_EDIFICIO',
        related_name='pagos'
    )

    class Meta:
        db_table = 'PAGOS'
        managed = False
        ordering = ['-id_pago']

    def __str__(self):
        return f"Pago {self.id_pago} - ${self.valor}"







# Create your models here.
"""

class Pago(models.Model):

    id_pago = models.BigIntegerField(
        primary_key=True,
        db_column='ID_PAGO'
    )

    fecha_pago = models.DateField(
        db_column='FECHA_PAGO'
    )

    fecha_limite = models.DateField(
        db_column='FECHA_LIMITE'
    )

    valor = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        db_column='VALOR'
    )

    descripcion = models.CharField(
        max_length=200,
        db_column='DESCRIPCION'
    )

    # 🔥 FK simples (manejo como enteros por ahora para no complicar)
    id_estado_pago = models.SmallIntegerField(
        db_column='ID_ESTADO_PAGO'
    )

    id_tipo_pago = models.SmallIntegerField(
        db_column='ID_TIPO_PAGO'
    )

    # 🔥 FK compuesta (IMPORTANTE)
    id_apartamento = models.SmallIntegerField(
        db_column='ID_APARTAMENTO'
    )

    id_piso = models.SmallIntegerField(
        db_column='ID_PISO'
    )

    id_edificio = models.CharField(
        max_length=4,
        db_column='ID_EDIFICIO'
    )

    class Meta:
        db_table = 'PAGOS'
        managed = False

# tipos de pagos

class TipoPago(models.Model):

    id_tipo_pago = models.AutoField(
        primary_key=True,
        db_column='ID_TIPO_PAGO'
    )

    nombre = models.CharField(
        max_length=100,
        db_column='NOMBRE'
    )

    class Meta:
        db_table = 'TIPOS_PAGOS'
        managed = False

    def __str__(self):
        return self.nombre
    
# estados de pagos
from django.db import models

class EstadoPago(models.Model):

    id_estado_pago = models.AutoField(
        primary_key=True,
        db_column='ID_ESTADO_PAGO'
    )

    nombre = models.CharField(
        max_length=100,
        db_column='NOMBRE'
    )

    class Meta:
        db_table = 'ESTADOS_PAGOS'
        managed = False

    def __str__(self):
        return self.nombre
    
"""
