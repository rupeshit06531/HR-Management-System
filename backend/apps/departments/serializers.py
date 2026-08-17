from rest_framework import serializers

from .models import Department, Designation


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department

        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Department name cannot be empty."
            )

        if len(value) > 100:
            raise serializers.ValidationError(
                "Department name cannot exceed 100 characters."
            )

        duplicate_queryset = Department.objects.filter(
            name__iexact=value,
        )

        if self.instance is not None:
            duplicate_queryset = duplicate_queryset.exclude(
                pk=self.instance.pk,
            )

        if duplicate_queryset.exists():
            raise serializers.ValidationError(
                "A department with this name already exists."
            )

        return value

    def validate_description(self, value):
        return value.strip()


class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
    )

    class Meta:
        model = Designation

        fields = [
            "id",
            "name",
            "department",
            "department_name",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "department_name",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Designation name cannot be empty."
            )

        if len(value) > 100:
            raise serializers.ValidationError(
                "Designation name cannot exceed 100 characters."
            )

        duplicate_queryset = Designation.objects.filter(
            name__iexact=value,
        )

        if self.instance is not None:
            duplicate_queryset = duplicate_queryset.exclude(
                pk=self.instance.pk,
            )

        if duplicate_queryset.exists():
            raise serializers.ValidationError(
                "A designation with this name already exists."
            )

        return value