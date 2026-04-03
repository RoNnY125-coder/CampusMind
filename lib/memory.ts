import MemoryClient from 'mem0ai';
import { env } from './env';
import type { MemoryUnit } from './types';

let _client: MemoryClient | null = null;

function getClient() {
  if (_client) return _client;
  _client = new MemoryClient({ apiKey: env.MEM0_API_KEY });
  return _client;
}

// Retain a memory for a specific user
export async function retainMemory(
  userId: string,
  content: string,
  context?: string
): Promise<void> {
  try {
    const client = getClient();
    await client.add([{ role: 'user', content }], {
      user_id: userId,
      metadata: context ? { context } : undefined,
    });
    console.log(`✅ Memory retained for user ${userId}`);
  } catch (error) {
    console.error(`[Mem0] retainMemory error:`, error);
  }
}

// Recall relevant memories for a user based on a query
export async function recallMemories(
  userId: string,
  query: string
): Promise<MemoryUnit[]> {
  try {
    const client = getClient();
    const results = await client.search(query, { user_id: userId, limit: 10 });
    return results.map((m: any) => ({
      id: m.id,
      content: m.memory,
      type: (m.metadata?.context as MemoryUnit['type']) || 'observation',
      created_at: m.created_at || new Date().toISOString(),
      tags: m.categories || [],
    }));
  } catch (error) {
    console.error(`[Mem0] recallMemories error:`, error);
    return [];
  }
}

// List all memories for a user (for the sidebar)
export async function listMemories(userId: string): Promise<MemoryUnit[]> {
  try {
    const client = getClient();
    const results = await client.getAll({ user_id: userId });
    return results.map((m: any) => ({
      id: m.id,
      content: m.memory,
      type: (m.metadata?.context as MemoryUnit['type']) || 'observation',
      created_at: m.created_at || new Date().toISOString(),
      tags: m.categories || [],
    }));
  } catch (error) {
    console.error(`[Mem0] listMemories error:`, error);
    return [];
  }
}
