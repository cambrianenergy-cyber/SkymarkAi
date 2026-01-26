import { AgentRunner, AgentRunContext, AgentRunResult } from "../agentRunner";

/**
 * ReviewResponderRunner: Responds to customer reviews with appropriate logic.
 * - Positive reviews: Thank the customer and express appreciation.
 * - Negative reviews: Attempt resolution if it does not hurt revenue, following all business rules.
 */
export const ReviewResponderRunner: AgentRunner = async (
  context: AgentRunContext
): Promise<AgentRunResult> => {
    // Enforce workspace isolation: agent must only run in its own workspace
    const agentWorkspaceId = context.input.agentWorkspaceId || context.input.workspaceId;
    const currentWorkspaceId = context.input.workspaceId;
    if (agentWorkspaceId && agentWorkspaceId !== currentWorkspaceId) {
      return {
        output: null,
        error: {
          message: `Workspace mismatch: agent belongs to ${agentWorkspaceId}, but current workspace is ${currentWorkspaceId}`,
          code: "WORKSPACE_ISOLATION_ERROR"
        },
        success: false
      };
    }

    const { reviewText } = context.input;
    let response = "";
    let action = "none";
    // Simple sentiment check (replace with real NLP in production)
    const positiveWords = ["good", "great", "excellent", "amazing", "love", "happy", "satisfied", "awesome", "fantastic", "best"];
    const negativeWords = ["bad", "poor", "terrible", "awful", "hate", "unhappy", "disappointed", "worst", "problem", "issue"];
    const reviewLower = reviewText.toLowerCase();
    const isPositive = positiveWords.some(word => reviewLower.includes(word));
    const isNegative = negativeWords.some(word => reviewLower.includes(word));

    if (isPositive && !isNegative) {
      response = "Thank you so much for your positive feedback! We truly appreciate your business and are thrilled to hear you had a great experience.";
      action = "thank";
    } else if (isNegative) {
      // Example resolution logic: Only offer resolution if it doesn't hurt revenue
      // (In real use, check context for order value, refund policy, etc.)
      if (context.input.canResolveWithoutRevenueLoss) {
        response = "We're sorry to hear about your experience. We'd love to resolve this for youplease contact us so we can make it right.";
        action = "resolve";
      } else {
        response = "Thank you for your feedback. We value your business and will work to improve.";
        action = "acknowledge";
      }
    } else {
      response = "Thank you for your review!";
      action = "neutral";
    }

    return {
      output: { response, action },
      logs: [
        `Review: ${reviewText}`,
        `Response: ${response}`,
        `Action: ${action}`
      ],
      success: true
    };
  };

