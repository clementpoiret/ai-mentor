import { addIcon, Menu, Notice, Plugin } from "obsidian"

import { MentorIcon } from "./assets/icons/mentor"
import { ChatView, VIEW_TYPE_CHAT } from "./chatview"
import { explain, redact } from "./commands"
import { MentorModal } from "./modals"
import SettingTab from "./settings"

interface MentorSettings {
	preferredMentorId: string
	language: string
	token: string
}

const DEFAULT_SETTINGS: MentorSettings = {
	preferredMentorId: "default",
	language: "en",
	token: "",
}

export default class ObsidianMentor extends Plugin {
	settings: MentorSettings = DEFAULT_SETTINGS

	async onload() {
		await this.loadSettings()

		this.registerView(
			VIEW_TYPE_CHAT,
			(leaf) =>
				new ChatView(
					leaf,
					this.settings.token,
					this.settings.preferredMentorId
				)
		)

		// This creates an icon in the left ribbon.
		addIcon("aimentor", MentorIcon)

		const ribbonIconEl = this.addRibbonIcon(
			"aimentor",
			"Mentor",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				this.activateView()
			}
		)
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("mentor-ribbon")

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this))

		// This adds a command that can be triggered with a hotkey.
		this.addCommand({
			id: "open-mentor",
			name: "Open Mentor",
			callback: () => {
				this.activateView()
			},
		})

		// This adds the "ELI5" command.
		this.addCommand({
			id: "eli5",
			name: "ELI5",
			editorCallback: async (editor) => {
				const title = "Explain Like I'm 5"
				const selection = editor.getSelection()
				const loadingModal = new MentorModal(
					this.app,
					title,
					"Interesting, let me think..."
				)

				if (selection) {
					loadingModal.open()

					explain(selection, this.settings.token).then((response) => {
						// editor.replaceSelection(response)
						if (response) {
							// Show the explanation
							loadingModal.close()
							new MentorModal(this.app, title, response).open()
						} else {
							// Show an error
							new Notice("Error: Could not get explanation.")
						}
					})
				} else {
					new Notice("Error: No text selected.")
				}
			},
		})

		// Also add ELI5 to the right-click context menu
		// todo: clean to avoid code duplication
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor, view) => {
				menu.addItem((item) => {
					item.setTitle("Explain Like I'm 5")
					item.setIcon("aimentor")
					item.onClick(() => {
						const title = "Explain Like I'm 5"
						const selection = editor.getSelection()
						const loadingModal = new MentorModal(
							this.app,
							title,
							"Interesting, let me think..."
						)

						if (selection) {
							loadingModal.open()

							explain(selection, this.settings.token).then(
								(response) => {
									// editor.replaceSelection(response)
									if (response) {
										// Show the explanation
										loadingModal.close()
										new MentorModal(
											this.app,
											title,
											response
										).open()
									} else {
										// Show an error
										new Notice(
											"Error: Could not get explanation."
										)
									}
								}
							)
						} else {
							new Notice("Error: No text selected.")
						}
					})
				})
			})
		)

		// This adds the "redact" command.
		this.addCommand({
			id: "redact",
			name: "Redact",
			editorCallback: async (editor) => {
				const title = "Redact"
				const selection = editor.getSelection()
				const loadingModal = new MentorModal(
					this.app,
					title,
					"Let me read and redact your note..."
				)

				if (selection) {
					loadingModal.open()

					redact(selection, this.settings.token).then((response) => {
						// editor.replaceSelection(response)
						if (response) {
							// append a new line to the end of the note
							loadingModal.close()
							const note = selection + "\n\n___\n\n" + response
							editor.replaceSelection(note)
						} else {
							// Show an error
							new Notice("Error: Could not redact your note.")
						}
					})
				} else {
					new Notice("Error: No text selected.")
				}
			},
		})

		// Also add redact to the right-click context menu
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor, view) => {
				menu.addItem((item) => {
					item.setTitle("Redact")
					item.setIcon("aimentor")
					item.onClick(() => {
						const title = "Redact"
						const selection = editor.getSelection()
						const loadingModal = new MentorModal(
							this.app,
							title,
							"Let me read and redact your note..."
						)

						if (selection) {
							loadingModal.open()

							redact(selection, this.settings.token).then(
								(response) => {
									// editor.replaceSelection(response)
									if (response) {
										// append a new line to the end of the note
										loadingModal.close()
										const note =
											selection + "\n\n___\n\n" + response
										editor.replaceSelection(note)
									} else {
										// Show an error
										new Notice(
											"Error: Could not redact your note."
										)
									}
								}
							)
						} else {
							new Notice("Error: No text selected.")
						}
					})
				})
			})
		)
	}

	async activateView() {
		// Pass token from settings to the view
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_CHAT)

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_CHAT,
			active: true,
		})

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_CHAT)[0]
		)
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_CHAT)
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		)
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}

	async getCompletion() {
		console.log("OK")
	}
}
