import { addIcon, Plugin } from "obsidian"
import { MentorIcon } from "./assets/icons/mentor"
import { ChatView, VIEW_TYPE_CHAT } from "./chatview"
import SettingTab from "./settings"

// Remember to rename these classes and interfaces!

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
