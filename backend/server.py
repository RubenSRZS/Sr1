from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
import resend
import json
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    phone: str
    email: EmailStr
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientCreate(BaseModel):
    name: str
    address: str
    phone: str
    email: EmailStr
    notes: Optional[str] = ""

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

class Quote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quote_number: str
    client_id: str
    client_name: str
    client_address: str
    client_phone: str
    client_email: str
    date: str
    work_location: str
    work_surface: str
    diagnostic: Optional[Diagnostic] = None
    services: List[Service]
    total_brut: float
    remise: float = 0.0
    total_net: float
    acompte_30: float
    notes: Optional[str] = ""
    status: str = "draft"  # draft, sent, accepted, refused
    signature_data: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuoteCreate(BaseModel):
    client_id: str
    work_location: str
    work_surface: str
    diagnostic: Optional[Diagnostic] = None
    services: List[Service]
    remise: float = 0.0
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
    client_email: str
    date: str
    work_location: str
    work_surface: str
    services: List[Service]
    total_brut: float
    remise: float = 0.0
    total_net: float
    acompte_paid: float = 0.0
    reste_a_payer: float
    payment_status: str = "pending"  # pending, partial, paid
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvoiceCreate(BaseModel):
    quote_id: Optional[str] = None
    client_id: str
    work_location: str
    work_surface: str
    services: List[Service]
    remise: float = 0.0
    acompte_paid: float = 0.0
    notes: Optional[str] = ""

class CatalogItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # TOITURE, FAÇADE, ZINGUERIE & HABILLAGE, SOLS & EXTÉRIEURS
    service_name: str
    description: str
    default_price: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CatalogItemCreate(BaseModel):
    category: str
    service_name: str
    description: str
    default_price: Optional[float] = None

class AIGenerateRequest(BaseModel):
    client_name: str
    client_address: str
    client_phone: str
    client_email: str
    work_location: str
    work_description: str
    document_type: str  # "quote" or "invoice"

class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    document_id: str
    document_type: str  # "quote" or "invoice"

# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Sr-Renovation API"}

# ==================== CLIENTS ====================

@api_router.post("/clients", response_model=Client)
async def create_client(input: ClientCreate):
    client_dict = input.model_dump()
    client_obj = Client(**client_dict)
    
    doc = client_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.clients.insert_one(doc)
    return client_obj

@api_router.get("/clients", response_model=List[Client])
async def get_clients():
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    
    for client in clients:
        if isinstance(client['created_at'], str):
            client['created_at'] = datetime.fromisoformat(client['created_at'])
    
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    if isinstance(client['created_at'], str):
        client['created_at'] = datetime.fromisoformat(client['created_at'])
    
    return client

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, input: ClientCreate):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = input.model_dump()
    await db.clients.update_one({"id": client_id}, {"$set": update_data})
    
    updated_client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if isinstance(updated_client['created_at'], str):
        updated_client['created_at'] = datetime.fromisoformat(updated_client['created_at'])
    
    return updated_client

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"status": "success", "message": "Client deleted"}

# ==================== CATALOG ====================

@api_router.post("/catalog", response_model=CatalogItem)
async def create_catalog_item(input: CatalogItemCreate):
    item_dict = input.model_dump()
    item_obj = CatalogItem(**item_dict)
    
    doc = item_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.catalog.insert_one(doc)
    return item_obj

