export type WorkspaceOnboardingDoc = {
  workspaceId: string;
  steps: any[];
  complete?: boolean;
  inputs?: {
    goals?: {
      tools?: any[];
    };
  };
};
