import { ItemView, Notice, WorkspaceLeaf } from "obsidian"
import { Individuals, Topics } from "./mentors"
import { getGPTCompletion, GPTSettings, ModelType } from "./model"
import { Mentor, Message } from "./types"

export const VIEW_TYPE_CHAT = "mentor-chat-view"

export class ChatView extends ItemView {
	apiKey: string

	constructor(leaf: WorkspaceLeaf, token: string) {
		super(leaf)
		this.apiKey = token
	}

	selectedMentor: Mentor = Individuals[0]

	currentInput = ""
	history: Message[] = []
	loadingMessage: Message = { role: "assistant", content: "..." }

	getViewType() {
		return VIEW_TYPE_CHAT
	}

	getDisplayText() {
		return "AI Mentor"
	}

	getIcon(): string {
		return "user"
	}

	async onOpen() {
		const chatView = this.containerEl.children[1]
		chatView.empty()
		chatView.addClass("main-container")

		const container = chatView.createDiv()
		container.addClass("chat")

		container.createEl("h4", { text: "Your AI Mentor" })

		// Mentor selection.
		const mentorDiv = container.createDiv()
		mentorDiv.addClass("chat__mentor")

		const mentorText = mentorDiv.createEl("p", { text: "Select a mentor:" })
		mentorText.addClass("chat__mentor-text")

		const selectEl = mentorDiv.createEl("select")
		selectEl.addClass("chat__mentor-select")

		// Create groups for categories of AI mentors.
		const topicsGroup = selectEl.createEl("optgroup")
		topicsGroup.label = "By Topic"
		const individualsGroup = selectEl.createEl("optgroup")
		individualsGroup.label = "Famous Individuals"

		for (const mentor of Topics) {
			const optionEl = topicsGroup.createEl("option")
			optionEl.value = mentor.id
			optionEl.text = mentor.name
		}
		for (const mentor of Individuals) {
			const optionEl = individualsGroup.createEl("option")
			optionEl.value = mentor.id
			optionEl.text = mentor.name
		}
		selectEl.onchange = (evt) => {
			this.handleMentorChange((evt.target as HTMLSelectElement).value)
		}
		selectEl.value = this.selectedMentor.id

		// Display messages in the chat.
		const chatDiv = container.createDiv()
		chatDiv.addClass("chat__messages")

		// Add history to selectedMentor.firstMessage
		const firstMessage: Message = {
			role: "assistant",
			content: this.selectedMentor.firstMessage,
		}
		const displayedMessages = [firstMessage, ...this.history]

		for (const message of displayedMessages) {
			// Contains text and icon.
			const messageDiv = chatDiv.createDiv()
			messageDiv.addClass("chat__message-container")
			messageDiv.addClass(`chat__message-container--${message.role}`)

			// Add the message text.
			const messageEl = messageDiv.createEl("p", {
				text: message.content,
			})
			messageEl.addClass("chat__message")
			messageEl.addClass(`chat__message--${message.role}`)

			// Add an icon button to next to the message to copy it.
			// Defaults to hidden.
			const actionButton = messageDiv.createEl("button")
			actionButton.addClass("chat__action-button")
			actionButton.onclick = () => {
				navigator.clipboard.writeText(message.content)
				new Notice("Copied to clipboard.")
			}

			// When the user hovers over the message, show the copy button.
			messageDiv.onmouseenter = () => {
				actionButton.addClass("chat__action-button--visible")
			}
			messageDiv.onmouseleave = () => {
				actionButton.removeClass("chat__action-button--visible")
			}
		}

		// Add a text input.
		const interationDiv = container.createDiv()
		interationDiv.addClass("chat__interaction-container")

		const inputEl = interationDiv.createEl("input")
		inputEl.type = "text"
		inputEl.placeholder = "Ask a question..."
		inputEl.addClass("chat__input")
		inputEl.oninput = (evt) => {
			this.currentInput = (evt.target as HTMLInputElement).value
		}
		inputEl.onkeydown = (evt) => {
			if (evt.key === "Enter") {
				this.handleSend()
			}
		}

		// Add a send button.
		const sendButton = interationDiv.createEl("button")
		sendButton.addClass("chat__send-button")
		sendButton.onclick = () => this.handleSend()

		// Add a button to clear the chat.
		const clearButton = interationDiv.createEl("button")
		clearButton.addClass("chat__clear-button")
		clearButton.onclick = () => this.handleClear()
	}

	async onClose() {
		// Nothing to clean up.
	}

	async handleMentorChange(id: string) {
		// Update the selected mentor.
		const mentors = [...Topics, ...Individuals]
		this.selectedMentor =
			mentors.find((mentor) => mentor.id === id) || mentors[0]

		// Clear the chat.
		this.history = []

		// Refresh the view.
		await this.onOpen()
	}

	async handleKeywordsInPrompt(prompt: string): Promise<string> {
		// Todo: return a prompt that do not contain the note to be inserted in the chat
		if (prompt.includes("@current-note")) {
			const noteFile = this.app.workspace.getActiveFile()
			if (!noteFile || !noteFile.name) {
				new Notice("Please open a note to use @current-note.")
				return prompt
			}

			const text = await this.app.vault.read(noteFile)

			// Replace @current-note with the text of the note.
			prompt = prompt.replace("@current-note", text)

			return prompt
		}

		return prompt
	}

	async handleSend() {
		// Don't send empty messages.
		if (this.currentInput === "") {
			new Notice("Cannot send empty messages.")
			return
		}

		// Wait for the mentor to respond.
		if (
			this.history.length !== 0 &&
			this.history[this.history.length - 1].role === "user"
		) {
			new Notice("Please wait for your mentor to respond.")
			return
		}

		const prompt = await this.handleKeywordsInPrompt(this.currentInput)
		const message: Message = { role: "user", content: prompt }
		this.history.push(message)
		this.history.push(this.loadingMessage)

		// Refresh the view.
		await this.onOpen()

		const systemMessage: Message = {
			role: "system",
			content:
				this.selectedMentor.systemPrompt ||
				"You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.",
		}
		const input = [
			systemMessage,
			...this.history.slice(0, this.history.length - 1),
		]
		const settings: GPTSettings = {
			modelType: ModelType.Default,
			maxTokens: 200,
			temperature: 1.0,
			topP: 1.0,
			presencePenalty: 0,
			frequencyPenalty: 0,
			stop: [],
		}
		const response = await getGPTCompletion(this.apiKey, input, settings)

		this.history.pop()
		this.history.push({ role: "assistant", content: response })

		// Refresh the view.
		await this.onOpen()

		// Clear the input.
		this.currentInput = ""
	}

	async handleClear() {
		// Keep only the first message.
		this.history = []

		// Refresh the view.
		await this.onOpen()
	}
}
