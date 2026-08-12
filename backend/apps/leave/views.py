from rest_framework import filters, viewsets

from django_filters.rest_framework import DjangoFilterBackend

from .models import Leave
from .serializers import LeaveSerializer
from apps.accounts.permissions import IsManagerOrAdmin


class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.select_related(
        "employee",
        "employee__user",
    ).all().order_by("-applied_at")

    serializer_class = LeaveSerializer

    permission_classes = [
        IsManagerOrAdmin,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "leave_type",
        "status",
        "employee",
        "start_date",
        "end_date",
    ]

    search_fields = [
        "employee__employee_id",
        "employee__user__username",
        "employee__user__first_name",
        "employee__user__last_name",
        "reason",
    ]

    ordering_fields = [
        "id",
        "start_date",
        "end_date",
        "applied_at",
    ]

    ordering = [
        "-applied_at",
    ]
