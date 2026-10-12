// Owner settings. Edit this file, not a URL parameter, so a link can never redirect someone's data.
export const CONFIG = {
  // Base URL of a server that speaks the httpAdapter contract (app/README.md). null = this device only.
  // Every user's records go there, each under their own user id.
  store: null,
  // Optional: a server that turns what you said into food, e.g. an AI in your own system
  // (contract in app/README.md). null = the built-in rule-based reader, which works offline.
  ai: null,
};
