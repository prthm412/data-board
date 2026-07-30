from fastapi import FastAPI

from app.routers import auth

app = FastAPI(
    title="xVectorLabs Data App",
    description="Upload CSV datasets, preview them, compute stats, and visualize columns.",
    version="0.1.0",
)

app.include_router(auth.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}