import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../../auth/useAuth';
import { api, mensagemDoErro } from '../../lib/api';
import Avatar from '../social/Avatar';

interface Props {
  tamanho: number;
  aoFalhar: (mensagem: string) => void;
}

/**
 * Avatar do próprio usuário com upload/remoção de foto de perfil por cima: um lápis pra
 * trocar (dispara o seletor de arquivo escondido) e um "x" pra remover quando já há foto.
 * Preview otimista com a foto local enquanto o envio está em andamento.
 */
export default function EditorFotoPerfil({ tamanho, aoFalhar }: Props) {
  const { perfil, definirPerfil } = useAuth();
  const entrada = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (perfil === null) return null;

  async function enviar(arquivo: File) {
    const urlLocal = URL.createObjectURL(arquivo);
    setPreview(urlLocal);
    setEnviando(true);
    try {
      definirPerfil(await api.enviarFotoPerfil(arquivo));
    } catch (falha: unknown) {
      aoFalhar(mensagemDoErro(falha));
    } finally {
      setEnviando(false);
      setPreview(null);
      URL.revokeObjectURL(urlLocal);
    }
  }

  async function remover() {
    setEnviando(true);
    try {
      definirPerfil(await api.removerFotoPerfil());
    } catch (falha: unknown) {
      aoFalhar(mensagemDoErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Box sx={{ position: 'relative', flex: 'none', width: tamanho, height: tamanho }}>
      <Avatar nome={perfil.nome} tamanho={tamanho} fotoUrl={preview ?? perfil.foto_url} />

      {enviando && (
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: 'rgba(0,0,0,0.35)',
          }}
        >
          <CircularProgress size={Math.round(tamanho * 0.4)} sx={{ color: '#fff' }} />
        </Box>
      )}

      <ButtonBase
        onClick={() => entrada.current?.click()}
        disabled={enviando}
        aria-label="trocar foto de perfil"
        sx={{
          position: 'absolute',
          right: -2,
          bottom: -2,
          width: 22,
          height: 22,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          border: '2px solid',
          borderColor: 'background.paper',
        }}
      >
        ✎
      </ButtonBase>

      {perfil.foto_url !== null && !enviando && (
        <ButtonBase
          onClick={() => void remover()}
          aria-label="remover foto de perfil"
          sx={{
            position: 'absolute',
            right: -2,
            top: -2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            bgcolor: 'neutro.cartao',
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            lineHeight: 1,
            border: '1px solid',
            borderColor: 'neutro.borda',
          }}
        >
          ×
        </ButtonBase>
      )}

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        hidden
        onChange={(evento) => {
          const arquivo = evento.target.files?.[0];
          evento.target.value = ''; // permite escolher a mesma foto de novo
          if (arquivo !== undefined) void enviar(arquivo);
        }}
      />
    </Box>
  );
}
