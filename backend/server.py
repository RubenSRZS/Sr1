from fastapi import FastAPI, APIRouter, HTTPException, Body
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import secrets
import resend
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

# Resend config
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', '')

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
    unit: str = "unité"
    unit_price: float
    remise_percent: float = 0.0
    total: float

class QuoteCreate(BaseModel):
    client_id: Optional[str] = None
    new_client: Optional[ClientCreate] = None
    custom_quote_number: Optional[str] = None
    quote_title: Optional[str] = ""  # Titre du devis
    work_location: str
    work_surface: Optional[str] = ""
    diagnostic: Optional[dict] = None
    services: List[Service]
    option_1_title: Optional[str] = ""  # Titre Option 1
    remise_percent: float = 0.0
    remise_montant: float = 0.0
    payment_plan: Optional[str] = "acompte_solde"
    # Option 2
    option_2_services: Optional[List[Service]] = []
    option_2_title: Optional[str] = ""  # Titre Option 2
    option_2_remise_percent: float = 0.0
    option_2_remise_montant: float = 0.0
    # Option 3
    option_3_services: Optional[List[Service]] = []
    option_3_title: Optional[str] = ""
    option_3_remise_percent: float = 0.0
    option_3_remise_montant: float = 0.0
    notes: Optional[str] = ""
    selected_option: Optional[int] = None  # Option choisie par le client (1, 2, 3...)

class Quote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quote_number: str
    quote_title: Optional[str] = ""
    client_id: str
    client_name: str
    client_address: str
    client_phone: str
    client_email: Optional[str] = ""
    date: str
    work_location: str
    work_surface: Optional[str] = ""
    diagnostic: Optional[dict] = None
    services: List[Service]
    option_1_title: Optional[str] = ""
    total_brut: float
    remise_percent: float = 0.0
    remise_montant: float = 0.0
    remise: float = 0.0
    total_net: float
    acompte_30: float
    payment_plan: Optional[str] = "acompte_solde"
    # Option 2 fields
    option_2_services: Optional[List[Service]] = []
    option_2_title: Optional[str] = ""
    option_2_total_brut: float = 0.0
    option_2_remise_percent: float = 0.0
    option_2_remise_montant: float = 0.0
    option_2_remise: float = 0.0
    option_2_total_net: float = 0.0
    option_2_acompte_30: float = 0.0
    # Option 3 fields
    option_3_services: Optional[List[Service]] = []
    option_3_title: Optional[str] = ""
    option_3_total_brut: float = 0.0
    option_3_remise_percent: float = 0.0
    option_3_remise_montant: float = 0.0
    option_3_remise: float = 0.0
    option_3_total_net: float = 0.0
    option_3_acompte_30: float = 0.0
    notes: Optional[str] = ""
    status: str = "draft"
    signature_data: Optional[str] = None
    selected_option: Optional[int] = None
    public_token: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    sent_at: Optional[str] = None
    sent_to_email: Optional[str] = None
    opened_at: Optional[str] = None
    signed_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvoiceCreate(BaseModel):
    quote_id: Optional[str] = None
    client_id: Optional[str] = None
    new_client: Optional[ClientCreate] = None
    custom_invoice_number: Optional[str] = None
    work_location: str
    work_surface: Optional[str] = ""
    services: List[Service]
    remise_percent: float = 0.0
    remise_montant: float = 0.0
    acompte_paid: float = 0.0
    payment_status: str = "pending"  # 'pending', 'paid', 'partial'
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
    default_unit: str = "unité"
    color: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CatalogItemCreate(BaseModel):
    category: str
    service_name: str
    description: str
    default_price: Optional[float] = None
    default_unit: str = "unité"
    color: Optional[str] = None

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