@api_router.get("/catalog", response_model=List[CatalogItem])
async def get_catalog():
    items = await db.catalog.find({}, {"_id": 0}).to_list(1000)
    
    for item in items:
        if isinstance(item['created_at'], str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    
    return items

@api_router.delete("/catalog/{item_id}")
async def delete_catalog_item(item_id: str):
    result = await db.catalog.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Catalog item not found")
    return {"status": "success", "message": "Catalog item deleted"}

# ==================== QUOTES ====================

@api_router.post("/quotes", response_model=Quote)
async def create_quote(input: QuoteCreate):
    # Get client info
    client = await db.clients.find_one({"id": input.client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Calculate totals
    total_brut = sum(s.total for s in input.services)
    total_net = total_brut - input.remise
    acompte_30 = total_net * 0.30
    
    # Generate quote number
    count = await db.quotes.count_documents({})
    quote_number = f"DEV-{datetime.now().year}-{count + 1:04d}"
    
    quote_dict = {
        "quote_number": quote_number,
        "client_id": input.client_id,
        "client_name": client["name"],
        "client_address": client["address"],
        "client_phone": client["phone"],
        "client_email": client["email"],
        "date": datetime.now().strftime("%d/%m/%Y"),
        "work_location": input.work_location,
        "work_surface": input.work_surface,
        "diagnostic": input.diagnostic.model_dump() if input.diagnostic else None,
        "services": [s.model_dump() for s in input.services],
        "total_brut": total_brut,
        "remise": input.remise,
        "total_net": total_net,
        "acompte_30": acompte_30,
        "notes": input.notes,
        "status": "draft"
    }
    
    quote_obj = Quote(**quote_dict)
    doc = quote_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.quotes.insert_one(doc)
    return quote_obj

@api_router.get("/quotes", response_model=List[Quote])
async def get_quotes():
    quotes = await db.quotes.find({}, {"_id": 0}).to_list(1000)
    
    for quote in quotes:
        if isinstance(quote['created_at'], str):
            quote['created_at'] = datetime.fromisoformat(quote['created_at'])
    
    return quotes

@api_router.get("/quotes/{quote_id}", response_model=Quote)
async def get_quote(quote_id: str):
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    if isinstance(quote['created_at'], str):
        quote['created_at'] = datetime.fromisoformat(quote['created_at'])
    
    return quote

@api_router.put("/quotes/{quote_id}", response_model=Quote)
async def update_quote(quote_id: str, input: QuoteCreate):
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Get client info
    client = await db.clients.find_one({"id": input.client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Calculate totals
    total_brut = sum(s.total for s in input.services)
    total_net = total_brut - input.remise
    acompte_30 = total_net * 0.30
    
    update_data = {
        "client_id": input.client_id,
        "client_name": client["name"],
        "client_address": client["address"],
        "client_phone": client["phone"],
        "client_email": client["email"],
        "work_location": input.work_location,
        "work_surface": input.work_surface,
        "diagnostic": input.diagnostic.model_dump() if input.diagnostic else None,
        "services": [s.model_dump() for s in input.services],
        "total_brut": total_brut,
        "remise": input.remise,
        "total_net": total_net,
        "acompte_30": acompte_30,
        "notes": input.notes
    }
    
    await db.quotes.update_one({"id": quote_id}, {"$set": update_data})
    
    updated_quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if isinstance(updated_quote['created_at'], str):
        updated_quote['created_at'] = datetime.fromisoformat(updated_quote['created_at'])
    
    return updated_quote

@api_router.patch("/quotes/{quote_id}/status")
async def update_quote_status(quote_id: str, status: str, signature_data: Optional[str] = None):
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    update_data = {"status": status}
    if signature_data:
        update_data["signature_data"] = signature_data
    
    await db.quotes.update_one({"id": quote_id}, {"$set": update_data})
    return {"status": "success", "message": "Quote status updated"}

@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str):
    result = await db.quotes.delete_one({"id": quote_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"status": "success", "message": "Quote deleted"}

# ==================== INVOICES ====================

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(input: InvoiceCreate):
    # Get client info
    client = await db.clients.find_one({"id": input.client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Calculate totals
    total_brut = sum(s.total for s in input.services)
    total_net = total_brut - input.remise
    reste_a_payer = total_net - input.acompte_paid
    
    # Generate invoice number
    count = await db.invoices.count_documents({})
    invoice_number = f"FACT-{datetime.now().year}-{count + 1:04d}"
    
    invoice_dict = {
        "invoice_number": invoice_number,
        "quote_id": input.quote_id,
        "client_id": input.client_id,
        "client_name": client["name"],
        "client_address": client["address"],
        "client_phone": client["phone"],
        "client_email": client["email"],
        "date": datetime.now().strftime("%d/%m/%Y"),
        "work_location": input.work_location,
        "work_surface": input.work_surface,
        "services": [s.model_dump() for s in input.services],
        "total_brut": total_brut,
        "remise": input.remise,
        "total_net": total_net,
        "acompte_paid": input.acompte_paid,
        "reste_a_payer": reste_a_payer,
        "payment_status": "paid" if reste_a_payer <= 0 else ("partial" if input.acompte_paid > 0 else "pending"),
        "notes": input.notes
    }
    
    invoice_obj = Invoice(**invoice_dict)
    doc = invoice_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.invoices.insert_one(doc)
    return invoice_obj

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices():
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    
    for invoice in invoices:
        if isinstance(invoice['created_at'], str):
            invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
    
    return invoices

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if isinstance(invoice['created_at'], str):
        invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
    
    return invoice

@api_router.post("/invoices/from-quote/{quote_id}", response_model=Invoice)
async def create_invoice_from_quote(quote_id: str):
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Calculate totals
    total_brut = quote["total_brut"]
    remise = quote["remise"]
    total_net = quote["total_net"]
    acompte_paid = quote["acompte_30"]
    reste_a_payer = total_net - acompte_paid
    
    # Generate invoice number
    count = await db.invoices.count_documents({})
    invoice_number = f"FACT-{datetime.now().year}-{count + 1:04d}"
    
    invoice_dict = {
        "invoice_number": invoice_number,
        "quote_id": quote_id,
        "client_id": quote["client_id"],
        "client_name": quote["client_name"],
        "client_address": quote["client_address"],
        "client_phone": quote["client_phone"],
        "client_email": quote["client_email"],
        "date": datetime.now().strftime("%d/%m/%Y"),
        "work_location": quote["work_location"],
        "work_surface": quote["work_surface"],
        "services": quote["services"],
        "total_brut": total_brut,
        "remise": remise,
        "total_net": total_net,
        "acompte_paid": acompte_paid,
        "reste_a_payer": reste_a_payer,
        "payment_status": "partial",
        "notes": quote.get("notes", "")
    }
    
    invoice_obj = Invoice(**invoice_dict)
    doc = invoice_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.invoices.insert_one(doc)
    return invoice_obj

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str):
    result = await db.invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"status": "success", "message": "Invoice deleted"}

# ==================== AI GENERATION ====================

@api_router.post("/ai/generate")
async def generate_document_with_ai(input: AIGenerateRequest):
    try:
        emergent_key = os.environ.get('EMERGENT_LLM_KEY')
        if not emergent_key:
            raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
        
        # Get catalog items for context
        catalog_items = await db.catalog.find({}, {"_id": 0}).to_list(1000)
        catalog_text = "\n".join([f"- {item['category']}: {item['service_name']} - {item['description']}" for item in catalog_items])
        
        prompt = f"""Tu es un assistant spécialisé dans la génération de {input.document_type}s professionnels pour Sr-Renovation, une entreprise de rénovation de toiture.

TEXTE BRUT FOURNI PAR L'ARTISAN (peut contenir infos client + travaux + prix):
{input.work_description}

INSTRUCTIONS IMPORTANTES:
1. EXTRAIS d'abord les informations client si présentes dans le texte (nom, adresse, email, surface)
2. EXTRAIS les services/travaux mentionnés avec leurs prix au m² ou totaux
3. APPLIQUE les remises mentionnées (ex: -30%)
4. GÉNÈRE les services professionnels détaillés
5. Si le texte contient déjà les calculs faits par l'artisan, RESPECTE-LES

Catalogue de services Sr-Renovation disponibles:
{catalog_text}

EXEMPLE de texte brut que tu peux recevoir:
"Mr Clere Nicolas, 2 Rue des Maisonnettes, 25480 Ecole-Valentin
140 M2 sans panneau solaire
Demoussage + Traitement action rapide 10€ m2
Promotion -30% = 7€ m2
Total: 7 x 140 = 980€"

Réponds UNIQUEMENT avec un JSON valide au format suivant:
{{
  "client_info_extracted": {{
    "name": "Nom extrait ou null",
    "address": "Adresse extraite ou null",
    "email": "Email extrait ou null",
    "surface": "Surface extraite ou null"
  }},
  "services": [
    {{
      "description": "Description professionnelle complète et détaillée du service (repris du texte ou généré)",
      "quantity": 140.0,
      "unit_price": 7.0,
      "total": 980.0
    }}
  ],
  "diagnostic": {{
    "mousses": true,
    "lichens": false,
    "tuiles_cassees": false,
    "faitage": false,
    "gouttieres": false,
    "facade": false
  }},
  "work_surface": "140m²",
  "remise_appliquee": 0,
  "notes": "Notes professionnelles (promotions appliquées, etc.)"
}}

RÈGLES IMPORTANTES:
- Si des prix sont donnés dans le texte, UTILISE-LES
- Si une remise est mentionnée, NOTE-LA dans les notes
- Les descriptions doivent être professionnelles style "Sr-Renovation"
- Respecte les calculs de l'artisan s'ils sont présents"""
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"sr-reno-{uuid.uuid4()}",
            system_message="Tu es un expert en rénovation. Tu génères des devis et factures professionnels en français sans aucune faute."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            result = json.loads(response_text)
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {response}")
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
            
    except Exception as e:
        logger.error(f"AI generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

# ==================== EMAIL ====================

@api_router.post("/send-email")
async def send_document_email(request: EmailRequest):
    try:
        resend_key = os.environ.get('RESEND_API_KEY')
        if not resend_key:
            raise HTTPException(status_code=500, detail="RESEND_API_KEY not configured. Please add your Resend API key in settings.")
        
        resend.api_key = resend_key
        
        # Get document
        if request.document_type == "quote":
            doc = await db.quotes.find_one({"id": request.document_id}, {"_id": 0})
            doc_type_label = "Devis"
            doc_number = doc["quote_number"]
        else:
            doc = await db.invoices.find_one({"id": request.document_id}, {"_id": 0})
            doc_type_label = "Facture"
            doc_number = doc["invoice_number"]
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Generate PDF (simplified version - in production you'd attach actual PDF)
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .header {{ background-color: #0F172A; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .footer {{ background-color: #F97316; color: white; padding: 15px; text-align: center; margin-top: 30px; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #F97316; color: white; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>SR RÉNOVATION</h1>
                <p>Ruben SUAREZ-SAR - 06 80 33 45 46</p>
            </div>
            <div class="content">
                <h2>{doc_type_label} n° {doc_number}</h2>
                <p><strong>Client:</strong> {doc['client_name']}</p>
                <p><strong>Date:</strong> {doc['date']}</p>
                <p><strong>Lieu des travaux:</strong> {doc['work_location']}</p>
                
                <h3>Détail des services</h3>
                <table>
                    <tr>
                        <th>Description</th>
                        <th>Quantité</th>
                        <th>Prix unitaire</th>
                        <th>Total</th>
                    </tr>
        """
        
        for service in doc['services']:
            html_content += f"""
                    <tr>
                        <td>{service['description']}</td>
                        <td>{service['quantity']}</td>
                        <td>{service['unit_price']:.2f} €</td>
                        <td>{service['total']:.2f} €</td>
                    </tr>
            """
        
        html_content += f"""
                </table>
                
                <p><strong>Total brut:</strong> {doc['total_brut']:.2f} €</p>
                <p><strong>Remise:</strong> {doc['remise']:.2f} €</p>
                <p><strong>Total net:</strong> {doc['total_net']:.2f} €</p>
        """
        
        if request.document_type == "quote":
            html_content += f"<p><strong>Acompte 30%:</strong> {doc['acompte_30']:.2f} €</p>"
        else:
            html_content += f"""
                <p><strong>Acompte déjà versé:</strong> {doc['acompte_paid']:.2f} €</p>
                <p><strong>Reste à payer:</strong> {doc['reste_a_payer']:.2f} €</p>
            """
        
        html_content += """
            </div>
            <div class="footer">
                <p>Sr-Renovation.fr - SIRET 894 908 227 00024</p>
                <p>Travaux couverts par l'assurance RC Professionnelle Banque Populaire</p>
            </div>
        </body>
        </html>
        """
        
        sender_email = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
        
        params = {
            "from": sender_email,
            "to": [request.recipient_email],
            "subject": request.subject,
            "html": html_content
        }
        
        email = await asyncio.to_thread(resend.Emails.send, params)
        
        return {
            "status": "success",
            "message": f"Email sent to {request.recipient_email}",
            "email_id": email.get("id")
        }
        
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

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
    
    # Calculate revenue
    all_invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    total_revenue = sum(inv["total_net"] for inv in all_invoices)
    pending_revenue = sum(inv["reste_a_payer"] for inv in all_invoices if inv["payment_status"] != "paid")
    
    return {
        "total_clients": total_clients,
        "total_quotes": total_quotes,
        "total_invoices": total_invoices,
        "quotes_by_status": {
            "draft": quotes_draft,
            "sent": quotes_sent,
            "accepted": quotes_accepted
        },
        "invoices_by_status": {
            "pending": invoices_pending,
            "partial": invoices_partial,
            "paid": invoices_paid
        },
        "revenue": {
            "total": total_revenue,
            "pending": pending_revenue
        }
    }

# Include router and middleware
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