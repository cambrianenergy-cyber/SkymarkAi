// Enhanced workflow step with dependencies
export interface WorkflowStepWithDependencies {
  stepId: string;
  order: number;
  agentType: string;
  instruction: string;
  dependencies?: string[]; // Array of stepIds that must complete first
  canRunInParallel?: boolean; // If true, can run concurrently with other parallel steps
  timeout?: number; // Max execution time in milliseconds
  retryConfig?: {
    maxRetries: number;
    retryDelay: number; // Base delay in ms (will use exponential backoff)
  };
}

export interface DependencyGraph {
  [stepId: string]: {
    step: WorkflowStepWithDependencies;
    dependsOn: string[];
    dependents: string[];
    canStart: boolean;
  };
}

export class DependencyResolver {
  /**
   * Build a dependency graph from workflow steps
   */
  static buildGraph(steps: WorkflowStepWithDependencies[]): DependencyGraph {
    const graph: DependencyGraph = {};

    // Initialize graph
    steps.forEach((step) => {
      graph[step.stepId] = {
        step,
        dependsOn: step.dependencies || [],
        dependents: [],
        canStart: false,
      };
    });

    // Build dependent relationships
    steps.forEach((step) => {
      if (step.dependencies) {
        step.dependencies.forEach((depId) => {
          if (graph[depId]) {
            graph[depId].dependents.push(step.stepId);
          }
        });
      }
    });

    return graph;
  }

  /**
   * Find steps that can execute now based on completed steps
   */
  static getExecutableSteps(
    graph: DependencyGraph,
    completedSteps: string[],
    runningSteps: string[]
  ): string[] {
    const executable: string[] = [];

    Object.keys(graph).forEach((stepId) => {
      const node = graph[stepId];

      // Skip if already completed or running
      if (completedSteps.includes(stepId) || runningSteps.includes(stepId)) {
        return;
      }

      // Check if all dependencies are completed
      const allDepsCompleted = node.dependsOn.every((depId) => completedSteps.includes(depId));

      if (allDepsCompleted) {
        executable.push(stepId);
      }
    });

    return executable;
  }

  /**
   * Group executable steps into parallel batches
   */
  static groupParallelSteps(
    graph: DependencyGraph,
    executableStepIds: string[]
  ): { parallel: string[]; sequential: string[] } {
    const parallel: string[] = [];
    const sequential: string[] = [];

    executableStepIds.forEach((stepId) => {
      const step = graph[stepId].step;
      if (step.canRunInParallel) {
        parallel.push(stepId);
      } else {
        sequential.push(stepId);
      }
    });

    return { parallel, sequential };
  }

  /**
   * Validate that there are no circular dependencies
   */
  static validateNoCycles(graph: DependencyGraph): { valid: boolean; error?: string } {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function hasCycle(nodeId: string): boolean {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = graph[nodeId];
      for (const depId of node.dependsOn) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) return true;
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    }

    for (const nodeId of Object.keys(graph)) {
      if (!visited.has(nodeId)) {
        if (hasCycle(nodeId)) {
          return { valid: false, error: `Circular dependency detected involving step: ${nodeId}` };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Get topological order of steps (respecting dependencies)
   */
  static getTopologicalOrder(graph: DependencyGraph): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    function visit(nodeId: string) {
      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      const node = graph[nodeId];

      // Visit dependencies first
      node.dependsOn.forEach((depId) => {
        if (graph[depId]) {
          visit(depId);
        }
      });

      result.push(nodeId);
    }

    Object.keys(graph).forEach((nodeId) => {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    });

    return result;
  }
}
