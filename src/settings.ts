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
				  dropdown.addOption(code, capitalize(name));
				});

			dropdown.setValue(this.plugin.settings.language || "en");
    
			dropdown.onChange((value) => {
			  this.plugin.settings.language = value as keyof typeof supportedLanguages;
			  this.plugin.saveSettings();
			});
		  });

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
					"llama-3-sonar-small-32k-chat",
					"Sonar Small Chat",
				)
				dropdown.addOption(
					"llama-3-sonar-small-32k-online",
					"Sonar Small Online",
				)
				dropdown.addOption(
					"llama-3-sonar-large-32k-chat",
					"Sonar Large Chat",
				)
				dropdown.addOption(
					"llama-3-sonar-large-32k-online",
					"Sonar Large Online",
				)
				dropdown.addOption(
					"mixtral-8x7b-instruct",
					"Mixtral 8x7b Instruct",
				)

				dropdown.setValue(
					this.plugin.settings.perplexityModel ||
						"llama-3-sonar-large-32k-online",
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
			.setName("Preferred Model")
			.setDesc("The model you want to use.")
			.addDropdown((dropdown) => {
				dropdown.addOption("gpt-3.5-turbo", "GPT-3.5 Turbo")
				dropdown.addOption("gpt-4-turbo", "GPT-4 Turbo")
				dropdown.addOption("gpt-4o", "GPT-4o")

				dropdown.setValue(this.plugin.settings.openAiModel || "gpt-4o")
				dropdown.onChange((value) => {
					this.plugin.settings.openAiModel = value as ModelType
					this.plugin.saveSettings()
				})
			})
	}
}
