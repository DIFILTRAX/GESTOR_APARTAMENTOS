from django.core.mail import send_mail, send_mass_mail
from django.conf import settings
from django.db import connection


def enviar_correo_notificacion(
    destinatario: str,
    nombre: str,
    asunto: str,
    mensaje: str
) -> bool:
    """
    Envía un correo a un propietario específico.
    Retorna True si se envió correctamente.
    """
    try:
        cuerpo_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0a2f20, #0f4a33);
                        padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #c9a84c; margin: 0; font-size: 22px;">
                    FYL Aliados Con Propiedad
                </h1>
                <p style="color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px;">
                    Sistema de gestión de copropiedad
                </p>
            </div>
            <div style="background: #ffffff; padding: 28px;
                        border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                <p style="color: #374151; font-size: 15px;">
                    Hola, <strong>{nombre}</strong>
                </p>
                <div style="background: #f9fafb; border-left: 4px solid #0f4a33;
                            padding: 16px; border-radius: 4px; margin: 16px 0;">
                    <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.6;">
                        {mensaje}
                    </p>
                </div>
                <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
                    Este es un mensaje automático del sistema de gestión.<br>
                    Por favor no responda este correo.
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                    © 2025 FYL Aliados Con Propiedad · Medellín, Colombia
                </p>
            </div>
        </div>
        """

        send_mail(
            subject=asunto,
            message=mensaje,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[destinatario],
            html_message=cuerpo_html,
            fail_silently=False,
        )
        return True

    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def enviar_recordatorio_pagos_masivo() -> dict:
    """
    Envía recordatorio de pago a todos los propietarios.
    NO guarda en tabla NOTIFICACIONES — registra en AUDITORIAS.
    """
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT
                u.CORREO,
                u.PRIMER_NOMBRE,
                u.PRIMER_APELLIDO,
                p.ID_APARTAMENTO,
                p.ID_EDIFICIO,
                e.NOMBRE as edificio_nombre
            FROM PROPIETARIOS p
            JOIN USUARIOS u ON u.IDENTIFICACION = p.IDENTIFICACION
            JOIN EDIFICIOS e ON e.ID_EDIFICIO = p.ID_EDIFICIO
            WHERE u.CORREO IS NOT NULL
            AND u.CORREO != ''
        """)
        propietarios = cursor.fetchall()

    enviados  = 0
    fallidos  = 0
    errores   = []

    for prop in propietarios:
        correo, nombre, apellido, apartamento, edificio, edificio_nombre = prop
        nombre_completo = f"{nombre} {apellido}"

        asunto = "🏢 Recordatorio de pago de administración — FYL Aliados"
        mensaje = (
            f"Le recordamos que el pago de administración del mes en curso "
            f"está próximo a vencer.\n\n"
            f"📍 Apartamento: {apartamento}\n"
            f"🏢 Edificio: {edificio_nombre}\n\n"
            f"Por favor realice su pago a tiempo para evitar recargos.\n\n"
            f"Si ya realizó el pago, por favor ignore este mensaje."
        )

        ok = enviar_correo_notificacion(correo, nombre_completo, asunto, mensaje)

        if ok:
            enviados += 1
        else:
            fallidos += 1
            errores.append(correo)

    # ✅ Registra en AUDITORIAS, no en NOTIFICACIONES
    with connection.cursor() as cursor:
        cursor.execute("""
            INSERT INTO AUDITORIAS
            (NOMBRE_TABLA, USUARIO, EVENTO, FECHA_CREACION, INFORMACION)
            VALUES (%s, %s, %s, CURDATE(), %s)
        """, [
            'NOTIFICACIONES',
            'SISTEMA',
            'RECORDATORIO_MASIVO',
            f"Enviados: {enviados}, Fallidos: {fallidos}, Errores: {', '.join(errores)}"
        ])

    return {
        'enviados': enviados,
        'fallidos': fallidos,
        'errores':  errores,
    }


def enviar_notificacion_individual(
    identificacion: str,
    asunto: str,
    mensaje: str,
    id_notificacion: int = None
) -> bool:
    """
    Envía correo a un propietario específico por su identificación.
    """
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT u.CORREO, u.PRIMER_NOMBRE, u.PRIMER_APELLIDO
            FROM USUARIOS u
            WHERE u.IDENTIFICACION = %s
        """, [identificacion])
        row = cursor.fetchone()

    if not row:
        return False

    correo, nombre, apellido = row
    nombre_completo = f"{nombre} {apellido}"

    return enviar_correo_notificacion(correo, nombre_completo, asunto, mensaje)