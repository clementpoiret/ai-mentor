import {
	App,
	ButtonComponent,
	PluginSettingTab,
	Setting,
	TextComponent,
} from "obsidian"
import ObsidianMentor from "./main"

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
					window.open("https://beta.openai.com/account/api-keys")
				})
			})
	}
}
