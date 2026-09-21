import { useCallback } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardPost from '../CardPost';
import { useFeed } from '../social/useFeed';
import { api } from '../../lib/api';

/** Aba "Publicações" do próprio perfil: reaproveita o feed que `PerfilPublico.tsx` já usa. */
export default function AbaPublicacoes({ userId }: { userId: string }) {
  const buscar = useCallback((antes?: string) => api.refeicoesDe(userId, antes), [userId]);
  const feed = useFeed(buscar);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {feed.erro !== null && (
        <Alert severity="error" onClose={feed.limparErro}>
          {feed.erro}
        </Alert>
      )}
      {feed.feed === null ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando...</Typography>
      ) : feed.feed.posts.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>nada registrado ainda</Typography>
      ) : (
        feed.feed.posts.map((post) => (
          <CardPost key={post.id} post={post} aoCurtir={feed.curtir} aoComentar={feed.abrirComentarios} aoSalvar={feed.salvar} />
        ))
      )}
      {feed.feed !== null && feed.feed.proximo_antes !== null && (
        <Button variant="outlined" disabled={feed.carregando} onClick={() => void feed.carregarMais()} sx={{ borderRadius: '12px', minHeight: 46 }}>
          {feed.carregando ? 'carregando...' : 'carregar mais'}
        </Button>
      )}
      {feed.folha}
    </Box>
  );
}
