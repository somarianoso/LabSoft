import { ArrowUpRight, Check } from "lucide-react";

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
        {[
          {
            name: "Básico",
            price: "R$ 29 /mês",
            description: "Comece com o essencial",
            benefits: [
              "2 categorias de consumo",
              "Engajamento na comunidade: avaliações e comentários",
            ],
          },
          {
            name: "Pro",
            price: "R$ 59 /mês",
            description: "Para quem treina sério",
            benefits: [
              "6 categorias de consumo",
              "Engajamento na comunidade: avaliações e comentários",
            ],
          },
          {
            name: "Premium",
            price: "R$ 89 /mês",
            description: "Performance sem limites",
            benefits: [
              "Todas as categorias de consumo",
              "Engajamento na comunidade: avaliações e comentários",
              "Lembretes de novas postagens (WhatsApp)",
            ],
          },
        ].map(({ name, price, description, benefits }, i) => (
          <article
            className={i === 1 ? "plan featured-plan" : "plan"}
            key={name}
          >
            {i === 1 && <span className="recommended">MAIS ESCOLHIDO</span>}
            <h2>{name}</h2>
            <small>{description}</small>
            <strong>{price}</strong>
            {benefits.map((benefit) => (
              <span className="check" key={benefit}>
                <Check size={13} /> {benefit}
              </span>
            ))}
            <button
              className={i === 1 ? "green" : "dark-button"}
              data-testid={`choose-plan-${name.toLowerCase()}`}
              onClick={() => go("checkout", { name, price })}
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
