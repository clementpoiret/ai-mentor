// Inspired by `https://github.com/jmilldotdev/obsidian-gpt/blob/main/src/models/chatGPT.ts`

import { RequestUrlParam, request } from "obsidian"
import { pythonifyKeys } from "src/utils"

import { Command } from "./commands"
import { Individuals, Topics } from "./mentors"
import { Mentor, Message } from "../types"
import { supportedLanguages } from "../languages"
import { complete } from "../utils"

export enum ModelType {
	// Perplexity models
	PerplexityDefault = "llama-3.1-sonar-large-128k-online",
	SonarSmallChat = "llama-3.1-sonar-small-128k-chat",
	SonarLargeChat = "llama-3.1-sonar-large-128k-chat",
	SonarSmallOnline = "llama-3.1-sonar-small-128k-online",
	SonarLargeOnline = "llama-3.1-sonar-large-128k-online",
	SonarHugeOnline = "llama-3.1-sonar-huge-128k-online",

	// OpenAI models
	OpenAiDefault = "gpt-4o",
	GPT35Turbo = "gpt-3.5-turbo",
	GPT4Turbo = "gpt-4-turbo",
	GPT4o = "gpt-4o",
	GPT4oMini = "gpt-4o-mini",
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

	language: keyof typeof supportedLanguages

	history: Message[]

	suffix: string | undefined = undefined

	headers

	constructor(
		id: string,
		mentor: Mentor,
		cloudProvider: string,
		model: ModelType,
		apiKey: string,
		language: keyof typeof supportedLanguages,
		customAPIHost : string,
		suffix?: string,
	) {
		this.id = id
		this.mentor = mentor

		this.apiUrl =
			//cloudProvider === "perplexity" ? ApiUrl.perplexity : ApiUrl.openai
			cloudProvider === "perplexity" ? ApiUrl.perplexity : customAPIHost === "" ? ApiUrl.openai : customAPIHost

		this.language = language

		this.model = model

		this.apiKey = apiKey

		this.history = [
			{
				role: "system",
				content: complete(
					mentor.systemPrompt,
					supportedLanguages[this.language],
				),
			},
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
		console.log(body)

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
		const systemPrompt = requestedMentor.systemPrompt.concat(
			"\n",
			command.prompt.content,
		)

		const prompts = command.pattern.map((prompt) => {
			return complete(prompt, supportedLanguages[this.language], text)
		})

		this.history = [
			{
				role: "system",
				content: complete(
					systemPrompt,
					supportedLanguages[this.language],
				),
			},
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
			console.log(body)

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
				content: complete(
					newMentor.systemPrompt,
					supportedLanguages[this.language],
				),
			},
		]
	}

	reset() {
		this.history = [
			{
				role: "system",
				content: complete(
					this.mentor.systemPrompt,
					supportedLanguages[this.language],
				),
			},
		]
	}
}
