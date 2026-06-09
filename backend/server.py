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
import json
from google import genai
from google.genai import types
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

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

# Gemini config
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY, http_options={'api_version': 'v1alpha'})

# ==================== RELANCE CONFIG ====================
scheduler = AsyncIOScheduler()

DEFAULT_RELANCE_TEMPLATES = {
    3: {
        "day": 3,
        "subject": "Rappel - Votre devis SR Rénovation n°{quote_number}",
        "body": "Bonjour {client_name},\n\nJe me permets de revenir vers vous concernant le devis n°{quote_number} que je vous ai adressé récemment pour votre chantier à {work_location} (montant : {total_net} €).\n\nJe reste entièrement disponible pour répondre à vos questions ou apporter des précisions sur notre proposition.\n\nN'hésitez pas à me contacter directement ou à consulter votre devis en ligne via le lien ci-dessous.\n\nCordialement,\nRuben Suarez – SR Rénovation"
    },
    7: {
        "day": 7,
        "subject": "Votre devis n°{quote_number} — Des questions ?",
        "body": "Bonjour {client_name},\n\nJe fais suite à mon précédent message concernant votre devis n°{quote_number} (montant : {total_net} €).\n\nAvez-vous eu l'opportunité d'en prendre connaissance ? Y a-t-il des points sur lesquels vous souhaiteriez des éclaircissements ou des ajustements ?\n\nJe suis à votre disposition pour adapter notre proposition à vos besoins. Votre satisfaction est ma priorité.\n\nBien cordialement,\nRuben Suarez – SR Rénovation"
    },
    14: {
        "day": 14,
        "subject": "Votre projet à {work_location} — Devis n°{quote_number} encore disponible",
        "body": "Bonjour {client_name},\n\nJe reviens vers vous au sujet de votre devis n°{quote_number} pour votre chantier à {work_location} (montant : {total_net} €).\n\nNous pouvons démarrer les travaux dans les meilleurs délais dès validation de votre devis.\n\nSi vous avez des interrogations, je suis disponible pour en discuter au 06 80 33 45 46.\n\nCordialement,\nRuben Suarez – SR Rénovation"
    },
    30: {
        "day": 30,
        "subject": "Dernière relance — Devis n°{quote_number}",
        "body": "Bonjour {client_name},\n\nCeci est mon dernier message concernant votre devis n°{quote_number} d'un montant de {total_net} € pour votre chantier à {work_location}.\n\nJe garde votre dossier ouvert encore quelques jours. Si votre situation a évolué ou si vous souhaitez retravailler le projet, n'hésitez pas à me recontacter à tout moment.\n\nBonne continuation,\nRuben Suarez – SR Rénovation"
    }
}

