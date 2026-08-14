from django.db.models import Q
from rest_framework import serializers

from apps.employees.models import Employee

from .models import Leave


class LeaveSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        required=False,
    )

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
            "applied_at",
            "updated_at",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        employee = attrs.get(
            "employee",
            getattr(self.instance, "employee", None),
        )

        if request and request.user.is_authenticated:
            if request.user.role == "EMPLOYEE":
                try:
                    employee = request.user.employee_profile
                except Employee.DoesNotExist:
                    raise serializers.ValidationError(
                        {
                            "employee": (
                                "Employee profile does not exist."
                            )
                        }
                    )

                attrs["employee"] = employee

        if employee is None:
            raise serializers.ValidationError(
                {
                    "employee": (
                        "Employee is required."
                    )
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

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "End date cannot be before start date."
                    )
                }
            )

        queryset = Leave.objects.filter(
            employee=employee,
            start_date__lte=end_date,
            end_date__gte=start_date,
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
                        "with an existing leave request "
                        "for this employee."
                    )
                }
            )

        reason = attrs.get(
            "reason",
            getattr(self.instance, "reason", ""),
        )

        if not reason or not reason.strip():
            raise serializers.ValidationError(
                {
                    "reason": "Leave reason cannot be empty."
                }
            )

        attrs["reason"] = reason.strip()

        return attrs