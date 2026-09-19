// Estado do Modo Privado. Fica separado do preferences-service para que
// `money()` em utils/format.js possa checá-lo sem criar dependência
// circular (format.js é usado por quase todo o app, inclusive por módulos
// que o preferences-service importa).
let active = false;

export function isPrivacyActive() { return active; }
export function setPrivacyMode(value) { active = !!value; }
