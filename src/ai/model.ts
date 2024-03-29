// Inspired by `https://github.com/jmilldotdev/obsidian-gpt/blob/main/src/models/chatGPT.ts`

import { RequestUrlParam, request } from "obsidian"
import { pythonifyKeys } from "src/utils"

import { Command } from "./commands"
import { Individuals, Topics } from "./mentors"
import { Mentor, Message, supportedLanguage } from "../types"

export enum ModelType {
	// Perplexity models
	PerplexityDefault = "sonar-medium-online",
	Mistral7bInstruct = "mistral-7b-instruct",
	Mixtral8x7bInstruct = "mixtral-8x7b-instruct",
	Codellama = "codellama-34b-instruct",
	SonarSmallChat = "sonar-small-chat",
	SonarSmallOnline = "sonar-small-online",
	SonarMediumChat = "sonar-medium-chat",
	SonarMediumOnline = "sonar-medium-online",

	// OpenAI models
	OpenAiDefault = "gpt-4-turbo-preview",
	GPT4Turbo = "gpt-4-turbo",
	GPT4 = "gpt-4",
}

enum ApiUrl {
	perplexity = `https://api.perplexity.ai/chat/completions`,
	openai = `https://api.openai.com/v1/chat/completions`,
}

export interface GPTSettings {
	maxTokens: number
	temperature: number
	topP: number
	presencePenalty: number
	frequencyPenalty: number
	stop: string[]
}

export const defaultSettings: GPTSettings = {
	maxTokens: 200,
	temperature: 1.0,
	topP: 1.0,
	presencePenalty: 0,
	frequencyPenalty: 1.0,
	stop: [],
}

export class MentorModel {
	apiUrl: string

	id: string
	mentor: Mentor

	model: ModelType

	apiKey: string
	preferredLanguage: supportedLanguage

	history: Message[]

	suffix: string | undefined = undefined

	headers

	constructor(
		id: string,
		mentor: Mentor,
		cloudProvider: string,
		model: ModelType,
		apiKey: string,
		preferredLanguage: supportedLanguage,
		suffix?: string
	) {
		this.id = id
		this.mentor = mentor

		this.apiUrl =
			cloudProvider === "perplexity" ? ApiUrl.perplexity : ApiUrl.openai

		this.model = model

		this.apiKey = apiKey
		this.preferredLanguage = preferredLanguage

		this.history = [
			{ role: "system", content: mentor.systemPrompt[preferredLanguage] },
		]

		this.suffix = suffix

		this.headers = {
			Authorization: `Bearer ${this.apiKey}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		}
	}

	async getCompletion(message: string): Promise<string> {
		const params = this.mentor.settings

		// Check that API Key is set
		if (!this.apiKey) {
			return "Please set your API key in the settings."
		}

		// Check that the model is set
		if (!this.model) {
			return "Please set your model in the settings."
		}

		// Check that the message is not empty
		if (!message) {
			return "Please enter a message."
		}

		const messages = [...this.history, { role: "user", content: message }]

		const body = {
			messages: messages,
			model: this.model,
			...pythonifyKeys(params),
			stop: params.stop.length > 0 ? params.stop : undefined,
			suffix: this.suffix,
		}

		const headers = this.headers
		const requestUrlParam = {
			url: this.apiUrl,
			method: "POST",
			headers: this.headers,
			contentType: "application/json",
			body: JSON.stringify(body),
		}

		this.history.push({ role: "user", content: message })

		const answer = await request(requestUrlParam)
			.then((response) => {
				const answer =
					JSON.parse(response)?.choices?.[0]?.message?.content

				this.history.push({ role: "assistant", content: answer })

				return answer
			})
			.catch((err) => {
				console.error(err)

				return `I got an error when trying to reply. The error is: ${err.message}`
			})

		return answer
	}

	async execute(text: string, command: Command): Promise<string[]> {
		const params = command.settings
		const mentorList: Record<string, Mentor> = {
			...Topics,
			...Individuals,
		}
		const requestedMentor = mentorList[command.mentor]
		const prompts = command.pattern.map((prompt) => {
			return prompt[this.preferredLanguage].replace("*", text)
		})

		this.history = [
			{
				role: "system",
				content: requestedMentor.systemPrompt[this.preferredLanguage],
			},
			command.prompt[this.preferredLanguage],
		]
		const answers: string[] = []

		for (const prompt of prompts) {
			this.history.push({ role: "user", content: prompt })

			const body = {
				messages: this.history,
				model: this.model,
				...pythonifyKeys(params),
				stop: params.stop.length > 0 ? params.stop : undefined,
				suffix: this.suffix,
			}

			const headers = this.headers
			const requestUrlParam: RequestUrlParam = {
				url: this.apiUrl,
				method: "POST",
				contentType: "application/json",
				body: JSON.stringify(body),
				headers,
			}

			const answer = await request(requestUrlParam)
				.then((response) => {
					return JSON.parse(response)?.choices?.[0]?.message?.content
				})
				.catch((err) => {
					console.error(err)

					return "I got an error when trying to reply."
				})

			this.history.push({ role: "assistant", content: answer })
			answers.push(answer)
		}

		// Reset history
		this.reset()

		return answers
	}

	changeIdentity(id: string, newMentor: Mentor) {
		this.id = id
		this.mentor = newMentor
		this.history = [
			{
				role: "system",
				content: newMentor.systemPrompt[this.preferredLanguage],
			},
		]
	}

	reset() {
		this.history = [
			{
				role: "system",
				content: this.mentor.systemPrompt[this.preferredLanguage],
			},
		]
	}
}
