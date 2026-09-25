import { ShieldCheck } from "lucide-react";

export default function Expert({ name, role, image }) {
  return (
    <div className="expert">
      <img src={image} alt={name} />
      <strong>
        {name} <ShieldCheck size={11} />
      </strong>
      <small>{role}</small>
    </div>
  );
}
