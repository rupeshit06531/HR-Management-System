from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from rest_framework.routers import DefaultRouter

from .views import LoginViewSet, LogoutViewSet, UserViewSet


router = DefaultRouter()

router.register(
    "users",
    UserViewSet,
    basename="user",
)

login_view = LoginViewSet.as_view({
    "post": "create",
})

logout_view = LogoutViewSet.as_view({
    "post": "create",
})


urlpatterns = router.urls + [
    path(
        "login/",
        login_view,
        name="login",
    ),
    path(
        "logout/",
        logout_view,
        name="logout",
    ),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),
]