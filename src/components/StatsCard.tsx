import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "primary" | "success" | "warning" | "vacant" | "occupied";
}

const StatsCard = ({ title, value, icon: Icon, trend, color = "primary" }: StatsCardProps) => {
  const getColorClasses = () => {
    switch (color) {
      case "success":
        return "bg-success text-success-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      case "vacant":
        return "bg-vacant text-vacant-foreground";
      case "occupied":
        return "bg-occupied text-occupied-foreground";
      default:
        return "bg-primary text-primary-foreground";
    }
  };

  return (
    <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {trend && (
              <p className={`text-xs mt-1 ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${getColorClasses()}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;