import { useState } from 'react';
import Overlay from './Overlay';

interface Props {
  aoEnviar: (texto: string) => void;
  aoFechar: () => void;
}

export default function EntradaTexto({ aoEnviar, aoFechar }: Props) {
  const [texto, setTexto] = useState('');
  const vazio = texto.trim().length === 0;

  return (
    <Overlay titulo="o que você comeu?" aoFechar={aoFechar}>
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          if (!vazio) aoEnviar(texto.trim());
        }}
      >
        <label className="campo">
          <span className="campo-rotulo">descreva do seu jeito</span>
          <textarea
            className="campo-entrada"
            autoFocus
            value={texto}
            placeholder="dois ovos mexidos e um pão francês"
            onChange={(evento) => setTexto(evento.target.value)}
          />
        </label>
        <div className="acoes-rodape">
          <button type="button" className="botao" onClick={aoFechar}>
            cancelar
          </button>
          <button type="submit" className="botao botao-primario" disabled={vazio}>
            interpretar
          </button>
        </div>
      </form>
    </Overlay>
  );
}
