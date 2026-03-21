export interface MemoryUnit {
  id: string;
  content: string;
  type: 'world' | 'experience' | 'observation';
  created_at: string;
  tags?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CampusEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  category: string;
  recommended?: boolean;
}

export interface Student {
  id: string;
  email: string;
  name: string;
  year: string;
  branch: string;
  interests: string[];
  clubs: string[];
  hasOnboarded: boolean;
}

export interface OnboardingData {
  name: string;
  year: string;
  branch: string;
  interests: string[];
  clubs: string[];
}

export interface ChatRequest {
  message: string;
  userId: string;
  history: ChatMessage[];
}

export interface MemoryResponse {
  memories: MemoryUnit[];
}
