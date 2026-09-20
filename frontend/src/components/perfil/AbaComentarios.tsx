import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { api, mensagemDoErro } from '../../lib/api';
import { tempoRelativo } from '../../lib/social';
import type { ComentarioComPost, FeedComentarios } from '../../lib/types';

function ItemComentario({ item }: { item: ComentarioComPost }) {
  return (
    <Box
      component={Link}
      to={`/u/${item.post.autor.id}`}
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          p: '14px',
          borderRadius: '14px',
          bgcolor: 'neutro.cartao',
          color: 'inherit',
          textDecoration: 'none',
        },
        (t) => t.applyStyles('dark', { border: '1px solid', borderColor: t.vars?.palette.neutro.borda }),
      ]}
    >
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        em "{item.post.descricao_bruta}" de {item.post.autor.nome} · {tempoRelativo(item.criado_em, new Date())}
      </Typography>
      <Typography sx={{ fontSize: 13.5 }}>{item.texto}</Typography>
    </Box>
  );
}

/** Aba "Comentários" do próprio perfil: `GET /api/me/comentarios`, paginado. */
export default function AbaComentarios() {
  const [pagina, setPagina] = useState<FeedComentarios | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setPagina(await api.meComentarios());
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
      const proxima = await api.meComentarios(pagina.proximo_antes);
      setPagina({ comentarios: [...pagina.comentarios, ...proxima.comentarios], proximo_antes: proxima.proximo_antes });
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setCarregando(false);
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
      ) : pagina.comentarios.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>você ainda não comentou em nada</Typography>
      ) : (
        pagina.comentarios.map((item) => <ItemComentario key={item.id} item={item} />)
      )}

      {pagina !== null && pagina.proximo_antes !== null && (
        <Button variant="outlined" disabled={carregando} onClick={() => void carregarMais()} sx={{ borderRadius: '12px', minHeight: 46 }}>
          {carregando ? 'carregando...' : 'carregar mais'}
        </Button>
      )}
    </Box>
  );
}
