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
