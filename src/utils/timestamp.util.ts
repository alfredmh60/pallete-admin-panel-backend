import moment from 'moment-timezone';

const defaultTimezone = 'Asia/Tehran';

export function getCurrentTimestamp(timezone?: string): string {
  return moment()
    .tz(timezone || this.defaultTimezone)
    .format('YYYY-MM-DD HH:mm:ss');
}

export function getCurrentISOString(): string {
  return new Date().toISOString();
}

export function getCurrentUnixTimestamp(): number {
  return Date.now();
}

export function formatDate(
  date: Date | string,
  format?: string,
  timezone?: string,
): string {
  return moment(date)
    .tz(timezone || this.defaultTimezone)
    .format(format || 'YYYY-MM-DD HH:mm:ss');
}
