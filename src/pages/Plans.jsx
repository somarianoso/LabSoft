import { ArrowUpRight } from "lucide-react";
import PlanBenefits from "../components/PlanBenefits.jsx";
import { plans } from "../data/plans.js";

export default function Plans({ go }) {
  return (
    <main className="wrap page plans">
      <span className="eyebrow">ESCOLHA SUA EVOLUÇÃO</span>
      <h1>Um plano para cada objetivo</h1>
      <p>
        Conteúdo certificado, novos vídeos toda semana e liberdade para mudar de
        plano quando quiser.
      </p>
      <div className="billing">
        <button>Mensal</button>
        <button>Anual · -20%</button>
      </div>
      <div className="plan-grid">
        {plans.map((plan, i) => (
          <article
            className={i === 1 ? "plan featured-plan" : "plan"}
            key={plan.id}
          >
            {i === 1 && <span className="recommended">MAIS ESCOLHIDO</span>}
            <h2>{plan.name}</h2>
            <small>{plan.description}</small>
            <strong>{plan.price}</strong>
            <PlanBenefits benefits={plan.benefits} />
            <button
              className={i === 1 ? "green" : "dark-button"}
              data-testid={`choose-plan-${plan.id}`}
              onClick={() => go("checkout", plan)}
            >
              {i === 1 ? "Assinar Pro" : "Escolher plano"}{" "}
              <ArrowUpRight size={13} />
            </button>
          </article>
        ))}
      </div>
      <div className="payment">
        <h3>
          ▣<br />
          Pagamento seguro e flexível
        </h3>
        <p>Cartão de crédito, Pix ou boleto. Cancele quando quiser.</p>
        <span>VISA</span>
        <span>mastercard</span>
        <span>PIX</span>
        <span>boleto</span>
      </div>
    </main>
  );
}
