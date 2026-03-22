import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Send, Edit3, Paperclip, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generatePDFBase64 } from './PDFPreview';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getDefaultBody = (clientName) => {
  const lastName = clientName ? clientName.trim().split(' ').filter(Boolean).slice(-1)[0] : '';
  return `Bonjour, Monsieur/Madame ${lastName},

Suite à notre échange, j'ai le plaisir de vous transmettre votre devis personnalisé pour votre projet de rénovation.

Vous pouvez le consulter, le télécharger et même le signer électroniquement en toute sécurité en cliquant sur le bouton ci-dessous.

N'hésitez pas à me contacter si vous avez la moindre question ou si vous souhaitez ajuster cette proposition. Je suis à votre écoute.

À très bientôt,

Ruben — SR Rénovation`;
};

const SendQuoteModal = ({ quote, onClose, onSent }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (quote) {
      setSubject(`Votre devis est prêt — SR Rénovation n°${quote.quote_number}`);
      setRecipientEmail(quote.client_email || '');
      setMessage(getDefaultBody(quote.client_name));
    }
  }, [quote]);

  const handleSend = async () => {
    if (!recipientEmail) return toast.error('Email du client requis');
    if (!recipientEmail.includes('@')) return toast.error('Email invalide');

    setSending(true);
    setGeneratingPdf(true);

    let pdfData = null;
    try {
      pdfData = await generatePDFBase64(quote, 'quote');
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
      };
      if (pdfData) {
        payload.pdf_base64 = pdfData.base64;
        payload.pdf_filename = pdfData.filename;
      }
      const res = await fetch(`${API}/quotes/${quote.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Devis envoyé avec le PDF en pièce jointe !');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" data-testid="send-quote-modal">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg text-slate-800">Envoyer le devis</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" data-testid="close-send-modal">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Quote info */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Devis</p>
            <p className="font-bold text-slate-700">{quote?.quote_number} — {quote?.client_name}</p>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-blue-600">
              <Paperclip className="w-3.5 h-3.5" />
              <span>PDF joint automatiquement</span>
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
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
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
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
              data-testid="email-subject-input"
            />
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">Message</label>
              <button
                onClick={() => setMessage(getDefaultBody(quote?.client_name))}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                data-testid="reset-message-btn"
              >
                <Edit3 className="w-3 h-3" /> Réinitialiser
              </button>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none resize-none"
              data-testid="email-message-textarea"
            />
            <p className="text-xs text-slate-400 mt-1">Le bouton "Consulter mon devis" et la signature SR Rénovation seront ajoutés automatiquement.</p>
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
              const phone = (quote?.client_phone || '').replace(/[^0-9]/g, '');
              const frPhone = phone.startsWith('0') ? '33' + phone.slice(1) : phone;
              const text = encodeURIComponent('Bonjour ' + (quote?.client_name || '') + ',\n\nSuite à notre échange, j\'ai le plaisir de vous transmettre votre devis personnalisé n°' + (quote?.quote_number || '') + ' pour votre projet de rénovation.\n\nConsultez, téléchargez et signez votre devis en ligne ici :\n' + window.location.origin + '/devis/public/' + (quote?.public_token || '') + '\n\nN\'hésitez pas à me contacter pour toute question.\n\nRuben — SR Rénovation\n06 80 33 45 46');
              window.open('https://wa.me/' + frPhone + '?text=' + text, '_blank');
            }}
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            style={{ backgroundColor: '#25D366', color: 'white' }}
            disabled={!quote?.client_phone}
          >
            Envoyer par WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendQuoteModal;
