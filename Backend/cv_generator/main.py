
from fastapi import FastAPI
from routers import cv_router
import logging

app = FastAPI(
    title="CV Generator API",
    description="An API to generate professional CVs as LaTeX files using Google Gemini AI.",
    version="1.0.0",
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")

app.include_router(cv_router.router)

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the CV Generator API!"}
