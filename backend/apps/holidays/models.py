
from django.db import models
from django.db.models import Q


class Holiday(models.Model):

    class HolidayType(models.TextChoices):
        NATIONAL = "NATIONAL", "National Holiday"
        FESTIVAL = "FESTIVAL", "Festival Holiday"
        COMPANY = "COMPANY", "Company Holiday"
        OPTIONAL = "OPTIONAL", "Optional Holiday"

    name = models.CharField(
        max_length=150,
    )

    date = models.DateField()

    holiday_type = models.CharField(
        max_length=20,
        choices=HolidayType.choices,
        default=HolidayType.COMPANY,
    )

    description = models.TextField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "date",
            "name",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "name",
                    "date",
                ],
                name="unique_holiday_name_date",
            ),
            models.CheckConstraint(
                condition=~Q(name=""),
                name="holidays_name_not_empty",
            ),
            models.CheckConstraint(
                condition=~Q(holiday_type=""),
                name="holidays_type_not_empty",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "date",
                    "is_active",
                ],
                name="holidays_date_active_idx",
            ),
            models.Index(
                fields=[
                    "holiday_type",
                    "date",
                ],
                name="holidays_type_date_idx",
            ),
            models.Index(
                fields=[
                    "is_active",
                    "date",
                ],
                name="holidays_active_date_idx",
            ),
        ]

    def __str__(self):
        return f"{self.name} - {self.date}"