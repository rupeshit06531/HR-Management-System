from django.db import models

from apps.employees.models import Employee


class PerformanceReview(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="performance_records",
    )

    review_period = models.CharField(
        max_length=100,
        default="Annual Review",
    )

    strengths = models.TextField(
        blank=True,
    )

    areas_for_improvement = models.TextField(
        blank=True,
    )

    manager_comments = models.TextField(
        blank=True,
    )

    review_date = models.DateField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-review_date",
            "-created_at",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "employee",
                    "review_period",
                    "review_date",
                ],
                name="performance_employee_period_date_unique",
            ),
            models.CheckConstraint(
                condition=~models.Q(review_period=""),
                name="performance_review_period_not_empty",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "employee",
                    "-review_date",
                ],
                name="performance_employee_date_idx",
            ),
            models.Index(
                fields=[
                    "-review_date",
                ],
                name="performance_review_date_idx",
            ),
        ]

    def __str__(self):
        return (
            f"{self.employee} - "
            f"{self.review_period}"
        )