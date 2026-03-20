export const CAMPUS_BANK = "campus_knowledge"

const BASE_URL = process.env.HINDSIGHT_BASE_URL!
const API_KEY = process.env.HINDSIGHT_API_KEY!
const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` }

export async function retainMemory(bankId: string, content: string, context?: string): Promise<void> {
    try {
        const url = `${BASE_URL}/v1/memories`
        console.log("Hindsight POST URL:", url)
        const res = await fetch(url, {
            method: "POST",
            headers: HEADERS,
            body: JSON.stringify({ bank_id: bankId, content, ...(context && { context }) })
        })
        console.log("Hindsight response status:", res.status)
        const text = await res.text()
        console.log("Hindsight response body:", text)
    } catch (e) { console.error("retainMemory failed:", e) }
}

export async function recallMemories(bankId: string, query: string): Promise<string[]> {
    try {
        const url = `${BASE_URL}/v1/memories/recall`
        console.log("Hindsight POST URL:", url)
        const res = await fetch(url, {
            method: "POST",
            headers: HEADERS,
            body: JSON.stringify({ bank_id: bankId, query })
        })
        console.log("Hindsight response status:", res.status)
        const text = await res.text()
        console.log("Hindsight response body:", text)
        const data = JSON.parse(text)
        return (data.results ?? data.memories ?? []).map((m: any) => m.content ?? m)
    } catch (e) { console.error("recallMemories failed:", e); return [] }
}
