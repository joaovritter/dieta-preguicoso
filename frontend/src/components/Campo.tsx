import { useState } from 'react';

interface Props {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  tipo?: 'text' | 'number' | 'email' | 'password';
  sufixo?: string;
  somenteLeitura?: boolean;
  autoComplete?: string;
  /** Mensagem sob o campo. Erro de digitação não merece o vermelho do topo. */
  aviso?: string;
}

export default function Campo({
  rotulo,
  valor,
  aoMudar,
  tipo = 'text',
  sufixo,
  somenteLeitura = false,
  autoComplete,
  aviso,
}: Props) {
  const [revelada, setRevelada] = useState(false);
  const senha = tipo === 'password';

  return (
    <label className="campo">
      <span className="campo-rotulo">{sufixo === undefined ? rotulo : `${rotulo} (${sufixo})`}</span>
      <span className={senha ? 'campo-com-botao' : undefined}>
        <input
          className="campo-entrada"
          type={senha && revelada ? 'text' : tipo}
          inputMode={tipo === 'number' ? 'decimal' : undefined}
          min={tipo === 'number' ? 0 : undefined}
          step={tipo === 'number' ? '0.1' : undefined}
          value={valor}
          readOnly={somenteLeitura}
          autoComplete={autoComplete}
          onChange={(evento) => aoMudar(evento.target.value)}
        />
        {senha && (
          <button
            type="button"
            className="campo-olho"
            aria-label={revelada ? 'ocultar senha' : 'mostrar senha'}
            aria-pressed={revelada}
            onClick={() => setRevelada((antes) => !antes)}
          >
            {revelada ? 'ocultar' : 'ver'}
          </button>
        )}
      </span>
      {aviso !== undefined && <span className="campo-aviso">{aviso}</span>}
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
