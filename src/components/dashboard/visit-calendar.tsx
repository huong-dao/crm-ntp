"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CalendarVisitEvent } from "@/actions/dashboard-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatVisitRequestDate,
  VISIT_REQUEST_TYPE_LABELS,
  visitRequestStatusBadgeClass,
  VISIT_REQUEST_STATUS_LABELS,
} from "@/lib/visit-request-list";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (number | null)[] = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function VisitCalendar({
  year,
  month,
  events,
}: {
  year: number;
  month: number;
  events: CalendarVisitEvent[];
}) {
  const router = useRouter();
  const cells = buildMonthGrid(year, month);

  const eventsByDay = new Map<string, CalendarVisitEvent[]>();
  for (const event of events) {
    const d = new Date(event.scheduledDate);
    const key = dateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const list = eventsByDay.get(key) ?? [];
    list.push(event);
    eventsByDay.set(key, list);
  }

  function navigateTo(nextYear: number, nextMonth: number) {
    const params = new URLSearchParams();
    params.set("year", String(nextYear));
    params.set("month", String(nextMonth));
    router.push(`/dashboard?${params.toString()}`);
  }

  function goPrev() {
    if (month === 1) navigateTo(year - 1, 12);
    else navigateTo(year, month - 1);
  }

  function goNext() {
    if (month === 12) navigateTo(year + 1, 1);
    else navigateTo(year, month + 1);
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <Button type="button" variant="outline" size="sm" onClick={goPrev}>
          ‹
        </Button>
        <h3 className="text-sm font-semibold capitalize text-gray-900">
          {monthLabel}
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={goNext}>
          ›
        </Button>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-center text-xs font-medium text-gray-500">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-1 py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (day === null) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[88px] border-b border-r border-gray-100 bg-gray-50/50"
              />
            );
          }

          const key = dateKey(year, month, day);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday =
            new Date().toDateString() ===
            new Date(year, month - 1, day).toDateString();

          return (
            <div
              key={key}
              className="min-h-[88px] border-b border-r border-gray-100 p-1 align-top"
            >
              <div
                className={cn(
                  "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday
                    ? "bg-[#1e3a5f] font-semibold text-white"
                    : "text-gray-700"
                )}
              >
                {day}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <Link
                    key={event.id}
                    href={`/visit-requests/${event.id}`}
                    className="block rounded bg-[#1e3a5f]/10 px-1 py-0.5 text-[10px] leading-tight text-[#1e3a5f] hover:bg-[#1e3a5f]/20"
                    title={`${event.code} — ${event.householdHeadName ?? event.householdCode}`}
                  >
                    <span className="font-medium">{event.code}</span>
                    <span className="block truncate text-gray-600">
                      {event.householdHeadName ?? event.householdCode}
                    </span>
                  </Link>
                ))}
                {dayEvents.length > 2 && (
                  <p className="text-[10px] text-gray-500">
                    +{dayEvents.length - 2} đơn
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {events.length > 0 && (
        <div className="border-t border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500">
            Chi tiết tháng ({events.length} đơn)
          </p>
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-sm">
            {events.map((event) => (
              <li key={event.id} className="rounded-md border border-gray-100 p-2">
                <Link
                  href={`/visit-requests/${event.id}`}
                  className="font-medium text-[#1e3a5f] hover:underline"
                >
                  {event.code}
                </Link>
                <span className="mx-2 text-gray-400">·</span>
                <span className="text-gray-600">
                  {formatVisitRequestDate(event.scheduledDate)}
                </span>
                <span
                  className={cn(
                    "ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    visitRequestStatusBadgeClass(event.status)
                  )}
                >
                  {VISIT_REQUEST_STATUS_LABELS[event.status]}
                </span>
                <p className="mt-1 text-xs text-gray-600">
                  {event.householdHeadName ?? event.householdCode} —{" "}
                  {VISIT_REQUEST_TYPE_LABELS[event.visitType]}
                  {event.staffNames.length > 0 &&
                    ` — ${event.staffNames.join(", ")}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
