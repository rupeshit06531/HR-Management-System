from django.db.models import Q
from rest_framework import serializers

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
        employee = attrs.get(
            "employee",
            getattr(self.instance, "employee", None),
        )

        if employee is None:
            request = self.context.get("request")

            if (
                request
                and request.user.is_authenticated
                and request.user.role == "EMPLOYEE"
            ):
                try:
                    employee = request.user.employee_profile
                except Exception:
                    raise serializers.ValidationError(
                        {
                            "employee": (
                                "Employee profile does not exist."
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

        if employee and start_date and end_date:
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