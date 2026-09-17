import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

interface Props<T extends string> {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  aoMudar: (valor: T) => void;
  rotulo: string;
}

/** Controle segmentado do design: claro = ativo preto; escuro = ativo claro sobre cartão com borda. */
export default function Segmentado<T extends string>({ opcoes, valor, aoMudar, rotulo }: Props<T>) {
  return (
    <Box
      role="tablist"
      aria-label={rotulo}
      sx={[
        { display: 'flex', gap: '6px', p: '4px', borderRadius: '12px', bgcolor: 'neutro.cartao' },
        (t) => t.applyStyles('dark', { border: '1px solid', borderColor: 'neutro.borda' }),
      ]}
    >
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <ButtonBase
            key={opcao.valor}
            role="tab"
            aria-selected={ativo}
            onClick={() => aoMudar(opcao.valor)}
            sx={[
              {
                flex: 1,
                minHeight: 36,
                borderRadius: '9px',
                fontWeight: 600,
                fontSize: 12.5,
                fontFamily: 'inherit',
                transition: 'background-color .2s, color .2s',
                bgcolor: ativo ? '#14120F' : 'transparent',
                color: ativo ? '#fff' : 'text.secondary',
              },
              (t) =>
                t.applyStyles('dark', {
                  bgcolor: ativo ? '#e7eaee' : 'transparent',
                  color: ativo ? '#0d0f12' : t.vars?.palette.text.secondary,
                }),
            ]}
          >
            {opcao.rotulo}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
