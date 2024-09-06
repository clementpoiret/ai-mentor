import { GPTSettings } from "./model"
import { Message } from "../types"

export interface Command {
	mentor: string
	prompt: Message
	pattern: string[]
	settings: GPTSettings
}

export const commands: Record<string, Command> = {
	explain: {
		mentor: "science",
		prompt: {
			role: "system",
			content:
				"Your job is to explain any concepts in an easy-to-understand manner. The user will give you a text, and you will only reply with an explanation. This could include providing examples or breaking down complex ideas into smaller pieces that are easier to understand. Be precise and concise. The user may not speak english. You MUST reply in the language of the user, which is $LANGUAGE.",
		},
		pattern: ['Explain in $LANGUAGE: "$TEXT"'],
		settings: {
			maxTokens: 500,
			temperature: 0.3, // Lower than defaults for fact-checking
			topP: 1.0,
			presencePenalty: 0,
			frequencyPenalty: 1,
			stop: [],
		},
	},
	redact: {
		mentor: "default",
		prompt: {
			role: "system",
			content:
				"Your job is to help the user write his notes. The user took the notes in a bullet-point format. Organize all the notes and write 1 or 2 paragraphs for each. Provide definitions or examples if complex ideas are present. All notes have to be in the written text. Do not provide any explanations, only the text you wrote. Use Markdown to format your text where needed. Your written text MUST follow the EXACT SAME language as the draft provided by the user.",
		},
		pattern: ['Write a note from the following draft: "$TEXT"'],
		settings: {
			maxTokens: 2000,
			temperature: 0.7, // todo: lower this?
			topP: 1.0,
			presencePenalty: 0,
			frequencyPenalty: 1,
			stop: [],
		},
	},
	enhance: {
		mentor: "default",
		prompt: {
			role: "system",
			content:
				"The user will provide you with a text and your only task is to enhance it. You will correct any grammar, spelling, and syntax errors. Using upper-level words and sentences, you will make the sentences more beautiful and elegant. Keep the exact same meaning. Any change you make must respect the original style of the text. Only reply with the enhanced text. Your written text MUST follow the EXACT SAME language as the text provided by the user.",
		},
		pattern: [
			'Enhance: "$TEXT"',
			"Explain to me the changes you have made. Explain your changes in the language of the enhanced text.",
		],
		settings: {
			maxTokens: 2000,
			temperature: 0.7, // todo: lower this?
			topP: 1.0,
			presencePenalty: 0,
			frequencyPenalty: 1,
			stop: [],
		},
	},
}
