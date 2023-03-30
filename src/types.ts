export type Mentor = {
	id: string
	name: string
	systemPrompt: string
	firstMessage: string
}

export type Role = "system" | "user" | "assistant"

export interface Message {
	role: Role
	content: string
}
