import {
	App,
	ButtonComponent,
	PluginSettingTab,
	Setting,
	TextComponent,
} from "obsidian"

import { Topics, Individuals } from "./ai/mentors"
import { ModelType } from "./ai/model"
import ObsidianMentor from "./main"
import { Mentor, supportedLanguage } from "./types"

export default class SettingTab extends PluginSettingTab {
	plugin: ObsidianMentor

	constructor(app: App, plugin: ObsidianMentor) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this

		containerEl.empty()

		containerEl.createEl("h2", { text: "Settings for your mentor" })

		const mentorList: Record<string, Mentor> = {
			...Topics,
			...Individuals,
		}
		const mentorIds = mentorList ? Object.keys(mentorList) : []

		new Setting(containerEl)
			.setName("Language")
			.setDesc("The language you'd like to talk to your mentor in.")
			.addDropdown((dropdown) => {
				dropdown.addOption("en", "English")
				dropdown.addOption("fr", "Français")

				dropdown.setValue(this.plugin.settings.language || "en")
				dropdown.onChange((value) => {
					this.plugin.settings.language = value as supportedLanguage
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName("Preferred Mentor")
			.setDesc("The mentor you'd like to talk to in priority.")
			.addDropdown((dropdown) => {
				mentorIds.forEach((id) => {
					dropdown.addOption(id, mentorList[id].name.en)
				})
				dropdown.setValue(
					this.plugin.settings.preferredMentorId || "default"
				)
				dropdown.onChange((value) => {
					this.plugin.settings.preferredMentorId = value
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName("OpenAI API Key")
			.setDesc("The token generated in your OpenAI dashboard.")
			.addText((text: TextComponent) => {
				text.setPlaceholder("Token")
					.setValue(this.plugin.settings.token || "")
					.onChange((change) => {
						this.plugin.settings.token = change
						this.plugin.saveSettings()
					})
			})
			.addButton((button: ButtonComponent) => {
				button.setButtonText("Generate token")
				button.onClick((evt: MouseEvent) => {
					window.open("https://platform.openai.com/account/api-keys")
				})
			})

		new Setting(containerEl)
			.setName("Preferred Model")
			.setDesc("The model you want to use.")
			.addDropdown((dropdown) => {
				dropdown.addOption("gpt-3.5-turbo", "GPT-3.5 Turbo")
				dropdown.addOption("gpt-3.5-turbo-16k", "GPT-3.5 Turbo 16k")
				dropdown.addOption("gpt-4", "GPT-4")
				dropdown.addOption("text-davinci-003", "Davinci 003")

				dropdown.setValue(this.plugin.settings.model || "gpt-3.5-turbo")
				dropdown.onChange((value) => {
					this.plugin.settings.model = value as ModelType
					this.plugin.saveSettings()
				})
			})
	}
}
