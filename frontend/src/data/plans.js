export const plans = [
  {
    id: "basico",
    name: "Básico",
    price: "R$ 29 /mês",
    description: "Comece com o essencial",
    categoryLimit: 2,
    benefits: [
      "2 categorias de consumo",
      "Engajamento na comunidade: avaliações e comentários",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 59 /mês",
    description: "Para quem treina sério",
    categoryLimit: 6,
    benefits: [
      "6 categorias de consumo",
      "Engajamento na comunidade: avaliações e comentários",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 89 /mês",
    description: "Performance sem limites",
    categoryLimit: null,
    benefits: [
      "Todas as categorias de consumo",
      "Engajamento na comunidade: avaliações e comentários",
      "Lembretes de novas postagens (WhatsApp)",
    ],
  },
];

export const defaultPlan = plans.find((plan) => plan.id === "pro");
