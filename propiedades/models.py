from django.db import models
from usuarios.models import Usuario


class Edificio(models.Model):
    id_edificio = models.CharField(
        primary_key=True, max_length=4, db_column='ID_EDIFICIO'
    )
    nombre = models.CharField(max_length=100, db_column='NOMBRE')
    direccion = models.CharField(max_length=100, db_column='DIRECCION')

    class Meta:
        db_table = 'EDIFICIOS'
        managed = False

    def __str__(self):
        return f"{self.id_edificio} - {self.nombre}"


class Piso(models.Model):
    """
    PK compuesta (ID_PISO, ID_EDIFICIO).
    Django no soporta PK compuesta nativa — usamos primary_key=True
    en el primer campo y unique_together para la restricción real.
    """
    id_piso = models.SmallIntegerField(
        primary_key=True, db_column='ID_PISO'
    )
    edificio = models.ForeignKey(
        Edificio,
        on_delete=models.CASCADE,
        db_column='ID_EDIFICIO',
        related_name='pisos'
    )

    class Meta:
        db_table = 'PISOS'
        managed = False
        unique_together = (('id_piso', 'edificio'),)

    def __str__(self):
        return f"Piso {self.id_piso} - Edificio {self.edificio_id}"


class Apartamento(models.Model):
    id_apartamento = models.SmallIntegerField(
        primary_key=True, db_column='ID_APARTAMENTO'
    )
    piso = models.SmallIntegerField(
        db_column='ID_PISO'
    )
    edificio = models.ForeignKey(
        Edificio,
        on_delete=models.CASCADE,
        db_column='ID_EDIFICIO',
        related_name='apartamentos'
    )

    class Meta:
        db_table = 'APARTAMENTOS'
        managed = False
        unique_together = (('id_apartamento', 'piso', 'edificio'),)


class Propietario(models.Model):
    """
    PK compuesta (IDENTIFICACION, ID_APARTAMENTO, ID_PISO, ID_EDIFICIO).
    identificacion es FK a USUARIOS.
    """
    identificacion = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column='IDENTIFICACION',
        primary_key=True,
        related_name='propiedades'
    )
    apartamento = models.ForeignKey(
        Apartamento,
        on_delete=models.CASCADE,
        db_column='ID_APARTAMENTO',
        related_name='propietarios'
    )
    piso = models.ForeignKey(
        Piso,
        on_delete=models.CASCADE,
        db_column='ID_PISO',
        related_name='propietarios'
    )
    edificio = models.ForeignKey(
        Edificio,
        on_delete=models.CASCADE,
        db_column='ID_EDIFICIO',
        related_name='propietarios'
    )

    class Meta:
        db_table = 'PROPIETARIOS'
        managed = False
        unique_together = (('identificacion', 'apartamento', 'piso', 'edificio'),)

    def __str__(self):
        return f"{self.identificacion_id} - Apto {self.apartamento_id}"




"""


from django.db import models
from usuarios.models import Usuario

class Edificio(models.Model):
    id_edificio = models.CharField(
        primary_key=True,
        max_length=4,
        db_column='ID_EDIFICIO'
    )
    nombre = models.CharField(
        max_length=100,
        db_column='NOMBRE'
    )
    direccion = models.CharField(
        max_length=100,
        db_column='DIRECCION'
    )

    class Meta:
        db_table = 'EDIFICIOS'
        managed = False

    def __str__(self):
        return self.nombre


class Piso(models.Model):

    id_piso = models.SmallIntegerField(
        primary_key=True,
        db_column='ID_PISO'
    )

    edificio = models.ForeignKey(
        'Edificio',
        on_delete=models.CASCADE,
        db_column='ID_EDIFICIO'
    )

    class Meta:
        db_table = 'PISOS'
        managed = False
        unique_together = (('id_piso', 'edificio'),)

#apartamento
class Apartamento(models.Model):

    id_apartamento = models.SmallIntegerField(
        primary_key=True,
        db_column='ID_APARTAMENTO'
    )

    piso = models.ForeignKey(
        'Piso',
        on_delete=models.CASCADE,
        db_column='ID_PISO'
    )

    edificio = models.ForeignKey(
        'Edificio',
        on_delete=models.CASCADE,
        db_column='ID_EDIFICIO'
    )

    class Meta:
        db_table = 'APARTAMENTOS'
        managed = False
        unique_together = (('id_apartamento', 'piso', 'edificio'),)

    def __str__(self):
        return f"Apto {self.id_apartamento}"
    
   

class Propietario(models.Model):

    identificacion = models.CharField(
        max_length=30,
        db_column='IDENTIFICACION',
        primary_key=True
    )

    apartamento = models.ForeignKey(
        'Apartamento',
        on_delete=models.CASCADE,
        db_column='ID_APARTAMENTO'
    )

    piso = models.ForeignKey(
        'Piso',
        on_delete=models.CASCADE,
        db_column='ID_PISO'
    )

    edificio = models.ForeignKey(
        'Edificio',
        on_delete=models.CASCADE,
        db_column='ID_EDIFICIO'
    )

    class Meta:
        db_table = 'PROPIETARIOS'
        managed = False
        unique_together = (('identificacion', 'apartamento', 'piso', 'edificio'),)

    def __str__(self):
        return self.identificacion
    
"""
