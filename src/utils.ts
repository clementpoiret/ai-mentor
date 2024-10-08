export const pythonifyKeys = (obj: any) =>
	Object.keys(obj).reduce((acc, key) => {
		// From `obsidian-gpt` plugin
		const modifiedKey = key.replace(/([A-Z])/g, function f(g) {
			return "_" + g.toLowerCase()
		})
		return {
			...acc,
			...{ [modifiedKey]: obj[key] },
		}
	}, {})

export const capitalize = (word: string) => {
	if (!word) return word
	return word[0].toUpperCase() + word.substr(1).toLowerCase()
}

export const complete = (content: string, language?: string, text?: string) => {
	let finalContent = content

	if (language) {
		finalContent = finalContent.replace("$LANGUAGE", language)
	}

	if (text) {
		finalContent = finalContent.replace("$TEXT", text)
	}

	return finalContent
}