@api_router.delete("/catalog/clear-all")
async def clear_all_catalog():
    """Vide complètement le catalogue de services"""
    try:
        result = await db.catalog.delete_many({})
        return {
            "status": "success",
            "deleted": result.deleted_count
        }
    except Exception as e:
        logger.error(f"Erreur lors de la suppression du catalogue: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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

@api_router.put("/catalog/{item_id}", response_model=CatalogItem)
async def update_catalog_item(item_id: str, input: CatalogItemCreate):
    item = await db.catalog.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Service non trouvé")
    await db.catalog.update_one({"id": item_id}, {"$set": input.model_dump()})
    updated = await db.catalog.find_one({"id": item_id}, {"_id": 0})
    return fix_datetime(updated)

@api_router.delete("/catalog/{item_id}")
async def delete_catalog_item(item_id: str):
    result = await db.catalog.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service non trouvé")
    return {"status": "success"}

# ==================== UTILITY ROUTES ====================

@api_router.delete("/cleanup/test-data")
async def cleanup_test_data():
    """Supprime tous les clients, devis et factures préfixés TEST_"""
    try:
        # Supprimer les clients de test
        clients_result = await db.clients.delete_many({"name": {"$regex": "^TEST_"}})
        
        # Supprimer les devis de test
        quotes_result = await db.quotes.delete_many({"client_name": {"$regex": "^TEST_"}})
        
        # Supprimer les factures de test
        invoices_result = await db.invoices.delete_many({"client_name": {"$regex": "^TEST_"}})
        
        return {
            "status": "success",
            "deleted": {
                "clients": clients_result.deleted_count,
                "quotes": quotes_result.deleted_count,
                "invoices": invoices_result.deleted_count
            }
        }
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== QUOTES ====================

@api_router.post("/quotes", response_model=Quote)
async def create_quote(input: QuoteCreate):
    client_data = await get_or_create_client(input.client_id, input.new_client)
    client_id = client_data["id"]

    # Option 1 calculations
    total_brut = sum(s.total for s in input.services)
    remise_from_pct = round(total_brut * input.remise_percent / 100, 2) if input.remise_percent > 0 else 0
    remise = remise_from_pct if input.remise_percent > 0 else round(input.remise_montant, 2)
    total_net = round(total_brut - remise, 2)
    acompte_30 = round(total_net * 0.30, 2)
    
    # Option 2 calculations
    opt2_services = input.option_2_services or []
    opt2_total_brut = sum(s.total for s in opt2_services) if opt2_services else 0
    opt2_remise_from_pct = round(opt2_total_brut * input.option_2_remise_percent / 100, 2) if input.option_2_remise_percent > 0 else 0
    opt2_remise = opt2_remise_from_pct if input.option_2_remise_percent > 0 else round(input.option_2_remise_montant, 2)
    opt2_total_net = round(opt2_total_brut - opt2_remise, 2)
    opt2_acompte_30 = round(opt2_total_net * 0.30, 2)
    
    quote_number = input.custom_quote_number.strip() if input.custom_quote_number and input.custom_quote_number.strip() else await get_next_quote_number(client_id)

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
        remise_montant=input.remise_montant,
        remise=remise,
        total_net=total_net,
        acompte_30=acompte_30,
        payment_plan=input.payment_plan or "acompte_solde",
        # Option 2
        option_2_services=opt2_services,
        option_2_total_brut=opt2_total_brut,
        option_2_remise_percent=input.option_2_remise_percent,
        option_2_remise_montant=input.option_2_remise_montant,
        option_2_remise=opt2_remise,
        option_2_total_net=opt2_total_net,
        option_2_acompte_30=opt2_acompte_30,
        notes=input.notes or "",
        status="draft",
    )
    doc = quote.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
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
    
    # Option 1 calculations
    total_brut = sum(s.total for s in input.services)
    remise_from_pct = round(total_brut * input.remise_percent / 100, 2) if input.remise_percent > 0 else 0
    remise = remise_from_pct if input.remise_percent > 0 else round(input.remise_montant, 2)
    total_net = round(total_brut - remise, 2)
    acompte_30 = round(total_net * 0.30, 2)
    
    # Option 2 calculations
    opt2_services = input.option_2_services or []
    opt2_total_brut = sum(s.total for s in opt2_services) if opt2_services else 0
    opt2_remise_from_pct = round(opt2_total_brut * input.option_2_remise_percent / 100, 2) if input.option_2_remise_percent > 0 else 0
    opt2_remise = opt2_remise_from_pct if input.option_2_remise_percent > 0 else round(input.option_2_remise_montant, 2)
    opt2_total_net = round(opt2_total_brut - opt2_remise, 2)
    opt2_acompte_30 = round(opt2_total_net * 0.30, 2)

    update_data = {
        "client_id": client_data["id"],
        "client_name": client_data["name"],
        "client_address": client_data["address"],
        "client_phone": client_data["phone"],
        "client_email": client_data.get("email", ""),
        "work_location": input.work_location,
        "work_surface": input.work_surface or "",
        "diagnostic": input.diagnostic if input.diagnostic else None,
        "services": [s.model_dump() for s in input.services],
        "total_brut": total_brut,
        "remise_percent": input.remise_percent,
        "remise_montant": input.remise_montant,
        "remise": remise,
        "total_net": total_net,
        "acompte_30": acompte_30,
        "payment_plan": input.payment_plan or "acompte_solde",
        # Option 2 fields
        "option_2_services": [s.model_dump() for s in opt2_services],
        "option_2_total_brut": opt2_total_brut,
        "option_2_remise_percent": input.option_2_remise_percent,
        "option_2_remise_montant": input.option_2_remise_montant,
        "option_2_remise": opt2_remise,
        "option_2_total_net": opt2_total_net,
        "option_2_acompte_30": opt2_acompte_30,
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
    remise_from_pct = round(total_brut * input.remise_percent / 100, 2) if input.remise_percent > 0 else 0
    remise = remise_from_pct if input.remise_percent > 0 else round(input.remise_montant, 2)
    total_net = round(total_brut - remise, 2)
    reste_a_payer = round(total_net - input.acompte_paid, 2)
    
    # Utiliser le numéro personnalisé ou générer automatiquement
    if input.custom_invoice_number:
        invoice_number = input.custom_invoice_number
    else:
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
        remise_montant=input.remise_montant,
        remise=remise,
        total_net=total_net,
        acompte_paid=input.acompte_paid,
        reste_a_payer=reste_a_payer,
        payment_status=input.payment_status if input.payment_status else ("paid" if reste_a_payer <= 0 else ("partial" if input.acompte_paid > 0 else "pending")),
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

class ConvertQuoteToInvoice(BaseModel):
    mark_as_paid: bool = False

@api_router.post("/invoices/from-quote/{quote_id}", response_model=Invoice)
async def create_invoice_from_quote(quote_id: str, options: Optional[ConvertQuoteToInvoice] = None):
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")

    invoice_number = await get_next_invoice_number(q["client_id"])
    
    # Si marqué comme payé, acompte = total
    mark_paid = options.mark_as_paid if options else False
    if mark_paid:
        acompte_paid = q["total_net"]
        reste = 0.0
        payment_status = "paid"
    else:
        acompte_paid = q.get("acompte_30", 0)
        reste = round(q["total_net"] - acompte_paid, 2)
        payment_status = "paid" if reste <= 0 else ("partial" if acompte_paid > 0 else "pending")

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
        remise_montant=q.get("remise_montant", 0),
        remise=q.get("remise", 0),
        total_net=q["total_net"],
        acompte_paid=acompte_paid,
        reste_a_payer=reste,
        payment_status=payment_status,
        notes=q.get("notes", ""),
    )
    doc = invoice.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.invoices.insert_one(doc)
    
    # Mettre à jour le statut du devis en "facturé"
    await db.quotes.update_one({"id": quote_id}, {"$set": {"status": "invoiced"}})
    
    return invoice

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str):
    result = await db.invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return {"status": "success"}

