"""Pagination shared by every list endpoint."""

from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    """Page-number pagination with a client-controlled, capped page size.

    The medicine catalogue holds thousands of rows, so an unbounded page size
    would let one request pull the whole table.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class LargePagination(DefaultPagination):
    """For reference data a client legitimately wants in bulk."""

    page_size = 100
    max_page_size = 500
