export function nextStatusCode(current: string, flow: string[]): string | null {
  const i = flow.indexOf(current);
  if (i === -1 || i === flow.length - 1) return null;
  return flow[i + 1];
}

// The forward fulfillment flow, excluding terminal/side states.
export const FULFILLMENT_FLOW = ["confirmed", "packed", "shipped", "delivered"];
