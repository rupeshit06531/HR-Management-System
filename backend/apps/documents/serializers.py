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

        return value

    def validate_document_type(self, value):
        value = value.strip()

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

    def validate_file(self, value):
        if not value:
            raise serializers.ValidationError(
                "Document file is required."
            )

        return value