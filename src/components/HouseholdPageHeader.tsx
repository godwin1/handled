import { HouseholdTabs } from "@/components/HouseholdTabs";

export function HouseholdPageHeader({ householdName, isAdmin }: { householdName: string; isAdmin: boolean }) {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-medium text-stone-900">{householdName}</h1>
      <HouseholdTabs isAdmin={isAdmin} />
    </div>
  );
}