def build_relance_html(body_html: str, public_link: str, relance_day: int,
                       quote_number: str = "", total_net: str = "", work_location: str = "") -> str:
    wa_link = "https://wa.me/33680334546"
    tel_link = "tel:0680334546"
    mail_link = "mailto:SrRenovation03@gmail.com"

    quote_card = ""
    if quote_number or total_net or work_location:
        quote_card = f"""
<tr><td style="padding:0 28px 20px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="border-left:4px solid #f97316;background:#fff7ed;border-radius:0 8px 8px 0;padding:12px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="font-size:12px;color:#9a3412;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Devis en attente de signature</td>
      <td align="right" style="font-size:20px;font-weight:800;color:#ea580c;white-space:nowrap;">{total_net}&nbsp;€</td>
    </tr>
    <tr>
      <td colspan="2" style="font-size:13px;font-weight:700;color:#1c1917;padding-top:2px;">{quote_number}{("&nbsp;·&nbsp;" + work_location) if work_location else ""}</td>
    </tr>
    </table>
  </td></tr>
  </table>
</td></tr>"""

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Inter',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f4f6">
<tr><td align="center" style="padding:20px 12px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:580px;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- HEADER — gradient site exact -->
  <tr><td style="background:linear-gradient(to right,#2563eb,#f97316);padding:20px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td>
        <p style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:0.5px;">SR Rénovation</p>
        <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.75);">Nettoyage Toiture &amp; Habitat</p>
      </td>
      <td align="right">
        <a href="{tel_link}" style="display:inline-block;background:rgba(255,255,255,0.2);color:#fff;text-decoration:none;font-size:12px;font-weight:700;padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.3);">06 80 33 45 46</a>
      </td>
    </tr>
    </table>
  </td></tr>

  <!-- BODY — fond blanc -->
  <tr><td style="background:#ffffff;padding:28px 28px 8px;">

    <!-- Message -->
    <p style="margin:0 0 20px;color:#1f2937;font-size:15px;line-height:1.8;">{body_html}</p>

  </td></tr>

  <!-- QUOTE CARD -->
  {quote_card}

  <!-- PRIMARY CTA -->
  <tr><td style="background:#fff;padding:0 28px 20px;text-align:center;">
    <a href="{public_link}" style="display:inline-block;background:linear-gradient(to right,#f97316,#ea580c);color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:700;">
      Voir mon devis &rarr;
    </a>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="background:#fff;padding:0 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="border-top:1px solid #e5e7eb;"></td>
      <td style="padding:0 10px;white-space:nowrap;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Me contacter directement</td>
      <td style="border-top:1px solid #e5e7eb;"></td>
    </tr>
    </table>
  </td></tr>

  <!-- 3 BOUTONS — style site -->
  <tr><td style="background:#fff;padding:12px 28px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td width="32%" align="center" style="padding-right:5px;">
        <a href="{tel_link}" style="display:block;border:2px solid #2563eb;color:#2563eb;text-decoration:none;padding:10px 0;border-radius:8px;font-size:13px;font-weight:700;text-align:center;">Appeler</a>
      </td>
      <td width="36%" align="center" style="padding:0 2px;">
        <a href="{wa_link}" style="display:block;background:linear-gradient(to right,#22c55e,#16a34a);color:#fff;text-decoration:none;padding:10px 0;border-radius:8px;font-size:13px;font-weight:700;text-align:center;">WhatsApp</a>
      </td>
      <td width="32%" align="center" style="padding-left:5px;">
        <a href="{mail_link}" style="display:block;border:2px solid #e5e7eb;color:#6b7280;text-decoration:none;padding:10px 0;border-radius:8px;font-size:13px;font-weight:700;text-align:center;">Email</a>
      </td>
    </tr>
    </table>
  </td></tr>

  <!-- BOTTOM LINK -->
  <tr><td style="background:#f9fafb;padding:12px 28px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">
      <a href="{tel_link}" style="color:#6b7280;text-decoration:none;">06 80 33 45 46</a>
      &nbsp;&bull;&nbsp;
      <a href="{mail_link}" style="color:#6b7280;text-decoration:none;">SrRenovation03@gmail.com</a>
      &nbsp;&bull;&nbsp;
      <a href="https://sr-renovation.fr" style="color:#6b7280;text-decoration:none;">sr-renovation.fr</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""
    badge_labels = {3: "1er rappel", 7: "2ème rappel", 14: "3ème rappel", 30: "Dernière chance"}
    badge = badge_labels.get(relance_day, f"Relance J+{relance_day}")
    wa_link = "https://wa.me/33680334546"
    tel_link = "tel:0680334546"
    mail_link = "mailto:SrRenovation03@gmail.com"

    quote_card = ""
    if quote_number or total_net or work_location:
        quote_card = f"""
<tr><td style="padding:0 32px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="background:#eff6ff;border:1px solid #bfdbfe;border-left:5px solid #1e40af;border-radius:8px;padding:16px 20px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#3b82f6;">Votre devis en attente de signature</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:700;color:#1e293b;">{quote_number}{(" &nbsp;·&nbsp; " + work_location) if work_location else ""}</td>
      <td align="right" style="font-family:'Montserrat',sans-serif;font-size:22px;font-weight:900;color:#1e40af;white-space:nowrap;">{total_net}&nbsp;€</td>
    </tr>
    </table>
  </td></tr>
  </table>
</td></tr>"""

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
<tr><td align="center" style="padding:20px 12px 28px;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">

  <!-- TOP BAR bleu site -->
  <tr><td style="background:#1e40af;padding:10px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="font-family:'Montserrat',sans-serif;font-size:15px;font-weight:900;color:#fff;letter-spacing:1px;">&#9651;&nbsp;SR RÉNOVATION</td>
      <td align="right"><a href="{tel_link}" style="color:#fff;text-decoration:none;font-size:12px;font-weight:600;background:rgba(255,255,255,0.15);padding:4px 10px;border-radius:20px;">&#128222;&nbsp;06 80 33 45 46</a></td>
    </tr>
    </table>
  </td></tr>

  <!-- LIGNE ORANGE (comme le site) -->
  <tr><td style="background:#f97316;height:4px;line-height:4px;font-size:4px;">&nbsp;</td></tr>

  <!-- BADGE RELANCE -->
  <tr><td style="padding:20px 32px 4px;text-align:center;">
    <span style="display:inline-block;background:#fff7ed;border:1.5px solid #fed7aa;color:#f97316;font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">{badge}</span>
  </td></tr>

  <!-- QUOTE CARD -->
  {quote_card}

  <!-- BODY MESSAGE -->
  <tr><td style="padding:0 32px 28px;">
    <div style="color:#374151;font-size:15px;line-height:1.85;font-family:'Inter',sans-serif;">{body_html}</div>
  </td></tr>

  <!-- PRIMARY CTA -->
  <tr><td style="padding:0 32px 16px;text-align:center;">
    <a href="{public_link}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:15px 48px;border-radius:6px;font-family:'Montserrat',sans-serif;font-weight:700;font-size:15px;letter-spacing:0.3px;">
      Voir mon devis &rarr;
    </a>
  </td></tr>

  <!-- SÉPARATEUR "ou" -->
  <tr><td style="padding:4px 32px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="border-top:1px solid #e5e7eb;width:40%;"></td>
      <td style="text-align:center;padding:0 10px;font-size:11px;color:#9ca3af;white-space:nowrap;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">ou contactez-moi</td>
      <td style="border-top:1px solid #e5e7eb;width:40%;"></td>
    </tr>
    </table>
  </td></tr>

  <!-- SECONDARY CTAs (3 boutons) -->
  <tr><td style="padding:0 32px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td width="32%" align="center" style="padding-right:6px;">
        <a href="{tel_link}" style="display:block;border:2px solid #1e40af;color:#1e40af;text-decoration:none;padding:10px 4px;border-radius:6px;font-size:13px;font-weight:700;text-align:center;font-family:'Montserrat',sans-serif;">&#128222; Appeler</a>
      </td>
      <td width="36%" align="center" style="padding:0 3px;">
        <a href="{wa_link}" style="display:block;background:#25d366;color:#fff;text-decoration:none;padding:10px 4px;border-radius:6px;font-size:13px;font-weight:700;text-align:center;font-family:'Montserrat',sans-serif;">&#128172; WhatsApp</a>
      </td>
      <td width="32%" align="center" style="padding-left:6px;">
        <a href="{mail_link}" style="display:block;border:2px solid #e5e7eb;color:#6b7280;text-decoration:none;padding:10px 4px;border-radius:6px;font-size:13px;font-weight:700;text-align:center;font-family:'Montserrat',sans-serif;">&#9993; Email</a>
      </td>
    </tr>
    </table>
  </td></tr>

  <!-- BARRE STATS bleu→orange (comme le site) -->
  <tr><td style="background:linear-gradient(90deg,#1e40af 0%,#3b82f6 50%,#f97316 100%);padding:14px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="color:#fff;text-align:center;font-size:10px;font-weight:700;font-family:'Montserrat',sans-serif;padding:0 2px;">&#128205;<br>Artisan local<br><span style="font-weight:400;opacity:0.8;">Jura (39)</span></td>
      <td style="color:#fff;text-align:center;font-size:10px;font-weight:700;font-family:'Montserrat',sans-serif;padding:0 2px;">&#10004;<br>RC-PRO<br><span style="font-weight:400;opacity:0.8;">Assuré</span></td>
      <td style="color:#fff;text-align:center;font-size:10px;font-weight:700;font-family:'Montserrat',sans-serif;padding:0 2px;">&#9889;<br>Intervention<br><span style="font-weight:400;opacity:0.8;">Rapide</span></td>
      <td style="color:#fff;text-align:center;font-size:10px;font-weight:700;font-family:'Montserrat',sans-serif;padding:0 2px;">&#128203;<br>Devis<br><span style="font-weight:400;opacity:0.8;">Sous 24h</span></td>
    </tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:16px 24px;text-align:center;background:#f8fafc;border-top:1px solid #e5e7eb;">
    <p style="margin:0 0 4px;font-size:12px;color:#64748b;">
      <a href="{tel_link}" style="color:#1e40af;text-decoration:none;font-weight:600;">06 80 33 45 46</a>
      &nbsp;&bull;&nbsp;
      <a href="{mail_link}" style="color:#1e40af;text-decoration:none;font-weight:600;">SrRenovation03@gmail.com</a>
      &nbsp;&bull;&nbsp;
      <a href="https://sr-renovation.fr" style="color:#1e40af;text-decoration:none;font-weight:600;">sr-renovation.fr</a>
    </p>
    <p style="margin:0;font-size:11px;color:#94a3b8;">SR Rénovation &mdash; Toiture &middot; Fa&ccedil;ade &middot; Zinguerie &middot; Sols &amp; Ext&eacute;rieurs</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""
    badge_labels = {3: "1er rappel", 7: "2ème rappel", 14: "3ème rappel", 30: "Dernier rappel"}
    badge = badge_labels.get(relance_day, f"Relance J+{relance_day}")
    wa_link = "https://wa.me/33680334546"
    tel_link = "tel:0680334546"
    mail_link = "mailto:SrRenovation03@gmail.com"

    quote_card = ""
    if quote_number or total_net or work_location:
        quote_card = f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
