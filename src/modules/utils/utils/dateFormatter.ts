/**
 * Format a date using a simple token-based format string.
 *
 * Supported tokens:
 *   YYYY - 4-digit year
 *   MM   - 2-digit month (01-12)
 *   DD   - 2-digit day   (01-31)
 *   HH   - 2-digit hour  (00-23)
 *   mm   - 2-digit minute (00-59)
 *   ss   - 2-digit second (00-59)
 */
export function formatDate(format: string, date: Date = new Date()): string {
	const pad = (n: number): string => n.toString().padStart(2, "0");

	return format
		.replace("YYYY", date.getFullYear().toString())
		.replace("MM", pad(date.getMonth() + 1))
		.replace("DD", pad(date.getDate()))
		.replace("HH", pad(date.getHours()))
		.replace("mm", pad(date.getMinutes()))
		.replace("ss", pad(date.getSeconds()));
}
