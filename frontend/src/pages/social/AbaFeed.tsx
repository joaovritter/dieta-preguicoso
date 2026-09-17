import { useCallback } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardPost from '../../components/CardPost';
import { useFeed } from '../../components/social/useFeed';
import { api } from '../../lib/api';

export default function AbaFeed() {
  const buscar = useCallback((antes?: string) => api.feedGeral(antes), []);
  const { feed, erro, limparErro, carregando, carregarMais, curtir, abrirComentarios, folha } = useFeed(buscar);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {erro !== null && (
        <Alert severity="error" onClose={limparErro}>
          {erro}
        </Alert>
      )}
      {feed === null ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando o feed...</Typography>
      ) : feed.posts.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          nada por aqui ainda — adicione amigos ou entre num grupo
        </Typography>
      ) : (
        <>
          {feed.posts.map((post) => (
            <CardPost key={post.id} post={post} aoCurtir={curtir} aoComentar={abrirComentarios} />
          ))}
          {feed.proximo_antes !== null && (
            <Button variant="outlined" disabled={carregando} onClick={() => void carregarMais()} sx={{ borderRadius: '12px', minHeight: 46 }}>
              {carregando ? 'carregando...' : 'carregar mais'}
            </Button>
          )}
        </>
      )}
      {folha}
    </Box>
  );
}
