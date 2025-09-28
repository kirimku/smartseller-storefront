import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Percent, Users, ShieldCheck, RotateCw } from "lucide-react";

type MenuItem = {
  label: string;
  to: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const items: MenuItem[] = [
  { label: "Monthly Promo", to: "/promo", Icon: Percent },
  { label: "Affiliate", to: "/referral", Icon: Users },
  { label: "Warranty", to: "/warranty", Icon: ShieldCheck },
  { label: "Spin & Win", to: "/spin-win", Icon: RotateCw },
];

export const MenuSection = () => {
  return (
    <nav aria-label="Quick menu" className="px-6 mt-4">
      <Card>
        <div className="grid grid-cols-4 gap-2 p-3">
          {items.map(({ label, to, Icon }) => (
            <Link
              key={label}
              to={to}
              className="group flex flex-col items-center justify-start gap-2 rounded-lg bg-card p-3 text-center hover:bg-muted transition-colors min-h-[80px]"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <span className="text-xs font-medium text-muted-foreground leading-tight mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </nav>
  );
};
