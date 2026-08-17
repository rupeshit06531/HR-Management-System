from django.db import models

from apps.employees.models import Employee


class Payroll(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="payroll_records",
    )

    month = models.DateField()

    basic_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    allowances = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    deductions = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    net_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )

    paid_at = models.DateTimeField(
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
            "-month",
            "-created_at",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "employee",
                    "month",
                ],
                name="payroll_employee_month_unique",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    basic_salary__gte=0,
                ),
                name="payroll_basic_salary_gte_0",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    allowances__gte=0,
                ),
                name="payroll_allowances_gte_0",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    deductions__gte=0,
                ),
                name="payroll_deductions_gte_0",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    net_salary__gte=0,
                ),
                name="payroll_net_salary_gte_0",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(
                        payment_status="pending",
                        paid_at__isnull=True,
                    )
                    | models.Q(
                        payment_status="paid",
                        paid_at__isnull=False,
                    )
                ),
                name="payroll_payment_status_paid_at_consistent",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "employee",
                    "-month",
                ],
                name="payroll_employee_month_idx",
            ),
            models.Index(
                fields=[
                    "payment_status",
                    "-month",
                ],
                name="payroll_status_month_idx",
            ),
            models.Index(
                fields=[
                    "-month",
                ],
                name="payroll_month_idx",
            ),
        ]

    def save(self, *args, **kwargs):
        self.net_salary = (
            self.basic_salary
            + self.allowances
            - self.deductions
        )

        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.employee} - "
            f"{self.month} - "
            f"{self.payment_status}"
        )