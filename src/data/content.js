import { Apple, Dumbbell, HeartPulse, ShieldCheck, Trophy } from "lucide-react";

export const img = {
  athlete: "/assets/workout.png",
  yoga: "/assets/yoga.jpg",
  food: "/assets/nutrition.png",
  coach: "/assets/coach.jpg",
};
export const cats = [
  ["Musculação", Dumbbell],
  ["Yoga", HeartPulse],
  ["Basquete", Trophy],
  ["Nutrição", Apple],
  ["Recuperação", HeartPulse],
  ["Lesões", ShieldCheck],
];
export const videos = [
  [
    "Hipertrofia inteligente: peito e tríceps",
    "Musculação",
    "32 min",
    img.athlete,
  ],
  ["Yoga para mobilidade do quadril", "Yoga", "24 min", img.yoga],
  ["Controle de bola para armadores", "Basquete", "18 min", img.athlete],
  ["Sono: o treino invisível", "Recuperação", "14 min", img.yoga],
  ["Proteína sem complicação", "Nutrição", "20 min", img.food],
  ["Prevenção de lesões no joelho", "Lesões", "27 min", img.coach],
];
