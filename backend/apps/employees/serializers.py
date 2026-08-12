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

    def validate_employee_id(self, value):
        """
        Normalize employee IDs and prevent duplicates.
        """

        value = value.strip().upper()

        queryset = Employee.objects.filter(
            employee_id__iexact=value,
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "An employee with this employee ID already exists."
            )

        return value

    def validate_user(self, value):
        """
        Ensure one User can have only one Employee profile.
        """

        queryset = Employee.objects.filter(
            user=value,
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "This user is already linked to an employee profile."
            )

        return value

    def validate(self, attrs):
        department = attrs.get(
            "department",
            getattr(self.instance, "department", None),
        )

        designation = attrs.get(
            "designation",
            getattr(self.instance, "designation", None),
        )

        manager = attrs.get(
            "manager",
            getattr(self.instance, "manager", None),
        )

        employment_status = attrs.get(
            "employment_status",
            getattr(
                self.instance,
                "employment_status",
                Employee.EmploymentStatus.ACTIVE,
            ),
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

        if (
            self.instance is not None
            and manager is not None
            and manager.pk == self.instance.pk
        ):
            raise serializers.ValidationError(
                {
                    "manager": (
                        "An employee cannot be their own manager."
                    )
                }
            )

        if manager is not None:
            if manager.employment_status in {
                Employee.EmploymentStatus.INACTIVE,
                Employee.EmploymentStatus.RESIGNED,
                Employee.EmploymentStatus.TERMINATED,
            }:
                raise serializers.ValidationError(
                    {
                        "manager": (
                            "An inactive, resigned, or terminated "
                            "employee cannot be assigned as a manager."
                        )
                    }
                )

        if (
            employment_status
            in {
                Employee.EmploymentStatus.RESIGNED,
                Employee.EmploymentStatus.TERMINATED,
            }
            and manager is not None
            and manager.pk == getattr(self.instance, "manager_id", None)
        ):
            raise serializers.ValidationError(
                {
                    "manager": (
                        "A resigned or terminated employee "
                        "cannot have an active reporting assignment."
                    )
                }
            )

        return attrs