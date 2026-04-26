
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import cv_router
import logging

app = FastAPI(
    title="CV Generator API",
    description="An API to generate professional CVs as LaTeX files using Google Gemini AI.",
    version="1.0.0",
)

# Allow any origin to call the API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")

app.include_router(cv_router.router)

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the CV Generator API!"}
