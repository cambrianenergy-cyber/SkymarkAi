
import { AgentRunnerBase } from '../agentRunner';

export class ReviewRequesterRunner extends AgentRunnerBase {
  async run(config: any) {
    try {
      if (!config || !config.recipients || !Array.isArray(config.recipients) || !config.reviewLink) {
        return {
          success: false,
          output: null,
          error: {
            message: 'Missing required recipients array or reviewLink',
            code: 'INVALID_INPUT',
          },
        };
      }

      // Simulate sending review requests (replace with real integration)
      const requests = config.recipients.map((recipient: string) => ({
        recipient,
        reviewLink: config.reviewLink,
        sentAt: new Date().toISOString(),
        status: 'sent',
      }));

      return {
        success: true,
        output: {
          message: 'Review requests sent',
          requests,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: {
          message: error.message || 'Review request failed',
          code: 'EXECUTION_ERROR',
        },
      };
    }
  }
}
