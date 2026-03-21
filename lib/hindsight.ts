import type { MemoryUnit } from './types';

export const CAMPUS_BANK = 'campus_knowledge';
export const studentBank = (userId: string) => `student_${userId}`;

const BASE_URL = process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.com';
const API_KEY = process.env.HINDSIGHT_API_KEY || '';

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
  'Accept': 'application/json',
  'User-Agent': 'CampusMind/1.0',
};

export async function retainMemory(
  bankId: string,
  content: string,
  context?: string
): Promise<void> {
  try {
    const url = `${BASE_URL}/v1/memories`;
    const res = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        bank_id: bankId,
        content,
        ...(context && { context }),
      }),
    });

    const contentType = res.headers.get('content-type');
    const text = await res.text();

    // Check for HTML response (bot detection or error page)
    if (
      !contentType?.includes('application/json') ||
      text.includes('<html>') ||
      text.includes('<!DOCTYPE')
    ) {
      console.error(`[Hindsight] API returned non-JSON response (${res.status}):`, {
        contentType,
        bodyPreview: text.substring(0, 200),
        apiKey: API_KEY.substring(0, 10) + '...',
        baseUrl: BASE_URL,
      });
      return;
    }

    if (!res.ok) {
      console.error(`[Hindsight] Failed to retain memory (${res.status}):`, text);
      return;
    }

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
    const url = `${BASE_URL}/v1/memories/search`;
    const res = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        bank_id: bankId,
        query,
        limit: 10,
      }),
    });

    const contentType = res.headers.get('content-type');
    const text = await res.text();

    // Check for HTML response
    if (
      !contentType?.includes('application/json') ||
      text.includes('<html>') ||
      text.includes('<!DOCTYPE')
    ) {
      console.warn(`[Hindsight] Search returned non-JSON response (${res.status})`);
      return [];
    }

    if (!res.ok) {
      if (res.status === 404) return [];
      console.error(`[Hindsight] Failed to recall memories (${res.status}):`, text);
      return [];
    }

    const data = JSON.parse(text);
    const memories = (data.memories || []).map((m: any) => ({
      id: m.id,
      content: m.content,
      type: m.type || 'observation',
      created_at: m.created_at || new Date().toISOString(),
      tags: m.tags,
    }));

    return memories;
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
    const url = `${BASE_URL}/v1/reflect`;
    const res = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        bank_id: bankId,
        query,
      }),
    });

    const contentType = res.headers.get('content-type');
    const text = await res.text();

    if (
      !contentType?.includes('application/json') ||
      text.includes('<html>') ||
      text.includes('<!DOCTYPE')
    ) {
      console.warn(`[Hindsight] Reflect returned non-JSON response (${res.status})`);
      return '';
    }

    if (!res.ok) {
      console.error(`[Hindsight] Failed to reflect (${res.status}):`, text);
      return '';
    }

    const data = JSON.parse(text);
    return data.reflection || '';
  } catch (error) {
    console.error(`[Hindsight] Error in reflectOnQuery:`, error);
    return '';
  }
}
