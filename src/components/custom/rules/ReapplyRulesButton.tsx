import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export function ReapplyRulesButton() {
  const reapplyRulesMutation = api.rules.reapplyAllRules.useMutation({
    onSuccess: () => {
      toast.success("Rules reapplied successfully");
      void api.useUtils().transaction.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to reapply rules: " + error.message);
    },
  });

  const handleReapplyRules = () => {
    reapplyRulesMutation.mutate();
  };

  return (
    <Button
      onClick={handleReapplyRules}
      disabled={reapplyRulesMutation.isPending}
    >
      {reapplyRulesMutation.isPending ? "Reapplying..." : "Reapply All Rules"}
    </Button>
  );
}
