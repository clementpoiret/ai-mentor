import { GPTSettings } from "./ai/model"

export type MultiLingualString = {
	[key: string]: string
}

export type supportedLanguage = "en" | "fr"

export type Mentor = {
	name: MultiLingualString
	systemPrompt: MultiLingualString
	firstMessage: MultiLingualString
	settings: GPTSettings
}

export type Role = "system" | "user" | "assistant"

export interface Message {
	role: Role
	content: string
}
