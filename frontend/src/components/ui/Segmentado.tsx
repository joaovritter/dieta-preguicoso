import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

interface Props<T extends string> {
  opcoes: Array<{ valor: T; rotulo: string }>;
  valor: T;
  aoMudar: (valor: T) => void;
  estilo?: 'padrao' | 'login';
  rotulo: string;
}

export default function Segmentado<T extends string>({
  opcoes,
  valor,
  aoMudar,
  estilo = 'padrao',
  rotulo,
}: Props<T>) {
  const login = estilo === 'login';
  return (
    <Box
      role="tablist"
      aria-label={rotulo}
      sx={(t) => ({
        display: 'flex',
        gap: login ? '8px' : '6px',
        p: login ? '3px' : '4px',
        borderRadius: login ? '13px' : '12px',
        bgcolor: 'neutro.cartao',
        ...t.applyStyles('dark', login ? {} : { border: '1px solid', borderColor: 'neutro.borda' }),
      })}
    >
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <ButtonBase
            key={opcao.valor}
            role="tab"
            aria-selected={ativo}
            onClick={() => aoMudar(opcao.valor)}
            sx={(t) => ({
              flex: 1,
              minHeight: login ? 40 : 36,
              borderRadius: login ? '10px' : '9px',
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: login ? 13.5 : 12.5,
              transition: 'background-color .2s, color .2s, box-shadow .2s',
              ...(login
                ? {
                    bgcolor: ativo ? '#000' : '#fff',
                    color: ativo ? '#fff' : '#000',
                    ...t.applyStyles('dark', {
                      bgcolor: ativo ? '#1c2027' : 'transparent',
                      color: ativo ? 'text.primary' : 'text.secondary',
                      boxShadow: ativo ? `inset 0 0 0 1px ${(t.vars ?? t).palette.primary.main}` : 'none',
                    }),
                  }
                : {
                    bgcolor: ativo ? '#14120F' : 'transparent',
                    color: ativo ? '#fff' : 'text.secondary',
                    ...t.applyStyles('dark', {
                      bgcolor: ativo ? 'text.primary' : 'transparent',
                      color: ativo ? 'background.default' : 'text.secondary',
                    }),
                  }),
            })}
          >
            {opcao.rotulo}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
