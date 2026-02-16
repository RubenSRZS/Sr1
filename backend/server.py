from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class ClientCreate(BaseModel):
    name: str
    address: str
    phone: str
    email: Optional[str] = ""
    notes: Optional[str] = ""

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    phone: str
    email: Optional[str] = ""
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Service(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float
    total: float

class Diagnostic(BaseModel):
    mousses: bool = False
    lichens: bool = False
    tuiles_cassees: bool = False
    faitage: bool = False
    gouttieres: bool = False
    facade: bool = False

class QuoteCreate(BaseModel):
    client_id: Optional[str] = None
    new_client: Optional[ClientCreate] = None
    work_location: str
    work_surface: Optional[str] = ""
    diagnostic: Optional[Diagnostic] = None
    services: List[Service]
    remise_percent: float = 0.0
    remise_montant: float = 0.0
    notes: Optional[str] = ""

class Quote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quote_number: str
    client_id: str
    client_name: str
    client_address: str
    client_phone: str
    client_email: Optional[str] = ""
    date: str
    work_location: str
    work_surface: Optional[str] = ""
    diagnostic: Optional[Diagnostic] = None
    services: List[Service]
    total_brut: float
    remise_percent: float = 0.0
    remise_montant: float = 0.0
    remise: float = 0.0
    total_net: float
    acompte_30: float
    notes: Optional[str] = ""
    status: str = "draft"
    signature_data: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvoiceCreate(BaseModel):
    quote_id: Optional[str] = None
    client_id: Optional[str] = None
    new_client: Optional[ClientCreate] = None
    work_location: str
    work_surface: Optional[str] = ""
    services: List[Service]
    remise_percent: float = 0.0
    remise_montant: float = 0.0
    acompte_paid: float = 0.0
    notes: Optional[str] = ""

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    quote_id: Optional[str] = None
    client_id: str
    client_name: str
    client_address: str
    client_phone: str
    client_email: Optional[str] = ""
    date: str
    work_location: str
    work_surface: Optional[str] = ""
    services: List[Service]
    total_brut: float
    remise_percent: float = 0.0
    remise_montant: float = 0.0
    remise: float = 0.0
    total_net: float
    acompte_paid: float = 0.0
    reste_a_payer: float
    payment_status: str = "pending"
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CatalogItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    service_name: str
    description: str
    default_price: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CatalogItemCreate(BaseModel):
    category: str
    service_name: str
    description: str
    default_price: Optional[float] = None

# ==================== HELPERS ====================

def fix_datetime(doc):
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    return doc

async def get_or_create_client(client_id, new_client_data):
    if new_client_data:
        client_obj = Client(**new_client_data.model_dump())
        doc = client_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.clients.insert_one(doc)
        return client_obj.model_dump()
    if client_id:
        c = await db.clients.find_one({"id": client_id}, {"_id": 0})
        if not c:
            raise HTTPException(status_code=404, detail="Client non trouvé")
        return c
    raise HTTPException(status_code=400, detail="Client requis")

async def get_next_quote_number(client_id: str) -> str:
    count = await db.quotes.count_documents({"client_id": client_id})
    return f"DEVIS-{count + 1:02d}"

async def get_next_invoice_number(client_id: str) -> str:
    count = await db.invoices.count_documents({"client_id": client_id})
    return f"FACT-{count + 1:02d}"

# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Sr-Renovation API"}

# ==================== CLIENTS ====================

@api_router.post("/clients", response_model=Client)
async def create_client(input: ClientCreate):
    client_obj = Client(**input.model_dump())
    doc = client_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.clients.insert_one(doc)
    return client_obj

@api_router.get("/clients", response_model=List[Client])
async def get_clients():
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    return [fix_datetime(c) for c in clients]

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str):
    c = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return fix_datetime(c)

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, input: ClientCreate):
    c = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    await db.clients.update_one({"id": client_id}, {"$set": input.model_dump()})
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return fix_datetime(updated)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return {"status": "success"}

# ==================== CATALOG ====================

