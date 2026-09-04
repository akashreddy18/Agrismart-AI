from fastapi import APIRouter
from app.api.v1.endpoints import auth, farms, crops, expenses, finance, tractor, labour, fertilizer, irrigation, weather, ml, market, assistant, disease

api_router = APIRouter()

# Register sub-routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(farms.router, prefix="/farms", tags=["farms"])
api_router.include_router(crops.router, prefix="/crops", tags=["crops"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(finance.router, prefix="/finance", tags=["finance"])
api_router.include_router(tractor.router, prefix="/tractor", tags=["tractor"])
api_router.include_router(labour.router, prefix="/labour", tags=["labour"])
api_router.include_router(fertilizer.router, prefix="/fertilizer", tags=["fertilizer"])
api_router.include_router(irrigation.router, prefix="/irrigation", tags=["irrigation"])
api_router.include_router(weather.router, prefix="/weather", tags=["weather"])
api_router.include_router(ml.router, prefix="/ml", tags=["machine learning"])
api_router.include_router(market.router, prefix="/market", tags=["market prices"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["assistant"])
api_router.include_router(disease.router, prefix="/disease", tags=["disease"])
