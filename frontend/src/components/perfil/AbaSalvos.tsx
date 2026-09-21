import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { Trash2 } from 'lucide-react';
import { api, mensagemDoErro } from '../../lib/api';
import { milhar } from '../../lib/format';
import { tempoRelativo } from '../../lib/social';
import type { RefeicaoSalva } from '../../lib/types';

interface Pagina {
  salvos: RefeicaoSalva[];
  proximo_antes: string | null;
}

function ItemSalvo({ item, aoApagar }: { item: RefeicaoSalva; aoApagar: (id: string) => void }) {
  return (
    <Box
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          p: '14px',
          borderRadius: '14px',
          bgcolor: 'neutro.cartao',
        },
        (t) => t.applyStyles('dark', { border: '1px solid', borderColor: t.vars?.palette.neutro.borda }),
      ]}
    >
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14.5, overflowWrap: 'anywhere' }}>{item.nome}</Typography>
        <Typography sx={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
          {milhar(item.calorias_total)} kcal · C {milhar(item.carboidrato_total_g)} g · P {milhar(item.proteina_total_g)} g
          · G {milhar(item.gordura_total_g)} g
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          salvo {tempoRelativo(item.criado_em, new Date())}
          {item.origem_autor_nome !== null && ` · salvo do post de ${item.origem_autor_nome}`}
        </Typography>
      </Box>
      <ButtonBase
        onClick={() => aoApagar(item.id)}
        aria-label={`apagar refeição salva ${item.nome}`}
        sx={{
          minWidth: 44,
          minHeight: 44,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <Trash2 size={20} strokeWidth={1.8} />
      </ButtonBase>
    </Box>
  );
}

/** Aba "Salvos" do próprio perfil: `GET /api/me/salvos`, paginado. Sempre privada. */
export default function AbaSalvos() {
  const [pagina, setPagina] = useState<Pagina | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setPagina(await api.salvos());
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function carregarMais() {
    if (pagina === null || pagina.proximo_antes === null) return;
    setCarregando(true);
    try {
      const proxima = await api.salvos(pagina.proximo_antes);
      setPagina({ salvos: [...pagina.salvos, ...proxima.salvos], proximo_antes: proxima.proximo_antes });
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setCarregando(false);
    }
  }

  async function apagar(id: string) {
    try {
      await api.apagarSalvo(id);
      setPagina((atual) => (atual === null ? atual : { ...atual, salvos: atual.salvos.filter((s) => s.id !== id) }));
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {erro !== null && (
        <Alert severity="error" onClose={() => setErro(null)}>
          {erro}
        </Alert>
      )}

      {pagina === null ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando...</Typography>
      ) : pagina.salvos.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>nenhuma refeição salva ainda</Typography>
      ) : (
        pagina.salvos.map((item) => <ItemSalvo key={item.id} item={item} aoApagar={(id) => void apagar(id)} />)
      )}

      {pagina !== null && pagina.proximo_antes !== null && (
        <Button variant="outlined" disabled={carregando} onClick={() => void carregarMais()} sx={{ borderRadius: '12px', minHeight: 46 }}>
          {carregando ? 'carregando...' : 'carregar mais'}
        </Button>
      )}
    </Box>
  );
}
