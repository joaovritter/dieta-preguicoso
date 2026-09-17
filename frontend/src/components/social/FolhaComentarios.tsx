import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Drawer from '@mui/material/Drawer';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import Avatar from './Avatar';
import { api, mensagemDoErro } from '../../lib/api';
import { tempoRelativo } from '../../lib/social';
import type { Comentario, Post } from '../../lib/types';

interface Props {
  post: Post | null;
  aoFechar: () => void;
  aoMudarContagem: (postId: string, delta: number) => void;
}

/** Bottom sheet dos comentários de um post. `post === null` = fechada. */
export default function FolhaComentarios({ post, aoFechar, aoMudarContagem }: Props) {
  const [comentarios, setComentarios] = useState<Comentario[] | null>(null);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (post === null) return;
    let vivo = true;
    setComentarios(null);
    setErro(null);
    api
      .comentarios(post.id)
      .then((r) => vivo && setComentarios(r.comentarios))
      .catch((falha: unknown) => vivo && setErro(mensagemDoErro(falha)));
    return () => {
      vivo = false;
    };
  }, [post]);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (post === null || texto.trim() === '') return;
    setEnviando(true);
    try {
      const novo = await api.comentar(post.id, texto);
      setComentarios((atual) => [...(atual ?? []), novo]);
      aoMudarContagem(post.id, 1);
      setTexto('');
      setErro(null);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  async function apagar(comentario: Comentario) {
    if (post === null) return;
    try {
      await api.apagarComentario(comentario.id);
      setComentarios((atual) => (atual ?? []).filter((c) => c.id !== comentario.id));
      aoMudarContagem(post.id, -1);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }

  return (
    <Drawer
      anchor="bottom"
      open={post !== null}
      onClose={aoFechar}
      slotProps={{
        paper: {
          sx: [
            {
              borderRadius: '26px 26px 0 0',
              bgcolor: 'background.default',
              maxHeight: '80dvh',
              maxWidth: 480,
              mx: 'auto',
              p: '22px',
              pb: 'calc(22px + env(safe-area-inset-bottom))',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            },
            (t) =>
              t.applyStyles('dark', {
                borderRadius: '20px 20px 0 0',
                bgcolor: t.vars?.palette.neutro.cartao,
                borderTop: '1px solid',
                borderColor: t.vars?.palette.neutro.borda,
              }),
          ],
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography component="h3" sx={{ fontWeight: 700, fontSize: 18 }}>
          comentários
        </Typography>
        <ButtonBase onClick={aoFechar} sx={{ fontFamily: 'inherit', fontSize: 13, color: 'text.secondary', minHeight: 44 }}>
          fechar
        </ButtonBase>
      </Box>

      {erro !== null && (
        <Alert severity="error" onClose={() => setErro(null)}>
          {erro}
        </Alert>
      )}

      <Box sx={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {comentarios === null ? (
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando...</Typography>
        ) : comentarios.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>ninguém comentou ainda</Typography>
        ) : (
          comentarios.map((c) => (
            <Box
              key={c.id}
              sx={{ display: 'flex', gap: '10px', py: '10px', borderTop: 1, borderColor: 'neutro.linha' }}
            >
              <Avatar nome={c.autor.nome} tamanho={30} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5 }}>
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {c.autor.nome}
                  </Box>{' '}
                  <Box component="span" sx={{ color: 'text.secondary', fontSize: 10.5 }}>
                    {tempoRelativo(c.criado_em, new Date())}
                  </Box>
                </Typography>
                <Typography sx={{ fontSize: 13, lineHeight: 1.4, overflowWrap: 'anywhere' }}>{c.texto}</Typography>
              </Box>
              {c.posso_apagar && (
                <ButtonBase
                  onClick={() => void apagar(c)}
                  sx={{ fontFamily: 'inherit', fontSize: 11.5, color: 'error.main', alignSelf: 'flex-start', minHeight: 32 }}
                >
                  apagar
                </ButtonBase>
              )}
            </Box>
          ))
        )}
      </Box>

      <Box component="form" onSubmit={(e) => void enviar(e)} sx={{ display: 'flex', gap: '8px' }}>
        <InputBase
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="comentar..."
          inputProps={{ maxLength: 500, 'aria-label': 'escrever comentário' }}
          sx={{
            flex: 1,
            minHeight: 44,
            px: '12px',
            border: '1.4px solid',
            borderColor: 'neutro.borda',
            borderRadius: '11px',
            fontSize: 14,
          }}
        />
        <Button type="submit" variant="contained" disabled={enviando || texto.trim() === ''} sx={{ borderRadius: '11px', minHeight: 44 }}>
          enviar
        </Button>
      </Box>
    </Drawer>
  );
}
