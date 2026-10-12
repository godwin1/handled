import { requireUser } from "@/lib/auth";
import { HouseholdPageHeader } from "@/components/HouseholdPageHeader";
import { CalendarSyncSection } from "@/components/CalendarSyncSection";
import { getOrCreateCalendarUrl } from "@/lib/actions/calendar";

export default async function CalendarHouseholdPage() {
  const user = await requireUser();
  const calendarUrl = await getOrCreateCalendarUrl();

  return (
    <div className="space-y-6">
      <HouseholdPageHeader householdName={user.household.name} isAdmin={user.isAdmin} />
      <CalendarSyncSection initialUrl={calendarUrl} />
    </div>
  );
}