@api_router.patch("/invoices/{invoice_id}/payment")
async def update_invoice_payment(invoice_id: str, payment_status: str):
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    update_data = {"payment_status": payment_status}
    if payment_status == "paid":
        update_data["acompte_paid"] = inv["total_net"]
        update_data["reste_a_payer"] = 0.0
    elif payment_status == "pending":
        update_data["acompte_paid"] = 0.0
        update_data["reste_a_payer"] = inv["total_net"]
    await db.invoices.update_one({"id": invoice_id}, {"$set": update_data})
    return {"status": "success", "payment_status": payment_status}

# ==================== PIN AUTH ====================

class PinVerify(BaseModel):
    pin: str

class PinChange(BaseModel):
    current_pin: str
    new_pin: str

async def get_settings():
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings:
        settings = {
            "id": "app_settings",
            "pin": os.environ.get("DEFAULT_PIN", "0330"),
            "admin_email": ADMIN_EMAIL,
        }
        await db.settings.insert_one(settings)
    return settings

@api_router.post("/auth/verify-pin")
async def verify_pin(body: PinVerify):
    settings = await get_settings()
    if body.pin == settings["pin"]:
        return {"status": "success", "authenticated": True}
    raise HTTPException(status_code=401, detail="Code incorrect")

@api_router.post("/auth/change-pin")
async def change_pin(body: PinChange):
    settings = await get_settings()
    if body.current_pin != settings["pin"]:
        raise HTTPException(status_code=401, detail="Code actuel incorrect")
    await db.settings.update_one({"id": "app_settings"}, {"$set": {"pin": body.new_pin}})
    return {"status": "success", "message": "Code modifié"}

