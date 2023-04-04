export type Mentor = {
	name: string
	systemPrompt: string
	firstMessage: string
}

export type Role = "system" | "user" | "assistant"

export interface Message {
	role: Role
	content: string
}
