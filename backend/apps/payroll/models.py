from django.db import models
from apps.employees.models import Employee


class Payroll(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="payroll_records"
    )
    month = models.DateField()
    basic_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    allowances = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    deductions = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    net_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("paid", "Paid"),
        ],
        default="pending"
    )
    paid_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.net_salary = (
            self.basic_salary
            + self.allowances
            - self.deductions
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee} - {self.month}"