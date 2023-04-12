import { Notice } from "obsidian"

import { Individuals } from "./mentors"
import { getGPTCompletion, GPTSettings, ModelType } from "./model"
import { Mentor, Message } from "./types"

export const explain = async (
	text: string,
	language: string,
	apiKey: string
) => {
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
		temperature: 0.5, // Lower than defaults for fact-checking
		topP: 1.0,
		presencePenalty: 0,
		frequencyPenalty: 0,
		stop: [],
	}

	const explanation = await modelRequest(
		prompt,
		systemPrompt,
		mentor,
		language,
		settings,
		apiKey
	)

	return explanation
}

export const redact = async (
	text: string,
	language: string,
	apiKey: string
) => {
	// Don't send empty messages.
	if (text === "") {
		new Notice("Cannot send empty messages.")
		return
	}

	const mentor = Individuals["default"]

	const systemPrompt: Message = {
		role: "system",
		content:
			"Now, you are Esnest Hemingway. I took notes in a bullet-point format. Please organize all the notes, and provide (where possible), 1 or 2 paragraphs for each. Provide definitions or examples if complex ideas are present. All notes have to be in the redacted text. Do not provide any explanations, just the redacted text. Use Markdown to give subtitles. Emphasize important points in bold or italics.",
	}

	const prompt: Message = {
		role: "user",
		content: `My notes are: ${text}`,
	}

	const settings: GPTSettings = {
		modelType: ModelType.Default,
		maxTokens: 1000,
		temperature: 0.7, // todo: lower this?
		topP: 1.0,
		presencePenalty: 0,
		frequencyPenalty: 0,
		stop: [],
	}

	const redaction = await modelRequest(
		prompt,
		systemPrompt,
		mentor,
		language,
		settings,
		apiKey
	)

	return redaction
}

const modelRequest = async (
	prompt: Message,
	systemPrompt: Message,
	mentor: Mentor,
	language: string,
	settings: GPTSettings,
	apiKey: string
): Promise<string> => {
	const systemMessage: Message = {
		role: "system",
		content:
			mentor.systemPrompt[language] ||
			"You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.",
	}

	const input = [systemMessage, systemPrompt, prompt]

	const response = await getGPTCompletion(apiKey, input, settings)

	return response
}
