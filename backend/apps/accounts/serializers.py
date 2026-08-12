from django.contrib.auth import get_user_model

from rest_framework import serializers


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Secure serializer for HRMS user management.

    Authentication data belongs to User while
    employee-specific HR information belongs to Employee.
    """

    class Meta:
        model = User

        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "profile_image",
            "is_active",
            "date_joined",
        )

        read_only_fields = (
            "id",
            "date_joined",
        )

    def validate_email(self, value):
        """
        Normalize email addresses and prevent duplicates.
        """

        value = value.strip().lower()

        queryset = User.objects.filter(
            email__iexact=value,
        )

        instance = self.instance

        if instance is not None:
            queryset = queryset.exclude(
                pk=instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value

    def validate_username(self, value):
        """
        Prevent duplicate usernames while allowing
        the current user to retain their username.
        """

        value = value.strip()

        queryset = User.objects.filter(
            username__iexact=value,
        )

        instance = self.instance

        if instance is not None:
            queryset = queryset.exclude(
                pk=instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "A user with this username already exists."
            )

        return value

    def validate_role(self, value):
        """
        Only a Super Admin can assign the Super Admin role.
        """

        request = self.context.get("request")

        if (
            request
            and request.user.is_authenticated
            and value == User.Role.SUPER_ADMIN
            and request.user.role != User.Role.SUPER_ADMIN
        ):
            raise serializers.ValidationError(
                "Only a Super Admin can assign the Super Admin role."
            )

        return value

    def validate_is_active(self, value):
        """
        Prevent an administrator from deactivating
        their own account.
        """

        request = self.context.get("request")

        if (
            request
            and request.user.is_authenticated
            and self.instance is not None
            and self.instance.pk == request.user.pk
            and value is False
        ):
            raise serializers.ValidationError(
                "You cannot deactivate your own account."
            )

        return value

    def validate_profile_image(self, value):
        """
        Validate profile image size and MIME type.
        """

        max_size = 2 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "Profile image size cannot exceed 2 MB."
            )

        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }

        content_type = getattr(
            value,
            "content_type",
            None,
        )

        if content_type not in allowed_types:
            raise serializers.ValidationError(
                "Only JPG, PNG and WEBP images are allowed."
            )

        return value