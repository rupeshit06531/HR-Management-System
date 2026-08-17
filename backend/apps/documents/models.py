from django.db import models

from apps.employees.models import Employee


class Document(models.Model):
    class DocumentType(models.TextChoices):
        CONTRACT = "contract", "Contract"
        ID_PROOF = "id_proof", "ID Proof"
        CERTIFICATE = "certificate", "Certificate"
        RESUME = "resume", "Resume"
        OTHER = "other", "Other"

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    title = models.CharField(
        max_length=200,
    )

    document_type = models.CharField(
        max_length=30,
        choices=DocumentType.choices,
        default=DocumentType.OTHER,
    )

    file = models.FileField(
        upload_to="employee_documents/",
    )

    description = models.TextField(
        blank=True,
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-uploaded_at",
        ]

        constraints = [
            models.CheckConstraint(
                condition=~models.Q(title=""),
                name="documents_title_not_empty",
            ),
            models.CheckConstraint(
                condition=~models.Q(document_type=""),
                name="documents_type_not_empty",
            ),
            models.CheckConstraint(
                condition=~models.Q(file=""),
                name="documents_file_not_empty",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "employee",
                    "-uploaded_at",
                ],
                name="documents_employee_date_idx",
            ),
            models.Index(
                fields=[
                    "document_type",
                    "-uploaded_at",
                ],
                name="documents_type_date_idx",
            ),
            models.Index(
                fields=[
                    "-uploaded_at",
                ],
                name="documents_uploaded_idx",
            ),
        ]

    def __str__(self):
        return (
            f"{self.employee} - "
            f"{self.title}"
        )