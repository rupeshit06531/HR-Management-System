from rest_framework import serializers

from apps.accounts.models import User

from .models import Attendance


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

        if check_in is not None and check_out is None:
            raise serializers.ValidationError(
                {
                    "check_out": (
                        "Check-out time is required when check-in "
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