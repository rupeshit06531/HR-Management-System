from rest_framework import filters, viewsets

from django_filters.rest_framework import DjangoFilterBackend

from .models import Attendance
from .serializers import AttendanceSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related(
        "employee",
        "employee__user",
    ).all()

    serializer_class = AttendanceSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "employee",
        "status",
        "date",
    ]

    search_fields = [
        "employee__employee_id",
        "employee__user__username",
        "employee__user__first_name",
        "employee__user__last_name",
    ]

    ordering_fields = [
        "id",
        "date",
        "check_in",
        "check_out",
    ]

    ordering = [
        "-date",
        "-check_in",
    ]