from rest_framework import serializers

from apps.accounts.models import User

from .models import Attendance, AttendanceLocationStop


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    employee_id = serializers.CharField(
        source="employee.employee_id",
        read_only=True,
    )

    class Meta:
        model = Attendance

        fields = [
            "id",
            "employee",
            "employee_id",
            "employee_name",
            "date",
            "check_in",
            "check_out",
            "check_in_latitude",
            "check_in_longitude",
            "check_in_accuracy",
            "check_out_latitude",
            "check_out_longitude",
            "check_out_accuracy",
            "check_in_selfie",
            "check_out_selfie",
            "status",
            "remarks",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "employee_id",
            "employee_name",
            "created_at",
            "updated_at",
        ]

    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()

    def validate_employee(self, value):
        request = self.context.get("request")

        if request is None:
            return value

        user = request.user

        if not user.is_authenticated:
            return value

        if user.role == User.Role.MANAGER:
            try:
                manager_employee = user.employee_profile
            except Exception:
                raise serializers.ValidationError(
                    "Manager employee profile is required."
                )

            if value.manager_id != manager_employee.id:
                raise serializers.ValidationError(
                    "Managers can only manage attendance "
                    "for employees assigned to them."
                )

        return value

    def validate(self, attrs):
        check_in = attrs.get(
            "check_in",
            getattr(self.instance, "check_in", None),
        )

        check_out = attrs.get(
            "check_out",
            getattr(self.instance, "check_out", None),
        )

        if check_in is None and check_out is not None:
            raise serializers.ValidationError(
                {
                    "check_in": (
                        "Check-in time is required when check-out "
                        "time is provided."
                    )
                }
            )

        if check_in is not None and check_out is not None:
            if check_out <= check_in:
                raise serializers.ValidationError(
                    {
                        "check_out": (
                            "Check-out time must be after check-in time."
                        )
                    }
                )

        return attrs


class AttendancePunchInSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
    )

    longitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
    )

    accuracy = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    selfie = serializers.ImageField(
        required=True,
        allow_empty_file=False,
    )

    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError(
                "Latitude must be between -90 and 90."
            )

        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError(
                "Longitude must be between -180 and 180."
            )

        return value

    def validate_accuracy(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "GPS accuracy cannot be negative."
            )

        return value

    def validate_selfie(self, value):
        if value.size <= 0:
            raise serializers.ValidationError(
                "Selfie file cannot be empty."
            )

        return value


class AttendancePunchOutSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
    )

    longitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
    )

    accuracy = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    selfie = serializers.ImageField(
        required=True,
        allow_empty_file=False,
    )

    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError(
                "Latitude must be between -90 and 90."
            )

        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError(
                "Longitude must be between -180 and 180."
            )

        return value

    def validate_accuracy(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "GPS accuracy cannot be negative."
            )

        return value

    def validate_selfie(self, value):
        if value.size <= 0:
            raise serializers.ValidationError(
                "Selfie file cannot be empty."
            )

        return value


class AttendanceLocationStopSerializer(
    serializers.ModelSerializer,
):
    employee_name = serializers.SerializerMethodField()

    employee_id = serializers.CharField(
        source="employee.employee_id",
        read_only=True,
    )

    class Meta:
        model = AttendanceLocationStop

        fields = [
            "id",
            "employee",
            "employee_id",
            "employee_name",
            "attendance",
            "latitude",
            "longitude",
            "accuracy",
            "recorded_at",
        ]

        read_only_fields = [
            "id",
            "employee_id",
            "employee_name",
            "recorded_at",
        ]

    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError(
                "Latitude must be between -90 and 90."
            )

        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError(
                "Longitude must be between -180 and 180."
            )

        return value

    def validate_accuracy(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "GPS accuracy cannot be negative."
            )

        return value

    def validate(self, attrs):
        employee = attrs.get("employee")
        attendance = attrs.get("attendance")

        if employee is not None and attendance is not None:
            if attendance.employee_id != employee.id:
                raise serializers.ValidationError(
                    {
                        "employee": (
                            "Employee must match the attendance employee."
                        )
                    }
                )

        return attrs