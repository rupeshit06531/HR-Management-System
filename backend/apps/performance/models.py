from django.db import models
from apps.employees.models import Employee


class PerformanceReview(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="performance_records"
    )
    review_period = models.CharField(
        max_length=100,
        default="Annual Review"
    )
    strengths = models.TextField(blank=True)
    areas_for_improvement = models.TextField(blank=True)
    manager_comments = models.TextField(blank=True)
    review_date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee} - {self.review_period}"