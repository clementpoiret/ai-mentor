import { GPTSettings } from "./ai/model"

export type Mentor = {
	name: string
	systemPrompt: string
	settings: GPTSettings
}

export type Role = "system" | "user" | "assistant"

export interface Message {
	role: Role
	content: string
}
