from django.conf import settings
from django.db import models
from django.db.models import Q


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
        ordering = [
            "-publish_date",
            "-created_at",
        ]

        constraints = [
            models.CheckConstraint(
                condition=~Q(title=""),
                name="announcements_title_not_empty",
            ),
            models.CheckConstraint(
                condition=~Q(message=""),
                name="announcements_message_not_empty",
            ),
            models.CheckConstraint(
                condition=(
                    Q(expiry_date__isnull=True)
                    | Q(expiry_date__gt=models.F("publish_date"))
                ),
                name="announcements_expiry_after_publish",
            ),
            models.CheckConstraint(
                condition=(
                    ~Q(target_audience="DEPARTMENT")
                    | Q(department__isnull=False)
                ),
                name="announcements_department_required",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "target_audience",
                    "-publish_date",
                ],
                name="ann_audience_date_idx",
            ),
            models.Index(
                fields=[
                    "department",
                    "-publish_date",
                ],
                name="ann_department_date_idx",
            ),
            models.Index(
                fields=[
                    "is_active",
                    "-publish_date",
                ],
                name="announcements_active_date_idx",
            ),
            models.Index(
                fields=[
                    "-publish_date",
                    "-created_at",
                ],
                name="announcements_publish_date_idx",
            ),
        ]

    def __str__(self):
        return self.title


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        SYSTEM = "SYSTEM", "System"
        ANNOUNCEMENT = "ANNOUNCEMENT", "Announcement"
        LEAVE = "LEAVE", "Leave"
        ATTENDANCE = "ATTENDANCE", "Attendance"
        PAYROLL = "PAYROLL", "Payroll"
        PERFORMANCE = "PERFORMANCE", "Performance"
        RECRUITMENT = "RECRUITMENT", "Recruitment"
        DOCUMENT = "DOCUMENT", "Document"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    title = models.CharField(
        max_length=200,
    )

    message = models.TextField()

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )

    is_read = models.BooleanField(
        default=False,
    )

    action_url = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-created_at",
            "-id",
        ]

        indexes = [
            models.Index(
                fields=[
                    "recipient",
                    "is_read",
                    "-created_at",
                ],
                name="notif_recipient_read_idx",
            ),
            models.Index(
                fields=[
                    "recipient",
                    "-created_at",
                ],
                name="notif_recipient_date_idx",
            ),
            models.Index(
                fields=[
                    "notification_type",
                    "-created_at",
                ],
                name="notif_type_date_idx",
            ),
        ]

        constraints = [
            models.CheckConstraint(
                condition=~Q(title=""),
                name="notifications_title_not_empty",
            ),
            models.CheckConstraint(
                condition=~Q(message=""),
                name="notifications_message_not_empty",
            ),
        ]

    def __str__(self):
        return self.title