<tr><td style="background:#f8faff;border:1px solid #dbeafe;border-left:4px solid #3b82f6;border-radius:10px;padding:14px 18px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Votre devis en attente</td>
    <td align="right" style="font-size:20px;font-weight:800;color:#1e40af;">{total_net} €</td>
  </tr>
  <tr>
    <td colspan="2" style="padding-top:4px;font-size:13px;color:#374151;">
      <span style="font-weight:700;color:#1e40af;">{quote_number}</span>
      {"&nbsp;·&nbsp;" + work_location if work_location else ""}
    </td>
  </tr>
  </table>
</td></tr>
</table>"""

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<title>SR Rénovation</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
<tr><td align="center" style="padding:24px 12px 32px;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

    <!-- HEADER -->
    <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#1d4ed8 100%);border-radius:16px 16px 0 0;padding:32px 36px 28px;text-align:center;">
      <p style="margin:0 0 6px;font-family:'Montserrat',sans-serif;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:1.5px;text-transform:uppercase;">SR Rénovation</p>
      <p style="margin:0 0 14px;font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">Toiture · Façade · Zinguerie</p>
      <span style="display:inline-block;background:rgba(249,115,22,0.9);color:#fff;font-size:11px;font-weight:700;padding:5px 16px;border-radius:20px;letter-spacing:0.5px;">{badge}</span>
    </td></tr>

    <!-- BODY -->
    <tr><td style="background:#ffffff;padding:36px 36px 28px;">
      {quote_card}
      <p style="color:#1e293b;font-size:15px;line-height:1.9;margin:0 0 28px;font-family:'Inter',sans-serif;">{body_html}</p>

      <!-- PRIMARY CTA -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr><td align="center">
        <a href="{public_link}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#ffffff;text-decoration:none;padding:16px 44px;border-radius:50px;font-family:'Montserrat',sans-serif;font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 15px rgba(249,115,22,0.35);">
          Voir mon devis &rarr;
        </a>
      </td></tr>
      </table>

      <!-- DIVIDER -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="border-top:1px solid #e2e8f0;"></td>
        <td style="padding:0 12px;font-size:11px;color:#94a3b8;white-space:nowrap;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ou contactez-moi directement</td>
        <td style="border-top:1px solid #e2e8f0;"></td>
      </tr>
      </table>

      <!-- SECONDARY CTAs -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="33%" style="padding:0 5px 0 0;" align="center">
          <a href="{tel_link}" style="display:block;background:#f0fdf4;border:1.5px solid #bbf7d0;color:#15803d;text-decoration:none;padding:12px 8px;border-radius:12px;font-size:13px;font-weight:700;text-align:center;">
            &#128222; Appeler
          </a>
        </td>
        <td width="33%" style="padding:0 2px;" align="center">
          <a href="{wa_link}" style="display:block;background:#f0fdf4;border:1.5px solid #bbf7d0;color:#15803d;text-decoration:none;padding:12px 8px;border-radius:12px;font-size:13px;font-weight:700;text-align:center;">
            &#128172; WhatsApp
          </a>
        </td>
        <td width="33%" style="padding:0 0 0 5px;" align="center">
          <a href="{mail_link}" style="display:block;background:#eff6ff;border:1.5px solid #bfdbfe;color:#1d4ed8;text-decoration:none;padding:12px 8px;border-radius:12px;font-size:13px;font-weight:700;text-align:center;">
            &#9993; R&eacute;pondre
          </a>
        </td>
      </tr>
      </table>
    </td></tr>

    <!-- FOOTER -->
    <tr><td style="background:#0f172a;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
      <p style="color:#f8fafc;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;margin:0 0 6px;">Ruben Suarez &mdash; SR R&eacute;novation</p>
      <p style="color:#64748b;font-size:12px;margin:0 0 14px;line-height:1.8;">
        <a href="{tel_link}" style="color:#94a3b8;text-decoration:none;">06 80 33 45 46</a>
        &nbsp;&bull;&nbsp;
        <a href="{mail_link}" style="color:#94a3b8;text-decoration:none;">SrRenovation03@gmail.com</a>
        &nbsp;&bull;&nbsp;
        <a href="https://sr-renovation.fr" style="color:#94a3b8;text-decoration:none;">sr-renovation.fr</a>
      </p>
      <p style="color:#334155;font-size:11px;margin:0;">Jura (39) &mdash; Toiture &middot; Fa&ccedil;ade &middot; Zinguerie &middot; Sols &amp; Ext&eacute;rieurs</p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>"""

