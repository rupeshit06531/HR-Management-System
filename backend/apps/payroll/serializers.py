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

    def validate(self, attrs):
        basic_salary = attrs.get("basic_salary")
        allowances = attrs.get("allowances", 0)
        deductions = attrs.get("deductions", 0)

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

        return attrs
