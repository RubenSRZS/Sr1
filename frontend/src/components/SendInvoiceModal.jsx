import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Send, Edit3, Paperclip, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { generatePDFBase64 } from './PDFPreview';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getDefaultBodyWithReview = (clientName) => {
  const lastName = clientName ? clientName.split(' ').slice(-1)[0] : '';
  return `Bonjour Monsieur ${lastName},

Nous vous remercions sincèrement pour votre confiance et pour avoir choisi SR Rénovation pour vos travaux.

Vous trouverez en pièce jointe votre facture.

Votre satisfaction est notre priorité. Si le travail réalisé vous a satisfait, nous serions très reconnaissants si vous pouviez prendre quelques instants pour partager votre expérience sur notre page Google.

Votre avis nous aide à grandir et aide d'autres clients à nous découvrir.

Nous restons à votre disposition pour toute question.

Cordialement,

Ruben — SR Rénovation`;
};

const getDefaultBodySimple = (clientName) => {
  const lastName = clientName ? clientName.split(' ').slice(-1)[0] : '';
  return `Bonjour Monsieur ${lastName},

Nous vous remercions sincèrement pour votre confiance et pour avoir choisi SR Rénovation pour vos travaux.

Vous trouverez en pièce jointe votre facture.

Nous restons à votre disposition pour toute question.

Cordialement,

Ruben — SR Rénovation`;
};

