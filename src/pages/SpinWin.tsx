import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Header } from "@/components/common/Header";
import gamingMouse from "@/assets/gaming-mouse.jpg";
import gamingKeyboard from "@/assets/gaming-keyboard.jpg";
import gamingHeadset from "@/assets/gaming-headset.jpg";
import { 
  RotateCcw, 
  Gift, 
  Star, 
  Coins,
  Clock,
  Trophy,
  Tag,
  Gamepad2,
  Zap,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type RewardType = "product" | "points" | "voucher" | "better-luck";

type WheelSegment = {
  id: number;
  label: string;
  type: RewardType;
  value: string;
  points?: number;
  color: string;
  probability: number;
  image?: string;
};

type SpinResult = {
  segment: WheelSegment;
  angle: number;
};

type UserStats = {
  dailySpinsLeft: number;
  totalPoints: number;
  totalSpins: number;
  todaySpins: number;
  lastFreeSpinTime: string;
};

// Wheel segments with different rewards using specified color palette
const wheelSegments: WheelSegment[] = [
  { id: 1, label: "Gaming Mouse", type: "product", value: "Gaming Mouse REXUS GM7", color: "#3B3A7A", probability: 5, image: gamingMouse },
  { id: 2, label: "500 Points", type: "points", value: "500", points: 500, color: "#5255A4", probability: 15 },
  { id: 3, label: "Better Luck", type: "better-luck", value: "Try again!", color: "#879297", probability: 30 },
  { id: 4, label: "20% Voucher", type: "voucher", value: "20% OFF", color: "#6465AD", probability: 20 },
  { id: 5, label: "Gaming Headset", type: "product", value: "Gaming Headset REXUS H3", color: "#3B3A7A", probability: 3, image: gamingHeadset },
  { id: 6, label: "1000 Points", type: "points", value: "1000", points: 1000, color: "#5255A4", probability: 10 },
  { id: 7, label: "10% Voucher", type: "voucher", value: "10% OFF", color: "#98A3A7", probability: 25 },
  { id: 8, label: "Keyboard", type: "product", value: "Gaming Keyboard REXUS MX5", color: "#C4D2D4", probability: 2, image: gamingKeyboard }
];

// Mock user data
const mockUserStats: UserStats = {
  dailySpinsLeft: 1,
  totalPoints: 15420,
  totalSpins: 47,
  todaySpins: 2,
  lastFreeSpinTime: "2024-08-09",
};

export default function SpinWin() {
  const navigate = useNavigate();
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>(mockUserStats);
  const [spinHistory, setSpinHistory] = useState<SpinResult[]>([]);

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case "home":
        navigate("/");
        break;
      case "rewards":
        break;
      case "shop":
        break;
      case "profile":
        break;
    }
  };

  const getRandomSegment = (): WheelSegment => {
    const random = Math.random() * 100;
    let cumulativeProbability = 0;
    
    for (const segment of wheelSegments) {
      cumulativeProbability += segment.probability;
      if (random <= cumulativeProbability) {
        return segment;
      }
    }
    
    return wheelSegments[wheelSegments.length - 1];
  };

  const spinWheel = (usePoints: boolean = false) => {
    if (isSpinning) return;
    
    if (!usePoints && userStats.dailySpinsLeft <= 0) {
      alert("No free spins left today! Use points to spin.");
      return;
    }
    
    if (usePoints && userStats.totalPoints < 100) {
      alert("Insufficient points! You need 100 points to spin.");
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    
    const winningSegment = getRandomSegment();
    const segmentAngle = 360 / wheelSegments.length;
    const targetAngle = (winningSegment.id - 1) * segmentAngle + (segmentAngle / 2);
    const spins = 5 + Math.random() * 3; // 5-8 full rotations
    const finalRotation = currentRotation + (spins * 360) + (360 - targetAngle);
    
    setCurrentRotation(finalRotation);
    
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
    }
    
    setTimeout(() => {
      setIsSpinning(false);
      setSpinResult({ segment: winningSegment, angle: finalRotation });
      setShowResult(true);
      
      // Update user stats
      if (usePoints) {
        setUserStats(prev => ({
          ...prev,
          totalPoints: prev.totalPoints - 100,
          totalSpins: prev.totalSpins + 1,
          todaySpins: prev.todaySpins + 1,
        }));
      } else {
        setUserStats(prev => ({
          ...prev,
          dailySpinsLeft: prev.dailySpinsLeft - 1,
          totalSpins: prev.totalSpins + 1,
          todaySpins: prev.todaySpins + 1,
        }));
      }
      
      // Add to history
      setSpinHistory(prev => [{ segment: winningSegment, angle: finalRotation }, ...prev.slice(0, 4)]);
      
      // Award points if won
      if (winningSegment.type === "points" && winningSegment.points) {
        setUserStats(prev => ({
          ...prev,
          totalPoints: prev.totalPoints + winningSegment.points!,
        }));
      }
    }, 4000);
  };

  const resetWheel = () => {
    setCurrentRotation(0);
    setSpinResult(null);
    setShowResult(false);
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(0deg)`;
    }
  };

  const getRewardIcon = (type: RewardType) => {
    switch (type) {
      case "product":
        return <Gamepad2 className="h-5 w-5" />;
      case "points":
        return <Coins className="h-5 w-5" />;
      case "voucher":
        return <Tag className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getRewardColor = (type: RewardType) => {
    switch (type) {
      case "product":
        return "text-purple-600 bg-purple-100";
      case "points":
        return "text-green-600 bg-green-100";
      case "voucher":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Spin & Win" />
      
      <div className="container max-w-2xl mx-auto px-6 py-6">
        {/* User Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4" style={{ borderColor: '#C4D2D4' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#C4D2D4' }}>
                <RotateCcw className="h-5 w-5" style={{ color: '#3B3A7A' }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#879297' }}>Free Spins</p>
                <p className="text-xl font-bold" style={{ color: '#3B3A7A' }}>{userStats.dailySpinsLeft}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4" style={{ borderColor: '#C4D2D4' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#C4D2D4' }}>
                <Coins className="h-5 w-5" style={{ color: '#3B3A7A' }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#879297' }}>Points</p>
                <p className="text-xl font-bold" style={{ color: '#3B3A7A' }}>{userStats.totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Wheel Container */}
        <Card className="p-6 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Spin the Wheel!</h2>
            <p className="text-muted-foreground">Win amazing rewards every day</p>
          </div>

          {/* Roulette Wheel */}
          <div className="relative mx-auto w-80 h-80 mb-8">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent drop-shadow-md" 
                   style={{ borderBottomColor: '#3B3A7A' }}></div>
            </div>
            
            {/* Wheel */}
            <div 
              ref={wheelRef}
              className={`w-full h-full rounded-full shadow-2xl relative overflow-hidden transition-transform duration-4000 ease-out ${isSpinning ? 'animate-pulse' : ''}`}
              style={{
                background: `conic-gradient(${wheelSegments.map((segment, index) => {
                  const startAngle = (index * 360) / wheelSegments.length;
                  const endAngle = ((index + 1) * 360) / wheelSegments.length;
                  return `${segment.color} ${startAngle}deg ${endAngle}deg`;
                }).join(', ')})`,
                border: '4px solid #C4D2D4'
              }}
            >
              {/* Segment Content */}
              {wheelSegments.map((segment, index) => {
                const angle = (index * 360) / wheelSegments.length + (360 / wheelSegments.length) / 2;
                return (
                  <div
                    key={segment.id}
                    className="absolute w-full h-full flex items-center justify-center"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: '50% 50%'
                    }}
                  >
                    <div 
                      className="flex flex-col items-center justify-center text-center"
                      style={{ 
                        transform: `translateY(-100px) rotate(${-angle}deg)`,
                        width: '70px'
                      }}
                    >
                      {/* Product Image or Icon */}
                      {segment.image ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden p-1 mb-1 shadow-sm" 
                             style={{ backgroundColor: '#C4D2D4' }}>
                          <img 
                            src={segment.image} 
                            alt={segment.label}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1 shadow-sm" 
                             style={{ backgroundColor: '#C4D2D4' }}>
                          {segment.type === "points" && <Coins className="h-4 w-4" style={{ color: '#3B3A7A' }} />}
                          {segment.type === "voucher" && <Tag className="h-4 w-4" style={{ color: '#3B3A7A' }} />}
                          {segment.type === "better-luck" && <Clock className="h-4 w-4" style={{ color: '#3B3A7A' }} />}
                        </div>
                      )}
                      
                      {/* Label */}
                      <div className="text-white font-semibold text-xs leading-tight drop-shadow-md">
                        {segment.label}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Center Circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-4"
                   style={{ 
                     background: 'linear-gradient(135deg, #3B3A7A, #5255A4)',
                     borderColor: '#C4D2D4'
                   }}>
                <Zap className="h-8 w-8 text-yellow-400 drop-shadow-md" />
              </div>
            </div>
          </div>

          {/* Spin Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => spinWheel(false)}
              disabled={isSpinning || userStats.dailySpinsLeft <= 0}
              className="flex items-center gap-2 px-6 py-3 text-white"
              style={{ backgroundColor: '#3B3A7A' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5255A4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B3A7A'}
            >
              <RotateCcw className="h-4 w-4" />
              Free Spin
              {userStats.dailySpinsLeft <= 0 && <span className="text-xs">(Tomorrow)</span>}
            </Button>
            
            <Button
              onClick={() => spinWheel(true)}
              disabled={isSpinning || userStats.totalPoints < 100}
              variant="outline"
              className="flex items-center gap-2 px-6 py-3"
              style={{ 
                borderColor: '#C4D2D4', 
                color: '#3B3A7A',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#C4D2D4';
                e.currentTarget.style.color = '#3B3A7A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#3B3A7A';
              }}
            >
              <Coins className="h-4 w-4" />
              Spin for 100 pts
            </Button>
          </div>
        </Card>

        {/* Result Modal */}
        {showResult && spinResult && (
          <Card className="p-6 mb-6 shadow-lg"
                style={{ 
                  borderColor: '#C4D2D4',
                  borderWidth: '2px',
                  background: 'linear-gradient(135deg, #C4D2D4, #ffffff)'
                }}>
            <div className="text-center">
              {/* Product Image or Icon */}
              {spinResult.segment.image ? (
                <div className="mx-auto w-20 h-20 rounded-full overflow-hidden p-2 mb-4 shadow-md"
                     style={{ backgroundColor: '#C4D2D4' }}>
                  <img 
                    src={spinResult.segment.image} 
                    alt={spinResult.segment.value}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              ) : (
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${getRewardColor(spinResult.segment.type)}`}>
                  {getRewardIcon(spinResult.segment.type)}
                </div>
              )}
              
              <h3 className="text-xl font-bold mb-2" style={{ color: '#3B3A7A' }}>
                {spinResult.segment.type === "better-luck" ? "Better Luck Next Time!" : "Congratulations!"}
              </h3>
              <p className="text-lg mb-4" style={{ color: '#879297' }}>
                You won: <span className="font-semibold" style={{ color: '#3B3A7A' }}>{spinResult.segment.value}</span>
              </p>
              {spinResult.segment.type === "points" && (
                <Badge className="mb-4" style={{ backgroundColor: '#5255A4', color: 'white' }}>+{spinResult.segment.points} Points Added!</Badge>
              )}
              <Button onClick={() => setShowResult(false)} className="w-full text-white"
                      style={{ backgroundColor: '#3B3A7A' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5255A4'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B3A7A'}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Claim Reward
              </Button>
            </div>
          </Card>
        )}

        {/* Recent Spins */}
        {spinHistory.length > 0 && (
          <Card className="p-4" style={{ borderColor: '#C4D2D4' }}>
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#3B3A7A' }}>
              <Trophy className="h-4 w-4" />
              Recent Spins
            </h3>
            <div className="space-y-2">
              {spinHistory.map((spin, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border"
                     style={{ 
                       backgroundColor: '#C4D2D4', 
                       borderColor: '#98A3A7'
                     }}>
                  <div className="flex items-center gap-3">
                    {/* Product Image or Icon */}
                    {spin.segment.image ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white p-1 shadow-sm">
                        <img 
                          src={spin.segment.image} 
                          alt={spin.segment.value}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                    ) : (
                      <div className={`p-1.5 rounded-full ${getRewardColor(spin.segment.type)}`}>
                        {getRewardIcon(spin.segment.type)}
                      </div>
                    )}
                    <span className="text-sm font-medium" style={{ color: '#3B3A7A' }}>{spin.segment.value}</span>
                  </div>
                  <Badge variant="outline" className="text-xs" 
                         style={{ color: '#879297', borderColor: '#98A3A7' }}>
                    Spin #{userStats.totalSpins - index}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Daily Progress */}
        <Card className="p-4 mt-4" style={{ borderColor: '#C4D2D4' }}>
          <h3 className="font-semibold mb-3" style={{ color: '#3B3A7A' }}>Daily Progress</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold" style={{ color: '#3B3A7A' }}>{userStats.todaySpins}</p>
              <p className="text-xs" style={{ color: '#879297' }}>Today's Spins</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#5255A4' }}>{userStats.totalSpins}</p>
              <p className="text-xs" style={{ color: '#879297' }}>Total Spins</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#6465AD' }}>{userStats.dailySpinsLeft}</p>
              <p className="text-xs" style={{ color: '#879297' }}>Free Left</p>
            </div>
          </div>
        </Card>
      </div>
      
      <MobileNav activeTab="rewards" onTabChange={handleTabChange} />
    </div>
  );
}
