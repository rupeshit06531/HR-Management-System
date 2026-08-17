
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.permissions import (
    IsAuthenticatedUser,
    IsSuperAdmin,
)

from .models import Holiday
from .serializers import HolidaySerializer


class HolidayViewSet(viewsets.ModelViewSet):

    queryset = Holiday.objects.all()

    serializer_class = HolidaySerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "holiday_type",
        "date",
        "is_active",
    ]

    search_fields = [
        "name",
        "description",
    ]

    ordering_fields = [
        "id",
        "name",
        "date",
        "holiday_type",
        "is_active",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "date",
        "name",
    ]

    def get_permissions(self):
        """
        Read access:
            Authenticated HRMS users

        Write access:
            Super Admin only
        """

        if self.action in {
            "create",
            "update",
            "partial_update",
            "destroy",
        }:
            permission_classes = [
                IsSuperAdmin,
            ]
        else:
            permission_classes = [
                IsAuthenticatedUser,
            ]

        return [
            permission()
            for permission in permission_classes
        ]