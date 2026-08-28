from rest_framework import serializers

from apps.accounts.models import User
from apps.employees.models import Employee

from .models import Leave


class LeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Leave

        fields = [
            "id",
            "employee",
            "leave_type",
            "start_date",
            "end_date",
            "reason",
            "status",
            "applied_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "employee",
            "status",
            "applied_at",
            "updated_at",
        ]

    def _get_employee_from_input(self, value):
        if value in (None, ""):
            return None

        try:
            employee = Employee.objects.filter(pk=value).first()

            if employee:
                return employee
        except (TypeError, ValueError):
            pass

        employee = Employee.objects.filter(
            employee_id=str(value)
        ).first()

        if employee:
            return employee

        return None

    def validate(self, attrs):
        request = self.context.get("request")

        user = (
            request.user
            if request and request.user.is_authenticated
            else None
        )

        employee = attrs.get(
            "employee",
            getattr(self.instance, "employee", None),
        )

        # Employee users can only create leave for themselves.
        if (
            user
            and user.role == User.Role.EMPLOYEE
            and self.instance is None
        ):
            try:
                employee = user.employee_profile
            except Employee.DoesNotExist:
                raise serializers.ValidationError(
                    {
                        "employee": "Employee profile does not exist."
                    }
                )

            attrs["employee"] = employee

        # HR and Super Admin can create leave for another employee.
        elif (
            user
            and user.role in {
                User.Role.HR,
                User.Role.SUPER_ADMIN,
            }
            and self.instance is None
        ):
            employee_value = self.initial_data.get("employee")

            if not employee_value:
                raise serializers.ValidationError(
                    {
                        "employee": "Employee is required."
                    }
                )

            employee = self._get_employee_from_input(
                employee_value
            )

            if employee is None:
                raise serializers.ValidationError(
                    {
                        "employee": "Invalid employee."
                    }
                )

            attrs["employee"] = employee

        # Make sure every newly-created leave has an employee.
        if self.instance is None and employee is None:
            raise serializers.ValidationError(
                {
                    "employee": "Employee is required."
                }
            )

        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )

        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        # Leave dates must always form a valid date range.
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "End date cannot be before start date."
                    )
                }
            )

        # Only pending and approved leave requests block
        # another overlapping leave request.
        if employee and start_date and end_date:
            queryset = Leave.objects.filter(
                employee=employee,
                start_date__lte=end_date,
                end_date__gte=start_date,
            ).exclude(
                status="rejected",
            )

            # When updating an existing leave, exclude itself
            # from the overlap check.
            if self.instance is not None:
                queryset = queryset.exclude(
                    pk=self.instance.pk,
                )

            if queryset.exists():
                raise serializers.ValidationError(
                    {
                        "start_date": (
                            "This leave period overlaps "
                            "with an existing pending or "
                            "approved leave request for "
                            "this employee."
                        )
                    }
                )

        reason = attrs.get(
            "reason",
            getattr(self.instance, "reason", ""),
        )

        if not isinstance(reason, str) or not reason.strip():
            raise serializers.ValidationError(
                {
                    "reason": "Leave reason cannot be empty."
                }
            )

        attrs["reason"] = reason.strip()

        return attrs