from fastapi import FastAPI

app = FastAPI(
    title="xVectorLabs Data App",
    description="Upload CSV datasets, preview them, compute stats, and visualize columns.",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    """Basic liveness check. Confirms the server is up before we wire in the DB."""
    return {"status": "ok"}