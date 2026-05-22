from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken, TokenError

from usuarios.permissions import TienePermiso
from .models import TipoNotificacion, Notificacion
from .serializers import TipoNotificacionSerializer, NotificacionSerializer
from .email_service import enviar_notificacion_individual
from .scheduler import RecordatorioScheduler


# ──────────────────────────────────────────────────────
# TIPOS DE NOTIFICACION
# ──────────────────────────────────────────────────────

class TipoNotificacionListCreateView(APIView):
    formulario_nombre = "TIPOS_NOTIFICACIONES"
    permission_classes = [TienePermiso]

    def get(self, request):
        tipos = TipoNotificacion.objects.all().order_by('id_tipo_notificacion')
        return Response(TipoNotificacionSerializer(tipos, many=True).data)

    def post(self, request):
        serializer = TipoNotificacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class TipoNotificacionDetailView(APIView):
    formulario_nombre = "TIPOS_NOTIFICACIONES"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(TipoNotificacion, pk=pk)

    def get(self, request, pk):
        return Response(TipoNotificacionSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = TipoNotificacionSerializer(
            self.get_object(pk), data=request.data
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)


# ──────────────────────────────────────────────────────
# NOTIFICACIONES
# ──────────────────────────────────────────────────────

class NotificacionListCreateView(APIView):
    formulario_nombre = "NOTIFICACIONES"
    permission_classes = [TienePermiso]

    def get(self, request):
        data = (
            Notificacion.objects
            .select_related('pago', 'tipo_notificacion')
            .all()
        )
        return Response(NotificacionSerializer(data, many=True).data)

    def post(self, request):
        serializer = NotificacionSerializer(data=request.data)
        if serializer.is_valid():
            notificacion = serializer.save()

            # ✅ Envía correo automáticamente al crear notificación
            try:
                from django.db import connection
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT DISTINCT u.IDENTIFICACION
                        FROM PAGOS p
                        JOIN PROPIETARIOS pr ON (
                            pr.ID_APARTAMENTO = p.ID_APARTAMENTO
                            AND pr.ID_PISO = p.ID_PISO
                            AND pr.ID_EDIFICIO = p.ID_EDIFICIO
                        )
                        JOIN USUARIOS u ON u.IDENTIFICACION = pr.IDENTIFICACION
                        WHERE p.ID_PAGO = %s
                    """, [notificacion.pago.id_pago])
                    propietarios = cursor.fetchall()

                asunto  = f"Notificación: {notificacion.tipo_notificacion.nombre}"
                mensaje = notificacion.descripcion

                for (identificacion,) in propietarios:
                    enviar_notificacion_individual(identificacion, asunto, mensaje)

            except Exception as e:
                print(f"[EMAIL] Error enviando correo: {e}")

            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class NotificacionDetailView(APIView):
    formulario_nombre = "NOTIFICACIONES"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(
            Notificacion.objects.select_related('pago', 'tipo_notificacion'),
            pk=pk
        )

    def get(self, request, pk):
        return Response(NotificacionSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = NotificacionSerializer(
            self.get_object(pk), data=request.data
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)


# ──────────────────────────────────────────────────────
# CORREO MASIVO — Recordatorio manual
# ──────────────────────────────────────────────────────

class EnviarRecordatorioView(APIView):
    """
    POST /api/notificaciones/enviar-recordatorio/
    Envía recordatorio de pago a todos los propietarios ahora mismo.
    """
    formulario_nombre = "NOTIFICACIONES"
    permission_classes = [TienePermiso]

    def post(self, request):
        try:
            from .email_service import enviar_recordatorio_pagos_masivo
            resultado = enviar_recordatorio_pagos_masivo()
            return Response({
                'mensaje': f"Recordatorio enviado a {resultado['enviados']} propietarios.",
                'resultado': resultado
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ──────────────────────────────────────────────────────
# SCHEDULER — ON/OFF
# ──────────────────────────────────────────────────────

class SchedulerConfigView(APIView):
    """
    GET  /api/notificaciones/scheduler/  → estado actual
    POST /api/notificaciones/scheduler/  → activar/desactivar
         body: { "activo": true | false }
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        scheduler = RecordatorioScheduler.get_instance()
        return Response({'activo': scheduler.esta_activo()})

    def post(self, request):
        activo = request.data.get('activo')
        if activo is None:
            return Response({'error': 'Se requiere el campo activo (true/false)'}, status=400)

        scheduler = RecordatorioScheduler.get_instance()
        if activo:
            scheduler.activar()
        else:
            scheduler.desactivar()

        return Response({
            'activo':  scheduler.esta_activo(),
            'mensaje': 'Scheduler activado.' if activo else 'Scheduler desactivado.'
        })


"""
from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import TipoNotificacion, Notificacion
from .serializers import TipoNotificacionSerializer
from .serializers import NotificacionSerializer


class TipoNotificacionListCreateView(APIView):

    def get(self, request):
        tipos = TipoNotificacion.objects.all()
        serializer = TipoNotificacionSerializer(tipos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TipoNotificacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class TipoNotificacionDetailView(APIView):

    def get_object(self, pk):
        try:
            return TipoNotificacion.objects.get(pk=pk)
        except TipoNotificacion.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"error": "No encontrado"}, status=404)
        return Response(TipoNotificacionSerializer(obj).data)

    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"error": "No encontrado"}, status=404)
        serializer = TipoNotificacionSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"error": "No encontrado"}, status=404)
        obj.delete()
        return Response(status=204)
    
class NotificacionListCreateView(APIView):

    def get(self, request):
        data = Notificacion.objects.all()
        serializer = NotificacionSerializer(data, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = NotificacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class NotificacionDetailView(APIView):

    def get_object(self, pk):
        try:
            return Notificacion.objects.get(pk=pk)
        except Notificacion.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"error": "No encontrado"}, status=404)
        return Response(NotificacionSerializer(obj).data)

    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"error": "No encontrado"}, status=404)
        serializer = NotificacionSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"error": "No encontrado"}, status=404)
        obj.delete()
        return Response(status=204)


------------------------------------
# ──────────────────────────────────────────────────────
# TIPOS DE NOTIFICACION
# ──────────────────────────────────────────────────────
class TipoNotificacionListCreateView(APIView):
    formulario_nombre = "TIPOS_NOTIFICACIONES"
    permission_classes = [TienePermiso]

    def get(self, request):
        tipos = TipoNotificacion.objects.all().order_by('id_tipo_notificacion')
        return Response(TipoNotificacionSerializer(tipos, many=True).data)

    def post(self, request):
        serializer = TipoNotificacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class TipoNotificacionDetailView(APIView):
    formulario_nombre = "TIPOS_NOTIFICACIONES"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(TipoNotificacion, pk=pk)

    def get(self, request, pk):
        return Response(TipoNotificacionSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = TipoNotificacionSerializer(
            self.get_object(pk), data=request.data
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)


# ──────────────────────────────────────────────────────
# NOTIFICACIONES
# ──────────────────────────────────────────────────────

class NotificacionListCreateView(APIView):
    formulario_nombre = "NOTIFICACIONES"
    permission_classes = [TienePermiso]

    def get(self, request):
        notificaciones = (
            Notificacion.objects
            .select_related('pago', 'tipo_notificacion')
            .all()
        )
        return Response(NotificacionSerializer(notificaciones, many=True).data)

    def post(self, request):
        serializer = NotificacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class NotificacionDetailView(APIView):
    formulario_nombre = "NOTIFICACIONES"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(
            Notificacion.objects.select_related('pago', 'tipo_notificacion'),
            pk=pk
        )

    def get(self, request, pk):
        return Response(NotificacionSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = NotificacionSerializer(
            self.get_object(pk), data=request.data
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)




"""