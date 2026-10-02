import { useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import PlanBenefits from "../components/PlanBenefits.jsx";
import { consumptionCategories } from "../data/content.js";
import { defaultPlan, plans } from "../data/plans.js";

export default function Checkout({ plan, go }) {
  const [feedback, setFeedback] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const selectedPlan =
    plans.find((item) => item.id === plan?.id) ||
    plans.find((item) => item.name === plan?.name) ||
    defaultPlan;
  const categoryLimit = selectedPlan.categoryLimit;
  const requiresCategorySelection = categoryLimit !== null;

  const handleCategoryChange = (category) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
    setFeedback(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      requiresCategorySelection &&
      selectedCategories.length !== categoryLimit
    ) {
      setFeedback({
        type: "error",
        message: `Selecione exatamente ${categoryLimit} categorias para o plano ${selectedPlan.name}.`,
      });
      return;
    }

    const categoryConfirmation = requiresCategorySelection
      ? ` Categorias selecionadas: ${selectedCategories.join(", ")}.`
      : "";
    setFeedback({
      type: "success",
      message: `Pagamento aprovado. Plano ${selectedPlan.name} ativado.${categoryConfirmation}`,
    });
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
          {requiresCategorySelection && (
            <fieldset className="checkout-categories">
              <legend>Escolha suas categorias de consumo</legend>
              <p id="checkout-category-help">
                Selecione exatamente {categoryLimit} de{" "}
                {consumptionCategories.length} categorias.
              </p>
              <span
                className="category-selection-count"
                data-testid="checkout-category-count"
                aria-live="polite"
              >
                {selectedCategories.length} de {categoryLimit} selecionadas
              </span>
              <div className="checkout-category-options">
                {consumptionCategories.map((category, index) => {
                  const isSelected = selectedCategories.includes(category);
                  const isAtLimit =
                    selectedCategories.length === categoryLimit && !isSelected;
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
          {feedback && (
            <p
              className={`checkout-feedback checkout-feedback--${feedback.type}`}
              role={feedback.type === "error" ? "alert" : "status"}
              data-testid="checkout-feedback"
            >
              {feedback.message}
            </p>
          )}
        </form>
        <aside className="checkout-summary" aria-label="Resumo do pedido">
          <span className="eyebrow">SEU PLANO</span>
          <h2>{selectedPlan.name}</h2>
          <strong>{selectedPlan.price}</strong>
          <p>Assinatura mensal, com cancelamento quando quiser.</p>
          <PlanBenefits
            benefits={selectedPlan.benefits}
            className="checkout-benefit"
          />
          {requiresCategorySelection ? (
            <div
              className="checkout-selected-categories"
              data-testid="checkout-selected-categories"
            >
              <strong>Categorias selecionadas</strong>
              {selectedCategories.length > 0 ? (
                <ul>
                  {selectedCategories.map((category) => (
                    <li key={category}>{category}</li>
                  ))}
                </ul>
              ) : (
                <p>Nenhuma categoria selecionada.</p>
              )}
            </div>
          ) : (
            <p className="checkout-all-categories">
              Acesso a todas as categorias de consumo.
            </p>
          )}
          <small>Ambiente de demonstração. Nenhuma cobrança será realizada.</small>
        </aside>
      </div>
    </main>
  );
}
