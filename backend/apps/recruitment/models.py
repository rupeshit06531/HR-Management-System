from django.db import models

from apps.departments.models import Department


class Candidate(models.Model):

    class ApplicationStatus(models.TextChoices):
        APPLIED = "APPLIED", "Applied"
        SCREENING = "SCREENING", "Screening"
        SHORTLISTED = "SHORTLISTED", "Shortlisted"
        INTERVIEW = "INTERVIEW", "Interview"
        SELECTED = "SELECTED", "Selected"
        REJECTED = "REJECTED", "Rejected"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"

    first_name = models.CharField(
        max_length=100,
    )

    last_name = models.CharField(
        max_length=100,
        blank=True,
    )

    email = models.EmailField()

    phone = models.CharField(
        max_length=15,
    )

    job_title = models.CharField(
        max_length=150,
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="candidates",
    )

    resume = models.FileField(
        upload_to="resumes/",
        blank=True,
        null=True,
    )

    application_date = models.DateField(
        auto_now_add=True,
    )

    interview_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.APPLIED,
    )

    interview_notes = models.TextField(
        blank=True,
    )

    hr_notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-application_date", "-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.job_title}"