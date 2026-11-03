from fastapi import APIRouter
from backend.app.api.v1 import workspaces, files, scans, dashboard, rules

api_router = APIRouter()
api_router.include_router(workspaces.router)
api_router.include_router(files.router)
api_router.include_router(scans.router)
api_router.include_router(dashboard.router)
api_router.include_router(rules.router)
