const { classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components
Cu.import("resource://gre/modules/Services.jsm")

const file = Services.dirsvc.get("UChrm", Ci.nsIFile)
file.append('userChrome.js')

function* getAllWindows(type = 'navigator:browser') {
	const enumerator = Services.wm.getEnumerator(type);
	while (enumerator.hasMoreElements()) yield enumerator.getNext()
}

async function injectIntoWindow(window) {
	try {
		if (!file.exists() || !file.isFile()) {
			console.warn('userChrome.js not found')
			return
		}
		if (window.document.readyState !== "complete")
			await new Promise(resolve => window.addEventListener("load", resolve))
		const url = 'file://' + file.path

		const sandbox = Cu.Sandbox(window, {
			sandboxPrototype: window,
			sameZoneAs: window,
			wantXrays: false,
		})
		const script = await window.ChromeUtils.compileScript(url)
		script.executeInGlobal(sandbox)
	} catch (error) { console.error(error) }
}

[...getAllWindows()].map(injectIntoWindow)

Services.ww.registerNotification({
	observe(subject, topic) {
		if (topic !== 'domwindowopened') return
		const window = subject.QueryInterface(Ci.nsIDOMWindow)
		void injectIntoWindow(window)
	},
})

class API extends ExtensionAPI {
	getAPI(context) { return { activate() { } } }
}
