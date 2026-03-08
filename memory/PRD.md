# SR-Renovation Invoice/Quote Application - PRD

## Original Problem Statement
The user, representing the renovation company "Sr-Renovation.fr," requires a web application to create professional, highly customized quotes and invoices. The primary goal is to achieve a unique and brand-aligned design that distinguishes them from competitors, using their specific blue and orange brand colors.

## User Personas
- **Primary User:** Sr-Renovation.fr staff creating quotes/invoices
- **Language:** French
- **Device:** Mobile-first design requirement

## Core Requirements

### Implemented Features ✅
1. **Core Functionality:** Create, view, and manage quotes and invoices
2. **Client Management:** Manage a list of clients
3. **Catalog:** Pre-filled catalog of professional service descriptions
4. **Live Preview:** Real-time PDF preview while filling the form
5. **Flexible Forms:**
   - Client's email optional
   - Discounts as percentage (%) and fixed amount (€)
   - Custom units for services (m², ml, unit, etc.)
   - Custom quote numbering
6. **Multi-Option Quotes:** Single quote with two distinct options
7. **Payment Plans:** Payment terms (30% deposit, installments)
8. **PDF Download:** Using html2canvas + jsPDF

### Pending/In Progress
1. **Logo in Downloaded PDF** - Logo SARL might be missing in downloaded version (needs verification)
2. **Footer Logo** - Incorrect logo in footer (needs verification)
3. **Text Alignment** - Not vertically centered in tables
4. **Banque Populaire Logo** - Too small

### Future Tasks
1. **Email Integration:** Send documents via email using Resend
2. **E-Signature:** Electronic signature solution with signature image display
3. **Online Quote Acceptance:** Clients accept/sign via unique link
4. **Quote to Invoice Conversion:** One-click conversion

## Technical Architecture

### Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI
- **Backend:** FastAPI, Pydantic
- **Database:** MongoDB
- **PDF Generation:** html2canvas + jsPDF (NOT @react-pdf/renderer - user rejected)

### Key Files
```
/app/
├── backend/
│   └── server.py
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── PDFPreview.js   # Main PDF preview component
    │   ├── lib/
    │   │   └── logoConstants.js # Logo SARL base64 (NEW - created 2026-03-08)
    │   └── ...
    └── package.json
```

### Database Schema
- **quotes collection:** `client_name`, `quote_number`, `payment_plan`, `items` array
- **items array:** `description`, `quantity`, `price`, `unit`, `discount`

### Key API Endpoints
- `GET /api/quotes` - List all quotes
- `POST /api/quotes` - Create new quote

## Change Log

### 2026-03-08
- **FIXED:** Critical frontend compilation error
  - Issue: Unterminated string constant in PDFPreview.js line 34
  - Cause: Large base64 string incorrectly embedded in component file
  - Solution: Created `/app/frontend/src/lib/logoConstants.js` with base64 logo
  - Cleaned up broken code in PDFPreview.js

## Known Issues & Constraints

### User Preferences
- User is highly sensitive to visual details
- User speaks French
- User rejected @react-pdf/renderer migration - must use html2canvas

### Technical Constraints
- html2canvas has CORS limitations for images
- Base64 embedded images needed for PDF generation
- Large assets must be in separate modules (not inline in components)

## Testing Notes
- Always visually verify PDF downloads after changes
- Check logo rendering in both preview and downloaded PDF
- Test on mobile viewport (mobile-first requirement)
