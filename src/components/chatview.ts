import { ItemView, Notice, WorkspaceLeaf } from "obsidian"

import { Individuals, Topics } from "../ai/mentors"
import { MentorModel, ModelType } from "../ai/model"
import { CleanIcon } from "../assets/icons/clean"
import { CopyIcon } from "../assets/icons/copy"
import { SendIcon } from "../assets/icons/send"
import { supportedLanguages } from "../languages"
import { Mentor, Message } from "../types"

const introducer =
	"[ai-mentor] Feel free to send your first message to your mentor. FYI: `online` models are really good at question-answering and follow-up, but can hallucinate for small-talks, where `chat` models are better."

export const VIEW_TYPE_CHAT = "mentor-chat-view"

export class ChatView extends ItemView {
	preferredMentorId = "default"
	language: keyof typeof supportedLanguages = "en"
	model: ModelType
	firstOpen = true
	// isTyping = false
	displayedMessages: Message[] = []

	// Merge the two Record<string, Mentor> objects into one.
	mentorList: Record<string, Mentor> = {
		...Topics,
		...Individuals,
	}

	mentor: MentorModel

	constructor(
		leaf: WorkspaceLeaf,
		cloudProvider: string,
		token: string,
		preferredMentorId: string,
		model: string,
		language: keyof typeof supportedLanguages,
		customOpenAiAPIHost: string,
	) {
		super(leaf)
		this.preferredMentorId = preferredMentorId
		this.model = model as ModelType
		this.language = language

		// Mentor selection.
		const selectedMentor = this.mentorList[preferredMentorId]
		this.mentor = new MentorModel(
			preferredMentorId,
			selectedMentor,
			cloudProvider,
			this.model,
			token,
			this.language,
			customOpenAiAPIHost,
		)
	}

	currentInput = ""
	loadingMessage: Message = { role: "assistant", content: "..." }

	getViewType() {
		return VIEW_TYPE_CHAT
	}

	getDisplayText() {
		return "AI Mentor"
	}

	getIcon(): string {
		return "aimentor"
	}

	async onOpen() {
		// if this is the first time the view is opened, we need to load the choosen mentor from the settings
		if (this.firstOpen) {
			this.firstOpen = false
			this.handleMentorChange(this.preferredMentorId)
		}

		const chatView = this.containerEl.children[1]
		chatView.empty()
		chatView.addClass("main-container")

		const container = chatView.createDiv()
		container.addClass("chat")

		container.createEl("h4", { text: "Your AI Mentor" })

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

		for (const mentor of Object.entries(Topics)) {
			const optionEl = topicsGroup.createEl("option")
			optionEl.value = mentor[0]
			optionEl.text = mentor[1].name
		}

		for (const mentor of Object.entries(Individuals)) {
			const optionEl = individualsGroup.createEl("option")
			optionEl.value = mentor[0]
			optionEl.text = mentor[1].name
		}

		selectEl.onchange = (evt) => {
			this.handleMentorChange((evt.target as HTMLSelectElement).value)
		}
		selectEl.value = this.mentor.id

		// Display messages in the chat.
		const chatDiv = container.createDiv()
		chatDiv.addClass("chat__messages")

		// Add history to selectedMentor.firstMessage
		// const firstMessage: Message = {
		// 	role: "assistant",
		// 	content: selectedMentor.firstMessage[this.preferredLanguage],
		// }

		// Add the first message to the chat.

		const history =
			this.mentor.history.filter(
				(message: Message) => message.role !== "system",
			) || []

		for (const message of this.displayedMessages) {
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
			actionButton.addClass("icon-button")
			actionButton.addClass("clickable-icon")
			actionButton.addClass("icon-button--hidden")
			actionButton.innerHTML = CopyIcon

			actionButton.onclick = () => {
				navigator.clipboard.writeText(message.content)
				new Notice("Copied to clipboard.")
			}

			// When the user hovers over the message, show the copy button.
			messageDiv.onmouseenter = () => {
				actionButton.removeClass("icon-button--hidden")
			}
			messageDiv.onmouseleave = () => {
				actionButton.addClass("icon-button--hidden")
			}
		}

		// Add a text input.
		// Dealing with Textarea Height
		function calcHeight(value: string) {
			const numberOfLineBreaks = (value.match(/\n/g) || []).length

			// min-height + lines x line-height + padding + border
			const newHeight = 16 + numberOfLineBreaks * 16 + 12 + 2
			return newHeight
		}
		const interationDiv = container.createDiv()
		interationDiv.addClass("chat__interaction-container")

		const inputEl = interationDiv.createEl("textarea")
		inputEl.placeholder = "Ask a question..."
		inputEl.addClass("chat__input")
		inputEl.oninput = (evt) => {
			this.currentInput = (evt.target as HTMLInputElement).value
		}
		inputEl.onkeydown = (evt) => {
			if (!evt.shiftKey) {
				if (evt.key === "Enter") {
					this.handleSend()
				}
			}
		}
		inputEl.onkeyup = (evt) => {
			// Resize the input element to fit the text.
			inputEl.style.height = calcHeight(this.currentInput) + "px"
		}

		// Add a send button.
		const sendButton = interationDiv.createEl("button")
		sendButton.addClass("icon-button")
		sendButton.addClass("clickable-icon")
		sendButton.innerHTML = SendIcon
		sendButton.onclick = () => this.handleSend()

		// Add a button to clear the chat.
		const clearButton = interationDiv.createEl("button")
		clearButton.addClass("icon-button")
		clearButton.addClass("clickable-icon")
		clearButton.innerHTML = CleanIcon
		clearButton.onclick = () => this.handleClear()
	}

	async onClose() {
		// Nothing to clean up.
	}

	async handleMentorChange(id: string) {
		const newMentor = this.mentorList[id]

		this.mentor.changeIdentity(id, newMentor)

		this.displayedMessages = [
			{
				role: "assistant",
				content: introducer,
			},
		]

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
			this.mentor.history.length !== 0 &&
			this.mentor.history[this.mentor.history.length - 1].role === "user"
		) {
			new Notice("Please wait for your mentor to respond.")
			return
		}

		const prompt = await this.handleKeywordsInPrompt(this.currentInput)

		// Display the prompt
		this.displayedMessages.push({
			role: "user",
			content: prompt,
		})

		// Add the loading message
		this.displayedMessages.push(this.loadingMessage)

		// Refresh the view.
		await this.onOpen()

		this.mentor
			.getCompletion(prompt)
			.then(async (response) => {
				// Clear the input.
				this.currentInput = ""

				// Display the response.
				this.displayedMessages.pop()
				this.displayedMessages.push({
					role: "assistant",
					content: response,
				})

				// Refresh the view.
				await this.onOpen()
			})
			.catch(async (error) => {
				console.log("error", error)

				// Clear the input.
				this.currentInput = ""

				// Display the error message.
				this.displayedMessages.pop()
				this.displayedMessages.push({
					role: "assistant",
					content: "An error occurred. Please try again.",
				})

				// Refresh the view.
				await this.onOpen()
			})
	}

	async handleClear() {
		// Keep only the first message.
		this.mentor.reset()

		// Clear the displayed messages.
		this.displayedMessages = [
			{
				role: "assistant",
				content: introducer,
			},
		]

		// Refresh the view.
		await this.onOpen()
	}
}
