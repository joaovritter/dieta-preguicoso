import { numero } from '../lib/format';
import type { Metrica } from '../lib/types';

interface Props {
  rotulo: string;
  unidade: string;
  metrica: Metrica;
}

export default function BarraMacro({ rotulo, unidade, metrica }: Props) {
  const preenchido = metrica.meta > 0 ? Math.min(metrica.consumido / metrica.meta, 1) : 0;
  const excesso = metrica.meta > 0 ? Math.min(metrica.excedido / metrica.meta, 1) : 0;

  return (
    <div className="macro">
      <div className="macro-linha">
        <span>{rotulo}</span>
        <span className="macro-valor">
          {numero(metrica.consumido)} / {numero(metrica.meta)} {unidade}
        </span>
      </div>
      <div
        className="macro-trilha"
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={metrica.meta}
        aria-valuenow={metrica.consumido}
      >
        <div className="macro-preenchido" style={{ width: `${preenchido * 100}%` }} />
        {excesso > 0 && <div className="macro-excesso" style={{ width: `${excesso * 100}%` }} />}
      </div>
    </div>
  );
}
