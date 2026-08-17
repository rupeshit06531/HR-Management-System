from rest_framework import serializers

from .models import PerformanceReview


class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    employee_id = serializers.CharField(
        source="employee.employee_id",
        read_only=True,
    )

    class Meta:
        model = PerformanceReview

        fields = [
            "id",
            "employee",
            "employee_id",
            "employee_name",
            "review_period",
            "strengths",
            "areas_for_improvement",
            "manager_comments",
            "review_date",
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

    def validate_review_period(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Review period cannot be empty."
            )

        return value

    def validate(self, attrs):
        employee = attrs.get(
            "employee",
            getattr(self.instance, "employee", None),
        )

        review_period = attrs.get(
            "review_period",
            getattr(self.instance, "review_period", None),
        )

        review_date = attrs.get(
            "review_date",
            getattr(self.instance, "review_date", None),
        )

        if (
            employee is not None
            and review_period is not None
            and review_date is not None
        ):
            duplicate_queryset = PerformanceReview.objects.filter(
                employee=employee,
                review_period=review_period,
                review_date=review_date,
            )

            if self.instance is not None:
                duplicate_queryset = duplicate_queryset.exclude(
                    pk=self.instance.pk,
                )

            if duplicate_queryset.exists():
                raise serializers.ValidationError(
                    {
                        "review_period": (
                            "A performance review already exists "
                            "for this employee, review period, and "
                            "review date."
                        )
                    }
                )

        return attrs