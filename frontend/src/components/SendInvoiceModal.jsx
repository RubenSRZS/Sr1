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

  useEffect(() => {
    if (invoice) {
      setSubject(`Votre facture — SR Rénovation n°${invoice.invoice_number}`);
      setRecipientEmail(invoice.client_email || '');
      setMessage(getDefaultBodyWithReview(invoice.client_name));
    }
  }, [invoice]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" data-testid="send-invoice-modal">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
      </div>
    </div>
  );
};

export default SendInvoiceModal;
