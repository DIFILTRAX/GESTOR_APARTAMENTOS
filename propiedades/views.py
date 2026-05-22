# views.py
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import connection

from usuarios.permissions import TienePermiso
from .models import Edificio, Piso, Apartamento, Propietario
from .serializers import (
    EdificioSerializer, PisoSerializer,
    ApartamentoSerializer, PropietarioSerializer
)


# ──────────────────────────────────────────────────────
# EDIFICIOS
# ──────────────────────────────────────────────────────

class EdificioListCreateView(APIView):
    formulario_nombre = "EDIFICIOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        edificios = Edificio.objects.all().order_by('id_edificio')
        return Response(EdificioSerializer(edificios, many=True).data)

    def post(self, request):
        serializer = EdificioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class EdificioDetailView(APIView):
    formulario_nombre = "EDIFICIOS"
    permission_classes = [TienePermiso]

    def get_object(self, pk):
        return get_object_or_404(Edificio, pk=pk)

    def get(self, request, pk):
        return Response(EdificioSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = EdificioSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=204)


# ──────────────────────────────────────────────────────
# PISOS
# ──────────────────────────────────────────────────────

class PisoListCreateView(APIView):
    formulario_nombre = "PISOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT DISTINCT p.ID_PISO, p.ID_EDIFICIO, e.NOMBRE
                FROM PISOS p
                JOIN EDIFICIOS e ON e.ID_EDIFICIO = p.ID_EDIFICIO
                ORDER BY p.ID_EDIFICIO, p.ID_PISO
            """)
            rows = cursor.fetchall()
        data = [
            {'id_piso': row[0], 'edificio': row[1], 'edificio_nombre': row[2]}
            for row in rows
        ]
        return Response(data)

    def post(self, request):
        serializer = PisoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)



class PisoDetailView(APIView):
    formulario_nombre = "PISOS"
    permission_classes = [TienePermiso]

    def get(self, request, pk):
        edificio = request.query_params.get('edificio')
        with connection.cursor() as cursor:
            if edificio:
                cursor.execute("""
                    SELECT p.ID_PISO, p.ID_EDIFICIO, e.NOMBRE
                    FROM PISOS p JOIN EDIFICIOS e ON e.ID_EDIFICIO = p.ID_EDIFICIO
                    WHERE p.ID_PISO = %s AND p.ID_EDIFICIO = %s
                """, [pk, edificio])
            else:
                cursor.execute("""
                    SELECT p.ID_PISO, p.ID_EDIFICIO, e.NOMBRE
                    FROM PISOS p JOIN EDIFICIOS e ON e.ID_EDIFICIO = p.ID_EDIFICIO
                    WHERE p.ID_PISO = %s LIMIT 1
                """, [pk])
            row = cursor.fetchone()

        if not row:
            return Response({'error': 'No encontrado'}, status=404)
        return Response({'id_piso': row[0], 'edificio': row[1], 'edificio_nombre': row[2]})

    def put(self, request, pk):
        edificio_actual = request.data.get('edificio_actual') or request.query_params.get('edificio')
        edificio_nuevo  = request.data.get('edificio')
        if not edificio_actual or not edificio_nuevo:
            return Response({'error': 'Se requiere edificio_actual y edificio'}, status=400)
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE PISOS SET ID_EDIFICIO = %s
                WHERE ID_PISO = %s AND ID_EDIFICIO = %s
            """, [edificio_nuevo, pk, edificio_actual])
        return Response({'id_piso': pk, 'edificio': edificio_nuevo})

    def delete(self, request, pk):
        edificio = request.query_params.get('edificio')
        if not edificio:
            return Response(
                {'error': 'Se requiere el parámetro edificio. Ej: /pisos/1/?edificio=E001'},
                status=400
            )
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM APARTAMENTOS WHERE ID_PISO = %s AND ID_EDIFICIO = %s",
                [pk, edificio]
            )
            cursor.execute(
                "DELETE FROM PISOS WHERE ID_PISO = %s AND ID_EDIFICIO = %s",
                [pk, edificio]
            )
        return Response(status=204)


# ──────────────────────────────────────────────────────
# APARTAMENTOS
# ──────────────────────────────────────────────────────

