import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { img } from "../data/content.js";

export default function Signup({ mode = "signup", go, onSuccess }) {
  const isLogin = mode === "login";
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [invalidFields, setInvalidFields] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setInvalidFields((current) => current.filter((field) => field !== name));
    setFeedback(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const fieldsToValidate = isLogin
      ? { email: formData.email, password: formData.password }
      : formData;
    const missingFields = Object.entries(fieldsToValidate)
      .filter(([, value]) => !value.trim())
      .map(([field]) => field);

    if (missingFields.length > 0) {
      setInvalidFields(missingFields);
      setFeedback({
        type: "error",
        message: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setInvalidFields(["email"]);
      setFeedback({ type: "error", message: "Informe um e-mail válido." });
      return;
    }

    setInvalidFields([]);
    if (isLogin) {
      onSuccess?.({ name: formData.email.split("@")[0] });
      return;
    }

    setFeedback({
      type: "success",
      message: `Cadastro realizado com sucesso para ${formData.name.trim()}.`,
    });
  };

  return (
    <main className="signup">
      <div
        className="signup-art"
        style={{ backgroundImage: `url(${img.athlete})` }}
      >
        <button className="logo">◉ WellFlix</button>
        <div>
          <h1>
            Consistência ganha
            <br />
            quando direção e<br />
            movimento jogam juntos.
          </h1>
          <span>Conteúdo certificado para resultados reais.</span>
        </div>
      </div>
      <form className="signup-form" onSubmit={handleSubmit} noValidate>
        <div className="tabs">
          <button
            className={isLogin ? "selected" : ""}
            type="button"
            onClick={() => go("login")}
          >
            Entrar
          </button>
          <button
            className={isLogin ? "" : "selected"}
            type="button"
            onClick={() => go("cadastro")}
          >
            Criar conta
          </button>
        </div>
        <h2>{isLogin ? "Entre para continuar" : "Que bom ter você aqui"}</h2>
        <p>
          {isLogin
            ? "Acesse sua conta para acompanhar sua evolução."
            : "Entre para continuar sua evolução."}
        </p>
        {!isLogin && (
          <label htmlFor="signup-name">
            Nome completo
            <input
              id="signup-name"
              name="name"
              type="text"
              placeholder="Seu nome"
              value={formData.name}
              onChange={handleChange}
              required
              aria-invalid={invalidFields.includes("name")}
              aria-describedby={invalidFields.includes("name") ? "signup-feedback" : undefined}
            />
          </label>
        )}
        <label htmlFor={isLogin ? "login-email" : "signup-email"}>
          E-mail
          <input
            id={isLogin ? "login-email" : "signup-email"}
            name="email"
            type="email"
            placeholder="voce@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            aria-invalid={invalidFields.includes("email")}
            aria-describedby={invalidFields.includes("email") ? "signup-feedback" : undefined}
          />
        </label>
        <label htmlFor={isLogin ? "login-password" : "signup-password"}>
          Senha
          <input
            id={isLogin ? "login-password" : "signup-password"}
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            aria-invalid={invalidFields.includes("password")}
            aria-describedby={invalidFields.includes("password") ? "signup-feedback" : undefined}
          />
        </label>
        {!isLogin && (
          <label className="creator-check" htmlFor="signup-creator">
            <input id="signup-creator" name="creator" type="checkbox" />
            Quero me cadastrar como profissional
          </label>
        )}
        <button
          className="green"
          type="submit"
          data-testid={isLogin ? "login-submit" : "signup-submit"}
        >
          {isLogin ? "Entrar" : "Cadastrar"} <ArrowUpRight size={13} />
        </button>
        {feedback && (
          <p
            id="signup-feedback"
            className={`feedback feedback--${feedback.type}`}
            role={feedback.type === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        )}
      </form>
    </main>
  );
}
