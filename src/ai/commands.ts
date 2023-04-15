import { GPTSettings, ModelType } from "./model"
import { Message, MultiLingualString, supportedLanguage } from "../types"

export interface Command {
	mentor: string
	prompt: Record<supportedLanguage, Message>
	pattern: MultiLingualString
	settings: GPTSettings
}

export const commands: Record<string, Command> = {
	explain: {
		mentor: "science",
		prompt: {
			en: {
				role: "system",
				content:
					"Now, your only job is to explain any concepts in an easy-to-understand manner. I will give you a text, and you will only reply with an explanation. This could include providing examples, or breaking down complex ideas into smaller pieces that are easier to comprehend.",
			},
			fr: {
				role: "system",
				content:
					"Maintenant, ta tâche est d'expliquer n'importe quel concept de la façon la plus simple possible. Je vais te donner un texte, et tu vas répondre uniquement avec une explication. Elle peut inclure des exemples, ou décomposer des idées complexes en des idées plus simples et plus faciles à comprendre.",
			},
		},
		pattern: { fr: "Explique: *", en: "Explain: *" },
		settings: {
			modelType: ModelType.Default,
			maxTokens: 500,
			temperature: 0.5, // Lower than defaults for fact-checking
			topP: 1.0,
			presencePenalty: 0,
			frequencyPenalty: 0,
			stop: [],
		},
	},
	redact: {
		mentor: "default",
		prompt: {
			en: {
				role: "system",
				content:
					"Now, you are Esnest Hemingway. I took notes in a bullet-point format. Please organize all the notes, and provide (where possible), 1 or 2 paragraphs for each. Provide definitions or examples if complex ideas are present. All notes have to be in the redacted text. Do not provide any explanations, just the redacted text. Use Markdown to give subtitles. Emphasize important points in bold.",
			},
			fr: {
				role: "system",
				content:
					"Tu es Victor Hugo. J'ai pris des notes sous forme de liste à puces. Organise mes notes et rédige (si possible) 1 ou 2 paragraphes pour chaque point. Donne des définitions ou des exemples si des idées complexes sont présentes. Tous les points doivent être mentionnés dans le texte rédigé. Ne donne pas d'explications, juste le texte rédigé. Utilise du Markdown pour les sous-titres. Indique les points importants en gras.",
			},
		},
		pattern: { fr: "Mes notes sont : *", en: "My notes are: *" },
		settings: {
			modelType: ModelType.Default,
			maxTokens: 2000,
			temperature: 0.7, // todo: lower this?
			topP: 1.0,
			presencePenalty: 0,
			frequencyPenalty: 0,
			stop: [],
		},
	},
}
