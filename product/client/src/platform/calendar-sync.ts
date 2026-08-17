import type { CalendarEventPayload } from './platform.types';

export class CalendarSyncService {
  /**
   * Formats a date into iCalendar UTC format (YYYYMMDDTHHmmssZ).
   */
  private static formatDateToIcs(dateInput: Date | string): string {
    const d = new Date(dateInput);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  /**
   * Generates a standard RFC 5545 .ics file content for an array of calendar events.
   */
  public static generateIcsContent(events: CalendarEventPayload[]): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CampusOS//Academic Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const evt of events) {
      const dtStart = this.formatDateToIcs(evt.startTime);
      const dtEnd = this.formatDateToIcs(evt.endTime);
      const uid = `campusos-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@campusos.internal`;

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${this.formatDateToIcs(new Date())}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${evt.title.replace(/,/g, '\\,')}`,
        evt.description ? `DESCRIPTION:${evt.description.replace(/\n/g, '\\n')}` : '',
        evt.location ? `LOCATION:${evt.location.replace(/,/g, '\\,')}` : '',
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    }

    lines.push('END:VCALENDAR');
    return lines.filter(Boolean).join('\r\n');
  }

  /**
   * Triggers download or native calendar import of the .ics file.
   */
  public static exportToCalendar(events: CalendarEventPayload[], filename = 'campusos-schedule.ics'): void {
    const icsData = this.generateIcsContent(events);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
