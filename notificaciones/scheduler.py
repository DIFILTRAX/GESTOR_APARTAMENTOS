import threading
from datetime import datetime
from django.db import connection


class RecordatorioScheduler:
    """
    Scheduler simple usando threading.Timer.
    Se activa automáticamente el último día de cada mes.
    """

    _instance = None
    _lock     = threading.Lock()
    _timer    = None
    _activo   = True

    @classmethod
    def get_instance(cls):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = cls()
        return cls._instance

    def __init__(self):
        self._timer  = None
        self._activo = self._cargar_estado()

    def _cargar_estado(self) -> bool:
        """Lee si el automático está activo desde la BD."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT INFORMACION FROM AUDITORIAS
                    WHERE EVENTO = 'SCHEDULER_CONFIG'
                    ORDER BY ID_LOG DESC LIMIT 1
                """)
                row = cursor.fetchone()
                if row:
                    return row[0] == 'activo'
        except Exception:
            pass
        return True  # activo por defecto

    def _guardar_estado(self, activo: bool):
        """Guarda el estado del scheduler en AUDITORIAS."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO AUDITORIAS
                    (NOMBRE_TABLA, USUARIO, EVENTO, FECHA_CREACION, INFORMACION)
                    VALUES ('SISTEMA', 'ADMIN', 'SCHEDULER_CONFIG', CURDATE(), %s)
                """, ['activo' if activo else 'inactivo'])
        except Exception as e:
            print(f"[SCHEDULER] Error guardando estado: {e}")

    def _segundos_hasta_proximo_envio(self) -> float:
        """
        Calcula los segundos hasta el último día del mes a las 8:00 AM.
        """
        ahora = datetime.now()
        # Próximo mes
        if ahora.month == 12:
            proximo_mes = ahora.replace(year=ahora.year + 1, month=1, day=1)
        else:
            proximo_mes = ahora.replace(month=ahora.month + 1, day=1)

        # Último día del mes actual
        import calendar
        ultimo_dia = calendar.monthrange(ahora.year, ahora.month)[1]
        objetivo = ahora.replace(day=ultimo_dia, hour=8, minute=0, second=0, microsecond=0)

        if objetivo <= ahora:
            # Ya pasó este mes, programar para el próximo mes
            ultimo_dia_prox = calendar.monthrange(proximo_mes.year, proximo_mes.month)[1]
            objetivo = proximo_mes.replace(day=ultimo_dia_prox, hour=8, minute=0, second=0)

        delta = (objetivo - ahora).total_seconds()
        print(f"[SCHEDULER] Próximo envío en {delta/3600:.1f} horas ({objetivo})")
        return delta

    def _ejecutar(self):
        """Ejecuta el envío masivo y reprograma."""
        if not self._activo:
            print("[SCHEDULER] Inactivo, no se envía recordatorio.")
            return

        print(f"[SCHEDULER] Ejecutando recordatorio masivo — {datetime.now()}")
        try:
            from .email_service import enviar_recordatorio_pagos_masivo
            resultado = enviar_recordatorio_pagos_masivo()
            print(f"[SCHEDULER] Resultado: {resultado}")
        except Exception as e:
            print(f"[SCHEDULER] Error: {e}")

        # Reprograma para el próximo mes
        self._programar()

    def _programar(self):
        """Programa el próximo envío."""
        if self._timer:
            self._timer.cancel()

        segundos = self._segundos_hasta_proximo_envio()
        self._timer = threading.Timer(segundos, self._ejecutar)
        self._timer.daemon = True
        self._timer.start()

    def iniciar(self):
        """Inicia el scheduler."""
        print("[SCHEDULER] Iniciando...")
        self._programar()

    def activar(self):
        self._activo = True
        self._guardar_estado(True)
        if not self._timer or not self._timer.is_alive():
            self._programar()
        print("[SCHEDULER] Activado.")

    def desactivar(self):
        self._activo = False
        self._guardar_estado(False)
        print("[SCHEDULER] Desactivado.")

    def esta_activo(self) -> bool:
        return self._activo

    def enviar_ahora(self) -> dict:
        """Envío manual inmediato."""
        from .email_service import enviar_recordatorio_pagos_masivo
        return enviar_recordatorio_pagos_masivo()