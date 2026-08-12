from django.db import models


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
        ordering = ["date"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "date"],
                name="unique_holiday_name_date",
            )
        ]

    def __str__(self):
        return f"{self.name} - {self.date}"