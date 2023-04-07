// Inspired by `https://github.com/jmilldotdev/obsidian-gpt/blob/main/src/models/chatGPT.ts`
import { request, RequestUrlParam } from "obsidian"

import { pythonifyKeys } from "src/utils"

import { Message } from "./types"

export enum ModelType {
	Default = "gpt-3.5-turbo",
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

// todo: discard first messages if they are too long
export const getGPTCompletion = async (
	apiKey: string,
	messages: Message[],
	settings: GPTSettings,
	suffix?: string
): Promise<string> => {
	const apiUrl = `https://api.openai.com/v1/chat/completions`
	const headers = {
		Authorization: `Bearer ${apiKey}`,
		"Content-Type": "application/json",
	}
	const { modelType, ...params } = settings
	const body = {
		messages,
		model: modelType,
		...pythonifyKeys(params),
		stop: settings.stop.length > 0 ? settings.stop : undefined,
		suffix: suffix ? suffix : undefined,
	}
	const requestUrlParam: RequestUrlParam = {
		url: apiUrl,
		method: "POST",
		contentType: "application/json",
		body: JSON.stringify(body),
		headers,
	}
	const res: any = await request(requestUrlParam)
		.then((response) => {
			return JSON.parse(response)
		})
		.catch((err) => {
			console.error(err)
		})
	return res?.choices?.[0]?.message?.content
}
