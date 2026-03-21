const BASE_URL = process.env.HINDSIGHT_BASE_URL || "https://api.hindsight.vectorize.io"
const API_KEY = process.env.HINDSIGHT_API_KEY!
const HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${API_KEY}`
}

export const CAMPUS_BANK = "campus_knowledge"

export async function retainMemory(bankId: string, content: string, context?: string): Promise<void> {
  try {
    const url = `${BASE_URL}/v1/default/banks/${bankId}/memories`
    const body = {
      items: [
        {
          content,
          ...(context && { context })
        }
      ]
    }
    const res = await fetch(url, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body)
    })
    const text = await res.text()
    console.log(`[Hindsight retain] ${bankId} → status ${res.status}:`, text)
  } catch (e) {
    console.error("[Hindsight retain error]", e)
  }
}

export async function recallMemories(bankId: string, query: string): Promise<string[]> {
  try {
    const url = `${BASE_URL}/v1/default/banks/${bankId}/memories/recall`
    const body = { query, budget: "mid", max_tokens: 4096 }
    const res = await fetch(url, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body)
    })
    const data = await res.json()
    console.log(`[Hindsight recall] ${bankId} → status ${res.status}, results:`, data?.results?.length ?? 0)
    return (data.results ?? []).map((m: any) => m.text ?? m.content ?? "")
  } catch (e) {
    console.error("[Hindsight recall error]", e)
    return []
  }
}
