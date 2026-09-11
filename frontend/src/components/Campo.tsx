interface Props {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  tipo?: 'text' | 'number';
  sufixo?: string;
  somenteLeitura?: boolean;
}

export default function Campo({
  rotulo,
  valor,
  aoMudar,
  tipo = 'text',
  sufixo,
  somenteLeitura = false,
}: Props) {
  return (
    <label className="campo">
      <span className="campo-rotulo">{sufixo === undefined ? rotulo : `${rotulo} (${sufixo})`}</span>
      <input
        className="campo-entrada"
        type={tipo}
        inputMode={tipo === 'number' ? 'decimal' : undefined}
        min={tipo === 'number' ? 0 : undefined}
        step={tipo === 'number' ? '0.1' : undefined}
        value={valor}
        readOnly={somenteLeitura}
        onChange={(evento) => aoMudar(evento.target.value)}
      />
    </label>
  );
}

interface PropsInterruptor {
  rotulo: string;
  dica: string;
  ligado: boolean;
  aoMudar: (ligado: boolean) => void;
}

export function Interruptor({ rotulo, dica, ligado, aoMudar }: PropsInterruptor) {
  return (
    <label className="interruptor">
      <span className="interruptor-texto">
        {rotulo}
        <span className="interruptor-dica">{dica}</span>
      </span>
      <input type="checkbox" checked={ligado} onChange={(evento) => aoMudar(evento.target.checked)} />
    </label>
  );
}
