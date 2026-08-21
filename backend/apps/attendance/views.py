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

from .models import Attendance, AttendanceLocationStop
from .serializers import (
    AttendanceLocationStopSerializer,
    AttendancePunchInSerializer,
    AttendancePunchOutSerializer,
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
        if self.action in {
            "punch_in",
            "punch_out",
            "record_location",
        }:
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

    def _get_employee_profile(self, user):
        try:
            return user.employee_profile
        except Exception:
            return None

    def _get_current_attendance(self, employee):
        current_date = timezone.localtime().date()

        return Attendance.objects.filter(
            employee=employee,
            date=current_date,
        ).first()

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

        employee = self._get_employee_profile(user)

        if employee is None:
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
                serializer.validated_data.get(
                    "accuracy"
                )
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
                    serializer.validated_data.get(
                        "accuracy"
                    )
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

        AttendanceLocationStop.objects.create(
            employee=employee,
            attendance=attendance,
            latitude=serializer.validated_data[
                "latitude"
            ],
            longitude=serializer.validated_data[
                "longitude"
            ],
            accuracy=serializer.validated_data.get(
                "accuracy"
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

    @action(
        detail=False,
        methods=["post"],
        url_path="punch-out",
        parser_classes=[
            MultiPartParser,
            FormParser,
        ],
    )
    def punch_out(self, request):
        user = request.user

        if user.role != User.Role.EMPLOYEE:
            return Response(
                {
                    "detail": (
                        "Only employees can use the "
                        "employee punch-out endpoint."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        employee = self._get_employee_profile(user)

        if employee is None:
            return Response(
                {
                    "detail": (
                        "Employee profile is required "
                        "for punch-out."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AttendancePunchOutSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        serializer.is_valid(raise_exception=True)

        attendance = self._get_current_attendance(
            employee
        )

        if attendance is None:
            return Response(
                {
                    "detail": (
                        "You must punch in before "
                        "punching out."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if attendance.check_in is None:
            return Response(
                {
                    "detail": (
                        "You must punch in before "
                        "punching out."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if attendance.check_out is not None:
            return Response(
                {
                    "detail": (
                        "You have already punched out "
                        "for today."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_datetime = timezone.localtime()
        current_time = current_datetime.time().replace(
            microsecond=0,
        )

        attendance.check_out = current_time

        attendance.check_out_latitude = (
            serializer.validated_data["latitude"]
        )

        attendance.check_out_longitude = (
            serializer.validated_data["longitude"]
        )

        attendance.check_out_accuracy = (
            serializer.validated_data.get(
                "accuracy"
            )
        )

        attendance.check_out_selfie = (
            serializer.validated_data["selfie"]
        )

        remarks = serializer.validated_data.get(
            "remarks",
            "",
        )

        if remarks:
            attendance.remarks = remarks

        attendance.save()

        AttendanceLocationStop.objects.create(
            employee=employee,
            attendance=attendance,
            latitude=serializer.validated_data[
                "latitude"
            ],
            longitude=serializer.validated_data[
                "longitude"
            ],
            accuracy=serializer.validated_data.get(
                "accuracy"
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
                    "Punch-out successful. "
                    "Attendance completed."
                ),
                "attendance": response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="location",
    )
    def record_location(self, request):
        user = request.user

        if user.role != User.Role.EMPLOYEE:
            return Response(
                {
                    "detail": (
                        "Only employees can record "
                        "attendance locations."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        employee = self._get_employee_profile(user)

        if employee is None:
            return Response(
                {
                    "detail": (
                        "Employee profile is required "
                        "for location tracking."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        attendance = self._get_current_attendance(
            employee
        )

        if attendance is None:
            return Response(
                {
                    "detail": (
                        "You must punch in before "
                        "location tracking can start."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if attendance.check_in is None:
            return Response(
                {
                    "detail": (
                        "You must punch in before "
                        "location tracking can start."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if attendance.check_out is not None:
            return Response(
                {
                    "detail": (
                        "Location tracking has ended "
                        "because you have punched out."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AttendanceLocationStopSerializer(
            data={
                "employee": employee.id,
                "attendance": attendance.id,
                "latitude": request.data.get(
                    "latitude"
                ),
                "longitude": request.data.get(
                    "longitude"
                ),
                "accuracy": request.data.get(
                    "accuracy"
                ),
            },
            context={
                "request": request,
            },
        )

        serializer.is_valid(raise_exception=True)

        location_stop = serializer.save()

        return Response(
            AttendanceLocationStopSerializer(
                location_stop,
                context={
                    "request": request,
                },
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="locations",
    )
    def locations(self, request):
        user = request.user

        queryset = AttendanceLocationStop.objects.select_related(
            "employee",
            "employee__user",
            "attendance",
        ).all()

        if user.role in {
            User.Role.SUPER_ADMIN,
            User.Role.HR,
        }:
            pass

        elif user.role == User.Role.MANAGER:
            try:
                manager_employee = user.employee_profile
            except Exception:
                queryset = queryset.none()
            else:
                queryset = queryset.filter(
                    employee__manager=manager_employee,
                )

        elif user.role == User.Role.EMPLOYEE:
            employee = self._get_employee_profile(user)

            if employee is None:
                queryset = queryset.none()
            else:
                queryset = queryset.filter(
                    employee=employee,
                )

        else:
            queryset = queryset.none()

        queryset = queryset.order_by(
            "-recorded_at",
            "-id",
        )

        serializer = AttendanceLocationStopSerializer(
            queryset,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )