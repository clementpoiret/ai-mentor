import { App, Modal, Notice } from "obsidian"

export class MentorModal extends Modal {
	title = ""
	displayedText = ""

	constructor(app: App, title: string, displayedText: string) {
		super(app)
		this.title = title
		this.displayedText = displayedText
	}

	onOpen() {
		const { contentEl } = this
		const titleEl = contentEl.createDiv("title")
		titleEl.addClass("modal__title")
		titleEl.setText(this.title)

		const textEl = contentEl.createDiv("text")
		textEl.addClass("modal__text")
		textEl.setText(this.displayedText)

		// Copy text when clicked
		textEl.addEventListener("click", () => {
			navigator.clipboard.writeText(this.displayedText)
			new Notice("Copied to clipboard")
		})
		textEl.addEventListener("contextmenu", () => {
			navigator.clipboard.writeText(this.displayedText)
			new Notice("Copied to clipboard")
		})
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
