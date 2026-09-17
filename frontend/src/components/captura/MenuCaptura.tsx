import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Camera, Mic, Type } from 'lucide-react';
import { useCaptura } from '../../captura/CapturaContext';
import { IconeMais } from '../tabbar/icones';
import { estiloVidro } from '../tabbar/vidro';
import { useRolagemCompacta } from '../tabbar/useRolagemCompacta';
import { paleta } from '../../theme/tema';

const MOLA = { type: 'spring', stiffness: 300, damping: 28 } as const;

const BotaoCentral = styled(motion.button)(({ theme }) => ({
  margin: '0 2px',
  padding: 0,
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  background: 'linear-gradient(155deg,#14C77A,#0B7A46)',
  boxShadow: '0 8px 20px -6px rgba(11,122,70,.55), inset 0 1.4px 0 rgba(255,255,255,.5)',
  WebkitTapHighlightColor: 'transparent',
  '&:hover': { filter: 'brightness(1.06)' },
  '&:disabled': { cursor: 'progress', opacity: 0.7 },
  '&:focus-visible': { outline: `2px solid ${paleta(theme).primary.main}`, outlineOffset: 3 },
  ...theme.applyStyles('dark', {
    color: '#07130e',
    background: 'linear-gradient(155deg,#47b989,#2c6f55)',
    boxShadow: '0 8px 20px -6px rgba(63,168,124,.5), inset 0 1.4px 0 rgba(255,255,255,.35)',
    '&:hover': { filter: 'brightness(1.08)' },
  }),
}));

const Popover = styled(motion.div)(({ theme }) => ({
  ...estiloVidro(theme),
  position: 'absolute',
  bottom: 'calc(100% + 14px)',
  left: '50%',
  display: 'flex',
  gap: 4,
  padding: 6,
  borderRadius: 22,
}));

const Opcao = styled('button')(({ theme }) => ({
  width: 64,
  minHeight: 58,
  border: 'none',
  borderRadius: 16,
  background: 'none',
  font: 'inherit',
  fontSize: 11,
  fontWeight: 600,
  color: paleta(theme).text.primary,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  '&:hover': { background: 'rgba(0,0,0,.06)' },
  '&:focus-visible': { outline: `2px solid ${paleta(theme).primary.main}` },
  ...theme.applyStyles('dark', { '&:hover': { background: 'rgba(255,255,255,.08)' } }),
}));

export default function MenuCaptura() {
  const { enviarFoto, abrirAudio, abrirTexto, ocupado } = useCaptura();
  const [aberto, setAberto] = useState(false);
  const compacta = useRolagemCompacta();
  const reduzir = useReducedMotion() ?? false;
  const raiz = useRef<HTMLDivElement>(null);
  const seletorFoto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const aoTocarFora = (evento: PointerEvent) => {
      if (raiz.current !== null && !raiz.current.contains(evento.target as Node)) setAberto(false);
    };
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false);
    };
    document.addEventListener('pointerdown', aoTocarFora);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('pointerdown', aoTocarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  function escolher(acao: () => void) {
    setAberto(false);
    acao();
  }

  const tamanho = compacta ? 44 : 54;

  return (
    <Box ref={raiz} sx={{ position: 'relative', display: 'flex' }}>
      <AnimatePresence>
        {aberto && (
          <Popover
            role="menu"
            aria-label="registrar por"
            style={{ x: '-50%' }}
            initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduzir ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }}
            transition={reduzir ? { duration: 0.15 } : { type: 'spring', stiffness: 420, damping: 30 }}
          >
            <Opcao type="button" role="menuitem" onClick={() => escolher(() => seletorFoto.current?.click())}>
              <Camera size={20} aria-hidden="true" />
              foto
            </Opcao>
            <Opcao type="button" role="menuitem" onClick={() => escolher(abrirAudio)}>
              <Mic size={20} aria-hidden="true" />
              áudio
            </Opcao>
            <Opcao type="button" role="menuitem" onClick={() => escolher(abrirTexto)}>
              <Type size={20} aria-hidden="true" />
              texto
            </Opcao>
          </Popover>
        )}
      </AnimatePresence>

      <BotaoCentral
        type="button"
        aria-label="registrar refeição"
        aria-haspopup="menu"
        aria-expanded={aberto}
        disabled={ocupado}
        onClick={() => setAberto((atual) => !atual)}
        initial={false}
        animate={{ width: tamanho, height: tamanho, rotate: aberto ? 45 : 0 }}
        transition={reduzir ? { duration: 0.15 } : MOLA}
        whileTap={reduzir ? undefined : { scale: 0.86 }}
      >
        <IconeMais />
      </BotaoCentral>

      {/* Abre a câmera traseira no celular; no desktop cai no seletor de arquivo. */}
      <input
        ref={seletorFoto}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(evento) => {
          const arquivo = evento.target.files?.[0];
          evento.target.value = ''; // permite escolher a mesma foto de novo
          if (arquivo !== undefined) enviarFoto(arquivo);
        }}
      />
    </Box>
  );
}
