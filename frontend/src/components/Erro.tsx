export default function Erro({ mensagem, aoFechar }: { mensagem: string; aoFechar?: () => void }) {
  return (
    <div className="erro-faixa" role="alert">
      <span>{mensagem}</span>
      {aoFechar !== undefined && (
        <button type="button" onClick={aoFechar} aria-label="fechar aviso">
          ×
        </button>
      )}
    </div>
  );
}