@api_router.post("/catalog", response_model=CatalogItem)
async def create_catalog_item(input: CatalogItemCreate):
    item = CatalogItem(**input.model_dump())
    doc = item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.catalog.insert_one(doc)
    return item

@api_router.get("/catalog", response_model=List[CatalogItem])
async def get_catalog():
    items = await db.catalog.find({}, {"_id": 0}).to_list(1000)
    return [fix_datetime(i) for i in items]

@api_router.delete("/catalog/{item_id}")
async def delete_catalog_item(item_id: str):
    result = await db.catalog.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service non trouvé")
    return {"status": "success"}

# ==================== QUOTES ====================

@api_router.post("/quotes", response_model=Quote)
async def create_quote(input: QuoteCreate):
    client_data = await get_or_create_client(input.client_id, input.new_client)
    client_id = client_data["id"]

    total_brut = sum(s.total for s in input.services)
    remise = round(total_brut * input.remise_percent / 100, 2)
    total_net = round(total_brut - remise, 2)
    acompte_30 = round(total_net * 0.30, 2)
    quote_number = await get_next_quote_number(client_id)

    quote = Quote(
        quote_number=quote_number,
        client_id=client_id,
        client_name=client_data["name"],
        client_address=client_data["address"],
        client_phone=client_data["phone"],
        client_email=client_data.get("email", ""),
        date=datetime.now().strftime("%d/%m/%Y"),
        work_location=input.work_location,
        work_surface=input.work_surface or "",
        diagnostic=input.diagnostic,
        services=input.services,
        total_brut=total_brut,
        remise_percent=input.remise_percent,
        remise=remise,
        total_net=total_net,
        acompte_30=acompte_30,
        notes=input.notes or "",
        status="draft",
    )
    doc = quote.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('diagnostic'):
        pass  # already dict from model_dump
    await db.quotes.insert_one(doc)
    return quote

@api_router.get("/quotes", response_model=List[Quote])
async def get_quotes():
    quotes = await db.quotes.find({}, {"_id": 0}).to_list(1000)
    return [fix_datetime(q) for q in quotes]

@api_router.get("/quotes/{quote_id}", response_model=Quote)
async def get_quote(quote_id: str):
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    return fix_datetime(q)

@api_router.put("/quotes/{quote_id}", response_model=Quote)
async def update_quote(quote_id: str, input: QuoteCreate):
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")

    client_data = await get_or_create_client(input.client_id, input.new_client)
    total_brut = sum(s.total for s in input.services)
    remise = round(total_brut * input.remise_percent / 100, 2)
    total_net = round(total_brut - remise, 2)
    acompte_30 = round(total_net * 0.30, 2)

    update_data = {
        "client_id": client_data["id"],
        "client_name": client_data["name"],
        "client_address": client_data["address"],
        "client_phone": client_data["phone"],
        "client_email": client_data.get("email", ""),
        "work_location": input.work_location,
        "work_surface": input.work_surface or "",
        "diagnostic": input.diagnostic.model_dump() if input.diagnostic else None,
        "services": [s.model_dump() for s in input.services],
        "total_brut": total_brut,
        "remise_percent": input.remise_percent,
        "remise": remise,
        "total_net": total_net,
        "acompte_30": acompte_30,
        "notes": input.notes or "",
    }
    await db.quotes.update_one({"id": quote_id}, {"$set": update_data})
    updated = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    return fix_datetime(updated)

@api_router.patch("/quotes/{quote_id}/status")
async def update_quote_status(quote_id: str, status: str, signature_data: Optional[str] = None):
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    update_data = {"status": status}
    if signature_data:
        update_data["signature_data"] = signature_data
    await db.quotes.update_one({"id": quote_id}, {"$set": update_data})
    return {"status": "success"}

