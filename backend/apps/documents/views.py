from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets

from apps.accounts.models import User

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
        user = self.request.user

        if self.action in {
            "create",
            "update",
            "partial_update",
            "destroy",
        }:
            allowed = (
                user.is_authenticated
                and user.role in {
                    User.Role.HR,
                    User.Role.SUPER_ADMIN,
                }
            )
        else:
            allowed = (
                user.is_authenticated
                and user.role in {
                    User.Role.HR,
                    User.Role.SUPER_ADMIN,
                    User.Role.EMPLOYEE,
                }
            )

        if not allowed:
            return [
                permissions.IsAdminUser(),
            ]

        return [
            permissions.IsAuthenticated(),
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