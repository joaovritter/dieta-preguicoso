import { numero } from '../lib/format';
import type { Metrica } from '../lib/types';

const TAMANHO = 200;
const ESPESSURA = 14;
const RAIO = (TAMANHO - ESPESSURA) / 2;
const PERIMETRO = 2 * Math.PI * RAIO;

/** Fração 0..1 do anel a desenhar. */
function fracao(valor: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.min(valor / meta, 1);
}

export default function AnelCalorias({ metrica }: { metrica: Metrica }) {
  const excedeu = metrica.excedido > 0;
  const fracaoProgresso = fracao(metrica.consumido, metrica.meta);
  const fracaoExcesso = fracao(metrica.excedido, metrica.meta);

  const centro = TAMANHO / 2;
  const arco = (f: number) => PERIMETRO * (1 - f);

  return (
    <div className="anel">
      <svg
        width={TAMANHO}
        height={TAMANHO}
        viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}
        role="progressbar"
        aria-label="calorias do dia"
        aria-valuemin={0}
        aria-valuemax={metrica.meta}
        aria-valuenow={metrica.consumido}
      >
        <circle className="anel-trilha" cx={centro} cy={centro} r={RAIO} strokeWidth={ESPESSURA} />
        <circle
          className="anel-arco anel-progresso"
          cx={centro}
          cy={centro}
          r={RAIO}
          strokeWidth={ESPESSURA}
          strokeDasharray={PERIMETRO}
          strokeDashoffset={arco(fracaoProgresso)}
        />
        {excedeu && (
          <circle
            className="anel-arco anel-excesso"
            cx={centro}
            cy={centro}
            r={RAIO}
            strokeWidth={ESPESSURA}
            strokeDasharray={PERIMETRO}
            strokeDashoffset={arco(fracaoExcesso)}
          />
        )}
      </svg>

      <div className="anel-centro">
        <span className={excedeu ? 'anel-valor excedido' : 'anel-valor'}>
          {numero(excedeu ? metrica.excedido : metrica.restante)}
        </span>
        <span className="anel-rotulo">{excedeu ? 'excedidas' : 'restantes'}</span>
        <span className="anel-detalhe">
          {numero(metrica.consumido)} / {numero(metrica.meta)} kcal
        </span>
      </div>
    </div>
  );
}
