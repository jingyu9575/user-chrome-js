const { classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components
try { Cu.import("resource://gre/modules/Services.jsm") } catch { }

const scriptId = 'user-chrome-js-qw-linux-2g64-local'
const chromeId = 'userchromejs_qw_linux_2g64_local'

function scriptInjector({ target: document }) {
	try {
		if (document.getElementById(scriptId) ||
			document.readyState !== "complete")
			return
		const script = document.createElementNS(
			'http://www.w3.org/1999/xhtml', 'script')
		script.id = scriptId
		script.type = 'module'
		script.src = `chrome://${chromeId}/content/userChrome.js#` +
			(new Date()).getTime()
		document.documentElement.appendChild(script)
	} catch (error) { console.error(error) }
}

async function injectIntoWindow(window) {
	window.addEventListener("load", scriptInjector)
	scriptInjector({ target: window.document })
}

function removeFromWindow(window) {
	const script = window.document.getElementById(scriptId)
	if (script) script.remove()
	window.removeEventListener("load", scriptInjector)
}

function* enumerateXPCOM(enumerator) {
	while (enumerator.hasMoreElements()) yield enumerator.getNext()
}

const file = Services.dirsvc.get("UChrm", Ci.nsIFile)
file.append(chromeId)
if (!file.exists()) file.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755)
file.append('v0')
if (!file.exists()) file.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755)
file.append('chrome.manifest')
if (!file.exists()) {
	const stream = Cc["@mozilla.org/network/file-output-stream;1"]
		.createInstance(Ci.nsIFileOutputStream)
	stream.init(file, 0x02 | 0x08 | 0x20, 0o644, 0)
	data = `content ${chromeId} ../../\n`
	stream.write(data, data.length)
	stream.close()
}
Components.manager.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(file)

const windowListener = {
	onOpenWindow(xulWindow) {
		void injectIntoWindow(xulWindow.docShell.domWindow)
	},
}

function startup() {
	for (const v of enumerateXPCOM(Services.wm.getEnumerator(null)))
		void injectIntoWindow(v)
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
