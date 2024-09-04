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
import { Mentor } from "./types"
import { supportedLanguages } from "./languages"
import { capitalize } from "./utils"
import { Notice } from 'obsidian';

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
				Object.entries(supportedLanguages).forEach(([code, name]) => {
					dropdown.addOption(code, capitalize(name))
				})

				dropdown.setValue(this.plugin.settings.language || "en")

				dropdown.onChange((value) => {
					this.plugin.settings.language =
						value as keyof typeof supportedLanguages
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName("Preferred Mentor")
			.setDesc("The mentor you'd like to talk to in priority.")
			.addDropdown((dropdown) => {
				mentorIds.forEach((id) => {
					dropdown.addOption(id, mentorList[id].name)
				})
				dropdown.setValue(
					this.plugin.settings.preferredMentorId || "default",
				)
				dropdown.onChange((value) => {
					this.plugin.settings.preferredMentorId = value
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName("Cloud Provider")
			.setDesc("The cloud provider you'd like to use.")
			.addDropdown((dropdown) => {
				dropdown.addOption("perplexity", "Perplexity")
				dropdown.addOption("openai", "OpenAI")

				dropdown.setValue(
					this.plugin.settings.cloudProvider || "perplexity",
				)
				dropdown.onChange((value) => {
					this.plugin.settings.cloudProvider = value
					this.plugin.saveSettings()
				})
			})

		containerEl.createEl("h3", { text: "Perplexity settings" })

		new Setting(containerEl)
			.setName("Perplexity API Key")
			.setDesc("The token generated in your Perplexity.AI dashboard.")
			.addText((text: TextComponent) => {
				text.setPlaceholder("Token")
					.setValue(this.plugin.settings.perplexityToken || "")
					.onChange((change) => {
						this.plugin.settings.perplexityToken = change
						this.plugin.saveSettings()
					})
			})
			.addButton((button: ButtonComponent) => {
				button.setButtonText("Generate token")
				button.onClick((evt: MouseEvent) => {
					window.open("https://www.perplexity.ai/settings/api")
				})
			})

		new Setting(containerEl)
			.setName("Preferred Model")
			.setDesc("The model you want to use.")
			.addDropdown((dropdown) => {
				dropdown.addOption(
					"llama-3.1-sonar-small-128k-chat",
					"Sonar Small Chat (Llama 3.1 8B)",
				)
				dropdown.addOption(
					"llama-3.1-sonar-small-128k-online",
					"Sonar Small Online (Llama 3.1 8B)",
				)
				dropdown.addOption(
					"llama-3.1-sonar-large-128k-chat",
					"Sonar Large Chat (Llama 3.1 70B)",
				)
				dropdown.addOption(
					"llama-3.1-sonar-large-128k-online",
					"Sonar Large Online (Llama 3.1 70B)",
				)
				dropdown.addOption(
					"llama-3.1-sonar-huge-128k-online",
					"Sonar Huge Online (Llama 3.1 405B)",
				)

				dropdown.setValue(
					this.plugin.settings.perplexityModel ||
					"llama-3.1-sonar-large-128k-online",
				)
				dropdown.onChange((value) => {
					this.plugin.settings.perplexityModel = value as ModelType
					this.plugin.saveSettings()
				})
			})

		containerEl.createEl("h3", { text: "OpenAI settings" })

		new Setting(containerEl)
			.setName("OpenAI API Key")
			.setDesc("The token generated in your OpenAI dashboard.")
			.addText((text: TextComponent) => {
				text.setPlaceholder("Token")
					.setValue(this.plugin.settings.openAiToken || "")
					.onChange((change) => {
						this.plugin.settings.openAiToken = change
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
			.setName("Custom OpenAI API Host")
			.setDesc("Customizing the OpenAI API host. Restart to take effect")
			.addText((text: TextComponent) => {
				text.setPlaceholder("eg. https://api.openai.com/v1/chat/completions")
					.setValue(this.plugin.settings.customOpenAiAPIHost || "")
					.onChange((change) => {
						const regex = /https?:\/\/[a-zA-Z0-9.-]+\/v1\/chat\/completions/;
						if (!regex.test(change)) {
							new Notice("Custom OpenAI API Host Input Error")
							return
						}

						new Notice("Custom OpenAI API Host Input Success")
						this.plugin.settings.customOpenAiAPIHost = change
						this.plugin.saveSettings()
					})
			})

		new Setting(containerEl)
			.setName("Preferred Model")
			.setDesc("The model you want to use.")
			.addDropdown((dropdown) => {
				dropdown.addOption("gpt-3.5-turbo", "GPT-3.5 Turbo")
				dropdown.addOption("gpt-4-turbo", "GPT-4 Turbo")
				dropdown.addOption("gpt-4o", "GPT-4o")
				dropdown.addOption("gpt-4o-mini", "GPT-4o Mini")

				dropdown.setValue(this.plugin.settings.openAiModel || "gpt-4o")
				dropdown.onChange((value) => {
					this.plugin.settings.openAiModel = value as ModelType
					this.plugin.saveSettings()
				})
			})
	}
}
