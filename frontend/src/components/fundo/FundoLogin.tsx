import { Suspense, lazy, useMemo } from 'react';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { deveAnimarFundo, temWebgl } from './suporteWebgl';

const FundoLiquido = lazy(() => import('./FundoLiquido'));

function GradienteEstatico() {
  return (
    <Box
      sx={(theme) => ({
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(120% 60% at 20% 0%, rgba(12,168,93,.14), transparent 60%), radial-gradient(90% 50% at 90% 10%, rgba(12,168,93,.08), transparent 70%)',
        ...theme.applyStyles('dark', {
          background:
            'radial-gradient(120% 60% at 20% 0%, rgba(63,168,124,.18), transparent 60%), radial-gradient(90% 50% at 90% 10%, rgba(63,168,124,.10), transparent 70%)',
        }),
      })}
    />
  );
}

export default function FundoLogin() {
  const reduzMovimento = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });
  const webgl = useMemo(() => temWebgl(), []);
  const animar = deveAnimarFundo(webgl, reduzMovimento);

  return (
    <Box
      aria-hidden="true"
      sx={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      {animar ? (
        <Suspense fallback={<GradienteEstatico />}>
          <FundoLiquido />
        </Suspense>
      ) : (
        <GradienteEstatico />
      )}
    </Box>
  );
}
