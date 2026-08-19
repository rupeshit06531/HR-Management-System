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

    def create_holiday(
        self,
        name="Test Holiday",
        holiday_date=date(2026, 8, 15),
        holiday_type=Holiday.HolidayType.COMPANY,
        description="Test holiday",
        is_active=True,
    ):
        return Holiday.objects.create(
            name=name,
            date=holiday_date,
            holiday_type=holiday_type,
            description=description,
            is_active=is_active,
        )

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

    def test_blank_holiday_name_is_rejected(self):
        self.authenticate(self.super_admin)

        payload = {
            "name": "   ",
            "date": "2028-01-01",
            "holiday_type": "NATIONAL",
            "description": "Invalid holiday.",
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

        self.assertIn(
            "name",
            response.data,
        )

    def test_invalid_holiday_type_is_rejected(self):
        self.authenticate(self.super_admin)

        payload = {
            "name": "Invalid Holiday Type",
            "date": "2028-02-01",
            "holiday_type": "INVALID",
            "description": "Invalid holiday type.",
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

        self.assertIn(
            "holiday_type",
            response.data,
        )

    def test_duplicate_holiday_name_is_case_insensitive(self):
        self.authenticate(self.super_admin)

        Holiday.objects.create(
            name="Annual Foundation Day",
            date=date(2028, 3, 15),
            holiday_type="COMPANY",
            is_active=True,
        )

        payload = {
            "name": "annual foundation day",
            "date": "2028-03-15",
            "holiday_type": "COMPANY",
            "description": "Duplicate holiday.",
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

        self.assertTrue(
            "non_field_errors" in response.data
            or "name" in response.data
        )

    def test_description_is_trimmed(self):
        self.authenticate(self.super_admin)

        payload = {
            "name": "Trimmed Description Holiday",
            "date": "2028-04-01",
            "holiday_type": "COMPANY",
            "description": "   Company holiday description   ",
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

        holiday = Holiday.objects.get(
            name="Trimmed Description Holiday",
        )

        self.assertEqual(
            holiday.description,
            "Company holiday description",
        )

    def test_super_admin_can_retrieve_holiday(self):
        self.authenticate(self.super_admin)

        holiday = self.create_holiday(
            name="Retrieve Holiday",
            holiday_date=date(2026, 8, 15),
        )

        response = self.client.get(
            reverse(
                "holiday-detail",
                kwargs={"pk": holiday.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["name"],
            "Retrieve Holiday",
        )

        self.assertEqual(
            response.data["date"],
            "2026-08-15",
        )

    def test_employee_can_retrieve_holiday(self):
        self.authenticate(self.employee_user)

        holiday = self.create_holiday(
            name="Employee Holiday",
            holiday_date=date(2026, 8, 15),
        )

        response = self.client.get(
            reverse(
                "holiday-detail",
                kwargs={"pk": holiday.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["id"],
            holiday.id,
        )

    def test_super_admin_can_update_holiday(self):
        self.authenticate(self.super_admin)

        holiday = self.create_holiday(
            name="Original Holiday",
            holiday_date=date(2026, 8, 15),
        )

        response = self.client.patch(
            reverse(
                "holiday-detail",
                kwargs={"pk": holiday.pk},
            ),
            {
                "name": "Updated Holiday",
                "description": "Updated description",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        holiday.refresh_from_db()

        self.assertEqual(
            holiday.name,
            "Updated Holiday",
        )

        self.assertEqual(
            holiday.description,
            "Updated description",
        )

    def test_hr_cannot_update_holiday(self):
        self.authenticate(self.hr_user)

        holiday = self.create_holiday(
            name="HR Protected Holiday",
            holiday_date=date(2026, 8, 15),
        )

        response = self.client.patch(
            reverse(
                "holiday-detail",
                kwargs={"pk": holiday.pk},
            ),
            {
                "name": "Unauthorized Update",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        holiday.refresh_from_db()

        self.assertEqual(
            holiday.name,
            "HR Protected Holiday",
        )

    def test_manager_cannot_update_holiday(self):
        self.authenticate(self.manager_user)

        holiday = self.create_holiday(
            name="Manager Protected Holiday",
            holiday_date=date(2026, 8, 15),
        )

        response = self.client.patch(
            reverse(
                "holiday-detail",
                kwargs={"pk": holiday.pk},
            ),
            {
                "name": "Unauthorized Manager Update",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        holiday.refresh_from_db()

        self.assertEqual(
            holiday.name,
            "Manager Protected Holiday",
        )

    def test_employee_cannot_update_holiday(self):
        self.authenticate(self.employee_user)

        holiday = self.create_holiday(
            name="Employee Protected Holiday",
            holiday_date=date(2026, 8, 15),
        )

        response = self.client.patch(
            reverse(
                "holiday-detail",
                kwargs={"pk": holiday.pk},
            ),
            {
                "name": "Unauthorized Employee Update",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        holiday.refresh_from_db()

        self.assertEqual(
            holiday.name,
            "Employee Protected Holiday",
        )

    def test_super_admin_can_delete_holiday(self):
        self.authenticate(self.super_admin)

        holiday = self.create_holiday(
            name="Delete Holiday",
            holiday_date=date(2026, 8, 15),
        )

        response = self.client.delete(
            reverse(
                "holiday-detail",
                kwargs={"pk": holiday.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Holiday.objects.filter(
                pk=holiday.pk,
            ).exists()
        )

    def test_hr_cannot_delete_holiday(self):
        self.authenticate(self.hr_user)

        holiday = self.create_holiday(
            name="HR Delete Protected",
            holiday_date=date(2026, 8, 15),
        )

        response = self.client.delete(
            reverse(
                "holiday-detail",
                kwargs={"pk": holiday.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Holiday.objects.filter(
                pk=holiday.pk,
            ).exists()
        )

    def test_manager_cannot_delete_holiday(self):
        self.authenticate(self.manager_user)

        holiday = self.create_holiday(
            name="Manager Delete Protected",
            holiday_date=date(2026, 8, 15),
        )

        response = self.client.delete(
            reverse(
                "holiday-detail",
                kwargs={"pk": holiday.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Holiday.objects.filter(
                pk=holiday.pk,
            ).exists()
        )

    def test_employee_cannot_delete_holiday(self):
        self.authenticate(self.employee_user)

        holiday = self.create_holiday(
            name="Employee Delete Protected",
            holiday_date=date(2026, 8, 15),
        )

        response = self.client.delete(
            reverse(
                "holiday-detail",
                kwargs={"pk": holiday.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Holiday.objects.filter(
                pk=holiday.pk,
            ).exists()
        )

    def test_serializer_returns_expected_fields(self):
        self.authenticate(self.employee_user)

        holiday = self.create_holiday(
            name="Serializer Holiday",
            holiday_date=date(2026, 8, 15),
            holiday_type=Holiday.HolidayType.NATIONAL,
            description="National holiday",
            is_active=True,
        )

        response = self.client.get(
            reverse(
                "holiday-detail",
                kwargs={"pk": holiday.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        expected_fields = {
            "id",
            "name",
            "date",
            "holiday_type",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        }

        self.assertEqual(
            set(response.data.keys()),
            expected_fields,
        )

        self.assertEqual(
            response.data["holiday_type"],
            Holiday.HolidayType.NATIONAL,
        )

        self.assertTrue(
            response.data["is_active"],
        )