async def run_relances():
    today = datetime.now(timezone.utc)
    if today.weekday() == 6:
        logger.info("Relances: skipped (Sunday)")
        return
    thresholds = [3, 7, 14, 30]
    count = 0
    async for q in db.quotes.find(
        {"status": "sent", "relances_active": True, "sent_at": {"$exists": True, "$ne": None}},
        {"_id": 0}
    ):
        try:
            sent_at = datetime.fromisoformat(q["sent_at"].replace("Z", "+00:00"))
            days_since = (today - sent_at).days
            relances_sent = q.get("relances_sent", [])
            pending = next((t for t in thresholds if days_since >= t and t not in relances_sent), None)
            if pending is None:
                if days_since >= 30 and 30 in relances_sent:
                    await db.quotes.update_one({"id": q["id"]}, {"$set": {"relances_active": False}})
                continue
            tmpl = await db.relance_templates.find_one({"day": pending}, {"_id": 0})
            if not tmpl:
                tmpl = DEFAULT_RELANCE_TEMPLATES.get(pending)
            if not tmpl:
                continue
            fmt = dict(
                quote_number=q.get("quote_number", ""),
                client_name=q.get("client_name", ""),
                total_net=f"{q.get('total_net', 0):.2f}",
                work_location=q.get("work_location", "")
            )
            subject = tmpl["subject"].format(**fmt)
            body_html = tmpl["body"].replace('\n', '<br>').format(**fmt)
            base_url = os.environ.get("PUBLIC_APP_URL", "")
            public_link = f"{base_url}/devis/public/{q.get('public_token', '')}" if base_url else "#"
            html = build_relance_html(body_html, public_link, pending,
                                      quote_number=fmt["quote_number"],
                                      total_net=fmt["total_net"],
                                      work_location=fmt["work_location"])
            client_email = q.get("client_email", "")
            if client_email:
                params = {
                    "from": f"SR Renovation <{SENDER_EMAIL}>",
                    "to": [client_email],
                    "reply_to": REPLY_TO_EMAIL,
                    "subject": subject,
                    "html": html,
                }
                await asyncio.to_thread(resend.Emails.send, params)
                count += 1
            new_sent = relances_sent + [pending]
            now_str = datetime.now(timezone.utc).isoformat()
            upd = {"relances_sent": new_sent, "last_relance_at": now_str}
            if pending == 30:
                upd["relances_active"] = False
            await db.quotes.update_one({"id": q["id"]}, {"$set": upd})
            logger.info(f"Relance J+{pending} => quote {q['id']} / {client_email}")
        except Exception as e:
            logger.error(f"Relance error quote {q.get('id','?')}: {e}")
    logger.info(f"Relances run done: {count} sent")

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class Profile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    company_name: str
    siret: str = ""
    email: str
    phone: str
    address: str = ""
    iban: str = ""
    bic: str = ""
    account_holder: str = ""
    bank_name: str = ""
    insurance_decennale: str = ""
    insurance_rc_pro: str = ""
    is_default: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProfileCreate(BaseModel):
    name: str
    company_name: str
    siret: str = ""
    email: str
    phone: str
    address: str = ""
    iban: str = ""
    bic: str = ""
    account_holder: str = ""
    bank_name: str = ""
    insurance_decennale: str = ""
    insurance_rc_pro: str = ""

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
    remise_type: Optional[str] = "percent"  # "percent" ou "amount"
    remise_percent: float = 0.0
    remise_montant: float = 0.0
    total: float

class OptionBlock(BaseModel):
    title: Optional[str] = ""
    services: List[Service] = []
    remise_type: Optional[str] = "percent"
    remise_percent: float = 0.0
    remise_montant: float = 0.0

class QuoteCreate(BaseModel):
    client_id: Optional[str] = None
    new_client: Optional[ClientCreate] = None
    custom_quote_number: Optional[str] = None
    quote_title: Optional[str] = ""  # Titre du devis
    work_location: str
    work_surface: Optional[str] = ""
    diagnostic: Optional[dict] = None
    profile_id: Optional[str] = None  # Profil entreprise utilisé pour ce devis
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
    additional_options: Optional[List[OptionBlock]] = []  # Options dynamiques illimitées
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
    profile_id: Optional[str] = None
    company: Optional[dict] = None
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
    additional_options: Optional[List[dict]] = []  # Options dynamiques illimitées (avec totaux calculés)
    notes: Optional[str] = ""
    status: str = "draft"
    signature_data: Optional[str] = None
    selected_option: Optional[int] = None
    public_token: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    sent_at: Optional[str] = None
    sent_to_email: Optional[str] = None
    opened_at: Optional[str] = None
    signed_at: Optional[str] = None
    relances_active: bool = False
    relances_sent: List[int] = []
    last_relance_at: Optional[str] = None
    lost_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RelanceTemplate(BaseModel):
    day: int
    subject: str
    body: str
    updated_at: Optional[str] = None

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
    item_type: str = "service"  # "service" or "note_condition"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CatalogItemCreate(BaseModel):
    category: str
    service_name: str
    description: str
    default_price: Optional[float] = None
    default_unit: str = "unité"
    color: Optional[str] = None
    item_type: str = "service"

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

