from pydantic import BaseModel, Field


class StockUpdate(BaseModel):
    quantity: int = Field(gt=0)


class StockResponse(BaseModel):
    medicine_id: int
    medicine_name: str
    previous_quantity: int
    added_quantity: int
    current_quantity: int
