"""Standard response envelope shared by every endpoint.

Pairs with `config.exceptions`, which emits the matching shape for error
responses, so clients only ever deal with one JSON contract:

    {"success": true, "data": {...}}
    {"success": false, "error": {"code": ..., "message": ..., "details": ...}}
"""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel

DataT = TypeVar("DataT")


class SuccessResponse(BaseModel, Generic[DataT]):
    success: bool = True
    data: DataT


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: object | None = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
