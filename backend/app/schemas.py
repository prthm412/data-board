from datetime import datetime
from typing import List, Literal, Union

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DatasetOut(BaseModel):
    id: int
    name: str
    column_names: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DatasetListOut(BaseModel):
    items: List[DatasetOut]
    total: int
    page: int
    limit: int


class DatasetPreviewOut(BaseModel):
    columns: List[str]
    rows: List[dict]
    total_rows: int


class ComputeRequest(BaseModel):
    column: str
    operation: Literal["min", "max", "sum"]


class ComputeResponse(BaseModel):
    column: str
    operation: str
    result: Union[float, int]