@api_router.post("/auth/recover-pin")
async def recover_pin():
    settings = await get_settings()
    admin_email = settings.get("admin_email", ADMIN_EMAIL)
    if not admin_email:
        raise HTTPException(status_code=400, detail="Aucun email administrateur configuré")
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [admin_email],
            "subject": "SR Rénovation - Votre code d'accès",
            "html": f"""
            <div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:30px;background:#f8fafc;border-radius:12px;">
                <div style="text-align:center;margin-bottom:20px;">
                    <h2 style="color:#1e3a5f;margin:0;">SR Rénovation</h2>
                    <p style="color:#64748b;font-size:14px;">Récupération du code d'accès</p>
                </div>
                <div style="background:white;padding:20px;border-radius:8px;text-align:center;border:1px solid #e2e8f0;">
                    <p style="color:#475569;margin:0 0 10px;">Votre code d'accès est :</p>
                    <div style="font-size:36px;font-weight:bold;color:#1e3a5f;letter-spacing:8px;">{settings['pin']}</div>
                </div>
            </div>"""
        }
        await asyncio.to_thread(resend.Emails.send, params)
        return {"status": "success", "message": f"Code envoyé à {admin_email[:3]}***"}
    except Exception as e:
        logger.error(f"Erreur envoi email: {e}")
        raise HTTPException(status_code=500, detail="Erreur d'envoi de l'email")

# ==================== PUBLIC QUOTE ====================

@api_router.get("/public/quote/{token}")
async def get_public_quote(token: str):
    q = await db.quotes.find_one({"public_token": token}, {"_id": 0})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    # Return only necessary fields for client view
    return {
        "id": q["id"],
        "quote_number": q["quote_number"],
        "quote_title": q.get("quote_title", ""),
        "client_name": q["client_name"],
        "client_address": q["client_address"],
        "date": q["date"],
        "work_location": q["work_location"],
        "work_surface": q.get("work_surface", ""),
        "services": q["services"],
        "option_1_title": q.get("option_1_title", ""),
        "total_brut": q["total_brut"],
        "remise": q.get("remise", 0),
        "total_net": q["total_net"],
        "payment_plan": q.get("payment_plan", "acompte_solde"),
        "acompte_30": q.get("acompte_30", 0),
        "option_2_services": q.get("option_2_services", []),
        "option_2_title": q.get("option_2_title", ""),
        "option_2_total_net": q.get("option_2_total_net", 0),
        "option_3_services": q.get("option_3_services", []),
        "option_3_title": q.get("option_3_title", ""),
        "option_3_total_net": q.get("option_3_total_net", 0),
        "notes": q.get("notes", ""),
        "status": q["status"],
        "diagnostic": q.get("diagnostic"),
        "signed_at": q.get("signed_at"),
        "signature_data": q.get("signature_data"),
    }

@api_router.post("/public/quote/{token}/opened")
async def track_quote_opened(token: str):
    q = await db.quotes.find_one({"public_token": token}, {"_id": 0})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    if not q.get("opened_at"):
        await db.quotes.update_one(
            {"public_token": token},
            {"$set": {"opened_at": datetime.now(timezone.utc).isoformat()}}
        )
    return {"status": "success"}

class SignQuote(BaseModel):
    signature_data: str
    signer_name: Optional[str] = ""

