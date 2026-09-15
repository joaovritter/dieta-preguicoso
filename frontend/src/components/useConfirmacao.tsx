import { useCallback, useRef, useState } from 'react';
import Overlay from './Overlay';

export interface PedidoConfirmacao {
  titulo: string;
  /** O que acontece se confirmar. Uma frase, no presente. */
  texto: string;
  /** Rótulo do botão que confirma. Sempre o verbo da ação: "excluir", "remover". */
  rotulo: string;
}

/**
 * Confirmação de ação destrutiva. Devolve uma promessa para a chamada ficar
 * na linha da ação, em vez de espalhar estado de "o que estou confirmando"
 * por cada página:
 *
 * ```tsx
 * if (await confirmar({ titulo: 'excluir registro', texto: '...', rotulo: 'excluir' })) {
 *   await api.excluirRegistro(id);
 * }
 * ```
 */
export function useConfirmacao() {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null);
  const resolver = useRef<((confirmou: boolean) => void) | null>(null);

  const confirmar = useCallback((novo: PedidoConfirmacao) => {
    setPedido(novo);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const responder = useCallback((confirmou: boolean) => {
    setPedido(null);
    resolver.current?.(confirmou);
    resolver.current = null;
  }, []);

  const elemento =
    pedido === null ? null : (
      <Overlay titulo={pedido.titulo} aoFechar={() => responder(false)}>
        <p className="confirmacao-texto">{pedido.texto}</p>
        <div className="confirmacao-acoes">
          {/* Cancelar vem primeiro e leva o foco: Enter afobado não apaga nada. */}
          <button type="button" className="botao" autoFocus onClick={() => responder(false)}>
            cancelar
          </button>
          <button type="button" className="botao botao-perigo" onClick={() => responder(true)}>
            {pedido.rotulo}
          </button>
        </div>
      </Overlay>
    );

  return { confirmar, elemento };
}
