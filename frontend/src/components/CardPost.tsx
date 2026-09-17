import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { Heart, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Avatar from './social/Avatar';
import { numero } from '../lib/format';
import { tempoRelativo } from '../lib/social';
import type { Post } from '../lib/types';

interface Props {
  post: Post;
  aoCurtir: (post: Post) => void;
  aoComentar: (post: Post) => void;
}

const acaoSx = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  minHeight: 44,
  px: '4px',
  fontFamily: 'inherit',
  fontWeight: 600,
  fontSize: 12,
  color: 'text.secondary',
  fontVariantNumeric: 'tabular-nums',
} as const;

/** Post do feed (design 08, aba feed). */
export default function CardPost({ post, aoCurtir, aoComentar }: Props) {
  return (
    <Box
      component="article"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pb: '16px',
        borderBottom: 1,
        borderColor: 'neutro.linha',
      }}
    >
      <Box
        component={Link}
        to={`/u/${post.autor.id}`}
        sx={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'inherit', textDecoration: 'none' }}
      >
        <Avatar nome={post.autor.nome} tamanho={34} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{post.autor.nome}</Typography>
          <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }}>
            {post.refeicao_nome} · {tempoRelativo(post.criado_em, new Date())}
          </Typography>
        </Box>
      </Box>

      {post.midia_url !== null && (
        <Box
          component="img"
          src={post.midia_url}
          alt={`foto de ${post.descricao_bruta}`}
          loading="lazy"
          sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '14px', display: 'block' }}
        />
      )}

      <Typography sx={{ fontSize: 13, lineHeight: 1.4 }}>{post.descricao_bruta}</Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Box
          sx={[
            {
              minHeight: 26,
              display: 'flex',
              alignItems: 'center',
              px: '10px',
              borderRadius: '8px',
              bgcolor: 'neutro.cartao',
              fontWeight: 600,
              fontSize: 11,
              color: 'text.secondary',
              fontVariantNumeric: 'tabular-nums',
            },
            (t) => t.applyStyles('dark', { border: '1px solid', borderColor: 'neutro.borda' }),
          ]}
        >
          {numero(post.calorias_total)} kcal
        </Box>
        <Box sx={{ flex: 1 }} />
        <ButtonBase
          sx={{ ...acaoSx, color: post.curti ? 'status.passou' : 'text.secondary' }}
          aria-pressed={post.curti}
          aria-label={post.curti ? 'descurtir' : 'curtir'}
          onClick={() => aoCurtir(post)}
        >
          <motion.span
            key={String(post.curti)}
            initial={{ scale: post.curti ? 0.6 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            style={{ display: 'flex' }}
          >
            <Heart size={16} strokeWidth={1.9} fill={post.curti ? 'currentColor' : 'none'} />
          </motion.span>
          {post.curtidas}
        </ButtonBase>
        <ButtonBase sx={acaoSx} aria-label="comentários" onClick={() => aoComentar(post)}>
          <MessageSquare size={16} strokeWidth={1.9} />
          {post.comentarios}
        </ButtonBase>
      </Box>
    </Box>
  );
}
