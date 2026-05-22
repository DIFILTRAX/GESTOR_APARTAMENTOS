from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import connection

from usuarios.permissions import TienePermiso
from .models import TipoPago, EstadoPago
from .serializers import TipoPagoSerializer, EstadoPagoSerializer


# ──────────────────────────────────────────────────────
# TIPOS DE PAGO
# ──────────────────────────────────────────────────────

class TipoPagoListCreateView(APIView):
    formulario_nombre = "TIPOS_PAGOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        return Response(TipoPagoSerializer(
            TipoPago.objects.all().order_by('id_tipo_pago'), many=True
        ).data)

    def post(self, request):
        s = TipoPagoSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=201)
        return Response(s.errors, status=400)


class TipoPagoDetailView(APIView):
    formulario_nombre = "TIPOS_PAGOS"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(TipoPago, pk=pk)

    def get(self, request, pk):
        return Response(TipoPagoSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        s = TipoPagoSerializer(self.get_object(pk), data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)


# ──────────────────────────────────────────────────────
# ESTADOS DE PAGO
# ──────────────────────────────────────────────────────

class EstadoPagoListCreateView(APIView):
    formulario_nombre = "ESTADOS_PAGOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        return Response(EstadoPagoSerializer(
            EstadoPago.objects.all().order_by('id_estado_pago'), many=True
        ).data)

    def post(self, request):
        s = EstadoPagoSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=201)
        return Response(s.errors, status=400)


