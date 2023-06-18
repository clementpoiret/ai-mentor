// Inspired by `https://github.com/jmilldotdev/obsidian-gpt/blob/main/src/models/chatGPT.ts`

import { RequestUrlParam, request } from "obsidian"
import { pythonifyKeys } from "src/utils"

import { Command } from "./commands"
import { Individuals, Topics } from "./mentors"
import { Mentor, Message, supportedLanguage } from "../types"

export enum ModelType {
	Default = "gpt-3.5-turbo",
	GPT3516k = "gpt-3.5-turbo-16k",
	GPT4 = "gpt-4",
}

export interface GPTSettings {
	modelType: ModelType
	maxTokens: number
	temperature: number
	topP: number
	presencePenalty: number
	frequencyPenalty: number
	stop: string[]
}

export const defaultSettings: GPTSettings = {
	modelType: ModelType.Default,
	maxTokens: 200,
	temperature: 1.0,
	topP: 1.0,
	presencePenalty: 0,
	frequencyPenalty: 0,
	stop: [],
}

export class MentorModel {
	apiUrl = `https://api.openai.com/v1/chat/completions`

	id: string
	mentor: Mentor

	apiKey: string
	preferredLanguage: supportedLanguage

	history: Message[]

	suffix: string | undefined = undefined

	headers

	constructor(
		id: string,
		mentor: Mentor,
		apiKey: string,
		preferredLanguage: supportedLanguage,
		suffix?: string
	) {
		this.id = id
		this.mentor = mentor

		this.apiKey = apiKey
		this.preferredLanguage = preferredLanguage

		this.history = [
			{ role: "system", content: mentor.systemPrompt[preferredLanguage] },
		]

		this.suffix = suffix

		this.headers = {
			Authorization: `Bearer ${this.apiKey}`,
			"Content-Type": "application/json",
		}
	}

	async getCompletion(message: string): Promise<string> {
		const { modelType, ...params } = this.mentor.settings

		const messages = [...this.history, { role: "user", content: message }]

		const body = {
			messages,
			model: modelType,
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

				return "I got an error when trying to reply."
			})

		return answer
	}

	async execute(text: string, command: Command): Promise<string[]> {
		const { modelType, ...params } = command.settings
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

		console.log("prompts", prompts, prompts.length)

		for (const prompt of prompts) {
			this.history.push({ role: "user", content: prompt })

			const body = {
				messages: this.history,
				model: modelType,
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
