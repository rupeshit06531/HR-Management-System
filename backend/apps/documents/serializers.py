from pathlib import Path
from zipfile import BadZipFile, ZipFile, is_zipfile

from PIL import Image, UnidentifiedImageError
from rest_framework import serializers

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    file = serializers.FileField(
        use_url=False,
    )

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

        if value.name.startswith("."):
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

        extension = Path(value.name).suffix.lower()

        if extension not in allowed_extensions:
            raise serializers.ValidationError(
                "Unsupported document file type."
            )

        value.seek(0)
        header = value.read(8)
        value.seek(0)

        try:
            if extension == ".pdf" and not header.startswith(b"%PDF-"):
                raise serializers.ValidationError(
                    "File contents do not match the PDF extension."
                )

            if extension in {".jpg", ".jpeg", ".png"}:
                image = Image.open(value)
                expected_format = "PNG" if extension == ".png" else "JPEG"
                if image.format != expected_format:
                    raise serializers.ValidationError(
                        "File contents do not match the image extension."
                    )
                image.verify()

            if extension == ".doc" and not header.startswith(
                bytes.fromhex("D0CF11E0A1B11AE1")
            ):
                raise serializers.ValidationError(
                    "File contents do not match the DOC extension."
                )

            if extension == ".docx":
                if not is_zipfile(value):
                    raise serializers.ValidationError(
                        "File contents do not match the DOCX extension."
                    )
                value.seek(0)
                with ZipFile(value) as document:
                    names = set(document.namelist())
                if not {
                    "[Content_Types].xml",
                    "word/document.xml",
                }.issubset(names):
                    raise serializers.ValidationError(
                        "The DOCX file is missing required document content."
                    )

            if extension == ".txt":
                value.seek(0)
                try:
                    value.read().decode("utf-8-sig")
                except UnicodeDecodeError as error:
                    raise serializers.ValidationError(
                        "Text documents must use UTF-8 encoding."
                    ) from error
        except (
            OSError,
            ValueError,
            SyntaxError,
            BadZipFile,
            UnidentifiedImageError,
            Image.DecompressionBombError,
        ) as error:
            raise serializers.ValidationError(
                "The uploaded file is damaged or invalid."
            ) from error
        finally:
            value.seek(0)

        return value
