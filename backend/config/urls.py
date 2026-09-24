from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from apps.documents.views import deny_public_private_media
from config.health import health_check


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path(
        "media/employee_documents/<path:path>",
        deny_public_private_media,
        name="deny-public-employee-documents",
    ),
    path(
        "media/resumes/<path:path>",
        deny_public_private_media,
        name="deny-public-candidate-resumes",
    ),
    path(
        "media/attendance/selfies/<path:path>",
        deny_public_private_media,
        name="deny-public-attendance-selfies",
    ),

    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.employees.urls")),
    path("api/", include("apps.attendance.urls")),
    path("api/", include("apps.leave.urls")),
    path("api/", include("apps.payroll.urls")),
    path("api/", include("apps.performance.urls")),
    path("api/", include("apps.recruitment.urls")),
    path("api/", include("apps.documents.urls")),
    path("api/", include("apps.announcements.urls")),
    path("api/", include("apps.holidays.urls")),
    path("api/", include("apps.departments.urls")),
    path("api/", include("apps.dashboard.urls")),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
