from django.apps import AppConfig




class NotificacionesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notificaciones'

    def ready(self):
        """
        ✅ Inicia el scheduler cuando Django arranca.
        El import guard evita que se ejecute dos veces con el reloader.
        """
        import os
        if os.environ.get('RUN_MAIN') == 'true':
            from .scheduler import RecordatorioScheduler
            scheduler = RecordatorioScheduler.get_instance()
            scheduler.iniciar()