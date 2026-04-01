import { HindsightClient } from '@vectorize-io/hindsight-client';
import type { MemoryUnit } from './types';
import { HINDSIGHT_API_KEY, HINDSIGHT_BASE_URL } from './env';

export const CAMPUS_BANK = 'campus_knowledge';
export const studentBank = (userId: string) => `student_${userId}`;

const client = new HindsightClient({
  baseUrl: HINDSIGHT_BASE_URL(),
  apiKey: HINDSIGHT_API_KEY(),
});

export async function retainMemory(
  bankId: string,
  content: string,
  context?: string
): Promise<void> {
  try {
    await client.retain(bankId, content, { context, tags: context ? [context] : undefined });
    console.log(`✅ Memory retained in ${bankId}`);
  } catch (error) {
    console.error(`[Hindsight] Error in retainMemory:`, error);
  }
}

export async function recallMemories(
  bankId: string,
  query: string
): Promise<MemoryUnit[]> {
  try {
    const response = await client.recall(bankId, query);
    
    return (response.results || []).map((m: any) => ({
      id: m.id,
      content: m.text || m.content,
      type: m.type || m.context || 'observation',
      created_at: m.occurred_start || new Date().toISOString(),
      tags: m.entities || [],
    }));
  } catch (error) {
    console.error(`[Hindsight] Error in recallMemories:`, error);
    return [];
  }
}

export async function reflectOnQuery(
  bankId: string,
  query: string
): Promise<string> {
  try {
    const response = await client.reflect(bankId, query);
    return response.text || '';
  } catch (error) {
    console.error(`[Hindsight] Error in reflectOnQuery:`, error);
    return '';
  }
}
