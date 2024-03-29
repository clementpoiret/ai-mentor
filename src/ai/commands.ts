import { GPTSettings } from "./model"
import { Message, MultiLingualString, supportedLanguage } from "../types"

export interface Command {
	mentor: string
	prompt: Record<supportedLanguage, Message>
	pattern: MultiLingualString[]
	settings: GPTSettings
}

export const commands: Record<string, Command> = {
	explain: {
		mentor: "science",
		prompt: {
			en: {
				role: "system",
				content:
					"Now, your only job is to explain any concepts in an easy-to-understand manner. I will give you a text, and you will only reply with an explanation. This could include providing examples or breaking down complex ideas into smaller pieces that are easier to comprehend. Be precise and concise.",
			},
			fr: {
				role: "system",
				content:
					"Maintenant, ta tâche est d'expliquer n'importe quel concept de la façon la plus simple possible. Je vais te donner un texte, et tu vas répondre uniquement avec une explication. Elle peut inclure des exemples, ou décomposer des idées complexes en des idées plus simples et plus faciles à comprendre. Sois précis et concis.",
			},
		},
		pattern: [{ fr: 'Explique: "*"', en: 'Explain: "*"' }],
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
			en: {
				role: "system",
				content:
					"I took notes in a bullet-point format. Organize all the notes and redact 1 or 2 paragraphs for each. Provide definitions or examples if complex ideas are present. All notes have to be in the redacted text. Do not provide any explanations, only the redacted text. Use Markdown to format your text where needed.",
			},
			fr: {
				role: "system",
				content:
					"J'ai pris des notes sous forme de liste à puces. Organise mes notes et rédige 1 ou 2 paragraphes pour chaque point. Donne des définitions ou des exemples si des idées complexes sont présentes. Tous les points doivent être mentionnés dans le texte rédigé. Ne donne pas d'explications, juste le texte rédigé. Utilise du Markdown formatter ton texte si besoin.",
			},
		},
		pattern: [{ fr: 'Mes notes sont : "*"', en: 'My notes are: "*"' }],
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
			en: {
				role: "system",
				content:
					"I will provide you with a text and you will enhance it. You will correct any grammar, spelling, and syntax errors. Using upper-level English words and sentences, you will make my sentences more beautiful and elegant. Keep the exact same meaning. Any change you make must respect the original style of the text. Only reply with the enhanced text.",
			},
			fr: {
				role: "system",
				content:
					"Je vais te donner un texte et tu vas l'améliorer. Tu vas corriger les fautes d'orthographe, grammaire et syntaxe. En utilisant des mots et phrases avec un meilleur niveau de français, tu vas rendre mes phrases plus belles et élégantes. Préserve le sens exact du texte. Chaque changement que tu fais doit respecter le style original du texte. Ne répond qu'avec le texte amélioré.",
			},
		},
		pattern: [
			{ fr: 'Améliore : "*"', en: 'Enhance: "*"' },
			{
				fr: "Explique-moi les changements que tu as fait.",
				en: "Explain to me the changes you have made.",
			},
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
