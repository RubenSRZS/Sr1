import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

const SignaturePad = ({ onSave, onClear }) => {
  const sigCanvas = useRef(null);

  const clear = () => {
    sigCanvas.current.clear();
    if (onClear) onClear();
  };

  const save = () => {
    if (sigCanvas.current.isEmpty()) {
      return null;
    }
    const dataURL = sigCanvas.current.toDataURL();
    if (onSave) onSave(dataURL);
    return dataURL;
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-slate-300 rounded-lg bg-white">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-48 touch-action-none',
            'data-testid': 'signature-canvas',
          }}
          backgroundColor="white"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={clear}
          data-testid="signature-clear-btn"
          className="flex-1"
        >
          <Eraser className="mr-2 h-4 w-4" />
          Effacer
        </Button>
        <Button
          type="button"
          onClick={save}
          data-testid="signature-save-btn"
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
        >
          Valider la signature
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;