const SendInvoiceModal = ({ invoice, onClose, onSent }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [emailType, setEmailType] = useState('with_review'); // 'with_review' | 'simple'
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (invoice) {
      setSubject(`Votre facture — SR Rénovation n°${invoice.invoice_number}`);
      setRecipientEmail(invoice.client_email || '');
      setMessage(getDefaultBodyWithReview(invoice.client_name));
    }
  }, [invoice]);

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = typeof result === 'string' ? result.split(',')[1] : '';
      resolve({ name: file.name, size: file.size, content: base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleAddFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const MAX_TOTAL = 10 * 1024 * 1024;
    const currentTotal = attachments.reduce((s, a) => s + a.size, 0);
    let total = currentTotal;
    const next = [];
    for (const f of files) {
      if (total + f.size > MAX_TOTAL) {
        toast.error(`"${f.name}" dépasse la limite (10 Mo au total)`);
        continue;
      }
      total += f.size;
      next.push(await readFileAsBase64(f));
    }
    setAttachments((prev) => [...prev, ...next]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx));
  const formatSize = (b) => b < 1024 ? `${b} o` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1024 / 1024).toFixed(1)} Mo`;

  const handleEmailTypeChange = (type) => {
    setEmailType(type);
    if (type === 'with_review') {
      setMessage(getDefaultBodyWithReview(invoice?.client_name));
    } else {
      setMessage(getDefaultBodySimple(invoice?.client_name));
    }
  };

  const handleSend = async () => {
    if (!recipientEmail) return toast.error('Email du client requis');
    if (!recipientEmail.includes('@')) return toast.error('Email invalide');

    setSending(true);
    setGeneratingPdf(true);

    let pdfData = null;
    try {
      pdfData = await generatePDFBase64(invoice, 'invoice');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Erreur lors de la génération du PDF, envoi sans pièce jointe');
    }
    setGeneratingPdf(false);

    try {
      const payload = {
        subject,
        message,
        recipient_email: recipientEmail,
        email_type: emailType,
      };
      if (pdfData) {
        payload.pdf_base64 = pdfData.base64;
        payload.pdf_filename = pdfData.filename;
      }
      if (attachments.length > 0) {
        payload.extra_attachments = attachments.map(a => ({ filename: a.name, content: a.content }));
      }
      const res = await fetch(`${API}/invoices/${invoice.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Facture envoyée avec le PDF en pièce jointe !');
        onSent?.();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Erreur d'envoi");
      }
    } catch {
      toast.error('Erreur de connexion');
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" data-testid="send-invoice-modal">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-lg text-slate-800">Envoyer la facture</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" data-testid="close-send-modal">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Invoice info */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Facture</p>
            <p className="font-bold text-slate-700">{invoice?.invoice_number} — {invoice?.client_name}</p>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-600">
              <Paperclip className="w-3.5 h-3.5" />
              <span>PDF joint automatiquement</span>
            </div>
          </div>

          {/* Email Type Selection */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Type d'email</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleEmailTypeChange('with_review')}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  emailType === 'with_review'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid="email-type-with-review"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-slate-700">Avec avis</span>
                </div>
                <p className="text-xs text-slate-500">Remerciement + lien Google</p>
              </button>
              <button
                onClick={() => handleEmailTypeChange('simple')}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  emailType === 'simple'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid="email-type-simple"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Send className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">Simple</span>
                </div>
                <p className="text-xs text-slate-500">Remerciement uniquement</p>
              </button>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Email du client *</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="client@email.com"
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
              data-testid="recipient-email-input"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Objet</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
              data-testid="email-subject-input"
            />
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">Message</label>
              <button
                onClick={() => handleEmailTypeChange(emailType)}
                className="text-xs text-emerald-500 hover:text-emerald-700 flex items-center gap-1"
                data-testid="reset-message-btn"
              >
                <Edit3 className="w-3 h-3" /> Réinitialiser
              </button>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none resize-none"
              data-testid="email-message-textarea"
            />
            {emailType === 'with_review' && (
              <p className="text-xs text-slate-400 mt-1">Le bouton "Laisser un avis" avec le lien Google sera ajouté automatiquement.</p>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Pièces jointes supplémentaires</label>
            <label
              htmlFor="extra-attachments-invoice-input"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer transition-colors text-sm text-slate-600"
              data-testid="add-attachment-btn"
            >
              <Paperclip className="w-4 h-4" />
              <span>Ajouter un fichier (assurance, photo, PDF...)</span>
            </label>
            <input
              id="extra-attachments-invoice-input"
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx,.xls,.xlsx"
              onChange={handleAddFiles}
              className="hidden"
              data-testid="attachment-file-input"
            />
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {attachments.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-700">{a.name}</span>
                      <span className="text-slate-400 shrink-0">({formatSize(a.size)})</span>
                    </div>
                    <button onClick={() => handleRemoveAttachment(i)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 shrink-0" data-testid={`remove-attachment-${i}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-400 mt-1">10 Mo max au total. Le PDF de la facture est joint automatiquement.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-slate-100 flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1" data-testid="cancel-send-btn">
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !recipientEmail}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            data-testid="confirm-send-btn"
          >
            {generatingPdf ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Génération PDF...</>
            ) : sending ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Envoi en cours...</>
            ) : (
              <><Send className="w-4 h-4 mr-1.5" /> Envoyer</>
            )}
          </Button>

        </div>

        {/* WhatsApp */}
        <div className="px-5 pb-5 -mt-2">
          <button
            onClick={() => {
              const phoneRaw = invoice?.client_phone || "";
              const digits = phoneRaw.replace(/[^0-9+]/g, "").replace(/^\+/, "");
              const frPhone = digits.startsWith("0") ? "33" + digits.slice(1) : digits;
              let msg = "Bonjour " + (invoice?.client_name || "") + ",";
              msg += "\n\nNous vous remercions pour votre confiance et pour avoir choisi SR R\u00e9novation pour vos travaux.";
              msg += "\n\nVotre facture n\u00b0" + (invoice?.invoice_number || "") + " vous a \u00e9t\u00e9 envoy\u00e9e par email.";
              msg += "\n\nCoordonn\u00e9es bancaires :";
              msg += "\nIBAN : FR76 1080 7000 1312 3197 7296 321";
              msg += "\nBIC : CCBPFRPPDJN";
              msg += "\nTitulaire : M RUBEN SUAREZ-SAR";
              if (emailType === "with_review") {
                msg += "\n\nVotre avis compte ! Laissez-nous un avis Google :";
                msg += "\nhttps://g.page/r/CeQWOZZ9f7xAEBM/review";
              }
              msg += "\n\nParrainez & Gagnez jusqu'\u00e0 300\u20ac !";
              msg += "\nhttps://sr-renovation.fr/parrainage";
              msg += "\n\nCordialement,";
              msg += "\nRuben \u2014 SR R\u00e9novation";
              msg += "\n06 80 33 45 46";
              const text = encodeURIComponent(msg);
              if (!frPhone) {
                window.open(`https://wa.me/?text=${text}`, "_blank");
                toast.info("Téléphone client absent — ouvrez WhatsApp et choisissez le destinataire");
              } else {
                window.open(`https://wa.me/${frPhone}?text=${text}`, "_blank");
              }
            }}
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#25D366", color: "white" }}
            data-testid="send-whatsapp-btn"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.36-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.886 9.885zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Envoyer par WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendInvoiceModal;
