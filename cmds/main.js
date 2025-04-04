// Import command system
import { commands, initializeCommandSources } from './commands/index.js';

// Initialize command system
const init = async () => {
  await initializeCommandSources();
};

// Export public API
export { commands, initializeCommandSources };