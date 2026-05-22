from rest_framework_simplejwt.authentication import JWTAuthentication


class JWTSinUsuario(JWTAuthentication):
    """
    Versión de JWTAuthentication que valida el token
    pero NO intenta buscar el usuario en la BD de Django.
    El usuario se resuelve manualmente en TienePermiso.
    """

    def get_user(self, validated_token):
        # ✅ Retorna None en lugar de buscar en auth_user
        return None