from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.departments.models import Department

from .models import Candidate


class CandidateAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.hr_user = User.objects.create_user(
            username="recruitment_hr",
            email="recruitment_hr@test.com",
            password="TestPass@123",
            first_name="Recruitment",
            last_name="HR",
            role=User.Role.HR,
        )

        cls.super_admin_user = User.objects.create_user(
            username="recruitment_admin",
            email="recruitment_admin@test.com",
            password="TestPass@123",
            first_name="Recruitment",
            last_name="Admin",
            role=User.Role.SUPER_ADMIN,
        )

        cls.manager_user = User.objects.create_user(
            username="recruitment_manager",
            email="recruitment_manager@test.com",
            password="TestPass@123",
            first_name="Recruitment",
            last_name="Manager",
            role=User.Role.MANAGER,
        )

        cls.department = Department.objects.create(
            name="Recruitment IT",
            description="Recruitment test department",
        )

        cls.candidate = Candidate.objects.create(
            first_name="Amit",
            last_name="Kumar",
            email="amit@test.com",
            phone="9876543210",
            job_title="Software Engineer",
            department=cls.department,
            status=Candidate.ApplicationStatus.APPLIED,
        )

    def setUp(self):
        self.url = reverse("recruitment-list")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_hr_can_list_candidates(self):
        self.authenticate(self.hr_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_hr_can_create_candidate(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Ravi",
            "last_name": "Kumar",
            "email": "ravi@test.com",
            "phone": "9876543211",
            "job_title": "Backend Developer",
            "department": self.department.id,
            "status": "APPLIED",
            "interview_notes": "",
            "hr_notes": "",
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
            Candidate.objects.filter(
                email="ravi@test.com",
            ).exists()
        )

    def test_super_admin_can_access_recruitment(self):
        self.authenticate(self.super_admin_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_manager_cannot_access_recruitment(self):
        self.authenticate(self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_access_is_denied(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_candidate_detail(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            reverse(
                "recruitment-detail",
                kwargs={"pk": self.candidate.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["email"],
            "amit@test.com",
        )

    def test_candidate_update(self):
        self.authenticate(self.hr_user)

        response = self.client.patch(
            reverse(
                "recruitment-detail",
                kwargs={"pk": self.candidate.pk},
            ),
            {
                "status": "SHORTLISTED",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.candidate.refresh_from_db()

        self.assertEqual(
            self.candidate.status,
            Candidate.ApplicationStatus.SHORTLISTED,
        )

    def test_candidate_delete(self):
        self.authenticate(self.hr_user)

        response = self.client.delete(
            reverse(
                "recruitment-detail",
                kwargs={"pk": self.candidate.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Candidate.objects.filter(
                pk=self.candidate.pk,
            ).exists()
        )

    def test_candidate_search_by_name(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"search": "Amit"},
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
            results[0]["first_name"],
            "Amit",
        )

    def test_candidate_search_by_job_title(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"search": "Software Engineer"},
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
            results[0]["job_title"],
            "Software Engineer",
        )

    def test_candidate_filter_by_status(self):
        self.authenticate(self.hr_user)

        Candidate.objects.create(
            first_name="Neha",
            last_name="Sharma",
            email="neha@test.com",
            phone="9876543212",
            job_title="HR Executive",
            department=self.department,
            status=Candidate.ApplicationStatus.SELECTED,
            offer_date="2026-08-25",
            joining_date="2026-09-01",
        )

        response = self.client.get(
            self.url,
            {"status": "SELECTED"},
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
            results[0]["status"],
            "SELECTED",
        )

    def test_candidate_filter_by_department(self):
        self.authenticate(self.hr_user)

        response = self.client.get(
            self.url,
            {"department": self.department.id},
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
            results[0]["department"],
            self.department.id,
        )

    def test_candidate_duplicate_email_allowed(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Another",
            "last_name": "Candidate",
            "email": "amit@test.com",
            "phone": "9876543213",
            "job_title": "QA Engineer",
            "department": self.department.id,
            "status": "APPLIED",
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

    def test_blank_first_name_is_rejected(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "   ",
            "last_name": "Test",
            "email": "blankfirst@test.com",
            "phone": "9876543214",
            "job_title": "Developer",
            "department": self.department.id,
            "status": "APPLIED",
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
            "first_name",
            response.data,
        )

    def test_blank_last_name_is_allowed(self):
        self.authenticate(self.hr_user)

        payload = {
            "first_name": "Single",
            "last_name": "",
            "email": "single@test.com",
            "phone": "9876543215",
            "job_title": "Developer",
            "department": self.department.id,
            "status": "APPLIED",
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

        self.assertEqual(
            response.data["full_name"],
            "Single",
        )