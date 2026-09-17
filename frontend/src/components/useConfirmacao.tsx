import { useCallback, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import BotaoCta from './ui/BotaoCta';

export interface PedidoConfirmacao {
  titulo: string;
  /** O que acontece se confirmar. Uma frase, no presente. */
  texto: string;
  /** Rótulo do botão que confirma. Sempre o verbo da ação: "excluir", "remover". */
  rotulo: string;
}

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

  const elemento = (
    <Dialog
      open={pedido !== null}
      onClose={() => responder(false)}
      slotProps={{ paper: { sx: { borderRadius: '20px', p: '22px', m: '22px', bgcolor: 'background.default', backgroundImage: 'none' } } }}
    >
      {pedido !== null && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 20, letterSpacing: '-.02em' }}>{pedido.titulo}</Typography>
          <Typography sx={{ fontSize: 13.5, lineHeight: 1.45, color: 'text.secondary' }}>{pedido.texto}</Typography>
          <Box sx={{ display: 'flex', gap: '9px' }}>
            {/* Cancelar vem primeiro e leva o foco: Enter afobado não apaga nada. */}
            <BotaoCta variante="contorno" autoFocus onClick={() => responder(false)} sx={{ flex: 1 }}>
              cancelar
            </BotaoCta>
            <BotaoCta
              variante="primario"
              onClick={() => responder(true)}
              sx={{ flex: 1, bgcolor: 'error.main', '&:hover': { bgcolor: 'error.main', filter: 'brightness(.92)' } }}
            >
              {pedido.rotulo}
            </BotaoCta>
          </Box>
        </Box>
      )}
    </Dialog>
  );

  return { confirmar, elemento };
}
