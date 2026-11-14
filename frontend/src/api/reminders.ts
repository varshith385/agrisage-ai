/**
 * AgriSage AI — Reminders & Field Task Alerts API Client
 * Module: /api/v1/reminders
 */

import { apiRequest } from './client';

export interface Reminder {
  id: number;
  user_id: number;
  farm_id?: number | null;
  title: string;
  notes?: string | null;
  due_at: string;
  repeat: 'none' | 'daily' | 'weekly' | 'custom_days' | string;
  status: 'pending' | 'done' | 'snoozed' | string;
  source: 'user' | 'system_advisory' | 'weather_alert' | 'irrigation_plan' | 'calendar_stage' | string;
  created_at: string;
  updated_at: string;
  due_at_kolkata_iso?: string;
}

export interface ReminderCreatePayload {
  farm_id?: number | null;
  title: string;
  notes?: string | null;
  due_at: string;
  repeat?: string;
  source?: string;
}

export interface ReminderUpdatePayload {
  title?: string;
  notes?: string | null;
  due_at?: string;
  repeat?: string;
  status?: 'pending' | 'done' | 'snoozed' | string;
  snooze_days?: number;
}

export interface ReminderSuggestion {
  id: string;
  farm_id?: number | null;
  title: string;
  notes?: string | null;
  due_at: string;
  repeat: string;
  source: string;
  reason: string;
  badge_label: string;
}

export async function getReminders(params?: {
  farm_id?: number;
  status?: string;
}): Promise<Reminder[]> {
  const query = new URLSearchParams();
  if (params?.farm_id) query.append('farm_id', params.farm_id.toString());
  if (params?.status) query.append('status', params.status);
  const qStr = query.toString();
  return apiRequest<Reminder[]>(`/api/v1/reminders${qStr ? `?${qStr}` : ''}`);
}

export async function createReminder(payload: ReminderCreatePayload): Promise<Reminder> {
  return apiRequest<Reminder>('/api/v1/reminders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateReminder(
  id: number,
  payload: ReminderUpdatePayload
): Promise<Reminder> {
  return apiRequest<Reminder>(`/api/v1/reminders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteReminder(id: number): Promise<void> {
  return apiRequest<void>(`/api/v1/reminders/${id}`, {
    method: 'DELETE',
  });
}

export async function getReminderSuggestions(farm_id?: number): Promise<ReminderSuggestion[]> {
  const qStr = farm_id ? `?farm_id=${farm_id}` : '';
  return apiRequest<ReminderSuggestion[]>(`/api/v1/reminders/suggestions${qStr}`);
}

/**
 * Generates and triggers download of a standard RFC-5545 .ics iCalendar file.
 * Enables zero-infrastructure offline calendar alerts on Android / iOS / Google Calendar.
 */
export function downloadIcsCalendarFile(reminder: Reminder): void {
  const startDt = new Date(reminder.due_at);
  const endDt = new Date(startDt.getTime() + 30 * 60 * 1000); // 30 min duration

  const formatIcsDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AgriSage AI//Farmer Field Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:agrisage-rem-${reminder.id}-${Date.now()}@agrisage.local`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDt)}`,
    `DTEND:${formatIcsDate(endDt)}`,
    `SUMMARY:AgriSage: ${reminder.title.replace(/[\r\n]+/g, ' ')}`,
    `DESCRIPTION:${(reminder.notes || 'Field reminder from AgriSage AI').replace(/[\r\n]+/g, ' ')}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `agrisage-reminder-${reminder.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