class ApartamentoListCreateView(APIView):
    formulario_nombre = "APARTAMENTOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT DISTINCT
                    a.ID_APARTAMENTO,
                    a.ID_PISO,
                    a.ID_EDIFICIO,
                    e.NOMBRE
                FROM APARTAMENTOS a
                JOIN EDIFICIOS e ON e.ID_EDIFICIO = a.ID_EDIFICIO
                ORDER BY a.ID_EDIFICIO, a.ID_PISO, a.ID_APARTAMENTO
            """)
            rows = cursor.fetchall()
        data = [
            {
                'id_apartamento':  row[0],
                'piso':            row[1],
                'edificio':        row[2],
                'edificio_nombre': row[3],
            }
            for row in rows
        ]
        return Response(data)

    def post(self, request):
        serializer = ApartamentoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class ApartamentoDetailView(APIView):
    formulario_nombre = "APARTAMENTOS"
    permission_classes = [TienePermiso]

    def get(self, request, pk):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT a.ID_APARTAMENTO, a.ID_PISO, a.ID_EDIFICIO, e.NOMBRE
                FROM APARTAMENTOS a
                JOIN EDIFICIOS e ON e.ID_EDIFICIO = a.ID_EDIFICIO
                WHERE a.ID_APARTAMENTO = %s LIMIT 1
            """, [pk])
            row = cursor.fetchone()
        if not row:
            return Response({'error': 'No encontrado'}, status=404)
        return Response({
            'id_apartamento': row[0],
            'piso':           row[1],
            'edificio':       row[2],
            'edificio_nombre': row[3],
        })

    def put(self, request, pk):
        piso_nuevo     = request.data.get('piso')
        edificio_nuevo = request.data.get('edificio')
        if not piso_nuevo or not edificio_nuevo:
            return Response({'error': 'Se requiere piso y edificio'}, status=400)
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE APARTAMENTOS SET ID_PISO = %s, ID_EDIFICIO = %s
                WHERE ID_APARTAMENTO = %s
            """, [piso_nuevo, edificio_nuevo, pk])
        return Response({'id_apartamento': pk, 'piso': piso_nuevo, 'edificio': edificio_nuevo})

    def delete(self, request, pk):
        edificio = request.query_params.get('edificio')
        with connection.cursor() as cursor:
            if edificio:
                cursor.execute("""
                    DELETE FROM APARTAMENTOS
                    WHERE ID_APARTAMENTO = %s AND ID_EDIFICIO = %s
                """, [pk, edificio])
            else:
                cursor.execute(
                    "DELETE FROM APARTAMENTOS WHERE ID_APARTAMENTO = %s", [pk]
                )
        return Response(status=204)


# ──────────────────────────────────────────────────────
# PROPIETARIOS
# ──────────────────────────────────────────────────────

class PropietarioListCreateView(APIView):
    formulario_nombre = "PROPIETARIOS"
    permission_classes = [TienePermiso]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    p.IDENTIFICACION,
                    u.PRIMER_NOMBRE,
                    u.PRIMER_APELLIDO,
                    p.ID_APARTAMENTO,
                    p.ID_PISO,
                    p.ID_EDIFICIO,
                    e.NOMBRE
                FROM PROPIETARIOS p
                JOIN USUARIOS u ON u.IDENTIFICACION = p.IDENTIFICACION
                JOIN EDIFICIOS e ON e.ID_EDIFICIO = p.ID_EDIFICIO
                ORDER BY p.IDENTIFICACION
            """)
            rows = cursor.fetchall()
        data = [
            {
                'identificacion':  row[0],
                'nombre_usuario':  f"{row[1]} {row[2]}",
                'apartamento':     row[3],
                'piso':            row[4],
                'edificio':        row[5],
                'edificio_nombre': row[6],
            }
            for row in rows
        ]
        return Response(data)

    def post(self, request):
        serializer = PropietarioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class PropietarioDetailView(APIView):
    formulario_nombre = "PROPIETARIOS"
    permission_classes = [TienePermiso]

    def get(self, request, identificacion):
        apartamento = request.query_params.get('apartamento')
        piso        = request.query_params.get('piso')
        edificio    = request.query_params.get('edificio')

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT p.IDENTIFICACION, u.PRIMER_NOMBRE, u.PRIMER_APELLIDO,
                       p.ID_APARTAMENTO, p.ID_PISO, p.ID_EDIFICIO, e.NOMBRE
                FROM PROPIETARIOS p
                JOIN USUARIOS u ON u.IDENTIFICACION = p.IDENTIFICACION
                JOIN EDIFICIOS e ON e.ID_EDIFICIO = p.ID_EDIFICIO
                WHERE p.IDENTIFICACION = %s
                AND p.ID_APARTAMENTO = %s
                AND p.ID_PISO = %s
                AND p.ID_EDIFICIO = %s
            """, [identificacion, apartamento, piso, edificio])
            row = cursor.fetchone()

        if not row:
            return Response({'error': 'No encontrado'}, status=404)

        return Response({
            'identificacion':  row[0],
            'nombre_usuario':  f"{row[1]} {row[2]}",
            'apartamento':     row[3],
            'piso':            row[4],
            'edificio':        row[5],
            'edificio_nombre': row[6],
        })

    def put(self, request, identificacion):
        apartamento_actual = request.data.get('apartamento_actual')
        piso_actual        = request.data.get('piso_actual')
        edificio_actual    = request.data.get('edificio_actual')
        apartamento_nuevo  = request.data.get('apartamento')
        piso_nuevo         = request.data.get('piso')
        edificio_nuevo     = request.data.get('edificio')

        if not all([apartamento_actual, piso_actual, edificio_actual,
                    apartamento_nuevo, piso_nuevo, edificio_nuevo]):
            return Response({'error': 'Faltan campos requeridos.'}, status=400)

        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE PROPIETARIOS
                SET ID_APARTAMENTO = %s, ID_PISO = %s, ID_EDIFICIO = %s
                WHERE IDENTIFICACION = %s
                AND ID_APARTAMENTO = %s
                AND ID_PISO = %s
                AND ID_EDIFICIO = %s
            """, [
                apartamento_nuevo, piso_nuevo, edificio_nuevo,
                identificacion,
                apartamento_actual, piso_actual, edificio_actual
            ])

        return Response({
            'identificacion': identificacion,
            'apartamento':    apartamento_nuevo,
            'piso':           piso_nuevo,
            'edificio':       edificio_nuevo,
        })

    def delete(self, request, identificacion):
        apartamento = request.query_params.get('apartamento')
        piso        = request.query_params.get('piso')
        edificio    = request.query_params.get('edificio')

        if not apartamento or not piso or not edificio:
            return Response(
                {'error': 'Se requieren los parámetros: apartamento, piso, edificio'},
                status=400
            )

        with connection.cursor() as cursor:
            cursor.execute("""
                DELETE FROM PROPIETARIOS
                WHERE IDENTIFICACION = %s
                AND ID_APARTAMENTO = %s
                AND ID_PISO = %s
                AND ID_EDIFICIO = %s
            """, [identificacion, apartamento, piso, edificio])

        return Response(status=204)




