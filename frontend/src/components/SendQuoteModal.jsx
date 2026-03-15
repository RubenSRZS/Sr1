import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Send, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_MESSAGES = {
  subject: 'Votre devis SR Rénovation',
  body: `Bonjour,

Suite à notre visite, veuillez trouver ci-joint notre devis détaillé pour les travaux évoqués.

Vous pouvez consulter le devis en ligne et le signer directement en cliquant sur le lien ci-dessous.

N'hésitez pas à nous contacter pour toute question.

Cordialement,
SR Rénovation`,
};

const SendQuoteModal = ({ quote, onClose, onSent }) => {
  const [subject, setSubject] = useState(DEFAULT_MESSAGES.subject);
  const [message, setMessage] = useState(DEFAULT_MESSAGES.body);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (quote) {
      setSubject(`Devis ${quote.quote_number} — SR Rénovation`);
      setRecipientEmail(quote.client_email || '');
    }
  }, [quote]);

  const handleSend = async () => {
    if (!recipientEmail) return toast.error('Email du client requis');
    if (!recipientEmail.includes('@')) return toast.error('Email invalide');
    setSending(true);
    try {
      const res = await fetch(`${API}/quotes/${quote.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, recipient_email: recipientEmail }),
      });
      if (res.ok) {
        toast.success('Devis envoyé par email !');
        onSent?.();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Erreur d\'envoi');
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
            <p className="text-sm font-semibold text-blue-700 mt-1">{quote?.total_net?.toFixed(2)} € TTC</p>
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
                onClick={() => setMessage(DEFAULT_MESSAGES.body)}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                data-testid="reset-message-btn"
              >
                <Edit3 className="w-3 h-3" /> Réinitialiser
              </button>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none resize-none"
              data-testid="email-message-textarea"
            />
            <p className="text-xs text-slate-400 mt-1">Le lien vers le devis en ligne sera ajouté automatiquement dans l'email.</p>
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
            {sending ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendQuoteModal;
