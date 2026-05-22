from django.db import models


class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True, db_column='ID_ROL')
    nombre = models.CharField(max_length=50, db_column='NOMBRE')

    class Meta:
        db_table = 'ROLES'
        managed = False

    def __str__(self):
        return self.nombre


class Perfil(models.Model):
    id_perfil = models.SmallIntegerField(primary_key=True, db_column='ID_PERFIL')
    rol = models.ForeignKey(
        Rol,
        on_delete=models.CASCADE,
        db_column='ID_ROL',
        related_name='perfiles'
    )
    nombre = models.CharField(max_length=50, db_column='NOMBRE')

    class Meta:
        db_table = 'PERFILES'
        managed = False

    def __str__(self):
        return self.nombre


class Usuario(models.Model):
    identificacion = models.CharField(
        primary_key=True, max_length=30, db_column='IDENTIFICACION'
    )
    id_tipo_documento = models.SmallIntegerField(db_column='ID_TIPO_DOCUMENTO')
    correo = models.EmailField(max_length=254, db_column='CORREO', unique=True)
    celular = models.CharField(max_length=10, db_column='CELULAR')
    primer_nombre = models.CharField(max_length=50, db_column='PRIMER_NOMBRE')
    segundo_nombre = models.CharField(
        max_length=50, db_column='SEGUNDO_NOMBRE', null=True, blank=True
    )
    primer_apellido = models.CharField(max_length=50, db_column='PRIMER_APELLIDO')
    segundo_apellido = models.CharField(
        max_length=50, db_column='SEGUNDO_APELLIDO', null=True, blank=True
    )
    contrasenna = models.CharField(max_length=100, db_column='CONTRASENNA')
    perfil = models.ForeignKey(
        Perfil,
        on_delete=models.PROTECT,
        db_column='ID_PERFIL',
        related_name='usuarios'
    )

    class Meta:
        db_table = 'USUARIOS'
        managed = False

    def __str__(self):
        return f"{self.primer_nombre} {self.primer_apellido}"


class Formulario(models.Model):
    id_formulario = models.AutoField(primary_key=True, db_column='ID_FORMULARIO')
    nombre_formulario = models.CharField(max_length=50, db_column='NOMBRE_FORMULARIO')
    nodo_principal = models.CharField(max_length=1, db_column='NODO_PRINCIPAL')
    dependencia = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='DEPENDENCIA',
        related_name='hijos'
    )
    orden = models.IntegerField(db_column='ORDEN')
    icono = models.CharField(max_length=20, null=True, blank=True, db_column='ICONO')
    redirect = models.CharField(max_length=20, db_column='REDIRECT')

    class Meta:
        db_table = 'FORMULARIOS'
        managed = False
        ordering = ['orden']

    def __str__(self):
        return self.nombre_formulario


class Permiso(models.Model):
    perfil = models.ForeignKey(
        Perfil,
        on_delete=models.CASCADE,
        db_column='ID_PERFIL',
        primary_key=True,
        related_name='permisos'
    )
    formulario = models.ForeignKey(
        Formulario,
        on_delete=models.CASCADE,
        db_column='ID_FORMULARIO',
        related_name='permisos'
    )
    crear = models.CharField(max_length=1, db_column='CREAR')
    editar = models.CharField(max_length=1, db_column='EDITAR')
    leer = models.CharField(max_length=1, db_column='LEER')
    eliminar = models.CharField(max_length=1, db_column='ELIMINAR')

    class Meta:
        db_table = 'PERMISOS'
        managed = False
        unique_together = (('perfil', 'formulario'),)

    def puede(self, metodo: str) -> bool:
        mapa = {
            'GET': self.leer,
            'POST': self.crear,
            'PUT': self.editar,
            'PATCH': self.editar,
            'DELETE': self.eliminar,
        }
        return mapa.get(metodo, 'N') == 'S'
    