async def resolve_company(profile_id):
    """Retourne un snapshot des coordonnées de l'entreprise à partir d'un profil.
    Si profile_id est absent/introuvable, utilise le profil par défaut, puis le premier profil."""
    profile = None
    if profile_id:
        profile = await db.profiles.find_one({"id": profile_id}, {"_id": 0})
    if not profile:
        profile = await db.profiles.find_one({"is_default": True}, {"_id": 0})
    if not profile:
        profile = await db.profiles.find_one({}, {"_id": 0})
    if not profile:
        return None, None
    company = {
        "company_name": profile.get("company_name", ""),
        "account_holder": profile.get("account_holder", ""),
        "address": profile.get("address", ""),
        "phone": profile.get("phone", ""),
        "email": profile.get("email", ""),
        "siret": profile.get("siret", ""),
        "iban": profile.get("iban", ""),
        "bic": profile.get("bic", ""),
        "bank_name": profile.get("bank_name", ""),
    }
    return profile.get("id"), company

def compute_option_block(opt: OptionBlock) -> dict:
    """Calcule les totaux d'un bloc d'option dynamique."""
    services = opt.services or []
    total_brut = round(sum(s.total for s in services), 2)
    if opt.remise_type == "amount":
        remise = round(opt.remise_montant or 0, 2)
    else:
        remise = round(total_brut * (opt.remise_percent or 0) / 100, 2)
    total_net = round(max(total_brut - remise, 0), 2)
    acompte_30 = round(total_net * 0.30, 2)
    return {
        "title": opt.title or "",
        "services": [s.model_dump() for s in services],
        "remise_type": opt.remise_type or "percent",
        "remise_percent": opt.remise_percent or 0,
        "remise_montant": opt.remise_montant or 0,
        "total_brut": total_brut,
        "remise": remise,
        "total_net": total_net,
        "acompte_30": acompte_30,
    }

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

# ==================== PROFILES ====================