@api_router.post("/public/quote/{token}/sign")
async def sign_quote_public(token: str, body: SignQuote):
    q = await db.quotes.find_one({"public_token": token}, {"_id": 0})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    if q.get("signed_at"):
        raise HTTPException(status_code=400, detail="Ce devis a déjà été signé")
    now = datetime.now(timezone.utc).isoformat()
    await db.quotes.update_one(
        {"public_token": token},
        {"$set": {
            "signature_data": body.signature_data,
            "signed_at": now,
            "status": "accepted",
            "signer_name": body.signer_name or "",
        }}
    )
    # Notify admin by email
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_EMAIL],
            "subject": f"Devis {q['quote_number']} signé par {q['client_name']}",
            "html": f"""
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
                <h2 style="color:#166534;margin:0 0 15px;">Devis signé !</h2>
                <p style="color:#475569;"><strong>{q['client_name']}</strong> a accepté et signé le devis <strong>{q['quote_number']}</strong></p>
                <p style="color:#475569;">Montant : <strong>{q['total_net']:.2f} €</strong></p>
                <p style="color:#64748b;font-size:13px;">Signé le {datetime.now().strftime('%d/%m/%Y à %H:%M')}</p>
            </div>"""
        }
        await asyncio.to_thread(resend.Emails.send, params)
    except Exception as e:
        logger.error(f"Erreur notification signature: {e}")
    return {"status": "success", "signed_at": now}

# ==================== SEND QUOTE EMAIL ====================

class SendQuoteEmail(BaseModel):
    subject: str
    message: str
    recipient_email: str

@api_router.post("/quotes/{quote_id}/send-email")
async def send_quote_email(quote_id: str, body: SendQuoteEmail):
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    public_token = q.get("public_token")
    if not public_token:
        public_token = secrets.token_urlsafe(32)
        await db.quotes.update_one({"id": quote_id}, {"$set": {"public_token": public_token}})

    # Build the public URL for the quote
    # This will be the frontend URL with /devis/public/{token}
    base_url = os.environ.get("PUBLIC_APP_URL", "")
    public_link = f"{base_url}/devis/public/{public_token}" if base_url else f"/devis/public/{public_token}"

    # Convert newlines in message to <br>
    message_html = body.message.replace('\n', '<br>')

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:20px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 100%);padding:30px 40px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">SR RÉNOVATION</h1>
              <p style="color:#93c5fd;margin:5px 0 0;font-size:13px;">Rénovation de toiture et façade</p>
            </td></tr>
            <!-- Body -->
            <tr><td style="padding:35px 40px;">
              <p style="color:#1e293b;font-size:15px;line-height:1.7;margin:0 0 20px;">{message_html}</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:20px 0;">
                <tr><td style="padding:20px;">
                  <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Devis</p>
                  <p style="color:#1e3a5f;font-size:18px;font-weight:700;margin:0;">{q['quote_number']}</p>
                  <p style="color:#475569;font-size:14px;margin:8px 0 0;">Montant : <strong>{q['total_net']:.2f} € TTC</strong></p>
                </td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:10px 0 25px;">
                <a href="{public_link}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.5px;">
                  Consulter et signer le devis
                </a>
              </td></tr></table>
              <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Ce lien est unique et sécurisé. Il vous permet de consulter le détail du devis et de le signer directement en ligne.</p>
            </td></tr>
            <!-- Footer -->
            <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;text-align:center;margin:0;">SR Rénovation — Ce message a été envoyé automatiquement.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>"""

    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [body.recipient_email],
            "subject": body.subject,
            "html": html_content,
        }
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        now = datetime.now(timezone.utc).isoformat()
        await db.quotes.update_one(
            {"id": quote_id},
            {"$set": {
                "sent_at": now,
                "sent_to_email": body.recipient_email,
                "status": "sent",
                "public_token": public_token,
            }}
        )
        return {"status": "success", "email_id": email_result.get("id"), "public_token": public_token}
    except Exception as e:
        logger.error(f"Erreur envoi devis: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur d'envoi: {str(e)}")

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

@app.on_event("startup")
async def startup_migrate():
    """Assign public_token to quotes that don't have one."""
    async for q in db.quotes.find({"public_token": {"$exists": False}}, {"_id": 0, "id": 1}):
        token = secrets.token_urlsafe(32)
        await db.quotes.update_one({"id": q["id"]}, {"$set": {"public_token": token}})
        logger.info(f"Assigned public_token to quote {q['id']}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
