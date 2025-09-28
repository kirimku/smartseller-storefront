import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Coins, TrendingUp, Trophy } from "lucide-react";

export const StatsSection = () => {
  return (
    <div className="px-6 mt-4">
      <Card>
        <div className="p-6">
          {/* Points Balance */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Points</p>
                <p className="text-2xl font-bold text-primary">12,450</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">This Month</p>
              <div className="flex items-center gap-1 text-primary">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold">+2,340</span>
              </div>
            </div>
          </div>

          {/* Tier Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="font-medium">Elite Tier</span>
              </div>
              <span className="text-sm text-muted-foreground">2,550 / 5,000 XP</span>
            </div>
            <Progress value={51} className="h-2" />
            <p className="text-xs text-muted-foreground">
              2,450 XP until <span className="text-foreground font-medium">Legend Tier</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};