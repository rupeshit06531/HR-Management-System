from rest_framework import serializers

from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    user_name = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    department_name = serializers.SerializerMethodField()
    designation_name = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()
    manager_employee_id = serializers.SerializerMethodField()

    employment_type_label = serializers.SerializerMethodField()
    employment_status_label = serializers.SerializerMethodField()

    class Meta:
        model = Employee

        fields = [
            "id",
            "user",
            "full_name",
            "user_name",
            "user_username",
            "user_email",
            "employee_id",
            "department",
            "department_name",
            "designation",
            "designation_name",
            "joining_date",
            "employment_type",
            "employment_type_label",
            "employment_status",
            "employment_status_label",
            "manager",
            "manager_name",
            "manager_employee_id",
            "date_of_birth",
            "address",
            "emergency_contact",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "full_name",
            "user_name",
            "user_username",
            "user_email",
            "department_name",
            "designation_name",
            "manager_name",
            "manager_employee_id",
            "employment_type_label",
            "employment_status_label",
            "created_at",
            "updated_at",
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name()

    def get_user_name(self, obj):
        return obj.user.get_full_name()

    def get_user_username(self, obj):
        return obj.user.username

    def get_user_email(self, obj):
        return obj.user.email

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None

    def get_designation_name(self, obj):
        return obj.designation.name if obj.designation else None

    def get_manager_name(self, obj):
        if not obj.manager:
            return None

        return obj.manager.user.get_full_name()

    def get_manager_employee_id(self, obj):
        if not obj.manager:
            return None

        return obj.manager.employee_id

    def get_employment_type_label(self, obj):
        return obj.get_employment_type_display()

    def get_employment_status_label(self, obj):
        return obj.get_employment_status_display()

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
            getattr(
                self.instance,
                "department",
                None,
            ),
        )

        designation = attrs.get(
            "designation",
            getattr(
                self.instance,
                "designation",
                None,
            ),
        )

        manager = attrs.get(
            "manager",
            getattr(
                self.instance,
                "manager",
                None,
            ),
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
            and manager.pk
            == getattr(
                self.instance,
                "manager_id",
                None,
            )
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