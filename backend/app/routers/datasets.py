import io
import math

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_user

router = APIRouter(prefix="/dataset", tags=["datasets"])


@router.post("", response_model=schemas.DatasetOut, status_code=status.HTTP_201_CREATED)
def upload_dataset(
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    contents = file.file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not parse CSV file")

    if len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="CSV file has no columns")

    column_names = list(df.columns)

    dataset = models.Dataset(name=name, owner_id=current_user.id, column_names=column_names)
    db.add(dataset)
    db.flush()

    records = df.to_dict(orient="records")
    for record in records:
        for key, value in record.items():
            if isinstance(value, float) and math.isnan(value):
                record[key] = None

    for idx, row in enumerate(records):
        db.add(models.DatasetRow(dataset_id=dataset.id, row_index=idx, data=row))

    db.commit()
    db.refresh(dataset)
    return dataset


@router.get("", response_model=schemas.DatasetListOut)
def list_datasets(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Dataset).filter(models.Dataset.owner_id == current_user.id)
    total = query.count()
    items = (
        query.order_by(models.Dataset.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


def _get_owned_dataset(dataset_id: int, db: Session, current_user: models.User) -> models.Dataset:
    dataset = (
        db.query(models.Dataset)
        .filter(models.Dataset.id == dataset_id, models.Dataset.owner_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.get("/{dataset_id}/preview", response_model=schemas.DatasetPreviewOut)
def preview_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    dataset = _get_owned_dataset(dataset_id, db, current_user)

    total_rows = (
        db.query(models.DatasetRow).filter(models.DatasetRow.dataset_id == dataset.id).count()
    )
    rows = (
        db.query(models.DatasetRow)
        .filter(models.DatasetRow.dataset_id == dataset.id)
        .order_by(models.DatasetRow.row_index)
        .limit(25)
        .all()
    )
    return {"columns": dataset.column_names, "rows": [r.data for r in rows], "total_rows": total_rows}


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    dataset = _get_owned_dataset(dataset_id, db, current_user)
    db.delete(dataset)
    db.commit()
    return None


def _get_dataset_rows(dataset_id: int, db: Session):
    return (
        db.query(models.DatasetRow)
        .filter(models.DatasetRow.dataset_id == dataset_id)
        .all()
    )


@router.post("/{dataset_id}/compute", response_model=schemas.ComputeResponse)
def compute_stat(
    dataset_id: int,
    payload: schemas.ComputeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    dataset = _get_owned_dataset(dataset_id, db, current_user)

    if payload.column not in dataset.column_names:
        raise HTTPException(status_code=400, detail=f"Column '{payload.column}' not found in dataset")

    rows = _get_dataset_rows(dataset_id, db)

    if len(rows) == 0:
        raise HTTPException(status_code=400, detail="Dataset has no rows")

    raw_values = [row.data.get(payload.column) for row in rows]
    non_null_values = [v for v in raw_values if v is not None]

    if len(non_null_values) == 0:
        raise HTTPException(status_code=400, detail=f"Column '{payload.column}' has no non-null values")

    numeric_values = []
    for v in non_null_values:
        try:
            numeric_values.append(float(v))
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=400,
                detail=f"Column '{payload.column}' is not numeric (found value: {v!r})",
            )

    if payload.operation == "min":
        result = min(numeric_values)
    elif payload.operation == "max":
        result = max(numeric_values)
    else:
        result = sum(numeric_values)

    return {"column": payload.column, "operation": payload.operation, "result": result}


@router.get("/{dataset_id}/plot", response_model=schemas.PlotResponse)
def plot_dataset(
    dataset_id: int,
    col1: str = Query(...),
    col2: str = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    dataset = _get_owned_dataset(dataset_id, db, current_user)

    for col in (col1, col2):
        if col not in dataset.column_names:
            raise HTTPException(status_code=400, detail=f"Column '{col}' not found in dataset")

    rows = (
        db.query(models.DatasetRow)
        .filter(models.DatasetRow.dataset_id == dataset.id)
        .order_by(models.DatasetRow.row_index)
        .limit(30)
        .all()
    )

    data = [{"col1": row.data.get(col1), "col2": row.data.get(col2)} for row in rows]
    return {"col1": col1, "col2": col2, "data": data}