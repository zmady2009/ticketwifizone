'use client';

import { Printer } from 'lucide-react';

interface PrintButtonProps {
  className?: string;
}

export function PrintButton({ className }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className={className}
    >
      <Printer className="w-4 h-4 mr-2" />
      Imprimer
    </button>
  );
}
