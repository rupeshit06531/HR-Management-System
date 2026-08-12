from rest_framework.routers import DefaultRouter

from .views import DepartmentViewSet, DesignationViewSet


router = DefaultRouter()

router.register(
    "departments",
    DepartmentViewSet,
    basename="department",
)

router.register(
    "designations",
    DesignationViewSet,
    basename="designation",
)


urlpatterns = router.urls