"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Plus, 
  Trash2, 
  Calendar,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
}

export function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([
    {
      id: "1",
      name: "Emergency Fund",
      targetAmount: 10000,
      currentAmount: 3500,
      targetDate: "2024-12-31",
      monthlyContribution: 500,
    },
    {
      id: "2", 
      name: "Vacation Fund",
      targetAmount: 5000,
      currentAmount: 1200,
      targetDate: "2024-08-15",
      monthlyContribution: 300,
    },
  ]);

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    targetDate: "",
    monthlyContribution: "",
  });

  const addGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const goal: SavingsGoal = {
      id: Date.now().toString(),
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: parseFloat(newGoal.currentAmount) || 0,
      targetDate: newGoal.targetDate,
      monthlyContribution: parseFloat(newGoal.monthlyContribution) || 0,
    };

    setGoals([...goals, goal]);
    setNewGoal({
      name: "",
      targetAmount: "",
      currentAmount: "",
      targetDate: "",
      monthlyContribution: "",
    });
    setIsAddingGoal(false);
    toast.success("Savings goal added successfully");
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
    toast.success("Savings goal deleted");
  };

  const updateProgress = (id: string, amount: number) => {
    setGoals(goals.map(goal => 
      goal.id === id 
        ? { ...goal, currentAmount: Math.max(0, goal.currentAmount + amount) }
        : goal
    ));
  };

  const calculateProgress = (goal: SavingsGoal) => {
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  };

  const calculateMonthsRemaining = (goal: SavingsGoal) => {
    const targetDate = new Date(goal.targetDate);
    const today = new Date();
    const monthsDiff = (targetDate.getFullYear() - today.getFullYear()) * 12 + 
                      (targetDate.getMonth() - today.getMonth());
    return Math.max(0, monthsDiff);
  };

  const calculateRequiredMonthly = (goal: SavingsGoal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const monthsRemaining = calculateMonthsRemaining(goal);
    return monthsRemaining > 0 ? remaining / monthsRemaining : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Savings Goals
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingGoal(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingGoal && (
          <div className="p-4 border rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              <div>
                <Label htmlFor="target-amount">Target Amount</Label>
                <Input
                  id="target-amount"
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  placeholder="10000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="current-amount">Current Amount</Label>
                <Input
                  id="current-amount"
                  type="number"
                  value={newGoal.currentAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="target-date">Target Date</Label>
                <Input
                  id="target-date"
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addGoal}>
                Save Goal
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsAddingGoal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No savings goals set. Add your first goal to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = calculateProgress(goal);
              const monthsRemaining = calculateMonthsRemaining(goal);
              const requiredMonthly = calculateRequiredMonthly(goal);
              const isOnTrack = goal.monthlyContribution >= requiredMonthly;

              return (
                <div key={goal.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{goal.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteGoal(goal.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{monthsRemaining} months left</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{formatCurrency(requiredMonthly)}/month needed</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={isOnTrack ? "default" : "destructive"}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {isOnTrack ? "On Track" : "Behind Schedule"}
                    </Badge>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateProgress(goal.id, 100)}
                    >
                      +$100
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateProgress(goal.id, 500)}
                    >
                      +$500
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateProgress(goal.id, -100)}
                    >
                      -$100
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 