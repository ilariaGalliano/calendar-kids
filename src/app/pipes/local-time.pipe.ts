import { Pipe, PipeTransform } from '@angular/core';

/**
 * Estrae HH:MM da una stringa orario senza alcuna conversione di fuso orario.
 *
 * Accetta:
 *  - "HH:MM"               → restituisce "HH:MM"
 *  - "HH:MM:SS"            → restituisce "HH:MM"
 *  - "YYYY-MM-DDTHH:MM:SS" → restituisce i char 11-15 (wall-clock, no TZ shift)
 *  - null / undefined      → restituisce ""
 *
 * Perché NON usare DatePipe o new Date():
 *  Sul server (Vercel UTC) le date vengono costruite come ISO senza Z,
 *  ma il browser italiano (UTC+1) le convertirebbe aggiungendo +1 ora.
 *  Questa pipe legge la stringa grezza evitando qualsiasi conversione.
 */
@Pipe({
  name: 'localTime',
  standalone: true,
  pure: true,
})
export class LocalTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';

    // Stringa corta: già "HH:MM" o "HH:MM:SS"
    if (value.length <= 8) return value.substring(0, 5);

    // ISO string "YYYY-MM-DDTHH:MM..." → posizioni 11-15 = HH:MM
    return value.substring(11, 16);
  }
}
