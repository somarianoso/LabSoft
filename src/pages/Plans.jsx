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
          ["Básico", "R$ 29 /mês"],
          ["Pro", "R$ 59 /mês"],
          ["Premium", "R$ 89 /mês"],
        ].map(([name, price], i) => (
          <article
            className={i === 1 ? "plan featured-plan" : "plan"}
            key={name}
          >
            {i === 1 && <span className="recommended">MAIS ESCOLHIDO</span>}
            <h2>{name}</h2>
            <small>
              {i === 0
                ? "Comece com o essencial"
                : i === 1
                  ? "Para quem treina sério"
                  : "Performance sem limites"}
            </small>
            <strong>{price}</strong>
            {[
              "Todas as categorias",
              "Vídeos em Full HD",
              "Planos e favoritos",
              "Acesso em dispositivos",
            ]
              .slice(0, i + 2)
              .map((x) => (
                <span className="check" key={x}>
                  <Check size={13} /> {x}
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
