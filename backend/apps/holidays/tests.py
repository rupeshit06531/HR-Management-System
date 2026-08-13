from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User

from .models import Holiday


class HolidayAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.super_admin = User.objects.create_user(
            username="holiday_admin",
            email="holiday_admin@test.com",
            password="TestPass@123",
            first_name="Holiday",
            last_name="Admin",
            role=User.Role.SUPER_ADMIN,
        )

        cls.hr_user = User.objects.create_user(
            username="holiday_hr",
            email="holiday_hr@test.com",
            password="TestPass@123",
            first_name="Holiday",
            last_name="HR",
            role=User.Role.HR,
        )

        cls.manager_user = User.objects.create_user(
            username="holiday_manager",
            email="holiday_manager@test.com",
            password="TestPass@123",
            first_name="Holiday",
            last_name="Manager",
            role=User.Role.MANAGER,
        )

        cls.employee_user = User.objects.create_user(
            username="holiday_employee",
            email="holiday_employee@test.com",
            password="TestPass@123",
            first_name="Holiday",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

    def setUp(self):
        self.url = reverse("holiday-list")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_unauthenticated_access_is_denied(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_employee_can_list_holidays(self):
        self.authenticate(self.employee_user)

        Holiday.objects.create(
            name="Republic Day",
            date=date(2027, 1, 26),
            holiday_type="NATIONAL",
            description="National holiday",
            is_active=True,
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

    def test_manager_can_list_holidays(self):
        self.authenticate(self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_hr_can_list_holidays(self):
        self.authenticate(self.hr_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_super_admin_can_create_holiday(self):
        self.authenticate(self.super_admin)

        payload = {
            "name": "Independence Day",
            "date": "2027-08-15",
            "holiday_type": "NATIONAL",
            "description": "National holiday",
            "is_active": True,
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

        self.assertTrue(
            Holiday.objects.filter(
                name="Independence Day",
                date=date(2027, 8, 15),
            ).exists()
        )

    def test_hr_cannot_create_holiday(self):
        self.authenticate(self.hr_user)

        payload = {
            "name": "HR Created Holiday",
            "date": "2027-09-01",
            "holiday_type": "COMPANY",
            "description": "Permission test",
            "is_active": True,
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_manager_cannot_create_holiday(self):
        self.authenticate(self.manager_user)

        payload = {
            "name": "Manager Created Holiday",
            "date": "2027-09-02",
            "holiday_type": "COMPANY",
            "description": "Permission test",
            "is_active": True,
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_create_holiday(self):
        self.authenticate(self.employee_user)

        payload = {
            "name": "Employee Created Holiday",
            "date": "2027-09-03",
            "holiday_type": "COMPANY",
            "description": "Permission test",
            "is_active": True,
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_duplicate_holiday_name_and_date_is_rejected(self):
        self.authenticate(self.super_admin)

        Holiday.objects.create(
            name="Company Foundation Day",
            date=date(2027, 10, 1),
            holiday_type="COMPANY",
            is_active=True,
        )

        payload = {
            "name": "Company Foundation Day",
            "date": "2027-10-01",
            "holiday_type": "COMPANY",
            "is_active": True,
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

    def test_filter_by_holiday_type(self):
        self.authenticate(self.employee_user)

        Holiday.objects.create(
            name="Diwali",
            date=date(2027, 11, 1),
            holiday_type="FESTIVAL",
            is_active=True,
        )

        Holiday.objects.create(
            name="Company Day",
            date=date(2027, 11, 2),
            holiday_type="COMPANY",
            is_active=True,
        )

        response = self.client.get(
            self.url,
            {"holiday_type": "FESTIVAL"},
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
            results[0]["name"],
            "Diwali",
        )

    def test_filter_by_active_status(self):
        self.authenticate(self.employee_user)

        Holiday.objects.create(
            name="Active Holiday",
            date=date(2027, 12, 1),
            holiday_type="COMPANY",
            is_active=True,
        )

        Holiday.objects.create(
            name="Inactive Holiday",
            date=date(2027, 12, 2),
            holiday_type="COMPANY",
            is_active=False,
        )

        response = self.client.get(
            self.url,
            {"is_active": "true"},
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

        self.assertTrue(
            results[0]["is_active"]
        )

    def test_search_by_name(self):
        self.authenticate(self.employee_user)

        Holiday.objects.create(
            name="Christmas Day",
            date=date(2027, 12, 25),
            holiday_type="FESTIVAL",
            is_active=True,
        )

        response = self.client.get(
            self.url,
            {"search": "Christmas"},
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
            results[0]["name"],
            "Christmas Day",
        )

    def test_ordering_by_date(self):
        self.authenticate(self.employee_user)

        Holiday.objects.create(
            name="Later Holiday",
            date=date(2027, 12, 20),
            holiday_type="COMPANY",
            is_active=True,
        )

        Holiday.objects.create(
            name="Earlier Holiday",
            date=date(2027, 12, 10),
            holiday_type="COMPANY",
            is_active=True,
        )

        response = self.client.get(
            self.url,
            {"ordering": "date"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            results[0]["name"],
            "Earlier Holiday",
        )