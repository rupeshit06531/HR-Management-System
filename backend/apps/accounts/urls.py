from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import LoginViewSet, UserViewSet


router = DefaultRouter()

router.register(
    "users",
    UserViewSet,
    basename="user",
)

login_view = LoginViewSet.as_view({
    "post": "create",
})


urlpatterns = router.urls + [
    path(
        "login/",
        login_view,
        name="login",
    ),
]