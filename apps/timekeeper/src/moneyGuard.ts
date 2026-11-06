const AMOUNT =
  /(\b(usd|us\$|eur|gbp)\s?[\d][\d,]*(\.\d+)?\s?(k|m)?\b|[$€£]\s?[\d][\d,]*(\.\d+)?\s?(k|m)?|\b[\d][\d,]*(\.\d+)?\s?(k|m)?\s?(usd|dollars|euros|eur)\b)/i;
const TOPIC = /\b(demurrage|despatch|dispatch|laytime|lay time|time sheet|timesheet|claim)\b/i;

/** A model or person pairing a currency amount with demurrage, despatch or laytime. Only the engine may state money. */
export function pairsMoneyWithLaytime(body: string): boolean {
  return AMOUNT.test(body) && TOPIC.test(body);
}
