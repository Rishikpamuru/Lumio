
export function getAIKey(): string {
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error('AI_API_KEY not set');
  return key;
}
