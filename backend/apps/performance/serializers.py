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

    def validate(self, attrs):
        review_period = attrs.get("review_period")

        if review_period is not None and not review_period.strip():
            raise serializers.ValidationError(
                {
                    "review_period": (
                        "Review period cannot be empty."
                    )
                }
            )

        return attrs
