from decimal import Decimal

from rest_framework import serializers

from .models import Payroll


class PayrollSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    employee_id = serializers.CharField(
        source="employee.employee_id",
        read_only=True,
    )

    gross_salary = serializers.SerializerMethodField()

    class Meta:
        model = Payroll

        fields = [
            "id",
            "employee",
            "employee_id",
            "employee_name",
            "month",
            "basic_salary",
            "allowances",
            "deductions",
            "gross_salary",
            "net_salary",
            "payment_status",
            "paid_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "employee_id",
            "employee_name",
            "gross_salary",
            "net_salary",
            "created_at",
            "updated_at",
        ]

    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()

    def get_gross_salary(self, obj):
        return (
            Decimal(obj.basic_salary)
            + Decimal(obj.allowances)
        )

    def validate_month(self, value):
        if value.day != 1:
            raise serializers.ValidationError(
                "Payroll month must be the first day of the month."
            )

        return value

    def validate(self, attrs):
        employee = attrs.get(
            "employee",
            getattr(self.instance, "employee", None),
        )

        month = attrs.get(
            "month",
            getattr(self.instance, "month", None),
        )

        basic_salary = attrs.get(
            "basic_salary",
            getattr(self.instance, "basic_salary", None),
        )

        allowances = attrs.get(
            "allowances",
            getattr(
                self.instance,
                "allowances",
                Decimal("0"),
            ),
        )

        deductions = attrs.get(
            "deductions",
            getattr(
                self.instance,
                "deductions",
                Decimal("0"),
            ),
        )

        payment_status = attrs.get(
            "payment_status",
            getattr(
                self.instance,
                "payment_status",
                Payroll.PaymentStatus.PENDING,
            ),
        )

        paid_at = attrs.get(
            "paid_at",
            getattr(
                self.instance,
                "paid_at",
                None,
            ),
        )

        if (
            self.instance is not None
            and self.instance.payment_status
            == Payroll.PaymentStatus.PAID
            and payment_status
            == Payroll.PaymentStatus.PENDING
        ):
            raise serializers.ValidationError(
                {
                    "payment_status": (
                        "A paid payroll cannot be changed "
                        "back to pending."
                    )
                }
            )

        if (
            self.instance is not None
            and self.instance.payment_status
            == Payroll.PaymentStatus.PAID
            and "paid_at" in attrs
            and paid_at != self.instance.paid_at
        ):
            raise serializers.ValidationError(
                {
                    "paid_at": (
                        "The payment date of a paid payroll "
                        "cannot be changed."
                    )
                }
            )

        if basic_salary is not None and basic_salary < 0:
            raise serializers.ValidationError(
                {
                    "basic_salary": (
                        "Basic salary cannot be negative."
                    )
                }
            )

        if allowances < 0:
            raise serializers.ValidationError(
                {
                    "allowances": (
                        "Allowances cannot be negative."
                    )
                }
            )

        if deductions < 0:
            raise serializers.ValidationError(
                {
                    "deductions": (
                        "Deductions cannot be negative."
                    )
                }
            )

        if basic_salary is not None:
            gross_salary = (
                basic_salary + allowances
            )

            net_salary = (
                gross_salary - deductions
            )

            if net_salary < 0:
                raise serializers.ValidationError(
                    {
                        "deductions": (
                            "Deductions cannot exceed "
                            "gross salary."
                        )
                    }
                )

        if payment_status == Payroll.PaymentStatus.PENDING:
            if paid_at is not None:
                raise serializers.ValidationError(
                    {
                        "paid_at": (
                            "Paid at must be empty when "
                            "payment status is pending."
                        )
                    }
                )

        elif payment_status == Payroll.PaymentStatus.PAID:
            if paid_at is None:
                raise serializers.ValidationError(
                    {
                        "paid_at": (
                            "Paid at is required when "
                            "payment status is paid."
                        )
                    }
                )

        if employee is not None and month is not None:
            duplicate_queryset = Payroll.objects.filter(
                employee=employee,
                month=month,
            )

            if self.instance is not None:
                duplicate_queryset = duplicate_queryset.exclude(
                    pk=self.instance.pk,
                )

            if duplicate_queryset.exists():
                raise serializers.ValidationError(
                    {
                        "month": (
                            "Payroll already exists for this "
                            "employee and month."
                        )
                    }
                )

        return attrs