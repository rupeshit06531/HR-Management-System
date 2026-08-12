from rest_framework.routers import DefaultRouter

from .views import CandidateViewSet


router = DefaultRouter()
router.register(
    "recruitment",
    CandidateViewSet,
    basename="recruitment",
)


urlpatterns = router.urls