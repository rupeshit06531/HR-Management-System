from django.urls import path

from .views import AnalyticsView, DashboardView, GlobalSearchView


urlpatterns = [
    path(
        "dashboard/",
        DashboardView.as_view(),
        name="dashboard",
    ),
    path(
        "search/",
        GlobalSearchView.as_view(),
        name="global-search",
    ),
    path(
        "analytics/",
        AnalyticsView.as_view(),
        name="analytics",
    ),
]