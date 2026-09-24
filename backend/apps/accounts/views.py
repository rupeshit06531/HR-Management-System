import os
import logging

from django.contrib.auth import (
    authenticate,
    get_user_model,
)
from django.contrib.auth.models import update_last_login
from django.contrib.auth.tokens import (
    default_token_generator,
)
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import transaction

from rest_framework import status, viewsets
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)

from .permissions import IsAdminOrSuperAdmin
from .serializers import UserSerializer


User = get_user_model()
logger = logging.getLogger(__name__)


def revoke_user_refresh_tokens(user):
    token_ids = OutstandingToken.objects.filter(
        user=user,
    ).values_list("id", flat=True)

    BlacklistedToken.objects.bulk_create(
        [
            BlacklistedToken(token_id=token_id)
            for token_id in token_ids
        ],
        ignore_conflicts=True,
    )


class UserViewSet(viewsets.ModelViewSet):
    """
    Administrative user management API.

    Only HR and Super Admin users can manage user accounts.
    """

    queryset = User.objects.all().order_by("-id")
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrSuperAdmin]


class MeViewSet(viewsets.ViewSet):
    """
    Authenticated current-user profile API.
    """

    permission_classes = [IsAuthenticated]

    def list(self, request):
        return Response(
            UserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )


class LoginViewSet(viewsets.ViewSet):
    """
    Secure JWT authentication endpoint.
    """

    authentication_classes = []
    permission_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

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


class LogoutViewSet(viewsets.ViewSet):
    """
    Logout endpoint that blacklists the supplied refresh token.
    """

    permission_classes = [IsAuthenticated]

    def create(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {
                    "detail": "Refresh token is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {
                    "detail": (
                        "Invalid or expired refresh token."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": "Successfully logged out."
            },
            status=status.HTTP_200_OK,
        )


class ChangePasswordViewSet(viewsets.ViewSet):
    """
    Allows an authenticated user to change their own password.
    """

    permission_classes = [IsAuthenticated]

    def create(self, request):
        current_password = request.data.get(
            "current_password"
        )
        new_password = request.data.get(
            "new_password"
        )
        confirm_password = request.data.get(
            "confirm_password"
        )

        if not current_password:
            return Response(
                {
                    "detail": (
                        "Current password is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not new_password:
            return Response(
                {
                    "detail": (
                        "New password is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not confirm_password:
            return Response(
                {
                    "detail": (
                        "Password confirmation is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.check_password(
            current_password
        ):
            return Response(
                {
                    "detail": (
                        "Current password is incorrect."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {
                    "detail": (
                        "New password and confirmation "
                        "do not match."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.check_password(
            new_password
        ):
            return Response(
                {
                    "detail": (
                        "New password must be different "
                        "from the current password."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(
                new_password,
                user=request.user,
            )
        except ValidationError as error:
            return Response(
                {
                    "detail": " ".join(error.messages)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(new_password)
        request.user.must_change_password = False
        with transaction.atomic():
            request.user.save(
                update_fields=[
                    "password",
                    "must_change_password",
                ]
            )
            revoke_user_refresh_tokens(request.user)

        return Response(
            {
                "detail": (
                    "Password changed successfully."
                )
            },
            status=status.HTTP_200_OK,
        )


class ForgotPasswordViewSet(viewsets.ViewSet):
    """
    Starts the password recovery process.

    The reset token is sent through the configured
    Django email backend.

    Development uses the console email backend,
    so the reset email is printed in the
    backend terminal.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_forgot"

    def create(self, request):
        username = request.data.get("username")
        email = request.data.get("email")

        if not username and not email:
            return Response(
                {
                    "detail": (
                        "Username or email is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = None

        if username:
            user = User.objects.filter(
                username=username,
                is_active=True,
            ).first()

        if user is None and email:
            user = User.objects.filter(
                email=email,
                is_active=True,
            ).first()

        if user is None:
            return Response(
                {
                    "detail": (
                        "If the account exists, "
                        "password recovery instructions "
                        "have been sent."
                    )
                },
                status=status.HTTP_200_OK,
            )

        if not user.email:
            return Response(
                {
                    "detail": (
                        "If the account exists, password "
                        "recovery instructions have been sent."
                    )
                },
                status=status.HTTP_200_OK,
            )

        token = default_token_generator.make_token(
            user
        )

        frontend_base_url = os.getenv(
            "FRONTEND_BASE_URL",
            "http://localhost:5173",
        ).strip().rstrip("/")
        reset_url = (
            f"{frontend_base_url}/reset-password"
            f"?uid={user.pk}&token={token}"
        )

        try:
            send_mail(
                subject="HRMS Password Reset",
                message=(
                    "Your HRMS password reset request "
                    "has been received.\n\n"
                    f"Password reset link:\n{reset_url}\n\n"
                    "This link expires in one hour and can only be used once. "
                    "If you did not request a password reset, you can ignore this email."
                ),
                from_email=None,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception:
            logger.exception("Failed to send a password reset email.")

        return Response(
            {
                "detail": (
                    "If the account exists, "
                    "password recovery instructions "
                    "have been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordViewSet(viewsets.ViewSet):
    """
    Completes password recovery after token verification.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def create(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not uid or not token:
            return Response(
                {
                    "detail": (
                        "Reset user ID and token "
                        "are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(
                pk=uid,
                is_active=True,
            )
        except User.DoesNotExist:
            return Response(
                {
                    "detail": "Invalid password reset request."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(
            user,
            token,
        ):
            return Response(
                {
                    "detail": (
                        "Invalid or expired password "
                        "reset token."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not new_password or not confirm_password:
            return Response(
                {
                    "detail": "New password and confirmation are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {
                    "detail": "New password and confirmation do not match."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=user)
        except ValidationError as error:
            return Response(
                {
                    "detail": " ".join(error.messages)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(
            new_password
        )
        user.must_change_password = False

        with transaction.atomic():
            user.save(
                update_fields=[
                    "password",
                    "must_change_password",
                ]
            )
            revoke_user_refresh_tokens(user)

        return Response(
            {
                "detail": (
                    "Password reset successfully. You can now sign in with your new password."
                )
            },
            status=status.HTTP_200_OK,
        )
