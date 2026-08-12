from rest_framework.routers import DefaultRouter

from .views import PerformanceReviewViewSet


router = DefaultRouter()
router.register(
    "performance",
    PerformanceReviewViewSet,
    basename="performance",
)


urlpatterns = router.urls