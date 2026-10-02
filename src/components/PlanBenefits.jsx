import { Check } from "lucide-react";

export default function PlanBenefits({ benefits, className = "check" }) {
  return benefits.map((benefit) => (
    <span className={className} key={benefit}>
      <Check size={14} /> {benefit}
    </span>
  ));
}