"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Edificio
from .serializers import EdificioSerializer
from .models import Piso
from .serializers import PisoSerializer
from .models import Apartamento
from .serializers import ApartamentoSerializer
from rest_framework import generics
from .models import Propietario
from .serializers import PropietarioSerializer


class EdificioListCreateView(APIView):

    def get(self, request):
        edificios = Edificio.objects.all()
        serializer = EdificioSerializer(edificios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EdificioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EdificioDetailView(APIView):

    def get_object(self, pk):
        try:
            return Edificio.objects.get(pk=pk)
        except Edificio.DoesNotExist:
            return None

    def get(self, request, pk):
        edificio = self.get_object(pk)
        if not edificio:
            return Response({"error": "No encontrado"}, status=404)
        serializer = EdificioSerializer(edificio)
        return Response(serializer.data)

    def put(self, request, pk):
        edificio = self.get_object(pk)
        if not edificio:
            return Response({"error": "No encontrado"}, status=404)
        serializer = EdificioSerializer(edificio, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        edificio = self.get_object(pk)
        if not edificio:
            return Response({"error": "No encontrado"}, status=404)
        edificio.delete()
        return Response(status=204)
    
#pisos
class PisoListCreateView(APIView):

    def get(self, request):
        pisos = Piso.objects.all()
        serializer = PisoSerializer(pisos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PisoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class PisoDetailView(APIView):

    def get_object(self, pk):
        try:
            return Piso.objects.get(pk=pk)
        except Piso.DoesNotExist:
            return None

    def get(self, request, pk):
        piso = self.get_object(pk)
        if not piso:
            return Response({"error": "No encontrado"}, status=404)
        serializer = PisoSerializer(piso)
        return Response(serializer.data)

    def put(self, request, pk):
        piso = self.get_object(pk)
        if not piso:
            return Response({"error": "No encontrado"}, status=404)
        serializer = PisoSerializer(piso, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        piso = self.get_object(pk)
        if not piso:
            return Response({"error": "No encontrado"}, status=404)
        piso.delete()
        return Response(status=204)
    

#apartamentos
class ApartamentoListCreateView(APIView):

    def get(self, request):
        apartamentos = Apartamento.objects.all()
        serializer = ApartamentoSerializer(apartamentos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ApartamentoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class ApartamentoDetailView(APIView):

    def get_object(self, pk):
        try:
            return Apartamento.objects.get(pk=pk)
        except Apartamento.DoesNotExist:
            return None

    def get(self, request, pk):
        apto = self.get_object(pk)
        if not apto:
            return Response({"error": "No encontrado"}, status=404)
        serializer = ApartamentoSerializer(apto)
        return Response(serializer.data)

    def put(self, request, pk):
        apto = self.get_object(pk)
        if not apto:
            return Response({"error": "No encontrado"}, status=404)
        serializer = ApartamentoSerializer(apto, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        apto = self.get_object(pk)
        if not apto:
            return Response({"error": "No encontrado"}, status=404)
        apto.delete()
        return Response(status=204)


#propietarios



class PropietarioListCreateView(generics.ListCreateAPIView):
    queryset = Propietario.objects.all()
    serializer_class = PropietarioSerializer


class PropietarioDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Propietario.objects.all()
    serializer_class = PropietarioSerializer
    lookup_field = 'identificacion'

"""