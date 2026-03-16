import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PinScreen = ({ onSuccess }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const newPinRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => { inputRefs[0].current?.focus(); }, []);

  const handleDigit = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    if (value && index < 3) inputRefs[index + 1].current?.focus();
    if (next.every(d => d !== '')) verifyPin(next.join(''));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const verifyPin = async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/verify-pin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code }),
      });
      if (res.ok) {
        sessionStorage.setItem('sr_auth', 'true');
        onSuccess();
      } else {
        toast.error('Code incorrect');
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch { toast.error('Erreur de connexion'); }
    setLoading(false);
  };

  const handleRecover = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/recover-pin`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) toast.success(data.message);
      else toast.error(data.detail);
    } catch { toast.error('Erreur'); }
    setLoading(false);
    setShowRecover(false);
  };

  const handleChangePin = async () => {
    const code = newPin.join('');
    if (code.length !== 4) return toast.error('Nouveau code à 4 chiffres requis');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/change-pin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_pin: currentPin, new_pin: code }),
      });
      if (res.ok) {
        toast.success('Code modifié avec succès');
        setShowChange(false);
        setCurrentPin('');
        setNewPin(['', '', '', '']);
      } else {
        const data = await res.json();
        toast.error(data.detail);
      }
    } catch { toast.error('Erreur'); }
    setLoading(false);
  };

  const handleNewPinDigit = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...newPin];
    next[index] = value;
    setNewPin(next);
    if (value && index < 3) newPinRefs[index + 1].current?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-orange-600 p-4" data-testid="pin-screen">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">SR</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">RÉNOVATION</span>
          </div>
          <p className="text-slate-200 text-sm">Gestion devis & factures</p>
        </div>

        {!showChange ? (
          <div className="bg-slate-800/50 backdrop-blur border border-blue-500/30 rounded-2xl p-8" data-testid="pin-entry">
            <h2 className="text-white text-center text-lg font-semibold mb-6">Entrez votre code</h2>
            
            <div className="flex justify-center gap-3 mb-8">
              {pin.map((d, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={loading}
                  className="w-14 h-16 text-center text-2xl font-bold rounded-xl bg-slate-700/50 border-2 border-blue-500 text-white focus:border-orange-400 focus:outline-none transition-colors"
                  data-testid={`pin-digit-${i}`}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2 text-center">
              <button onClick={() => setShowRecover(true)} className="text-sm text-blue-300 hover:text-orange-400 transition-colors" data-testid="forgot-pin-btn">
                Code oublié ?
              </button>
              <button onClick={() => setShowChange(true)} className="text-xs text-slate-400 hover:text-slate-200 transition-colors" data-testid="change-pin-btn">
                Changer le code
              </button>
            </div>

            {showRecover && (
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-slate-300 text-sm mb-3">Recevoir le code par email ?</p>
                <div className="flex gap-2">
                  <Button onClick={handleRecover} disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm" data-testid="send-recover-btn">
                    {loading ? 'Envoi...' : 'Envoyer'}
                  </Button>
                  <Button onClick={() => setShowRecover(false)} variant="outline" className="border-blue-500 text-blue-300 text-sm">
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur border border-blue-500/30 rounded-2xl p-8" data-testid="change-pin-form">
            <h2 className="text-white text-center text-lg font-semibold mb-6">Changer le code</h2>
            
            <div className="mb-5">
              <label className="text-slate-400 text-sm mb-2 block">Code actuel</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={4}
                value={currentPin}
                onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                className="w-full h-12 text-center text-xl font-bold rounded-lg bg-slate-700/50 border border-blue-500 text-white focus:border-orange-400 focus:outline-none tracking-widest"
                data-testid="current-pin-input"
              />
            </div>

            <div className="mb-6">
              <label className="text-slate-400 text-sm mb-2 block">Nouveau code</label>
              <div className="flex justify-center gap-3">
                {newPin.map((d, i) => (
                  <input
                    key={i}
                    ref={newPinRefs[i]}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleNewPinDigit(i, e.target.value)}
                    className="w-14 h-14 text-center text-xl font-bold rounded-lg bg-slate-700/50 border border-blue-500 text-white focus:border-orange-400 focus:outline-none"
                    data-testid={`new-pin-digit-${i}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleChangePin} disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold" data-testid="confirm-change-pin-btn">
                {loading ? 'Modification...' : 'Confirmer'}
              </Button>
              <Button onClick={() => { setShowChange(false); setCurrentPin(''); setNewPin(['','','','']); }} variant="outline" className="border-blue-500 text-blue-300">
                Retour
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PinScreen;
