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

    # Punch-in location
    check_in_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    check_in_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    check_in_accuracy = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="GPS accuracy in meters.",
    )

    # Punch-out location
    check_out_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    check_out_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    check_out_accuracy = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="GPS accuracy in meters.",
    )

    # Punch-in selfie
    check_in_selfie = models.ImageField(
        upload_to="attendance/selfies/%Y/%m/%d/",
        null=True,
        blank=True,
    )

    # Punch-out selfie
    check_out_selfie = models.ImageField(
        upload_to="attendance/selfies/%Y/%m/%d/",
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


class AttendanceLocationStop(models.Model):
    """
    Stores an employee's location stops during the attendance day.

    This model is separate from Attendance because one employee can
    have multiple location records during a single working day.
    """

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="attendance_location_stops",
    )

    attendance = models.ForeignKey(
        Attendance,
        on_delete=models.CASCADE,
        related_name="location_stops",
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
    )

    accuracy = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="GPS accuracy in meters.",
    )

    recorded_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-recorded_at",
            "-id",
        ]

        indexes = [
            models.Index(
                fields=[
                    "employee",
                    "-recorded_at",
                ],
                name="location_employee_time_idx",
            ),
            models.Index(
                fields=[
                    "attendance",
                    "-recorded_at",
                ],
                name="location_attendance_time_idx",
            ),
            models.Index(
                fields=[
                    "recorded_at",
                ],
                name="location_recorded_at_idx",
            ),
        ]

    def __str__(self):
        return (
            f"{self.employee} - "
            f"{self.recorded_at}"
        )