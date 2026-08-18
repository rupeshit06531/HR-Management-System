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
                        "employee": (
                            "Employee profile does not exist."
                        )
                    }
                )

            attrs["employee"] = employee

        # HR / Super Admin must provide an employee when creating leave.
        elif (
            user
            and user.role in {
                User.Role.HR,
                User.Role.SUPER_ADMIN,
            }
            and self.instance is None
        ):
            employee_id = self.initial_data.get("employee")

            if not employee_id:
                raise serializers.ValidationError(
                    {
                        "employee": "Employee is required."
                    }
                )

            try:
                employee = Employee.objects.get(
                    pk=employee_id,
                )
            except (
                Employee.DoesNotExist,
                ValueError,
                TypeError,
            ):
                raise serializers.ValidationError(
                    {
                        "employee": "Invalid employee."
                    }
                )

            attrs["employee"] = employee

        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )

        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "End date cannot be before start date."
                    )
                }
            )

        # Only active leave requests should block a new request.
        #
        # Rejected requests must not prevent the employee
        # from applying for the same dates again.
        if employee and start_date and end_date:
            queryset = Leave.objects.filter(
                employee=employee,
                start_date__lte=end_date,
                end_date__gte=start_date,
            ).exclude(
                status="rejected",
            )

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