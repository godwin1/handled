"use client";

import { useRef, useTransition } from "react";
import type { Category, Level } from "@/lib/permissions";
import { setMemberPermission } from "@/lib/actions/household";

export function PermissionSelect({
  userId,
  category,
  level,
}: {
  userId: string;
  category: Category;
  level: Level;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const action = setMemberPermission.bind(null, userId, category);

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(() => action(formData))}
    >
      <select
        name="level"
        defaultValue={level}
        disabled={pending}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-stone-300 px-2 py-1 text-xs capitalize disabled:opacity-60"
      >
        <option value="edit">Edit</option>
        <option value="view">View</option>
        <option value="none">None</option>
      </select>
    </form>
  );
}
