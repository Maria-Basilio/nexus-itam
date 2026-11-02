from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from .seed import seed
from .routers import fornecedores, softwares, licencas, dashboard
from .routers.dashboard import alertas


def job_alertas():
    pendentes = alertas()
    print(f"\n[ALERTAS] {len(pendentes)} licença(s) precisam de atenção:")
    for a in pendentes:
        if a["dias_restantes"] < 0:
            print(f"  🔴 {a['software']}: vencida há {abs(a['dias_restantes'])} dias")
        else:
            print(f"  🟡 {a['software']}: vence em {a['dias_restantes']} dias ({a['data_vencimento']})")


scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed()
    # TESTE: roda a cada 30 segundos. Depois troque pela linha do cron (abaixo)
    scheduler.add_job(job_alertas, "interval", seconds=30)
    # scheduler.add_job(job_alertas, "cron", hour=8, minute=0)  # todo dia às 08:00
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Gestão de Softwares", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fornecedores.router)
app.include_router(softwares.router)
app.include_router(licencas.router)
app.include_router(dashboard.router)