class EstadoPagoDetailView(APIView):
    formulario_nombre = "ESTADOS_PAGOS"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(EstadoPago, pk=pk)

    def get(self, request, pk):
        return Response(EstadoPagoSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        s = EstadoPagoSerializer(self.get_object(pk), data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)


# ──────────────────────────────────────────────────────
# HELPER SQL — nunca toca propiedades_apartamento
# ──────────────────────────────────────────────────────

def _pagos_sql(where_clause='', params=None):
    sql = f"""
        SELECT
            p.ID_PAGO,
            p.FECHA_PAGO,
            p.FECHA_LIMITE,
            p.VALOR,
            p.DESCRIPCION,
            p.ID_ESTADO_PAGO,
            ep.NOMBRE  AS estado_pago_nombre,
            p.ID_TIPO_PAGO,
            tp.NOMBRE  AS tipo_pago_nombre,
            p.ID_APARTAMENTO,
            p.ID_PISO,
            p.ID_EDIFICIO,
            e.NOMBRE   AS edificio_nombre
        FROM PAGOS p
        LEFT JOIN ESTADOS_PAGOS ep ON ep.ID_ESTADO_PAGO = p.ID_ESTADO_PAGO
        LEFT JOIN TIPOS_PAGOS   tp ON tp.ID_TIPO_PAGO   = p.ID_TIPO_PAGO
        LEFT JOIN EDIFICIOS      e  ON e.ID_EDIFICIO     = p.ID_EDIFICIO
        {where_clause}
        ORDER BY p.ID_PAGO DESC
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params or [])
        rows = cursor.fetchall()

    return [
        {
            'id_pago':            row[0],
            'fecha_pago':         str(row[1]) if row[1] else None,
            'fecha_limite':       str(row[2]) if row[2] else None,
            'valor':              float(row[3]),
            'descripcion':        row[4],
            'estado_pago':        row[5],
            'estado_pago_nombre': row[6],
            'tipo_pago':          row[7],
            'tipo_pago_nombre':   row[8],
            'apartamento':        row[9],
            'piso':               row[10],
            'edificio':           row[11],
            'edificio_nombre':    row[12],
        }
        for row in rows
    ]


# ──────────────────────────────────────────────────────
# PAGOS
# ──────────────────────────────────────────────────────

class PagoListCreateView(APIView):
    formulario_nombre = "PAGOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        return Response(_pagos_sql())

    def post(self, request):
        data = request.data

        campos_requeridos = [
            'fecha_pago', 'fecha_limite', 'valor', 'descripcion',
            'estado_pago', 'tipo_pago', 'apartamento', 'piso', 'edificio'
        ]
        for campo in campos_requeridos:
            if not data.get(campo):
                return Response(
                    {'error': f'El campo {campo} es obligatorio.'},
                    status=400
                )

        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO PAGOS (
                        FECHA_PAGO, FECHA_LIMITE, VALOR, DESCRIPCION,
                        ID_ESTADO_PAGO, ID_TIPO_PAGO,
                        ID_APARTAMENTO, ID_PISO, ID_EDIFICIO
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, [
                    data['fecha_pago'],
                    data['fecha_limite'],
                    data['valor'],
                    data['descripcion'],
                    data['estado_pago'],
                    data['tipo_pago'],
                    data['apartamento'],
                    data['piso'],
                    data['edificio'],
                ])
                pago_id = cursor.lastrowid

            pagos = _pagos_sql('WHERE p.ID_PAGO = %s', [pago_id])
            return Response(pagos[0] if pagos else {}, status=201)

        except Exception as e:
            return Response({'error': str(e)}, status=500)


class PagoDetailView(APIView):
    formulario_nombre = "PAGOS"
    permission_classes = [TienePermiso]

    def get(self, request, pk):
        pagos = _pagos_sql('WHERE p.ID_PAGO = %s', [pk])
        if not pagos:
            return Response({'error': 'No encontrado'}, status=404)
        return Response(pagos[0])

    def put(self, request, pk):
        data = request.data

        campos_requeridos = [
            'fecha_pago', 'fecha_limite', 'valor', 'descripcion',
            'estado_pago', 'tipo_pago', 'apartamento', 'piso', 'edificio'
        ]
        for campo in campos_requeridos:
            if not data.get(campo):
                return Response(
                    {'error': f'El campo {campo} es obligatorio.'},
                    status=400
                )

        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE PAGOS SET
                        FECHA_PAGO     = %s,
                        FECHA_LIMITE   = %s,
                        VALOR          = %s,
                        DESCRIPCION    = %s,
                        ID_ESTADO_PAGO = %s,
                        ID_TIPO_PAGO   = %s,
                        ID_APARTAMENTO = %s,
                        ID_PISO        = %s,
                        ID_EDIFICIO    = %s
                    WHERE ID_PAGO = %s
                """, [
                    data['fecha_pago'],
                    data['fecha_limite'],
                    data['valor'],
                    data['descripcion'],
                    data['estado_pago'],
                    data['tipo_pago'],
                    data['apartamento'],
                    data['piso'],
                    data['edificio'],
                    pk,
                ])

            pagos = _pagos_sql('WHERE p.ID_PAGO = %s', [pk])
            return Response(pagos[0] if pagos else {})

        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def delete(self, request, pk):
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM PAGOS WHERE ID_PAGO = %s", [pk]
                )
            return Response(status=204)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

