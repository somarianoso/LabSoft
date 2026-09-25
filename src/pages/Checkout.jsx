import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";

export default function Checkout({ plan, go }) {
  const [feedback, setFeedback] = useState("");
  const selectedPlan = plan || { name: "Pro", price: "R$ 59 /mês" };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFeedback(`Pagamento aprovado. Plano ${selectedPlan.name} ativado.`);
  };

  return (
    <main className="wrap page checkout-page">
      <button className="dark-button" type="button" onClick={() => go("planos")}>
        <ArrowLeft size={14} /> Voltar aos planos
      </button>
      <span className="eyebrow">FINALIZAR ASSINATURA</span>
      <h1>Confirme seu plano</h1>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Dados de pagamento</h2>
          <label htmlFor="checkout-name">
            Nome no cartão
            <input id="checkout-name" name="name" autoComplete="cc-name" required />
          </label>
          <label htmlFor="checkout-card">
            Número do cartão
            <input
              id="checkout-card"
              name="card"
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={19}
              placeholder="0000 0000 0000 0000"
              required
            />
          </label>
          <div className="checkout-fields-row">
            <label htmlFor="checkout-expiry">
              Validade
              <input
                id="checkout-expiry"
                name="expiry"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                maxLength={5}
                required
              />
            </label>
            <label htmlFor="checkout-cvc">
              CVV
              <input
                id="checkout-cvc"
                name="cvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                required
              />
            </label>
          </div>
          <button className="green" type="submit" data-testid="checkout-submit">
            Confirmar compra <ArrowUpRight size={14} />
          </button>
          {feedback && <p role="status" data-testid="checkout-feedback">{feedback}</p>}
        </form>
        <aside className="checkout-summary" aria-label="Resumo do pedido">
          <span className="eyebrow">SEU PLANO</span>
          <h2>{selectedPlan.name}</h2>
          <strong>{selectedPlan.price}</strong>
          <p>Assinatura mensal, com cancelamento quando quiser.</p>
          <span><Check size={14} /> Conteúdo certificado</span>
          <span><Check size={14} /> Vídeos em Full HD</span>
          <small>Ambiente de demonstração. Nenhuma cobrança será realizada.</small>
        </aside>
      </div>
    </main>
  );
}