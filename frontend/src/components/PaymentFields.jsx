export default function PaymentFields({ method }) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <fieldset className="checkout-categories" key={method}>
      <legend>{method === "cartao" ? "Dados do cartão" : method === "pix" ? "Dados do pagador — Pix" : "Dados para o boleto"}</legend>
      <p id="payment-demo-help">Demonstração: use dados fictícios. Estes dados não serão enviados nem armazenados; nenhum pagamento será gerado.</p>
      <label htmlFor="payment-name">{method === "cartao" ? "Nome impresso no cartão" : "Nome completo do pagador"}
        <input id="payment-name" name="payment-name" autoComplete="off" required minLength={3} maxLength={120} pattern=".*\S.*" />
      </label>
      {method === "cartao" ? <>
        <label htmlFor="card-number">Número do cartão
          <input id="card-number" name="card-number" inputMode="numeric" autoComplete="off" required pattern="[0-9]{13,19}" minLength={13} maxLength={19} placeholder="Somente números" aria-describedby="payment-demo-help" />
        </label>
        <div className="checkout-fields-row">
          <label htmlFor="card-expiry">Validade
            <input id="card-expiry" name="card-expiry" type="month" min={currentMonth} required />
          </label>
          <label htmlFor="card-cvv">Código de segurança (CVV)
            <input id="card-cvv" name="card-cvv" type="password" inputMode="numeric" autoComplete="off" required pattern="[0-9]{3,4}" minLength={3} maxLength={4} />
          </label>
        </div>
      </> : <>
        <label htmlFor="payment-cpf">CPF do pagador
          <input id="payment-cpf" name="payment-cpf" inputMode="numeric" autoComplete="off" required pattern="[0-9]{11}" minLength={11} maxLength={11} placeholder="11 dígitos, somente números" />
        </label>
        <label htmlFor="payment-email">E-mail do pagador
          <input id="payment-email" name="payment-email" type="email" autoComplete="off" required maxLength={254} />
        </label>
        {method === "boleto" && <label htmlFor="billing-address">Endereço de cobrança
          <input id="billing-address" name="billing-address" autoComplete="off" required minLength={10} maxLength={250} placeholder="Rua, número, bairro, cidade, UF e CEP" />
        </label>}
        <p>{method === "pix" ? "O QR Code e o código Pix estarão disponíveis quando o processamento de pagamentos for integrado." : "O boleto e seu vencimento estarão disponíveis quando o processamento de pagamentos for integrado."}</p>
      </>}
    </fieldset>
  );
}