@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str):
    result = await db.quotes.delete_one({"id": quote_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    return {"status": "success"}

# ==================== INVOICES ====================

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(input: InvoiceCreate):
    client_data = await get_or_create_client(input.client_id, input.new_client)
    client_id = client_data["id"]

    total_brut = sum(s.total for s in input.services)
    remise = round(total_brut * input.remise_percent / 100, 2)
    total_net = round(total_brut - remise, 2)
    reste_a_payer = round(total_net - input.acompte_paid, 2)
    invoice_number = await get_next_invoice_number(client_id)

    invoice = Invoice(
        invoice_number=invoice_number,
        quote_id=input.quote_id,
        client_id=client_id,
        client_name=client_data["name"],
        client_address=client_data["address"],
        client_phone=client_data["phone"],
        client_email=client_data.get("email", ""),
        date=datetime.now().strftime("%d/%m/%Y"),
        work_location=input.work_location,
        work_surface=input.work_surface or "",
        services=input.services,
        total_brut=total_brut,
        remise_percent=input.remise_percent,
        remise=remise,
        total_net=total_net,
        acompte_paid=input.acompte_paid,
        reste_a_payer=reste_a_payer,
        payment_status="paid" if reste_a_payer <= 0 else ("partial" if input.acompte_paid > 0 else "pending"),
        notes=input.notes or "",
    )
    doc = invoice.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.invoices.insert_one(doc)
    return invoice

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices():
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    return [fix_datetime(i) for i in invoices]

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return fix_datetime(inv)

@api_router.post("/invoices/from-quote/{quote_id}", response_model=Invoice)
async def create_invoice_from_quote(quote_id: str):
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")

    invoice_number = await get_next_invoice_number(q["client_id"])
    acompte_paid = q.get("acompte_30", 0)
    reste = round(q["total_net"] - acompte_paid, 2)

    invoice = Invoice(
        invoice_number=invoice_number,
        quote_id=quote_id,
        client_id=q["client_id"],
        client_name=q["client_name"],
        client_address=q["client_address"],
        client_phone=q["client_phone"],
        client_email=q.get("client_email", ""),
        date=datetime.now().strftime("%d/%m/%Y"),
        work_location=q["work_location"],
        work_surface=q.get("work_surface", ""),
        services=[Service(**s) for s in q["services"]],
        total_brut=q["total_brut"],
        remise_percent=q.get("remise_percent", 0),
        remise=q.get("remise", 0),
        total_net=q["total_net"],
        acompte_paid=acompte_paid,
        reste_a_payer=reste,
        payment_status="partial",
        notes=q.get("notes", ""),
    )
    doc = invoice.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.invoices.insert_one(doc)
    return invoice

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str):
    result = await db.invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return {"status": "success"}

# ==================== STATS ====================

@api_router.get("/stats")
async def get_stats():
    total_clients = await db.clients.count_documents({})
    total_quotes = await db.quotes.count_documents({})
    total_invoices = await db.invoices.count_documents({})
    quotes_draft = await db.quotes.count_documents({"status": "draft"})
    quotes_sent = await db.quotes.count_documents({"status": "sent"})
    quotes_accepted = await db.quotes.count_documents({"status": "accepted"})
    invoices_pending = await db.invoices.count_documents({"payment_status": "pending"})
    invoices_partial = await db.invoices.count_documents({"payment_status": "partial"})
    invoices_paid = await db.invoices.count_documents({"payment_status": "paid"})

    all_invoices = await db.invoices.find({}, {"_id": 0, "total_net": 1, "reste_a_payer": 1, "payment_status": 1}).to_list(1000)
    total_revenue = sum(inv["total_net"] for inv in all_invoices)
    pending_revenue = sum(inv["reste_a_payer"] for inv in all_invoices if inv["payment_status"] != "paid")

    return {
        "total_clients": total_clients,
        "total_quotes": total_quotes,
        "total_invoices": total_invoices,
        "quotes_by_status": {"draft": quotes_draft, "sent": quotes_sent, "accepted": quotes_accepted},
        "invoices_by_status": {"pending": invoices_pending, "partial": invoices_partial, "paid": invoices_paid},
        "revenue": {"total": total_revenue, "pending": pending_revenue},
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
