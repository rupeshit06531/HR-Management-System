from rest_framework.pagination import PageNumberPagination


class StandardPageNumberPagination(PageNumberPagination):
    """Shared page-number pagination with a bounded page-size override."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100
