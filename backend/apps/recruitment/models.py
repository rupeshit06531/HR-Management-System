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

    experience_years = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )

    expected_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    offer_date = models.DateField(
        null=True,
        blank=True,
    )

    joining_date = models.DateField(
        null=True,
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
            "-application_date",
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "status",
                    "-application_date",
                ],
                name="recruitment_status_date_idx",
            ),
            models.Index(
                fields=[
                    "department",
                    "-application_date",
                ],
                name="recruitment_dept_date_idx",
            ),
            models.Index(
                fields=[
                    "email",
                ],
                name="recruitment_email_idx",
            ),
            models.Index(
                fields=[
                    "job_title",
                    "-application_date",
                ],
                name="recruitment_job_date_idx",
            ),
        ]

        constraints = [
            models.CheckConstraint(
                condition=~models.Q(first_name=""),
                name="recruitment_first_name_not_empty",
            ),
            models.CheckConstraint(
                condition=~models.Q(email=""),
                name="recruitment_email_not_empty",
            ),
            models.CheckConstraint(
                condition=~models.Q(job_title=""),
                name="recruitment_job_title_not_empty",
            ),
            models.CheckConstraint(
                condition=~models.Q(phone=""),
                name="recruitment_phone_not_empty",
            ),
            models.CheckConstraint(
                condition=models.Q(experience_years__gte=0),
                name="recruitment_experience_gte_0",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(expected_salary__isnull=True)
                    | models.Q(expected_salary__gte=0)
                ),
                name="recruitment_expected_salary_gte_0",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(
                        status="INTERVIEW",
                        interview_date__isnull=False,
                    )
                    | ~models.Q(
                        status="INTERVIEW",
                    )
                ),
                name="recruitment_interview_date_consistent",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(
                        status="SELECTED",
                        offer_date__isnull=False,
                    )
                    | ~models.Q(
                        status="SELECTED",
                    )
                ),
                name="recruitment_offer_date_consistent",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(
                        status="SELECTED",
                        joining_date__isnull=False,
                    )
                    | ~models.Q(
                        status="SELECTED",
                    )
                ),
                name="recruitment_joining_date_consistent",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(
                        status="SELECTED",
                        offer_date__isnull=False,
                    )
                    | ~models.Q(
                        status="SELECTED",
                    )
                ),
                name="recruitment_selected_offer_date_consistent",
            ),
        ]

    def __str__(self):
        return (
            f"{self.first_name} "
            f"{self.last_name} - "
            f"{self.job_title}"
        )