"""
#views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Pago
from .serializers import PagoSerializer
from .models import TipoPago
from .serializers import TipoPagoSerializer
from .serializers import EstadoPagoSerializer
from .models import EstadoPago


class PagoListCreateView(APIView):

    def get(self, request):
        pagos = Pago.objects.all()
        serializer = PagoSerializer(pagos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PagoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class PagoDetailView(APIView):

    def get_object(self, pk):
        try:
            return Pago.objects.get(pk=pk)
        except Pago.DoesNotExist:
            return None

    def get(self, request, pk):
        pago = self.get_object(pk)
        if not pago:
            return Response({"error": "No encontrado"}, status=404)
        serializer = PagoSerializer(pago)
        return Response(serializer.data)

    def put(self, request, pk):
        pago = self.get_object(pk)
        if not pago:
            return Response({"error": "No encontrado"}, status=404)
        serializer = PagoSerializer(pago, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        pago = self.get_object(pk)
        if not pago:
            return Response({"error": "No encontrado"}, status=404)
        pago.delete()
        return Response(status=204)

#tipos de pagos
class TipoPagoListCreateView(APIView):

    def get(self, request):
        tipos = TipoPago.objects.all()
        serializer = TipoPagoSerializer(tipos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TipoPagoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class TipoPagoDetailView(APIView):

    def get_object(self, pk):
        try:
            return TipoPago.objects.get(pk=pk)
        except TipoPago.DoesNotExist:
            return None

    def get(self, request, pk):
        tipo = self.get_object(pk)
        if not tipo:
            return Response({"error": "No encontrado"}, status=404)
        serializer = TipoPagoSerializer(tipo)
        return Response(serializer.data)

    def put(self, request, pk):
        tipo = self.get_object(pk)
        if not tipo:
            return Response({"error": "No encontrado"}, status=404)
        serializer = TipoPagoSerializer(tipo, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        tipo = self.get_object(pk)
        if not tipo:
            return Response({"error": "No encontrado"}, status=404)
        tipo.delete()
        return Response(status=204)
    
#estados de pagos



# LISTAR Y CREAR
class EstadoPagoListCreateView(APIView):

    def get(self, request):
        estados = EstadoPago.objects.all()
        serializer = EstadoPagoSerializer(estados, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EstadoPagoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


# DETALLE
class EstadoPagoDetailView(APIView):

    def get_object(self, pk):
        try:
            return EstadoPago.objects.get(pk=pk)
        except EstadoPago.DoesNotExist:
            return None

    def get(self, request, pk):
        estado = self.get_object(pk)
        if not estado:
            return Response({"error": "No encontrado"}, status=404)
        serializer = EstadoPagoSerializer(estado)
        return Response(serializer.data)

    def put(self, request, pk):
        estado = self.get_object(pk)
        if not estado:
            return Response({"error": "No encontrado"}, status=404)
        serializer = EstadoPagoSerializer(estado, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        estado = self.get_object(pk)
        if not estado:
            return Response({"error": "No encontrado"}, status=404)
        estado.delete()
        return Response(status=204)


------------------------ version 2 ------------------------
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response

from usuarios.permissions import TienePermiso
from .models import Pago, TipoPago, EstadoPago
from .serializers import PagoSerializer, TipoPagoSerializer, EstadoPagoSerializer


# ──────────────────────────────────────────────────────
# TIPOS DE PAGO
# ──────────────────────────────────────────────────────

class TipoPagoListCreateView(APIView):
    formulario_nombre = "TIPOS_PAGOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        tipos = TipoPago.objects.all().order_by('id_tipo_pago')
        return Response(TipoPagoSerializer(tipos, many=True).data)

    def post(self, request):
        serializer = TipoPagoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class TipoPagoDetailView(APIView):
    formulario_nombre = "TIPOS_PAGOS"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(TipoPago, pk=pk)

    def get(self, request, pk):
        return Response(TipoPagoSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = TipoPagoSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)


# ──────────────────────────────────────────────────────
# ESTADOS DE PAGO
# ──────────────────────────────────────────────────────

class EstadoPagoListCreateView(APIView):
    formulario_nombre = "ESTADOS_PAGOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        estados = EstadoPago.objects.all().order_by('id_estado_pago')
        return Response(EstadoPagoSerializer(estados, many=True).data)

    def post(self, request):
        serializer = EstadoPagoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class EstadoPagoDetailView(APIView):
    formulario_nombre = "ESTADOS_PAGOS"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(EstadoPago, pk=pk)

    def get(self, request, pk):
        return Response(EstadoPagoSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = EstadoPagoSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)


# ──────────────────────────────────────────────────────
# PAGOS
# ──────────────────────────────────────────────────────

class PagoListCreateView(APIView):
    formulario_nombre = "PAGOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        pagos = (
            Pago.objects
            .select_related('estado_pago', 'tipo_pago', 'edificio')
            .all()
        )
        return Response(PagoSerializer(pagos, many=True).data)

    def post(self, request):
        serializer = PagoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class PagoDetailView(APIView):
    formulario_nombre = "PAGOS"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(
            Pago.objects.select_related('estado_pago', 'tipo_pago', 'edificio'),
            pk=pk
        )

    def get(self, request, pk):
        return Response(PagoSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = PagoSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)        
"""