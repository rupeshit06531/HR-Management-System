from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import (
    IsAttendanceViewer,
    IsManagerOrAdmin,
)

from .models import Attendance
from .serializers import (
    AttendancePunchInSerializer,
    AttendanceSerializer,
)


class AttendanceViewSet(viewsets.ModelViewSet):
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
        "-id",
    ]

    def get_permissions(self):
        """
        Attendance access rules.

        Read:
            Employee / Manager / HR / Super Admin

        Write:
            Manager / HR / Super Admin

        Employee punch-in:
            Employee can create their own verified punch-in
            through the dedicated punch-in endpoint.

        Employees:
            Can only view their own attendance.

        Managers:
            Can only access attendance belonging to
            employees they manage.

        HR / Super Admin:
            Can access all attendance records.
        """

        if self.action == "punch_in":
            permission_classes = [
                IsAttendanceViewer,
            ]

        elif self.action in {
            "create",
            "update",
            "partial_update",
            "destroy",
        }:
            permission_classes = [
                IsManagerOrAdmin,
            ]

        else:
            permission_classes = [
                IsAttendanceViewer,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    def get_queryset(self):
        """
        Scope attendance records according to
        the authenticated user's role.

        Super Admin / HR:
            Can access all attendance records.

        Manager:
            Can access attendance records for
            employees managed by that manager.

        Employee:
            Can access only their own attendance.

        Unauthenticated / unsupported users:
            No records are returned.
        """

        queryset = Attendance.objects.select_related(
            "employee",
            "employee__user",
            "employee__department",
            "employee__designation",
            "employee__manager",
        ).all()

        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        if user.role in {
            User.Role.SUPER_ADMIN,
            User.Role.HR,
        }:
            return queryset.distinct()

        if user.role == User.Role.MANAGER:
            try:
                manager_employee = user.employee_profile
            except Exception:
                return queryset.none()

            return queryset.filter(
                employee__manager=manager_employee,
            ).distinct()

        if user.role == User.Role.EMPLOYEE:
            try:
                employee = user.employee_profile
            except Exception:
                return queryset.none()

            return queryset.filter(
                employee=employee,
            ).distinct()

        return queryset.none()

    @action(
        detail=False,
        methods=["post"],
        url_path="punch-in",
        parser_classes=[
            MultiPartParser,
            FormParser,
        ],
    )
    def punch_in(self, request):
        """
        Verified employee punch-in.

        Requirements:
            - Authenticated employee
            - Employee profile
            - GPS latitude
            - GPS longitude
            - Optional GPS accuracy
            - Mandatory selfie

        The server controls the attendance date/time.
        """

        user = request.user

        if user.role != User.Role.EMPLOYEE:
            return Response(
                {
                    "detail": (
                        "Only employees can use the "
                        "employee punch-in endpoint."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            employee = user.employee_profile
        except Exception:
            return Response(
                {
                    "detail": (
                        "Employee profile is required "
                        "for punch-in."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AttendancePunchInSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        serializer.is_valid(raise_exception=True)

        current_datetime = timezone.localtime()
        current_date = current_datetime.date()
        current_time = current_datetime.time().replace(
            microsecond=0,
        )

        attendance = Attendance.objects.filter(
            employee=employee,
            date=current_date,
        ).first()

        if attendance is not None:
            if attendance.check_in is not None:
                return Response(
                    {
                        "detail": (
                            "You have already punched in "
                            "for today."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            attendance.check_in = current_time
            attendance.check_in_latitude = (
                serializer.validated_data["latitude"]
            )
            attendance.check_in_longitude = (
                serializer.validated_data["longitude"]
            )
            attendance.check_in_accuracy = (
                serializer.validated_data.get("accuracy")
            )
            attendance.check_in_selfie = (
                serializer.validated_data["selfie"]
            )
            attendance.status = "present"

            remarks = serializer.validated_data.get(
                "remarks",
                "",
            )

            if remarks:
                attendance.remarks = remarks

            attendance.save()

        else:
            attendance = Attendance.objects.create(
                employee=employee,
                date=current_date,
                check_in=current_time,
                check_in_latitude=(
                    serializer.validated_data["latitude"]
                ),
                check_in_longitude=(
                    serializer.validated_data["longitude"]
                ),
                check_in_accuracy=(
                    serializer.validated_data.get("accuracy")
                ),
                check_in_selfie=(
                    serializer.validated_data["selfie"]
                ),
                status="present",
                remarks=serializer.validated_data.get(
                    "remarks",
                    "",
                ),
            )

        response_serializer = AttendanceSerializer(
            attendance,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Punch-in successful. "
                    "Attendance marked present."
                ),
                "attendance": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )