from pathlib import Path

from django.http import FileResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound

from apps.accounts.models import User
from apps.accounts.permissions import (
    IsAdminOrSuperAdmin,
    IsDocumentViewer,
)

from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "employee",
        "document_type",
        "uploaded_at",
    ]

    search_fields = [
        "employee__employee_id",
        "employee__user__username",
        "employee__user__first_name",
        "employee__user__last_name",
        "employee__user__email",
        "employee__department__name",
        "title",
        "description",
    ]

    ordering_fields = [
        "id",
        "title",
        "document_type",
        "uploaded_at",
    ]

    ordering = [
        "-uploaded_at",
        "-id",
    ]

    def get_permissions(self):
        if self.action in {
            "create",
            "update",
            "partial_update",
            "destroy",
        }:
            permission_classes = [
                IsAdminOrSuperAdmin,
            ]
        else:
            permission_classes = [
                IsDocumentViewer,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    def get_queryset(self):
        queryset = (
            Document.objects
            .select_related(
                "employee",
                "employee__user",
                "employee__department",
                "employee__designation",
                "employee__manager",
            )
            .all()
        )

        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        if user.role in {
            User.Role.HR,
            User.Role.SUPER_ADMIN,
        }:
            return queryset

        if user.role == User.Role.EMPLOYEE:
            try:
                employee = user.employee_profile
            except Exception:
                return queryset.none()

            return queryset.filter(
                employee=employee,
            )

        return queryset.none()

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        document = self.get_object()

        try:
            document.file.open("rb")
        except (OSError, ValueError) as error:
            raise NotFound("Document file is unavailable.") from error

        response = FileResponse(
            document.file,
            as_attachment=True,
            filename=Path(document.file.name).name,
            content_type="application/octet-stream",
        )
        response["Cache-Control"] = "private, no-store"
        response["X-Content-Type-Options"] = "nosniff"
        return response


def deny_public_private_media(request, path=""):
    """Sensitive HR files must use their authenticated download endpoints."""
    from django.http import HttpResponseNotFound

    return HttpResponseNotFound()
