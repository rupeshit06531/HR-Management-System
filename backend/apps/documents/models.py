from django.db import models
from apps.employees.models import Employee


class Document(models.Model):
    DOCUMENT_TYPES = [
        ("contract", "Contract"),
        ("id_proof", "ID Proof"),
        ("certificate", "Certificate"),
        ("resume", "Resume"),
        ("other", "Other"),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    title = models.CharField(max_length=200)
    document_type = models.CharField(
        max_length=30,
        choices=DOCUMENT_TYPES,
        default="other",
    )
    file = models.FileField(upload_to="employee_documents/")
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee} - {self.title}"