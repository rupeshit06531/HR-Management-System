from django.conf import settings
from django.db import models


class Announcement(models.Model):

    class TargetAudience(models.TextChoices):
        ALL = "ALL", "All Employees"
        MANAGERS = "MANAGERS", "Managers"
        DEPARTMENT = "DEPARTMENT", "Specific Department"

    title = models.CharField(
        max_length=200,
    )

    message = models.TextField()

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="announcements_created",
    )

    target_audience = models.CharField(
        max_length=20,
        choices=TargetAudience.choices,
        default=TargetAudience.ALL,
    )

    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="announcements",
    )

    publish_date = models.DateTimeField()

    expiry_date = models.DateTimeField(
        null=True,
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
        ordering = ["-publish_date", "-created_at"]

    def __str__(self):
        return self.title