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
SENDER_EMAIL = os.environ.get('SENDER_EMAIL')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL')
REPLY_TO_EMAIL = os.environ.get('REPLY_TO_EMAIL')

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
            "reply_to": REPLY_TO_EMAIL,
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
    # Return all fields needed by PDFDocument component for visual parity
    return {
        "id": q["id"],
        "quote_number": q["quote_number"],
        "quote_title": q.get("quote_title", ""),
        "client_name": q["client_name"],
        "client_address": q.get("client_address", ""),
        "client_phone": q.get("client_phone", ""),
        "client_email": q.get("client_email", ""),
        "date": q["date"],
        "work_location": q.get("work_location", ""),
        "services": q.get("services", []),
        "option_1_title": q.get("option_1_title", ""),
        "total_brut": q.get("total_brut", 0),
        "remise": q.get("remise", 0),
        "remise_percent": q.get("remise_percent", 0),
        "total_net": q.get("total_net", 0),
        "payment_plan": q.get("payment_plan", "acompte_solde"),
        "acompte_30": q.get("acompte_30", 0),
        "show_line_numbers": q.get("show_line_numbers", True),
        "option_2_services": q.get("option_2_services", []),
        "option_2_title": q.get("option_2_title", ""),
        "option_2_total_net": q.get("option_2_total_net", 0),
        "option_2_remise": q.get("option_2_remise", 0),
        "option_2_remise_percent": q.get("option_2_remise_percent", 0),
        "option_2_acompte_30": q.get("option_2_acompte_30", 0),
        "option_3_services": q.get("option_3_services", []),
        "option_3_title": q.get("option_3_title", ""),
        "option_3_total_net": q.get("option_3_total_net", 0),
        "option_3_remise": q.get("option_3_remise", 0),
        "option_3_remise_percent": q.get("option_3_remise_percent", 0),
        "option_3_acompte_30": q.get("option_3_acompte_30", 0),
        "notes": q.get("notes", ""),
        "status": q.get("status", ""),
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
    selected_option: Optional[int] = 1  # Option sélectionnée (1, 2 ou 3)
    pdf_base64: Optional[str] = None
    pdf_filename: Optional[str] = None

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

    # Accept optional PDF with client signature embedded
    signed_pdf_base64 = None
    signed_pdf_filename = None
    if hasattr(body, 'pdf_base64') and body.pdf_base64:
        signed_pdf_base64 = body.pdf_base64
        signed_pdf_filename = body.pdf_filename or f"Devis_SR-Renovation_{q['quote_number']}_signe.pdf"

    sign_date_str = datetime.now().strftime('%d/%m/%Y')
    sender = f"SR Renovation <{SENDER_EMAIL}>"
    client_name = q.get('client_name', 'Client')
    client_last_name = client_name.split()[-1] if client_name else 'Client'
    quote_number = q.get('quote_number', '')
    acompte = q.get('acompte_30', 0)
    total_net = q.get('total_net', 0)

    # 1) Notify admin with signed PDF attached
    try:
        admin_html = f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f5;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#16a34a 0%,#22c55e 100%);padding:28px 28px;text-align:center;">
  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;">Devis sign&eacute; !</h1>
</td></tr>
<tr><td style="padding:28px;">
  <p style="color:#1e293b;font-size:15px;line-height:1.7;margin:0 0 16px;">
    <strong>{q['client_name']}</strong> a accept&eacute; et sign&eacute; le devis <strong>n&deg;{quote_number}</strong>.
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin:0 0 16px;">
    <tr><td style="padding:16px;">
      <p style="color:#64748b;font-size:12px;margin:0 0 4px;">Montant</p>
      <p style="color:#166534;font-size:20px;font-weight:700;margin:0;">{total_net:.2f} &euro;</p>
      <p style="color:#64748b;font-size:13px;margin:6px 0 0;">Sign&eacute; le {sign_date_str}</p>
    </td></tr>
  </table>
  <p style="color:#64748b;font-size:13px;margin:0;">Le devis sign&eacute; est joint &agrave; cet email en pi&egrave;ce jointe PDF.</p>
</td></tr>
</table>
</td></tr></table></body></html>"""

        admin_params = {
            "from": sender,
            "to": [ADMIN_EMAIL],
            "reply_to": REPLY_TO_EMAIL,
            "subject": f"Devis {quote_number} signe par {client_name}",
            "html": admin_html,
        }
        if signed_pdf_base64:
            admin_params["attachments"] = [{
                "filename": signed_pdf_filename or f"Devis_SR-Renovation_{quote_number}_signe.pdf",
                "content": signed_pdf_base64,
            }]
        await asyncio.to_thread(resend.Emails.send, admin_params)
    except Exception as e:
        logger.error(f"Erreur notification admin signature: {e}")

    # 2) Send confirmation email to client with RIB
    client_email = q.get('sent_to_email') or q.get('client_email')
    if client_email:
        try:
            client_html = f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f5;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 40%,#f97316 100%);padding:32px 28px;text-align:center;">
  <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:0.5px;font-family:'Montserrat',sans-serif;">SR RÉNOVATION</h1>
  <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;font-weight:600;line-height:1.5;">Nettoyage <span style="font-weight:700;">Professionnel</span><br>Toitures &bull; Fa&ccedil;ades &bull; Terrasses</p>
</td></tr>
<tr><td style="padding:28px;">
  <p style="color:#1e293b;font-size:16px;line-height:1.7;margin:0 0 20px;">
    Bonjour, <strong>Monsieur {client_last_name}</strong>,
  </p>
  <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
    Nous vous confirmons la bonne réception de la signature électronique de votre devis <strong>n°{quote_number}</strong> d'un montant de <strong>{q.get('total_net', 0):.2f} €</strong>.
  </p>
  <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
    Nous vous remercions pour votre confiance et nous nous engageons à vous fournir un travail de qualité. Votre devis signé est joint à cet email.
  </p>

  {'<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin:0 0 20px;"><tr><td style="padding:18px;"><p style="color:#1e40af;font-size:14px;font-weight:700;margin:0 0 10px;">Acompte de 30%% à verser : ' + f'{acompte:.2f}' + ' €</p><p style="color:#475569;font-size:13px;line-height:1.6;margin:0;">Vous pouvez effectuer le virement aux coordonnées suivantes :</p></td></tr></table>' if acompte > 0 else ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:0 0 20px;">
    <tr><td style="padding:18px;">
      <p style="color:#1e40af;font-size:14px;font-weight:700;margin:0 0 12px;">Coordonnées bancaires (RIB)</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
        <tr><td style="color:#64748b;font-size:12px;padding:3px 0;">Titulaire</td><td style="color:#1e293b;font-size:13px;font-weight:600;padding:3px 0;">M RUBEN SUAREZ-SAR</td></tr>
        <tr><td style="color:#64748b;font-size:12px;padding:3px 0;">Banque</td><td style="color:#1e293b;font-size:13px;font-weight:600;padding:3px 0;">Banque Populaire BFC</td></tr>
        <tr><td style="color:#64748b;font-size:12px;padding:3px 0;">IBAN</td><td style="color:#1e293b;font-size:13px;font-weight:600;padding:3px 0;word-break:break-all;">FR76 1080 7000 1312 3197 7296 321</td></tr>
        <tr><td style="color:#64748b;font-size:12px;padding:3px 0;">BIC</td><td style="color:#1e293b;font-size:13px;font-weight:600;padding:3px 0;">CCBPFRPPDJN</td></tr>
      </table>
    </td></tr>
  </table>

  <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 8px;">
    N'hésitez pas à me contacter pour toute question.
  </p>
  <p style="color:#1e293b;font-size:14px;line-height:1.7;margin:0;">
    À très bientôt,<br>
    <strong>Ruben — SR Rénovation</strong>
  </p>
</td></tr>

<tr><td style="padding:0 28px;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>

<tr><td style="padding:24px 28px;text-align:center;">
  <p style="color:#1e293b;font-size:15px;font-weight:700;margin:0 0 10px;">SR Rénovation</p>
  <p style="color:#64748b;font-size:13px;line-height:2;margin:0;">
    &#9742; 06 80 33 45 46<br>
    &#9993; <a href="mailto:SrRenovation03@gmail.com" style="color:#3b82f6;text-decoration:none;">SrRenovation03@gmail.com</a><br>
    &#127968; Jura (39) - Artisan local &amp; certifié<br>
    &#127760; <a href="https://sr-renovation.fr" style="color:#3b82f6;text-decoration:none;">sr-renovation.fr</a>
  </p>
</td></tr>
</table>
</td></tr></table></body></html>"""

            client_params = {
                "from": sender,
                "to": [client_email],
                "reply_to": REPLY_TO_EMAIL,
                "subject": f"Confirmation de signature — Devis n{quote_number} SR Renovation",
                "html": client_html,
            }
            if signed_pdf_base64:
                client_params["attachments"] = [{
                    "filename": signed_pdf_filename or f"Devis_SR-Renovation_{quote_number}_signe.pdf",
                    "content": signed_pdf_base64,
                }]
            await asyncio.to_thread(resend.Emails.send, client_params)
        except Exception as e:
            logger.error(f"Erreur confirmation client signature: {e}")

    return {"status": "success", "signed_at": now}

# ==================== SEND QUOTE EMAIL ====================

class SendQuoteEmail(BaseModel):
    subject: str
    message: str
    recipient_email: str
    pdf_base64: str | None = None
    pdf_filename: str | None = None

@api_router.post("/quotes/{quote_id}/send-email")
async def send_quote_email(quote_id: str, body: SendQuoteEmail):
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    public_token = q.get("public_token")
    if not public_token:
        public_token = secrets.token_urlsafe(32)
        await db.quotes.update_one({"id": quote_id}, {"$set": {"public_token": public_token}})

    base_url = os.environ.get("PUBLIC_APP_URL", "")
    public_link = f"{base_url}/devis/public/{public_token}" if base_url else f"/devis/public/{public_token}"

    # Convert newlines in message to <br>
    message_html = body.message.replace('\n', '<br>')

    html_content = f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&display=swap" rel="stylesheet">
<title>Devis SR R&eacute;novation</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f5;">
<tr><td align="center" style="padding:24px 12px;">

<!-- Main container -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

<!-- Header with gradient -->
<tr><td style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 40%,#f97316 100%);padding:36px 28px;text-align:center;">
  <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:1px;font-family:'Montserrat',sans-serif;">SR RÉNOVATION</h1>
  <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:13px;font-weight:600;letter-spacing:0.5px;line-height:1.5;">Nettoyage <span style="background:linear-gradient(90deg,#3b82f6,#8b5cf6,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700;">Professionnel</span><br>Toitures &bull; Fa&ccedil;ades &bull; Terrasses</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 28px 24px;">
  <p style="color:#1e293b;font-size:15px;line-height:1.75;margin:0 0 24px;">{message_html}</p>

  <!-- CTA Button -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td align="center" style="padding:8px 0 24px;">
    <a href="{public_link}" target="_blank" style="display:inline-block;background-color:#F9A825;color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:50px;font-weight:700;font-size:16px;letter-spacing:0.3px;mso-padding-alt:0;text-align:center;font-family:'Segoe UI',Arial,sans-serif;">
      <!--[if mso]><i style="mso-font-width:300%;mso-text-raise:30px" hidden>&emsp;</i><![endif]-->
      Consulter mon devis
      <!--[if mso]><i style="mso-font-width:300%;" hidden>&emsp;&#8203;</i><![endif]-->
    </a>
  </td></tr>
  </table>

  <p style="color:#475569;font-size:13px;text-align:center;margin:0 0 8px;line-height:1.6;">
    Ce lien s&eacute;curis&eacute; vous permet de consulter votre devis,<br>le t&eacute;l&eacute;charger et le signer &eacute;lectroniquement en ligne.
  </p>
  {'<p style="color:#475569;font-size:13px;text-align:center;margin:8px 0 0;line-height:1.6;">Le devis est &eacute;galement joint &agrave; cet email en pi&egrave;ce jointe PDF.</p>' if body.pdf_base64 else ''}
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 28px;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>

<!-- Footer signature -->
<tr><td style="padding:24px 28px 28px;text-align:center;">
  <p style="color:#1e293b;font-size:16px;font-weight:700;margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;">SR R&eacute;novation</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr><td style="padding:4px 0;color:#475569;font-size:13px;line-height:1.5;">
      &#9742; 06 80 33 45 46
    </td></tr>
    <tr><td style="padding:4px 0;color:#475569;font-size:13px;line-height:1.5;">
      &#9993; <a href="mailto:SrRenovation03@gmail.com" style="color:#3b82f6;text-decoration:none;">SrRenovation03@gmail.com</a>
    </td></tr>
    <tr><td style="padding:4px 0;color:#475569;font-size:13px;line-height:1.5;">
      &#127968; Jura (39) &mdash; Artisan local &amp; certifi&eacute;
    </td></tr>
    <tr><td style="padding:4px 0;color:#475569;font-size:13px;line-height:1.5;">
      &#127760; <a href="https://sr-renovation.fr" style="color:#3b82f6;text-decoration:none;">sr-renovation.fr</a>
    </td></tr>
  </table>
</td></tr>

</table>
<!-- End main container -->

</td></tr>
</table>
</body>
</html>"""

    try:
        sender = f"SR Renovation <{SENDER_EMAIL}>"
        params = {
            "from": sender,
            "to": [body.recipient_email],
            "reply_to": REPLY_TO_EMAIL,
            "subject": body.subject,
            "html": html_content,
        }
        # Attach PDF if provided
        if body.pdf_base64 and body.pdf_filename:
            params["attachments"] = [{
                "filename": body.pdf_filename,
                "content": body.pdf_base64,
            }]
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
