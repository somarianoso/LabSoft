import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import PlanBenefits from "../components/PlanBenefits.jsx";
import { getCategories, getPlans } from "../services/wellflix.js";
import { apiRequest } from "../services/api.js";

export default function Checkout({ plan, go, user }) {
  const [plans, setPlans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getPlans(), getCategories()])
      .then(([availablePlans, availableCategories]) => {
        setPlans(availablePlans);
        setCategories(availableCategories);
      })
      .catch((error) => setFeedback({ type: "error", message: error.message }));
  }, []);

  const selectedPlan = plans.find((item) => item.id === plan?.id) || plans.find((item) => item.id === "pro");
  const categoryLimit = selectedPlan?.categoryLimit ?? null;
  const requiresCategorySelection = categoryLimit !== null;

  const handleCategoryChange = (category) => {
    setSelectedCategories((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
    setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?.accessToken) {
      setFeedback({ type: "error", message: "Entre na sua conta de atleta antes de solicitar uma assinatura." });
      return;
    }
    if (requiresCategorySelection && selectedCategories.length !== categoryLimit) {
      setFeedback({ type: "error", message: `Selecione exatamente ${categoryLimit} categorias para o plano ${selectedPlan.name}.` });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("account", "/api/assinaturas", {
        method: "POST",
        token: user.accessToken,
        body: {
          codigo_plano: selectedPlan.id,
          metodo_pagamento: paymentMethod,
          categorias: requiresCategorySelection ? selectedCategories : categories,
        },
      });
      setFeedback({ type: "success", message: `Solicitação do plano ${selectedPlan.name} registrada como pendente de pagamento. Nenhuma cobrança foi realizada.` });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedPlan) {
    return <main className="wrap page"><p role="status">Carregando plano e categorias…</p>{feedback?.type === "error" && <p role="alert">{feedback.message}</p>}</main>;
  }

  return (
    <main className="wrap page checkout-page">
      <button className="dark-button" type="button" onClick={() => go("planos")}>
        <ArrowLeft size={14} /> Voltar aos planos
      </button>
      <span className="eyebrow">FINALIZAR ASSINATURA</span>
      <h1>Confirme seu plano</h1>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Forma de pagamento</h2>
          {requiresCategorySelection && (
            <fieldset className="checkout-categories">
              <legend>Escolha suas categorias de consumo</legend>
              <p id="checkout-category-help">Selecione exatamente {categoryLimit} de {categories.length} categorias.</p>
              <span className="category-selection-count" data-testid="checkout-category-count" aria-live="polite">
                {selectedCategories.length} de {categoryLimit} selecionadas
              </span>
              <div className="checkout-category-options">
                {categories.map((category, index) => {
                  const isSelected = selectedCategories.includes(category);
                  const isAtLimit = selectedCategories.length === categoryLimit && !isSelected;
                  return (
                    <label key={category}>
                      <input
                        type="checkbox"
                        name="checkout-category"
                        value={category}
                        data-testid={`checkout-category-${index}`}
                        checked={isSelected}
                        disabled={isAtLimit}
                        aria-describedby="checkout-category-help"
                        onChange={() => handleCategoryChange(category)}
                      />
                      {category}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
          <label htmlFor="checkout-payment-method">
            Método de pagamento
            <select id="checkout-payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="pix">Pix</option>
              <option value="cartao">Cartão</option>
              <option value="boleto">Boleto</option>
            </select>
          </label>
          {!user?.accessToken && <button className="dark-button" type="button" onClick={() => go("login")}>Entrar para solicitar a assinatura</button>}
          <button className="green" type="submit" data-testid="checkout-submit" disabled={isSubmitting}>
            {isSubmitting ? "Enviando…" : "Solicitar assinatura"} <ArrowUpRight size={14} />
          </button>
          {feedback && <p className={`checkout-feedback checkout-feedback--${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"} data-testid="checkout-feedback">{feedback.message}</p>}
        </form>
        <aside className="checkout-summary" aria-label="Resumo do pedido">
          <span className="eyebrow">SEU PLANO</span>
          <h2>{selectedPlan.name}</h2>
          <strong>{selectedPlan.price}</strong>
          <p>Assinatura mensal, com cancelamento quando quiser.</p>
          <PlanBenefits benefits={selectedPlan.benefits} className="checkout-benefit" />
          {requiresCategorySelection ? (
            <div className="checkout-selected-categories" data-testid="checkout-selected-categories">
              <strong>Categorias selecionadas</strong>
              {selectedCategories.length ? <ul>{selectedCategories.map((category) => <li key={category}>{category}</li>)}</ul> : <p>Nenhuma categoria selecionada.</p>}
            </div>
          ) : <p className="checkout-all-categories">Acesso a todas as categorias de consumo.</p>}
          <small>Ambiente de demonstração. A solicitação fica pendente; nenhuma cobrança é processada.</small>
        </aside>
      </div>
    </main>
  );
}
