"""
Django settings for HR Management System.
"""

import os
from datetime import timedelta
from pathlib import Path


# ============================================================
# BASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================
# ENVIRONMENT
# ============================================================

ENVIRONMENT = os.getenv(
    "DJANGO_ENV",
    "development",
).strip().lower()


DEBUG = os.getenv(
    "DJANGO_DEBUG",
    "True" if ENVIRONMENT == "development" else "False",
).strip().lower() in (
    "true",
    "1",
    "yes",
)


SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "",
).strip()


if not SECRET_KEY:
    if ENVIRONMENT == "production":
        raise RuntimeError(
            "DJANGO_SECRET_KEY must be configured "
            "in production."
        )

    SECRET_KEY = (
        "dev-only-secret-key-change-in-production-"
        "hrms-local-development"
    )


ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "DJANGO_ALLOWED_HOSTS",
        "127.0.0.1,localhost",
    ).split(",")
    if host.strip()
]

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "DJANGO_CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "DJANGO_CSRF_TRUSTED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

# ============================================================
# APPLICATIONS
# ============================================================

INSTALLED_APPS = [
    # Third-party
    "corsheaders",

    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",

    # HRMS applications
    "apps.accounts",
    "apps.employees",
    "apps.departments",
    "apps.attendance",
    "apps.leave",
    "apps.payroll",
    "apps.performance",
    "apps.recruitment",
    "apps.documents",
    "apps.announcements",
    "apps.holidays",
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ============================================================
# URL / APPLICATION CONFIGURATION
# ============================================================

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ============================================================
# DATABASE
# ============================================================

DATABASE_ENGINE = os.getenv(
    "DJANGO_DATABASE_ENGINE",
    "django.db.backends.sqlite3",
).strip()

if DATABASE_ENGINE == "django.db.backends.postgresql":
    DATABASES = {
        "default": {
            "ENGINE": DATABASE_ENGINE,
            "NAME": os.getenv(
                "DJANGO_DATABASE_NAME",
                "",
            ).strip(),
            "USER": os.getenv(
                "DJANGO_DATABASE_USER",
                "",
            ).strip(),
            "PASSWORD": os.getenv(
                "DJANGO_DATABASE_PASSWORD",
                "",
            ),
            "HOST": os.getenv(
                "DJANGO_DATABASE_HOST",
                "localhost",
            ).strip(),
            "PORT": os.getenv(
                "DJANGO_DATABASE_PORT",
                "5432",
            ).strip(),
            "CONN_MAX_AGE": int(
                os.getenv(
                    "DJANGO_DATABASE_CONN_MAX_AGE",
                    "60",
                )
            ),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# ============================================================
# CUSTOM USER MODEL
# ============================================================

AUTH_USER_MODEL = "accounts.User"


# ============================================================
# PASSWORD VALIDATION
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
        "OPTIONS": {
            "min_length": 8,
        },
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# ============================================================
# INTERNATIONALIZATION
# ============================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = os.getenv(
    "DJANGO_TIME_ZONE",
    "Asia/Kolkata",
)

USE_I18N = True

USE_TZ = True


# ============================================================
# STATIC FILES
# ============================================================

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


# ============================================================
# MEDIA FILES
# ============================================================

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# ============================================================
# EMAIL
# ============================================================

EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend",
)

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    "HRMS <noreply@example.com>",
)


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),

    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),

    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),

    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),

    "PAGE_SIZE": 10,

    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
}


# ============================================================
# JWT AUTHENTICATION
# ============================================================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=60,
    ),

    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=1,
    ),

    "ROTATE_REFRESH_TOKENS": True,

    "BLACKLIST_AFTER_ROTATION": True,

    "UPDATE_LAST_LOGIN": True,

    "AUTH_HEADER_TYPES": (
        "Bearer",
    ),
}


# ============================================================
# SECURITY
# ============================================================

SECURE_CONTENT_TYPE_NOSNIFF = True

X_FRAME_OPTIONS = "DENY"

SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"


# Production-only HTTPS security.
# These remain disabled during local development.

if not DEBUG:
    SECURE_SSL_REDIRECT = True

    SESSION_COOKIE_SECURE = True

    CSRF_COOKIE_SECURE = True

    SECURE_HSTS_SECONDS = 31536000

    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

    SECURE_HSTS_PRELOAD = True

# Production security hardening
if ENVIRONMENT == "production":
    SECURE_SSL_REDIRECT = True

    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    SECURE_HSTS_SECONDS = int(
        os.getenv(
            "DJANGO_SECURE_HSTS_SECONDS",
            "31536000",
        )
    )

    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    SECURE_PROXY_SSL_HEADER = (
        "HTTP_X_FORWARDED_PROTO",
        "https",
    )
else:
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# Production environment validation
if ENVIRONMENT == "production":
    if not SECRET_KEY:
        raise RuntimeError(
            "DJANGO_SECRET_KEY must be configured in production."
        )

    if not ALLOWED_HOSTS:
        raise RuntimeError(
            "DJANGO_ALLOWED_HOSTS must be configured in production."
        )

    if DATABASE_ENGINE != "django.db.backends.postgresql":
        raise RuntimeError(
            "Production environment requires PostgreSQL."
        )

# ============================================================
# DEFAULT PRIMARY KEY
# ============================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"