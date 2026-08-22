from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordViewSet,
    ForgotPasswordViewSet,
    LoginViewSet,
    LogoutViewSet,
    MeViewSet,
    ResetPasswordViewSet,
    UserViewSet,
)


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

me_view = MeViewSet.as_view({
    "get": "list",
})

change_password_view = ChangePasswordViewSet.as_view({
    "post": "create",
})

forgot_password_view = ForgotPasswordViewSet.as_view({
    "post": "create",
})

reset_password_view = ResetPasswordViewSet.as_view({
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
    path(
        "me/",
        me_view,
        name="me",
    ),
    path(
        "password/change/",
        change_password_view,
        name="password-change",
    ),
    path(
        "password/forgot/",
        forgot_password_view,
        name="password-forgot",
    ),
    path(
        "password/reset/",
        reset_password_view,
        name="password-reset",
    ),
]