import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { api, mensagemDoErro } from '../../lib/api';
import { membros, textoRanking } from '../../lib/social';
import type { Grupo } from '../../lib/types';

/**
 * Aba "Grupos" do próprio perfil: só lista, sem criar/entrar (isso já existe em
 * `/social?aba=grupos`, sem duplicar o formulário aqui).
 */
export default function AbaGruposPerfil() {
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api
      .grupos()
      .then((resposta) => setGrupos(resposta.grupos))
      .catch((falha: unknown) => setErro(mensagemDoErro(falha)));
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {erro !== null && (
        <Alert severity="error" onClose={() => setErro(null)}>
          {erro}
        </Alert>
      )}

      {grupos === null ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando...</Typography>
      ) : grupos.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          você ainda não participa de nenhum grupo — entre ou crie um em{' '}
          <Box component={Link} to="/social?aba=grupos" sx={{ color: 'primary.main', fontWeight: 600 }}>
            social
          </Box>
          .
        </Typography>
      ) : (
        grupos.map((grupo) => {
          const ranking = textoRanking(grupo.minha_posicao_semana);
          return (
            <Box
              key={grupo.id}
              component={Link}
              to={`/grupos/${grupo.id}`}
              sx={[
                {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  p: '14px',
                  borderRadius: '14px',
                  bgcolor: 'neutro.cartao',
                  color: 'inherit',
                  textDecoration: 'none',
                },
                (t) => t.applyStyles('dark', { border: '1px solid', borderColor: t.vars?.palette.neutro.borda }),
              ]}
            >
              <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{grupo.nome}</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{membros(grupo.quantidade_membros)}</Typography>
              {ranking !== null && (
                <Typography sx={{ fontWeight: 600, fontSize: 12.5, color: 'primary.main' }}>{ranking}</Typography>
              )}
            </Box>
          );
        })
      )}
    </Box>
  );
}
