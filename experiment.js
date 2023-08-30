const { classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components
try { Cu.import("resource://gre/modules/Services.jsm") } catch { }

const scriptId = 'user-chrome-js-qw-linux-2g64-local'

async function injectIntoWindow(file, window) {
	try {
		if (window.document.readyState !== "complete")
			await new Promise(resolve => window.addEventListener("load", resolve))
		const script = window.document.createElementNS(
			'http://www.w3.org/1999/xhtml', 'script')
		script.id = scriptId
		script.type = 'module'
		script.src = 'file://' + file.path + '#' + (new Date()).getTime()
		window.document.documentElement.appendChild(script)
	} catch (error) { console.error(error) }
}

function removeFromWindow(window) {
	const script = window.document.getElementById(scriptId)
	if (script) script.remove()
}

function* enumerateXPCOM(enumerator) {
	while (enumerator.hasMoreElements()) yield enumerator.getNext()
}

const file = Services.dirsvc.get("UChrm", Ci.nsIFile)
file.append('userChrome.js')

const windowListener = {
	onOpenWindow(xulWindow) {
		void injectIntoWindow(file, xulWindow.docShell.domWindow)
	},
}

function startup() {
	for (const v of enumerateXPCOM(Services.wm.getEnumerator(null)))
		void injectIntoWindow(file, v)
	Services.wm.addListener(windowListener)
}

function shutdown() {
	for (const v of enumerateXPCOM(Services.wm.getEnumerator(null)))
		removeFromWindow(v)
	Services.wm.removeListener(windowListener)
}

this.qwUserChromeJS = class extends ExtensionAPI {
	getAPI(context) {
		const { extension } = context
		return {
			qwUserChromeJS: {
				activate() {
					try {
						startup()
						extension.callOnClose({ close() { shutdown() } })
					} catch (e) {
						throw { message: e.message }
					}
				}
			}
		}
	}
}
