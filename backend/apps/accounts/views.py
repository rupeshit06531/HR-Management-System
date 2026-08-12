from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import update_last_login

from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsAdminOrSuperAdmin
from .serializers import UserSerializer


User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    Administrative user management API.

    Only HR and Super Admin users can manage user accounts.
    """

    queryset = User.objects.all().order_by("-id")
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrSuperAdmin]


class LoginViewSet(viewsets.ViewSet):
    """
    Secure JWT authentication endpoint.

    Accepts:
        username
        password

    Returns:
        access token
        refresh token
        authenticated user profile
    """

    authentication_classes = []
    permission_classes = []

    def create(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {
                    "detail": (
                        "Username and password are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(
            request=request,
            username=username,
            password=password,
        )

        if user is None:
            return Response(
                {
                    "detail": (
                        "Invalid username or password."
                    )
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {
                    "detail": (
                        "User account is inactive."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        update_last_login(
            None,
            user,
        )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )