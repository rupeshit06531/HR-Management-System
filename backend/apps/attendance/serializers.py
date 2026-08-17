from rest_framework import serializers

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

    def validate(self, attrs):
        check_in = attrs.get("check_in")
        check_out = attrs.get("check_out")

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

        if check_in and check_out and check_out <= check_in:
            raise serializers.ValidationError(
                {
                    "check_out": (
                        "Check-out time must be after check-in time."
                    )
                }
            )

        return attrs