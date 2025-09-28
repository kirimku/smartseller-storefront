import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Clock, Zap, Target } from "lucide-react";

const rewards = [
  {
    id: 1,
    title: "5% Cashback",
    description: "On all purchases this week",
    points: "500",
    icon: Gift,
    color: "gaming-green",
    urgent: false,
  },
  {
    id: 2,
    title: "Flash Sale Access",
    description: "24h early access to sales",
    points: "1,200",
    icon: Zap,
    color: "gaming-cyan",
    urgent: true,
  },
  {
    id: 3,
    title: "Double XP Weekend",
    description: "2x points on all activities",
    points: "800",
    icon: Target,
    color: "gaming-purple",
    urgent: false,
  },
];

export const RewardsSection = () => {
  return (
    <div className="px-6 mt-8 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Available Rewards</h2>
        <Button variant="ghost" size="sm" className="text-primary">
          View All
        </Button>
      </div>
      
      <div className="space-y-3">
        {rewards.map((reward) => {
          const Icon = reward.icon;
          
          return (
            <Card key={reward.id} className="">
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{reward.title}</h3>
                      {reward.urgent && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Limited
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{reward.description}</p>
                    <p className="text-sm font-semibold text-primary">{reward.points} points</p>
                  </div>
                  
                  <Button size="sm" variant="outline">
                    Claim
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};