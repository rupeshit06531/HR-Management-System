from django.db import models
from django.db.models import Q

from apps.employees.models import Employee


class Leave(models.Model):
    LEAVE_TYPE_CHOICES = [
        ("casual", "Casual Leave"),
        ("sick", "Sick Leave"),
        ("earned", "Earned Leave"),
        ("unpaid", "Unpaid Leave"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="leave_records",
    )

    leave_type = models.CharField(
        max_length=20,
        choices=LEAVE_TYPE_CHOICES,
    )

    start_date = models.DateField()

    end_date = models.DateField()

    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    applied_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-applied_at"]

        indexes = [
            models.Index(
                fields=["employee", "start_date", "end_date"],
                name="leave_employee_dates_idx",
            ),
            models.Index(
                fields=["status", "start_date"],
                name="leave_status_start_idx",
            ),
            models.Index(
                fields=["leave_type", "start_date"],
                name="leave_type_start_idx",
            ),
        ]

        constraints = [
            models.CheckConstraint(
                condition=Q(end_date__gte=models.F("start_date")),
                name="leave_end_date_gte_start_date",
            ),
        ]

    def __str__(self):
        return (
            f"{self.employee} - "
            f"{self.leave_type} - "
            f"{self.status}"
        )