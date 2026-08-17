from datetime import date

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.departments.models import Department, Designation
from apps.employees.models import Employee

from .models import Document


class DocumentAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(
            name="Documents Engineering",
            description="Documents test department",
        )

        cls.other_department = Department.objects.create(
            name="Documents Finance",
            description="Documents second test department",
        )

        cls.designation = Designation.objects.create(
            name="Documents Employee",
            department=cls.department,
        )

        cls.other_designation = Designation.objects.create(
            name="Documents Finance Employee",
            department=cls.other_department,
        )

        cls.super_admin = User.objects.create_user(
            username="documents_admin",
            email="documents_admin@test.com",
            password="TestPass@123",
            first_name="Documents",
            last_name="Admin",
            role=User.Role.SUPER_ADMIN,
        )

        cls.hr_user = User.objects.create_user(
            username="documents_hr",
            email="documents_hr@test.com",
            password="TestPass@123",
            first_name="Documents",
            last_name="HR",
            role=User.Role.HR,
        )

        cls.manager_user = User.objects.create_user(
            username="documents_manager",
            email="documents_manager@test.com",
            password="TestPass@123",
            first_name="Documents",
            last_name="Manager",
            role=User.Role.MANAGER,
        )

        cls.employee_user = User.objects.create_user(
            username="documents_employee",
            email="documents_employee@test.com",
            password="TestPass@123",
            first_name="Documents",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

        cls.other_employee_user = User.objects.create_user(
            username="documents_other_employee",
            email="documents_other_employee@test.com",
            password="TestPass@123",
            first_name="Other",
            last_name="Employee",
            role=User.Role.EMPLOYEE,
        )

        cls.employee = Employee.objects.create(
            user=cls.employee_user,
            employee_id="DOC-EMP-001",
            department=cls.department,
            designation=cls.designation,
            joining_date=date(2026, 1, 1),
        )

        cls.other_employee = Employee.objects.create(
            user=cls.other_employee_user,
            employee_id="DOC-EMP-002",
            department=cls.other_department,
            designation=cls.other_designation,
            joining_date=date(2026, 1, 1),
        )

    def setUp(self):
        self.url = reverse("documents-list")

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def create_file(self, name="contract.txt"):
        return SimpleUploadedFile(
            name,
            b"Employee document test content.",
            content_type="text/plain",
        )

    def create_document(
        self,
        title="Employment Contract",
        document_type="contract",
        employee=None,
    ):
        return Document.objects.create(
            employee=employee or self.employee,
            title=title,
            document_type=document_type,
            file=self.create_file(),
            description="Test employee document.",
        )

    def test_unauthenticated_access_is_denied(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_super_admin_can_list_documents(self):
        self.authenticate(self.super_admin)

        self.create_document()

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

    def test_hr_can_list_documents(self):
        self.authenticate(self.hr_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_manager_cannot_access_documents(self):
        self.authenticate(self.manager_user)

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_can_list_own_documents(self):
        self.authenticate(self.employee_user)

        self.create_document()

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

        self.assertEqual(
            response.data["results"][0]["employee"],
            self.employee.id,
        )

    def test_employee_cannot_see_other_employee_documents(self):
        self.authenticate(self.employee_user)

        self.create_document(
            title="Own Document",
            employee=self.employee,
        )

        self.create_document(
            title="Other Employee Document",
            employee=self.other_employee,
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

        self.assertEqual(
            response.data["results"][0]["employee"],
            self.employee.id,
        )

    def test_employee_can_retrieve_own_document(self):
        self.authenticate(self.employee_user)

        document = self.create_document()

        response = self.client.get(
            reverse(
                "documents-detail",
                kwargs={"pk": document.id},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["id"],
            document.id,
        )

    def test_employee_cannot_retrieve_other_employee_document(self):
        self.authenticate(self.employee_user)

        document = self.create_document(
            employee=self.other_employee,
        )

        response = self.client.get(
            reverse(
                "documents-detail",
                kwargs={"pk": document.id},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_employee_cannot_create_document(self):
        self.authenticate(self.employee_user)

        payload = {
            "employee": self.employee.id,
            "title": "Employee Uploaded Document",
            "document_type": "other",
            "description": "Employee should not upload documents.",
            "file": self.create_file("employee-upload.txt"),
        }

        response = self.client.post(
            self.url,
            payload,
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_update_document(self):
        self.authenticate(self.employee_user)

        document = self.create_document()

        payload = {
            "title": "Updated Employee Document",
        }

        response = self.client.patch(
            reverse(
                "documents-detail",
                kwargs={"pk": document.id},
            ),
            payload,
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_delete_document(self):
        self.authenticate(self.employee_user)

        document = self.create_document()

        response = self.client.delete(
            reverse(
                "documents-detail",
                kwargs={"pk": document.id},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_super_admin_can_create_document(self):
        self.authenticate(self.super_admin)

        payload = {
            "employee": self.employee.id,
            "title": "Joining Certificate",
            "document_type": "certificate",
            "description": "Joining certificate document.",
            "file": self.create_file("joining.txt"),
        }

        response = self.client.post(
            self.url,
            payload,
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            Document.objects.filter(
                employee=self.employee,
                title="Joining Certificate",
            ).exists()
        )

    def test_hr_can_create_document(self):
        self.authenticate(self.hr_user)

        payload = {
            "employee": self.employee.id,
            "title": "Identity Proof",
            "document_type": "id_proof",
            "description": "Identity proof document.",
            "file": self.create_file("id-proof.txt"),
        }

        response = self.client.post(
            self.url,
            payload,
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_create_document_with_blank_title_is_rejected(self):
        self.authenticate(self.hr_user)

        payload = {
            "employee": self.employee.id,
            "title": "   ",
            "document_type": "contract",
            "description": "Invalid document.",
            "file": self.create_file("blank-title.txt"),
        }

        response = self.client.post(
            self.url,
            payload,
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "title",
            response.data,
        )

    def test_create_document_without_file_is_rejected(self):
        self.authenticate(self.hr_user)

        payload = {
            "employee": self.employee.id,
            "title": "Missing File Document",
            "document_type": "other",
            "description": "Document without file.",
        }

        response = self.client.post(
            self.url,
            payload,
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "file",
            response.data,
        )

    def test_create_document_with_invalid_document_type_is_rejected(self):
        self.authenticate(self.hr_user)

        payload = {
            "employee": self.employee.id,
            "title": "Invalid Type Document",
            "document_type": "invalid_type",
            "description": "Invalid document type.",
            "file": self.create_file("invalid-type.txt"),
        }

        response = self.client.post(
            self.url,
            payload,
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "document_type",
            response.data,
        )

    def test_document_title_is_trimmed(self):
        self.authenticate(self.hr_user)

        payload = {
            "employee": self.employee.id,
            "title": "   Trimmed Contract   ",
            "document_type": "contract",
            "description": "Document title normalization test.",
            "file": self.create_file("trimmed.txt"),
        }

        response = self.client.post(
            self.url,
            payload,
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        document = Document.objects.get(
            employee=self.employee,
        )

        self.assertEqual(
            document.title,
            "Trimmed Contract",
        )

    def test_search_by_employee_id(self):
        self.authenticate(self.hr_user)

        self.create_document(
            title="Employee Contract",
        )

        response = self.client.get(
            self.url,
            {"search": "DOC-EMP-001"},
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
            results[0]["employee"],
            self.employee.id,
        )

    def test_search_by_department_name(self):
        self.authenticate(self.hr_user)

        self.create_document()

        response = self.client.get(
            self.url,
            {"search": "Documents Engineering"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data["results"]),
            1,
        )

    def test_filter_by_document_type(self):
        self.authenticate(self.hr_user)

        self.create_document(
            title="Employment Contract",
            document_type="contract",
        )

        self.create_document(
            title="Employee Certificate",
            document_type="certificate",
        )

        response = self.client.get(
            self.url,
            {"document_type": "contract"},
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
            results[0]["document_type"],
            "contract",
        )

    def test_employee_name_is_returned(self):
        self.authenticate(self.hr_user)

        self.create_document()

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        result = response.data["results"][0]

        self.assertEqual(
            result["employee_name"],
            "Documents Employee",
        )

    def test_documents_are_ordered_by_uploaded_at_descending(self):
        self.authenticate(self.hr_user)

        older = self.create_document(
            title="Older Document",
        )

        newer = self.create_document(
            title="Newer Document",
        )

        Document.objects.filter(pk=older.pk).update(
            uploaded_at=older.uploaded_at.replace(
                year=2026,
                month=1,
                day=1,
            )
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data["results"]

        self.assertEqual(
            results[0]["title"],
            newer.title,
        )

    def test_serializer_returns_expected_fields(self):
        self.authenticate(self.hr_user)

        self.create_document()

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        result = response.data["results"][0]

        expected_fields = {
            "id",
            "employee",
            "employee_name",
            "title",
            "document_type",
            "file",
            "description",
            "uploaded_at",
        }

        self.assertEqual(
            set(result.keys()),
            expected_fields,
        )