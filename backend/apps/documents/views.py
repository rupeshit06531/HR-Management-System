from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.permissions import IsAdminOrSuperAdmin

from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer

    permission_classes = [
        IsAdminOrSuperAdmin,
    ]

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
    ]

    def get_queryset(self):
        return (
            Document.objects
            .select_related(
                "employee",
                "employee__user",
                "employee__department",
            )
            .all()
        )