@api_router.get("/profiles", response_model=List[Profile])
async def get_profiles():
    profiles = await db.profiles.find({}, {"_id": 0}).to_list(1000)
    # Ensure at least one default profile exists
    if not profiles:
        default_profile = {
            "id": str(uuid.uuid4()),
            "name": "Ruben",
            "company_name": "SR Rénovation",
            "siret": "",
            "email": "Srrenovation03@gmail.com",
            "phone": "06 80 33 45 46",
            "address": "Jura (39)",
            "iban": "FR76 1080 7000 1312 3197 7296 321",
            "bic": "CCBPFRPPDJN",
            "account_holder": "M RUBEN SUAREZ-SAR",
            "bank_name": "Banque Populaire BFC",
            "insurance_decennale": "",
            "insurance_rc_pro": "",
            "is_default": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.profiles.insert_one(default_profile)
        profiles = [default_profile]
    return profiles

@api_router.post("/profiles", response_model=Profile)
async def create_profile(profile: ProfileCreate):
    new_profile = {
        "id": str(uuid.uuid4()),
        **profile.model_dump(),
        "is_default": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.profiles.insert_one(new_profile)
    return new_profile

@api_router.put("/profiles/{profile_id}", response_model=Profile)
async def update_profile(profile_id: str, profile: ProfileCreate):
    updated = {
        **profile.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.profiles.update_one({"id": profile_id}, {"$set": updated})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
    updated_profile = await db.profiles.find_one({"id": profile_id}, {"_id": 0})
    return updated_profile

@api_router.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: str):
    # Check if it's the default profile
    profile = await db.profiles.find_one({"id": profile_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
    if profile.get("is_default"):
        raise HTTPException(status_code=400, detail="Impossible de supprimer le profil par défaut")
    await db.profiles.delete_one({"id": profile_id})
    return {"status": "success"}

@api_router.patch("/profiles/{profile_id}/set-default")
async def set_default_profile(profile_id: str):
    # Unset all defaults
    await db.profiles.update_many({}, {"$set": {"is_default": False}})
    # Set new default
    result = await db.profiles.update_one({"id": profile_id}, {"$set": {"is_default": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
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
    resolved_profile_id, company_snapshot = await resolve_company(input.profile_id)

    # Option 1 calculations
    total_brut = sum(s.total for s in input.services)
    remise_from_pct = round(total_brut * input.remise_percent / 100, 2) if input.remise_percent > 0 else 0
    remise = remise_from_pct if input.remise_percent > 0 else round(input.remise_montant, 2)
    total_net = round(total_brut - remise, 2)
    acompte_30 = round(total_net * 0.30, 2)
    
    # Options dynamiques (illimitées) — calcul des totaux
    computed_additional = [compute_option_block(o) for o in (input.additional_options or [])]

    # Rétro-compatibilité : dérive Option 2 / Option 3 depuis les 2 premières options dynamiques
    # si elles sont fournies, sinon utilise les anciens champs option_2 / option_3.
    def _legacy_block(idx, fallback_services, fallback_title, fallback_rtype, fallback_rpct, fallback_rmnt):
        if idx < len(computed_additional):
            b = computed_additional[idx]
            return {
                "services": [Service(**s) for s in b["services"]],
                "title": b["title"],
                "total_brut": b["total_brut"],
                "remise": b["remise"],
                "remise_percent": b["remise_percent"] if b["remise_type"] == "percent" else 0,
                "remise_montant": b["remise_montant"] if b["remise_type"] == "amount" else 0,
                "total_net": b["total_net"],
                "acompte_30": b["acompte_30"],
            }
        services = fallback_services or []
        tb = round(sum(s.total for s in services), 2)
        rem = round(tb * fallback_rpct / 100, 2) if fallback_rpct > 0 else round(fallback_rmnt, 2)
        tn = round(tb - rem, 2)
        return {
            "services": services, "title": fallback_title or "",
            "total_brut": tb, "remise": rem,
            "remise_percent": fallback_rpct, "remise_montant": fallback_rmnt,
            "total_net": tn, "acompte_30": round(tn * 0.30, 2),
        }

    use_dynamic = len(computed_additional) > 0
    b2 = _legacy_block(0, input.option_2_services, input.option_2_title, input.option_2_remise_type if hasattr(input, 'option_2_remise_type') else 'percent', input.option_2_remise_percent, input.option_2_remise_montant)
    b3 = _legacy_block(1, input.option_3_services, input.option_3_title, 'percent', input.option_3_remise_percent, input.option_3_remise_montant)
    # Si options dynamiques fournies mais moins de 2, vide la 2e/3e legacy non utilisée
    if use_dynamic and len(computed_additional) < 2:
        b3 = {"services": [], "title": "", "total_brut": 0, "remise": 0, "remise_percent": 0, "remise_montant": 0, "total_net": 0, "acompte_30": 0}

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
        profile_id=resolved_profile_id,
        company=company_snapshot,
        services=input.services,
        total_brut=total_brut,
        remise_percent=input.remise_percent,
        remise_montant=input.remise_montant,
        remise=remise,
        total_net=total_net,
        acompte_30=acompte_30,
        payment_plan=input.payment_plan or "acompte_solde",
        # Option 2 (legacy / dérivé de la 1ère option dynamique)
        option_2_services=b2["services"],
        option_2_total_brut=b2["total_brut"],
        option_2_remise_percent=b2["remise_percent"],
        option_2_remise_montant=b2["remise_montant"],
        option_2_remise=b2["remise"],
        option_2_total_net=b2["total_net"],
        option_2_acompte_30=b2["acompte_30"],
        notes=input.notes or "",
        quote_title=input.quote_title or "",
        option_1_title=input.option_1_title or "",
        option_2_title=b2["title"],
        # Option 3 (legacy / dérivé de la 2ème option dynamique)
        option_3_title=b3["title"],
        option_3_services=b3["services"],
        option_3_total_brut=b3["total_brut"],
        option_3_remise_percent=b3["remise_percent"],
        option_3_remise_montant=b3["remise_montant"],
        option_3_remise=b3["remise"],
        option_3_total_net=b3["total_net"],
        option_3_acompte_30=b3["acompte_30"],
        additional_options=computed_additional,
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
    resolved_profile_id, company_snapshot = await resolve_company(input.profile_id)

    # Option 1 calculations
    total_brut = sum(s.total for s in input.services)
    remise_from_pct = round(total_brut * input.remise_percent / 100, 2) if input.remise_percent > 0 else 0
    remise = remise_from_pct if input.remise_percent > 0 else round(input.remise_montant, 2)
    total_net = round(total_brut - remise, 2)
    acompte_30 = round(total_net * 0.30, 2)

    # Option 2 calculations
    computed_additional = [compute_option_block(o) for o in (input.additional_options or [])]

    def _legacy_block_u(idx, fallback_services, fallback_title, fallback_rpct, fallback_rmnt):
        if idx < len(computed_additional):
            b = computed_additional[idx]
            return {
                "services": [Service(**s).model_dump() for s in b["services"]],
                "title": b["title"], "total_brut": b["total_brut"], "remise": b["remise"],
                "remise_percent": b["remise_percent"] if b["remise_type"] == "percent" else 0,
                "remise_montant": b["remise_montant"] if b["remise_type"] == "amount" else 0,
                "total_net": b["total_net"], "acompte_30": b["acompte_30"],
            }
        services = fallback_services or []
        tb = round(sum(s.total for s in services), 2)
        rem = round(tb * fallback_rpct / 100, 2) if fallback_rpct > 0 else round(fallback_rmnt, 2)
        tn = round(tb - rem, 2)
        return {
            "services": [s.model_dump() for s in services], "title": fallback_title or "",
            "total_brut": tb, "remise": rem, "remise_percent": fallback_rpct, "remise_montant": fallback_rmnt,
            "total_net": tn, "acompte_30": round(tn * 0.30, 2),
        }

    use_dynamic = len(computed_additional) > 0
    b2 = _legacy_block_u(0, input.option_2_services, input.option_2_title, input.option_2_remise_percent, input.option_2_remise_montant)
    b3 = _legacy_block_u(1, input.option_3_services, input.option_3_title, input.option_3_remise_percent, input.option_3_remise_montant)
    if use_dynamic and len(computed_additional) < 2:
        b3 = {"services": [], "title": "", "total_brut": 0, "remise": 0, "remise_percent": 0, "remise_montant": 0, "total_net": 0, "acompte_30": 0}

    update_data = {
        "client_id": client_data["id"],
        "client_name": client_data["name"],
        "client_address": client_data["address"],
        "client_phone": client_data["phone"],
        "client_email": client_data.get("email", ""),
        "profile_id": resolved_profile_id,
        "company": company_snapshot,
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
        "option_2_services": b2["services"],
        "option_2_total_brut": b2["total_brut"],
        "option_2_remise_percent": b2["remise_percent"],
        "option_2_remise_montant": b2["remise_montant"],
        "option_2_remise": b2["remise"],
        "option_2_total_net": b2["total_net"],
        "option_2_acompte_30": b2["acompte_30"],
        "notes": input.notes or "",
        "quote_title": input.quote_title or "",
        "option_1_title": input.option_1_title or "",
        "option_2_title": b2["title"],
        "option_3_title": b3["title"],
        "option_3_services": b3["services"],
        "option_3_total_brut": b3["total_brut"],
        "option_3_remise_percent": b3["remise_percent"],
        "option_3_remise_montant": b3["remise_montant"],
        "option_3_remise": b3["remise"],
        "option_3_total_net": b3["total_net"],
        "option_3_acompte_30": b3["acompte_30"],
        "additional_options": computed_additional,
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
            "selected_option": body.selected_option or 1,
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
    Bonjour, <strong>Monsieur/Madame {client_last_name}</strong>,
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

# ==================== RELANCE ENDPOINTS ====================

@api_router.get("/relance-templates")
async def get_relance_templates():
    templates = []
    for day in [3, 7, 14, 30]:
        tmpl = await db.relance_templates.find_one({"day": day}, {"_id": 0})
        if not tmpl:
            tmpl = DEFAULT_RELANCE_TEMPLATES[day].copy()
        templates.append(tmpl)
    return templates

@api_router.put("/relance-templates/{day}")
async def update_relance_template(day: int, body: RelanceTemplate):
    if day not in [3, 7, 14, 30]:
        raise HTTPException(status_code=400, detail="Jour invalide. Doit être 3, 7, 14 ou 30.")
    now = datetime.now(timezone.utc).isoformat()
    await db.relance_templates.update_one(
        {"day": day},
        {"$set": {"subject": body.subject, "body": body.body, "updated_at": now, "day": day}},
        upsert=True
    )
    return {"status": "ok"}

@api_router.patch("/quotes/{quote_id}/toggle-relances")
async def toggle_relances(quote_id: str):
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0, "id": 1, "relances_active": 1, "status": 1})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    new_state = not q.get("relances_active", False)
    await db.quotes.update_one({"id": quote_id}, {"$set": {"relances_active": new_state}})
    return {"relances_active": new_state}

@api_router.patch("/quotes/{quote_id}/mark-lost")
async def mark_quote_lost(quote_id: str):
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0, "id": 1})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    await db.quotes.update_one(
        {"id": quote_id},
        {"$set": {"status": "lost", "relances_active": False, "lost_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "lost"}

@api_router.patch("/quotes/{quote_id}/restore")
async def restore_quote(quote_id: str):
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0, "id": 1, "status": 1})
    if not q:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    await db.quotes.update_one(
        {"id": quote_id},
        {"$set": {"status": "sent", "relances_active": False, "lost_at": None}}
    )
    return {"status": "sent"}

@api_router.post("/relances/run-now")
async def trigger_relances_now():
    """Endpoint de test pour déclencher les relances manuellement (Ruben uniquement)."""
    await run_relances()
    return {"status": "done"}

@api_router.post("/relances/send-previews")
async def send_preview_emails(body: dict = Body(...)):
    """Envoie les 4 templates de relance en aperçu à l'adresse spécifiée."""
    to_email = body.get("email", "rubensrzs03@gmail.com")
    base_url = os.environ.get("PUBLIC_APP_URL", "https://email-design-test.preview.emergentagent.com")
    public_link = f"{base_url}/devis/public/preview"
    fmt = dict(quote_number="D-2025-042", client_name="Ruben Suarez", total_net="3 250.00", work_location="Votre chantier test")
    sent = []
    errors = []
    for day in [3, 7, 14, 30]:
        tmpl = await db.relance_templates.find_one({"day": day}, {"_id": 0})
        if not tmpl:
            tmpl = DEFAULT_RELANCE_TEMPLATES.get(day)
        if not tmpl:
            continue
        try:
            subject = f"[APERÇU J+{day}] " + tmpl["subject"].format(**fmt)
            body_html = tmpl["body"].replace('\n', '<br>').format(**fmt)
            html = build_relance_html(body_html, public_link, day, **{k: fmt[k] for k in ["quote_number","total_net","work_location"]})
            params = {"from": f"SR Renovation <{SENDER_EMAIL}>", "to": [to_email], "reply_to": REPLY_TO_EMAIL, "subject": subject, "html": html}
            await asyncio.to_thread(resend.Emails.send, params)
            sent.append(f"J+{day}")
        except Exception as e:
            errors.append(f"J+{day}: {str(e)}")
    return {"sent": sent, "errors": errors, "to": to_email}

@api_router.post("/relances/send-preview/{day}")
async def send_single_preview(day: int, body: dict = Body(...)):
    """Envoie UN seul template de relance en aperçu."""
    if day not in [3, 7, 14, 30]:
        raise HTTPException(status_code=400, detail="Jour invalide")
    to_email = body.get("email", "rubensrzs03@gmail.com")
    base_url = os.environ.get("PUBLIC_APP_URL", "https://email-design-test.preview.emergentagent.com")
    public_link = f"{base_url}/devis/public/preview"
    fmt = dict(quote_number="D-2025-042", client_name="Ruben Suarez", total_net="3 250.00", work_location="Votre chantier test")
    tmpl = await db.relance_templates.find_one({"day": day}, {"_id": 0})
    if not tmpl:
        tmpl = DEFAULT_RELANCE_TEMPLATES.get(day)
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template introuvable")
    try:
        subject = f"[APERÇU J+{day}] " + tmpl["subject"].format(**fmt)
        body_html = tmpl["body"].replace('\n', '<br>').format(**fmt)
        html = build_relance_html(body_html, public_link, day, **{k: fmt[k] for k in ["quote_number","total_net","work_location"]})
        params = {"from": f"SR Renovation <{SENDER_EMAIL}>", "to": [to_email], "reply_to": REPLY_TO_EMAIL, "subject": subject, "html": html}
        await asyncio.to_thread(resend.Emails.send, params)
        return {"sent": True, "day": day, "to": to_email}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
                "relances_active": True,
                "relances_sent": [],
            }}
        )
        return {"status": "success", "email_id": email_result.get("id"), "public_token": public_token}
    except Exception as e:
        logger.error(f"Erreur envoi devis: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur d'envoi: {str(e)}")

# ==================== SEND INVOICE EMAIL ====================

class SendInvoiceEmail(BaseModel):
    subject: str
    message: str
    recipient_email: str
    email_type: str = "simple"  # 'with_review' | 'simple'
    pdf_base64: str | None = None
    pdf_filename: str | None = None

@api_router.post("/invoices/{invoice_id}/send-email")
async def send_invoice_email(invoice_id: str, body: SendInvoiceEmail):
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Facture non trouvée")

    # Convert newlines in message to <br>
    message_html = body.message.replace('\n', '<br>')

    # GMB review link
    gmb_review_link = "https://g.page/r/CeQWOZZ9f7xAEBM/review"

    # Build review button HTML if email_type is 'with_review'
    review_button_html = ""
    if body.email_type == "with_review":
        review_button_html = f"""
  <!-- Review CTA Button -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
  <tr><td align="center" style="padding:8px 0 24px;">
    <a href="{gmb_review_link}" target="_blank" style="display:inline-block;background-color:#F9A825;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;letter-spacing:0.3px;mso-padding-alt:0;text-align:center;font-family:'Segoe UI',Arial,sans-serif;">
      <!--[if mso]><i style="mso-font-width:300%;mso-text-raise:30px" hidden>&emsp;</i><![endif]-->
      ⭐ Laisser un avis Google
      <!--[if mso]><i style="mso-font-width:300%;" hidden>&emsp;&#8203;</i><![endif]-->
    </a>
  </td></tr>
  </table>
  <p style="color:#475569;font-size:13px;text-align:center;margin:0 0 8px;line-height:1.6;">
    Votre avis compte énormément pour nous et aide d'autres clients à nous découvrir.
  </p>
"""

    html_content = f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&display=swap" rel="stylesheet">
<title>Facture SR R&eacute;novation</title>
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

  {review_button_html}

  {'<p style="color:#475569;font-size:13px;text-align:center;margin:8px 0 0;line-height:1.6;">Votre facture est jointe &agrave; cet email en pi&egrave;ce jointe PDF.</p>' if body.pdf_base64 else ''}
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
        await db.invoices.update_one(
            {"id": invoice_id},
            {"$set": {
                "sent_at": now,
                "sent_to_email": body.recipient_email,
            }}
        )
        return {"status": "success", "email_id": email_result.get("id")}
    except Exception as e:
        logger.error(f"Erreur envoi facture: {e}")
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

# ==================== AI ASSISTANT ====================

class AIGenerateRequest(BaseModel):
    user_input: str
    document_type: str = "quote"  # "quote" or "invoice"

@api_router.post("/ai/generate-document")
async def ai_generate_document(body: AIGenerateRequest):
    """
    Utilise Gemini pour générer un devis/facture à partir d'un texte libre
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Clé API Gemini non configurée")
    
    try:
        # Récupérer le catalogue complet
        catalog_items = await db.catalog.find({}, {"_id": 0}).to_list(1000)
        
        # Séparer services et notes
        services = [item for item in catalog_items if item.get('item_type', 'service') == 'service']
        notes = [item for item in catalog_items if item.get('item_type') == 'note_condition']
        
        # Construire le system prompt avec le catalogue
        services_list = "\n".join([
            f"- {s['service_name']} (Catégorie: {s['category']}, Prix suggéré: {s.get('default_price', 'N/A')}€, Unité: {s.get('default_unit', 'unité')})"
            for s in services
        ])
        
        notes_list = "\n".join([
            f"- {n['service_name']}: {n['description']}"
            for n in notes
        ])
        
        system_prompt = f"""Tu es un assistant intelligent pour SR Rénovation, spécialisé dans la création de devis et factures.

CATALOGUE DE SERVICES DISPONIBLES:
{services_list}

NOTES & CONDITIONS PRÉENREGISTRÉES:
{notes_list}

INSTRUCTIONS:
1. Analyse le texte de l'utilisateur
2. Extrait les informations client (nom, adresse, téléphone, email)
3. Identifie les prestations du catalogue mentionnées
4. Si l'utilisateur mentionne un montant total cible, ajuste les quantités et prix pour l'atteindre
5. Identifie les notes/conditions à inclure

IMPORTANT:
- Utilise UNIQUEMENT les services du catalogue
- Si le service n'existe pas exactement, trouve le plus proche
- Ajuste intelligemment les quantités pour atteindre le montant cible
- Si pas de montant cible, utilise les prix du catalogue

Réponds UNIQUEMENT en JSON avec cette structure exacte:
{{
  "client": {{
    "name": "Nom du client",
    "address": "Adresse complète",
    "phone": "Téléphone",
    "email": "Email (si mentionné)"
  }},
  "work_location": "Lieu des travaux",
  "services": [
    {{
      "description": "Description de la prestation",
      "quantity": 1.0,
      "unit": "unité",
      "unit_price": 100.0,
      "remise_percent": 0.0,
      "total": 100.0
    }}
  ],
  "notes": "Notes et conditions (combine les notes préenregistrées si mentionnées)",
  "target_amount": 0.0,
  "confidence": "high/medium/low"
}}"""

        # Appeler Gemini
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"{system_prompt}\n\nTEXTE DE L'UTILISATEUR:\n{body.user_input}",
            config=types.GenerateContentConfig(
                temperature=0.3
            )
        )
        
        # Parser la réponse JSON (nettoyer les ```json si présent)
        response_text = response.text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:]  # Enlever ```json
        if response_text.startswith('```'):
            response_text = response_text[3:]  # Enlever ```
        if response_text.endswith('```'):
            response_text = response_text[:-3]  # Enlever ```
        response_text = response_text.strip()
        
        result = json.loads(response_text)
        
        return {
            "status": "success",
            "data": result
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Erreur parsing JSON Gemini: {e}")
        logger.error(f"Réponse brute: {response.text if 'response' in locals() else 'N/A'}")
        raise HTTPException(status_code=500, detail="L'IA n'a pas retourné un JSON valide")
    except Exception as e:
        logger.error(f"Erreur génération IA: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

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
    # Seed default relance templates if not present
    for day, tmpl in DEFAULT_RELANCE_TEMPLATES.items():
        existing = await db.relance_templates.find_one({"day": day})
        if not existing:
            await db.relance_templates.insert_one({"_id": str(uuid.uuid4()), **tmpl})
            logger.info(f"Seeded relance template J+{day}")
    # Start scheduler
    if not scheduler.running:
        scheduler.add_job(run_relances, CronTrigger(hour=8, minute=0, timezone='Europe/Paris'), id='relances_daily', replace_existing=True)
        scheduler.start()
        logger.info("APScheduler started — relances daily at 08:00 Europe/Paris")
    # Assign public_token to quotes that don't have one
    async for q in db.quotes.find({"public_token": {"$exists": False}}, {"_id": 0, "id": 1}):
        token = secrets.token_urlsafe(32)
        await db.quotes.update_one({"id": q["id"]}, {"$set": {"public_token": token}})
        logger.info(f"Assigned public_token to quote {q['id']}")

@app.on_event("shutdown")
async def shutdown_db_client():
    if scheduler.running:
        scheduler.shutdown()
    client.close()
