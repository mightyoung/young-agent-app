// Tools exports and registration

import { toolRegistry } from './registry';
import { toolExecutor } from './toolExecutor';
import { deviceQueryTool } from './deviceTool';
import { taskQueryTool } from './taskTool';
import { hazardQueryTool } from './hazardTool';
import { hazardAnalysisTool } from './hazardAnalysisTool';

// Register all tools with both registry and executor
toolRegistry.register(deviceQueryTool);
toolRegistry.register(taskQueryTool);
toolRegistry.register(hazardQueryTool);
toolRegistry.register(hazardAnalysisTool);

toolExecutor.register(deviceQueryTool);
toolExecutor.register(taskQueryTool);
toolExecutor.register(hazardQueryTool);
toolExecutor.register(hazardAnalysisTool);

// Export individual tools
export { deviceQueryTool } from './deviceTool';
export { taskQueryTool } from './taskTool';
export { hazardQueryTool } from './hazardTool';
export { hazardAnalysisTool } from './hazardAnalysisTool';
export { toolRegistry } from './registry';
export { toolExecutor, type ToolExecution, type ToolExecutorOptions } from './toolExecutor';
