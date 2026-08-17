from datetime import date
from decimal import Decimal

from django.utils import timezone

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.departments.models import Department, Designation
from apps.employees.models import Employee

from .models import Payroll


class PayrollAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(
            name="Payroll Engineering",
            description="Payroll test department",
        )

        cls.designation = Designation.objects.create(
            name="Payroll Employee",
            department=cls.department,
        )

        cls.super_admin = User.objects.create_user(
            username="payroll_admin",
            email="payroll_admin@test.com",
            password="TestPass@123",
            first_name="Payroll",
            last_name="Admin",
            role=User.Role.SUPER_ADMIN,
        )

        cls.hr_user = User.objects.create_user(
            username="payroll_hr",
            email="payroll_hr@test.com",
            password="TestPass@123",
            first_name="Payroll",
            last_name="HR",
            role=User.Role.HR,
        )

        cls.manager_user = User.objects.create_user(
            username="payroll_manager",
            email="payroll_manager@test.com",
            password="TestPass@123",
            first_name="Payroll",
            last_name="Manager",
            role=User.Role.MANAGER,
        )

        cls.employee_user = User.objects.create_user(
            username="payroll_employee",
            email="payroll_employee@test.com",
            password="TestPass@123",
            first_name="Payroll",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

        cls.employee = Employee.objects.create(
            user=cls.employee_user,
            employee_id="PAY-EMP-001",
            department=cls.department,
            designation=cls.designation,
            joining_date=date(2026, 1, 1),
        )

    def setUp(self):
        self.url = reverse("payroll-list")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_unauthenticated_access_is_denied(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_super_admin_can_list_payroll(self):
        self.authenticate(self.super_admin)

        Payroll.objects.create(
            employee=self.employee,
            month=date(2026, 8, 1),
            basic_salary=Decimal("50000.00"),
            allowances=Decimal("5000.00"),
            deductions=Decimal("2000.00"),
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

    def test_super_admin_can_create_payroll(self):
        self.authenticate(self.super_admin)

        payload = {
            "employee": self.employee.id,
            "month": "2026-09-01",
            "basic_salary": "50000.00",
            "allowances": "5000.00",
            "deductions": "2000.00",
            "payment_status": "pending",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        payroll = Payroll.objects.get(
            employee=self.employee,
            month=date(2026, 9, 1),
        )

        self.assertEqual(
            payroll.net_salary,
            Decimal("53000.00"),
        )

    def test_hr_can_access_payroll(self):
        self.authenticate(self.hr_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_manager_cannot_access_payroll(self):
        self.authenticate(self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_access_payroll(self):
        self.authenticate(self.employee_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_negative_basic_salary_is_rejected(self):
        self.authenticate(self.super_admin)

        payload = {
            "employee": self.employee.id,
            "month": "2026-10-01",
            "basic_salary": "-1000.00",
            "allowances": "500.00",
            "deductions": "100.00",
            "payment_status": "pending",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "basic_salary",
            response.data,
        )

    def test_negative_allowances_are_rejected(self):
        self.authenticate(self.super_admin)

        payload = {
            "employee": self.employee.id,
            "month": "2026-11-01",
            "basic_salary": "50000.00",
            "allowances": "-100.00",
            "deductions": "100.00",
            "payment_status": "pending",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "allowances",
            response.data,
        )

    def test_negative_deductions_are_rejected(self):
        self.authenticate(self.super_admin)

        payload = {
            "employee": self.employee.id,
            "month": "2026-12-01",
            "basic_salary": "50000.00",
            "allowances": "5000.00",
            "deductions": "-100.00",
            "payment_status": "pending",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "deductions",
            response.data,
        )

    def test_gross_salary_is_returned(self):
        self.authenticate(self.super_admin)

        Payroll.objects.create(
            employee=self.employee,
            month=date(2027, 1, 1),
            basic_salary=Decimal("60000.00"),
            allowances=Decimal("10000.00"),
            deductions=Decimal("3000.00"),
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        result = response.data["results"][0]

        self.assertEqual(
            Decimal(result["gross_salary"]),
            Decimal("70000.00"),
        )

        self.assertEqual(
            Decimal(result["net_salary"]),
            Decimal("67000.00"),
        )

    def test_filter_by_payment_status(self):
        self.authenticate(self.super_admin)

        Payroll.objects.create(
            employee=self.employee,
            month=date(2027, 2, 1),
            basic_salary=Decimal("50000.00"),
            payment_status="pending",
        )

        Payroll.objects.create(
            employee=self.employee,
            month=date(2027, 3, 1),
            basic_salary=Decimal("50000.00"),
            payment_status="paid",
            paid_at=timezone.now(),
        )

        response = self.client.get(
            self.url,
            {"payment_status": "paid"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            len(results),
            1,
        )

        self.assertEqual(
            results[0]["payment_status"],
            "paid",
        )

    def test_search_by_employee_id(self):
        self.authenticate(self.super_admin)

        Payroll.objects.create(
            employee=self.employee,
            month=date(2027, 4, 1),
            basic_salary=Decimal("50000.00"),
        )

        response = self.client.get(
            self.url,
            {"search": "PAY-EMP-001"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            len(results),
            1,
        )

        self.assertEqual(
            results[0]["employee_id"],
            "PAY-EMP-001",
        )

    def test_ordering_by_month(self):
        self.authenticate(self.super_admin)

        Payroll.objects.create(
            employee=self.employee,
            month=date(2027, 5, 1),
            basic_salary=Decimal("50000.00"),
        )

        Payroll.objects.create(
            employee=self.employee,
            month=date(2027, 6, 1),
            basic_salary=Decimal("50000.00"),
        )

        response = self.client.get(
            self.url,
            {"ordering": "month"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            results[0]["month"],
            "2027-05-01",
        )

    def test_duplicate_employee_month_is_rejected(self):
        self.authenticate(self.super_admin)

        Payroll.objects.create(
            employee=self.employee,
            month=date(2027, 7, 1),
            basic_salary=Decimal("50000.00"),
            allowances=Decimal("5000.00"),
            deductions=Decimal("2000.00"),
        )

        payload = {
            "employee": self.employee.id,
            "month": "2027-07-01",
            "basic_salary": "55000.00",
            "allowances": "6000.00",
            "deductions": "2500.00",
            "payment_status": "pending",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertTrue(
            "employee" in response.data
            or "month" in response.data
            or "non_field_errors" in response.data,
        )

    def test_pending_payment_rejects_paid_at(self):
        self.authenticate(self.super_admin)

        payload = {
            "employee": self.employee.id,
            "month": "2027-08-01",
            "basic_salary": "50000.00",
            "allowances": "5000.00",
            "deductions": "2000.00",
            "payment_status": "pending",
            "paid_at": "2027-08-31T10:00:00Z",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "paid_at",
            response.data,
        )

    def test_paid_payment_requires_paid_at(self):
        self.authenticate(self.super_admin)

        payload = {
            "employee": self.employee.id,
            "month": "2027-09-01",
            "basic_salary": "50000.00",
            "allowances": "5000.00",
            "deductions": "2000.00",
            "payment_status": "paid",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "paid_at",
            response.data,
        )

    def test_payroll_month_must_be_first_day(self):
        self.authenticate(self.super_admin)

        payload = {
            "employee": self.employee.id,
            "month": "2027-10-15",
            "basic_salary": "50000.00",
            "allowances": "5000.00",
            "deductions": "2000.00",
            "payment_status": "pending",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "month",
            response.data,
        )

    def test_payroll_update_recalculates_net_salary(self):
        self.authenticate(self.super_admin)

        payroll = Payroll.objects.create(
            employee=self.employee,
            month=date(2027, 10, 1),
            basic_salary=Decimal("50000.00"),
            allowances=Decimal("5000.00"),
            deductions=Decimal("2000.00"),
        )

        response = self.client.patch(
            reverse(
                "payroll-detail",
                kwargs={"pk": payroll.id},
            ),
            {
                "basic_salary": "60000.00",
                "allowances": "10000.00",
                "deductions": "5000.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        payroll.refresh_from_db()

        self.assertEqual(
            payroll.net_salary,
            Decimal("65000.00"),
        )

    def test_payroll_cannot_have_negative_net_salary(self):
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            Payroll.objects.create(
                employee=self.employee,
                month=date(2027, 11, 1),
                basic_salary=Decimal("1000.00"),
                allowances=Decimal("0.00"),
                deductions=Decimal("2000.00"),
                net_salary=Decimal("-1000.00"),
            )

    def test_database_rejects_paid_payroll_without_paid_at(self):
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            Payroll.objects.create(
                employee=self.employee,
                month=date(2027, 12, 1),
                basic_salary=Decimal("50000.00"),
                payment_status="paid",
                paid_at=None,
            )

    def test_database_rejects_pending_payroll_with_paid_at(self):
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            Payroll.objects.create(
                employee=self.employee,
                month=date(2028, 1, 1),
                basic_salary=Decimal("50000.00"),
                payment_status="pending",
                paid_at=timezone.now(),
            )