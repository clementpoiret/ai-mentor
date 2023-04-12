type MultiLingualString = {
	[key: string]: string
}

export type Mentor = {
	name: MultiLingualString
	systemPrompt: MultiLingualString
	firstMessage: MultiLingualString
}

export type Role = "system" | "user" | "assistant"

export interface Message {
	role: Role
	content: string
}
