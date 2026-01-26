
export type StepStatus = "locked" | "available" | "in_progress" | "completed";

export type OnboardingStepId =
  | "company_identity"
  | "company_role"
  | "team_size"
  | "workspace_needs"
  | "primary_outcome"
  | "plan_recommendation"
  | "workspace_setup_optional"
  | "invite_team"
  | "connect_social_accounts"
  | "complete";

export type SeatRange = "1" | "2-5" | "6-15" | "16-50" | "51-200" | "200+";
export type WorkspaceCountRange = "2-3" | "4-10" | "11-25" | "25+";

export type SocialPlatform =
  | "meta"
  | "x"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "snapchat"
  | "nextdoor"
  | "angi"
  | "threads";

export interface WorkspaceOnboardingDoc {
  workspaceId: string;

  currentStep: OnboardingStepId;
  steps: Record<
    OnboardingStepId,
    {
      status: StepStatus;
      startedAt?: any;
      completedAt?: any;
      blockedReasons?: string[];
    }
  >;

  inputs: {
    company: {
      legalName: string;
      dba?: string | null;
      industry?: string | null;
      website?: string | null;
      country?: string | null;
      state?: string | null;
    };

    user: {
      businessRole: "owner" | "exec" | "admin" | "lead" | "member" | "contractor";
      billingAuthority: boolean;
    };

    sizing: {
      seatRange: SeatRange;
      activeUsersRange: SeatRange;
      externalCollaborators: boolean;
    };

    workspaceNeeds: {
      multiWorkspace: boolean;
      useCase?: "locations" | "divisions" | "brands" | "agency" | null;
      workspaceCountRange?: WorkspaceCountRange | null;
    };

    goals: {
      primaryOutcome: "support" | "sales" | "ops" | "marketing" | "reporting" | "custom";
      tools: string[];
    };

    social: {
      connectNowChoice: "connect_now" | "add_later";
      plannedPlatforms: SocialPlatform[];
    };
  };

  planIntent: {
    recommendedPlan: "starter" | "team" | "business" | "enterprise";
    selectedPlan?: "starter" | "team" | "business" | "enterprise" | null;
    seatsPlanned: number;
    workspacesPlanned: number;
    reasonCodes: string[];
  };

  integrations: {
    social: {
      statusByPlatform: Record<
        SocialPlatform,
        { status: "not_connected" | "connected" | "needs_permission" | "error"; error?: string }
      >;
      connectedPlatforms: SocialPlatform[];
      connectedCount: number;
      deferred: boolean;
      updatedAt?: any;
    };
  };

  createdAt: any;
  updatedAt: any;
}
