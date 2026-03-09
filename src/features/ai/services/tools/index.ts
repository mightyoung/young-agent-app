// Tools exports and registration

import { toolRegistry } from './registry';
import { deviceQueryTool } from './deviceTool';
import { taskQueryTool } from './taskTool';
import { hazardQueryTool } from './hazardTool';
import { hazardAnalysisTool } from './hazardAnalysisTool';

// Register all tools
toolRegistry.register(deviceQueryTool);
toolRegistry.register(taskQueryTool);
toolRegistry.register(hazardQueryTool);
toolRegistry.register(hazardAnalysisTool);

// Export individual tools
export { deviceQueryTool } from './deviceTool';
export { taskQueryTool } from './taskTool';
export { hazardQueryTool } from './hazardTool';
export { hazardAnalysisTool } from './hazardAnalysisTool';
export { toolRegistry } from './registry';
