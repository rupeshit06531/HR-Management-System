from pathlib import Path

from rest_framework import serializers

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Document

        fields = [
            "id",
            "employee",
            "employee_name",
            "title",
            "document_type",
            "file",
            "description",
            "uploaded_at",
        ]

        read_only_fields = [
            "id",
            "employee_name",
            "uploaded_at",
        ]

    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()

    def validate_title(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Document title cannot be empty."
            )

        if len(value) > 200:
            raise serializers.ValidationError(
                "Document title cannot exceed 200 characters."
            )

        return value

    def validate_document_type(self, value):
        value = value.strip().lower()

        if not value:
            raise serializers.ValidationError(
                "Document type cannot be empty."
            )

        valid_types = {
            choice[0]
            for choice in Document.DocumentType.choices
        }

        if value not in valid_types:
            raise serializers.ValidationError(
                "Invalid document type."
            )

        return value

    def validate_description(self, value):
        return value.strip()

    def validate_file(self, value):
        if not value:
            raise serializers.ValidationError(
                "Document file is required."
            )

        if value.size <= 0:
            raise serializers.ValidationError(
                "Document file cannot be empty."
            )

        max_file_size = 10 * 1024 * 1024

        if value.size > max_file_size:
            raise serializers.ValidationError(
                "Document file cannot exceed 10 MB."
            )

        filename = Path(value.name).name

        if filename != value.name:
            raise serializers.ValidationError(
                "Invalid document filename."
            )

        if not filename.strip():
            raise serializers.ValidationError(
                "Document filename cannot be empty."
            )

        if filename.startswith("."):
            raise serializers.ValidationError(
                "Hidden document files are not allowed."
            )

        allowed_extensions = {
            ".pdf",
            ".doc",
            ".docx",
            ".txt",
            ".jpg",
            ".jpeg",
            ".png",
        }

        extension = Path(filename).suffix.lower()

        if extension not in allowed_extensions:
            raise serializers.ValidationError(
                "Unsupported document file type."
            )

        return value