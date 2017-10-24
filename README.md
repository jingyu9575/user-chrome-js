# user-chrome-js
Firefox extension (privileged) to enable userChrome.js support.

This extension consists of 2 parts: `user-chrome-js-1` is a WebExtensions Experiment that injects userChrome.js to windows; `user-chrome-js-2` is a regular WebExtension that loads the experiment. `user-chrome-js-1` must be installed first.

The extension xpi files are unsigned and can only be installed on Firefox Developer Edition, Nightly or some third-party builds.
