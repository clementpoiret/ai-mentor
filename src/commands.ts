import { Notice } from "obsidian"

import { Individuals } from "./mentors"
import { getGPTCompletion, GPTSettings, ModelType } from "./model"
import { Mentor, Message } from "./types"

export const explain = async (text: string, apiKey: string) => {
	// Don't send empty messages.
	if (text === "") {
		new Notice("Cannot send empty messages.")
		return
	}

	const mentor = Individuals["default"]

	const systemPrompt: Message = {
		role: "system",
		content:
			"Now, your only job is to explain any concepts in an easy-to-understand manner. I will give you a text, and you will only reply with an explanation. This could include providing examples, or breaking down complex ideas into smaller pieces that are easier to comprehend.",
	}

	const prompt: Message = {
		role: "user",
		content: `Explain: ${text}`,
	}

	const settings: GPTSettings = {
		modelType: ModelType.Default,
		maxTokens: 500,
		temperature: 1.0,
		topP: 1.0,
		presencePenalty: 0,
		frequencyPenalty: 0,
		stop: [],
	}

	console.log("prompt", prompt)
	console.log("systemPrompt", systemPrompt)
	console.log("mentor", mentor)
	const explanation = await modelRequest(
		prompt,
		systemPrompt,
		mentor,
		settings,
		apiKey
	)

	return explanation
}

const modelRequest = async (
	prompt: Message,
	systemPrompt: Message,
	mentor: Mentor,
	settings: GPTSettings,
	apiKey: string
): Promise<string> => {
	const systemMessage: Message = {
		role: "system",
		content:
			mentor.systemPrompt ||
			"You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.",
	}

	const input = [systemMessage, systemPrompt, prompt]

	const response = await getGPTCompletion(apiKey, input, settings)

	return response
}
