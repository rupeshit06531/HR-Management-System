from django.db import models
from django.db.models import Q

from apps.employees.models import Employee


class Attendance(models.Model):
    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late"),
        ("half_day", "Half Day"),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )

    date = models.DateField()

    check_in = models.TimeField(
        null=True,
        blank=True,
    )

    check_out = models.TimeField(
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="present",
    )

    remarks = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-date",
            "-id",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "employee",
                    "date",
                ],
                name="attendance_employee_date_unique",
            ),
            models.CheckConstraint(
                condition=Q(
                    check_in__isnull=True,
                )
                | Q(
                    check_out__isnull=False,
                ),
                name="attendance_checkin_requires_checkout",
            ),
            models.CheckConstraint(
                condition=Q(
                    check_out__isnull=True,
                )
                | Q(
                    check_in__isnull=False,
                ),
                name="attendance_checkout_requires_checkin",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "employee",
                    "-date",
                ],
                name="attendance_employee_date_idx",
            ),
            models.Index(
                fields=[
                    "status",
                    "-date",
                ],
                name="attendance_status_date_idx",
            ),
            models.Index(
                fields=[
                    "date",
                    "employee",
                ],
                name="attendance_date_employee_idx",
            ),
        ]

    def __str__(self):
        return (
            f"{self.employee} - "
            f"{self.date} - "
            f"{self.status}"
        )