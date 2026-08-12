from rest_framework import serializers

from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id",
            "user",
            "full_name",
            "employee_id",
            "department",
            "designation",
            "joining_date",
            "employment_type",
            "employment_status",
            "manager",
            "date_of_birth",
            "address",
            "emergency_contact",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "full_name",
            "created_at",
            "updated_at",
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name()

    def validate(self, attrs):
        department = attrs.get(
            "department",
            getattr(self.instance, "department", None),
        )

        designation = attrs.get(
            "designation",
            getattr(self.instance, "designation", None),
        )

        if (
            department
            and designation
            and designation.department_id != department.id
        ):
            raise serializers.ValidationError(
                {
                    "designation": (
                        "Designation must belong to the selected department."
                    )
                }
            )

        return attrs