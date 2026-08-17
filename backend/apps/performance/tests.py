
from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.departments.models import Department, Designation
from apps.employees.models import Employee

from .models import PerformanceReview


class PerformanceReviewAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(
            name="Performance Engineering",
            description="Performance test department",
        )

        cls.designation = Designation.objects.create(
            name="Performance Employee",
            department=cls.department,
        )

        cls.super_admin = User.objects.create_user(
            username="performance_admin",
            email="performance_admin@test.com",
            password="TestPass@123",
            first_name="Performance",
            last_name="Admin",
            role=User.Role.SUPER_ADMIN,
        )

        cls.manager_user = User.objects.create_user(
            username="performance_manager",
            email="performance_manager@test.com",
            password="TestPass@123",
            first_name="Performance",
            last_name="Manager",
            role=User.Role.MANAGER,
        )

        cls.hr_user = User.objects.create_user(
            username="performance_hr",
            email="performance_hr@test.com",
            password="TestPass@123",
            first_name="Performance",
            last_name="HR",
            role=User.Role.HR,
        )

        cls.employee_user = User.objects.create_user(
            username="performance_employee",
            email="performance_employee@test.com",
            password="TestPass@123",
            first_name="Performance",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

        cls.employee = Employee.objects.create(
            user=cls.employee_user,
            employee_id="PERF-EMP-001",
            department=cls.department,
            designation=cls.designation,
            joining_date=date(2026, 1, 1),
        )

    def setUp(self):
        self.url = reverse("performance-list")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_unauthenticated_access_is_denied(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_super_admin_can_list_reviews(self):
        self.authenticate(self.super_admin)

        PerformanceReview.objects.create(
            employee=self.employee,
            review_period="Annual Review 2026",
            strengths="Good communication",
            areas_for_improvement="Time management",
            manager_comments="Good overall performance",
            review_date=date(2026, 8, 1),
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

    def test_manager_can_list_reviews(self):
        self.authenticate(self.manager_user)

        PerformanceReview.objects.create(
            employee=self.employee,
            review_period="Annual Review 2026",
            strengths="Good communication",
            areas_for_improvement="Time management",
            manager_comments="Good overall performance",
            review_date=date(2026, 8, 1),
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

    def test_hr_can_list_reviews(self):
        self.authenticate(self.hr_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_manager_can_create_review(self):
        self.authenticate(self.manager_user)

        payload = {
            "employee": self.employee.id,
            "review_period": "Annual Review 2026",
            "strengths": "Strong technical skills",
            "areas_for_improvement": "Documentation",
            "manager_comments": "Good progress",
            "review_date": "2026-08-15",
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
            PerformanceReview.objects.filter(
                employee=self.employee,
                review_period="Annual Review 2026",
            ).exists()
        )

    def test_hr_can_create_review(self):
        self.authenticate(self.hr_user)

        payload = {
            "employee": self.employee.id,
            "review_period": "HR Review 2026",
            "strengths": "Strong technical skills",
            "areas_for_improvement": "Documentation",
            "manager_comments": "Good progress",
            "review_date": "2026-08-15",
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
            PerformanceReview.objects.filter(
                employee=self.employee,
                review_period="HR Review 2026",
            ).exists()
        )

    def test_super_admin_can_create_review(self):
        self.authenticate(self.super_admin)

        payload = {
            "employee": self.employee.id,
            "review_period": "Admin Review 2026",
            "strengths": "Excellent performance",
            "areas_for_improvement": "None",
            "manager_comments": "Approved",
            "review_date": "2026-08-20",
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
            PerformanceReview.objects.filter(
                employee=self.employee,
                review_period="Admin Review 2026",
            ).exists()
        )

    def test_employee_cannot_access_reviews(self):
        self.authenticate(self.employee_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_create_review_with_blank_review_period_is_rejected(self):
        self.authenticate(self.manager_user)

        payload = {
            "employee": self.employee.id,
            "review_period": "   ",
            "strengths": "Good work",
            "areas_for_improvement": "None",
            "manager_comments": "Satisfactory",
            "review_date": "2026-09-01",
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
            "review_period",
            response.data,
        )

    def test_search_by_employee_id(self):
        self.authenticate(self.manager_user)

        PerformanceReview.objects.create(
            employee=self.employee,
            review_period="Annual Review 2026",
            strengths="Leadership",
            review_date=date(2026, 8, 20),
        )

        response = self.client.get(
            self.url,
            {"search": "PERF-EMP-001"},
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
            "PERF-EMP-001",
        )

    def test_search_by_strengths(self):
        self.authenticate(self.manager_user)

        PerformanceReview.objects.create(
            employee=self.employee,
            review_period="Annual Review 2026",
            strengths="Excellent leadership and teamwork",
            review_date=date(2026, 8, 21),
        )

        response = self.client.get(
            self.url,
            {"search": "leadership"},
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
            results[0]["strengths"],
            "Excellent leadership and teamwork",
        )

    def test_filter_by_review_period(self):
        self.authenticate(self.manager_user)

        PerformanceReview.objects.create(
            employee=self.employee,
            review_period="Annual Review 2026",
            review_date=date(2026, 8, 22),
        )

        PerformanceReview.objects.create(
            employee=self.employee,
            review_period="Mid Year Review 2026",
            review_date=date(2026, 6, 22),
        )

        response = self.client.get(
            self.url,
            {"review_period": "Annual Review 2026"},
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
            results[0]["review_period"],
            "Annual Review 2026",
        )

    def test_ordering_by_review_date(self):
        self.authenticate(self.manager_user)

        PerformanceReview.objects.create(
            employee=self.employee,
            review_period="Older Review",
            review_date=date(2026, 5, 1),
        )

        PerformanceReview.objects.create(
            employee=self.employee,
            review_period="Newer Review",
            review_date=date(2026, 8, 1),
        )

        response = self.client.get(
            self.url,
            {"ordering": "review_date"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            results[0]["review_period"],
            "Older Review",
        )

        self.assertEqual(
            results[1]["review_period"],
            "Newer Review",
        )

    def test_employee_name_and_id_are_returned(self):
        self.authenticate(self.manager_user)

        PerformanceReview.objects.create(
            employee=self.employee,
            review_period="Annual Review 2026",
            review_date=date(2026, 8, 25),
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        result = response.data["results"][0]

        self.assertEqual(
            result["employee_id"],
            "PERF-EMP-001",
        )

        self.assertEqual(
            result["employee_name"],
            "Performance Employee",
        )

    def test_duplicate_review_is_rejected(self):
        self.authenticate(self.manager_user)

        PerformanceReview.objects.create(
            employee=self.employee,
            review_period="Annual Review 2026",
            review_date=date(2026, 8, 30),
        )

        payload = {
            "employee": self.employee.id,
            "review_period": "Annual Review 2026",
            "strengths": "Updated strengths",
            "areas_for_improvement": "Updated improvement",
            "manager_comments": "Updated comments",
            "review_date": "2026-08-30",
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
            "review_period" in response.data
            or "non_field_errors" in response.data,
        )