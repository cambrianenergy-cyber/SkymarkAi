// ORCHESTRATOR_INTEGRATION_GUIDE.md

# The Orchestrator Prodigy - Integration Guide

## Overview

The Orchestrator Prodigy is an elite AI that works **invisibly behind the scenes** for ALL users. It oversees EVERY task execution and operates automatically without users needing to add him to their workspace.

### How He Works

1. **Analyzes** every task automatically to determine optimal agent assignments
2. **Detects** when you don't have agents that would improve performance
3. **Recommends** specific agents with measurable benefits via popup
4. **Executes** tasks with available agents in optimal order
5. **Monitors** performance and makes real-time optimizations
6. **Overrides** even the Campaign Manager when necessary

### Access Model

- **Regular Users**: Orchestrator works invisibly - never shown in agent list
- **Founder/Owner**: Has unrestricted access + can explicitly invoke if desired
- **Campaign Manager**: Available to Founder automatically, Sovereign plan required for others

## Architecture

```
USER ACTION → ORCHESTRATOR (INVISIBLE) → DECISION → RECOMMENDATIONS → EXECUTION
     ↓               ↓                       ↓              ↓              ↓
  Template      Analyzes Task          Determines      Shows Popup    Runs Agents
   Selected     (Behind Scenes)         Agents         (if missing)   in Order
```

## Files Created

1. **`lib/orchestratorProdigy.ts`** - Core Orchestrator logic
   - `OrchestratorProdigy` class
   - `initializeOrchestrator()` function
   - Agent selection intelligence
   - Recommendation generation
   - Execution planning

2. **`components/AgentRecommendationPopup.tsx`** - UI for recommendations
   - Shows missing agents
   - Displays benefits & improvements
   - "Get Agent" CTA → Marketplace
   - "Continue Without" option

3. **`lib/useOrchestrator.tsx`** - React hook for easy integration
   - `analyzeTask()` - Get Orchestrator decision
   - `executeWithOrchestrator()` - Analyze + execute
   - `showRecommendations` - Recommendations to display
   - `clearRecommendations()` - Dismiss popup

## Integration Steps

### Step 1: Import the Hook

```typescript
import { useOrchestrator } from '@/lib/useOrchestrator';
import AgentRecommendationPopup from '@/components/AgentRecommendationPopup';
```

### Step 2: Initialize in Component

```typescript
function CampaignPage() {
  const { workspaceId } = useAuthWorkspaceGuard();
  const {
    analyzeTask,
    executeWithOrchestrator,
    showRecommendations,
    clearRecommendations,
    isAnalyzing,
  } = useOrchestrator(workspaceId);

  // ... rest of component
}
```

### Step 3: Analyze Task Before Execution

```typescript
async function handleTemplateSelect(templateId: string) {
  try {
    // Orchestrator analyzes the task
    const decision = await analyzeTask({
      taskType: 'execute_template',
      template: templateId,
      inputs: {
        campaignName: 'My Campaign',
        // ... other inputs
      },
    });

    console.log('Orchestrator decision:', decision);
    
    // If there are recommendations, popup will show automatically
    // (handled by showRecommendations state)
    
  } catch (error) {
    console.error('Orchestrator analysis failed:', error);
  }
}
```

### Step 4: Show Recommendation Popup

```typescript
return (
  <div>
    {/* Your page content */}
    
    {/* Recommendation Popup */}
    {showRecommendations.length > 0 && (
      <AgentRecommendationPopup
        recommendations={showRecommendations}
        taskName="Template Execution"
        onClose={clearRecommendations}
        onDismiss={() => {
          // User dismissed for this session
          clearRecommendations();
          sessionStorage.setItem('hideRecommendations', 'true');
        }}
        onProceedAnyway={() => {
          // Continue without recommended agents
          clearRecommendations();
          // Execute the task anyway
          executeTask();
        }}
      />
    )}
  </div>
);
```

### Step 5: Execute with Orchestrator

```typescript
async function executeTask() {
  try {
    const result = await executeWithOrchestrator({
      taskType: 'create_campaign',
      template: selectedTemplate,
      inputs: formData,
    });

    console.log('Execution result:', result);
    // result.decision - The Orchestrator's analysis
    // result.result - The execution output
    
  } catch (error) {
    console.error('Execution failed:', error);
  }
}
```

## Usage Examples

### Example 1: Template Execution

```typescript
// When user selects a template
async function onTemplateSelect(templateId: string) {
  // 1. Orchestrator analyzes
  const decision = await analyzeTask({
    taskType: 'execute_template',
    template: templateId,
    inputs: campaignData,
  });

  // 2. Check if all required agents are available
  if (decision.missingAgents.length > 0) {
    // Popup shows automatically via showRecommendations
    // User can purchase agents (add-ons: price varies) or continue
    console.log('Missing agents:', decision.missingAgents);
  } else {
    // 3. All agents available, proceed
    await executeTask();
  }
}
```

### Example 2: Campaign Creation

```typescript
async function createCampaign(campaignData: any) {
  // Orchestrator determines best agents for campaign
  const { decision, result } = await executeWithOrchestrator({
    taskType: 'create_campaign',
    inputs: campaignData,
  });

  // Shows recommendations if needed
  // Executes with available agents
  // Returns full results
}
```

### Example 3: Social Media Post

```typescript
async function createSocialPost(postData: any) {
  const decision = await analyzeTask({
    taskType: 'create_post',
    inputs: postData,
  });

  // Orchestrator might recommend:
  // - Hashtag_SEO (for viral hashtags)
  // - Trend_Hunter (for trending topics)
  // - Scheduler (for optimal timing)
  
  // Even if user only has Content_Creator subscribed
}
```

### Example 4: Workflow Execution

```typescript
async function runWorkflow(workflowId: string) {
  // Orchestrator analyzes workflow steps
  const decision = await analyzeTask({
    taskType: 'run_workflow',
    inputs: { workflowId },
  });

  // Recommends agents needed for workflow steps
  // User can purchase agents (add-ons: price varies) or continue with available ones
}
```

## Orchestrator Intelligence

The Orchestrator knows which agents are best for each task:

### Campaign Tasks
- **Required**: Campaign_Director, Brand_Voice_Guardian, Content_Creator
- **Recommended**: Social_Manager, Scheduler, Hashtag_SEO

### Content Creation
- **Required**: Content_Creator, Copywriter
- **Recommended**: Brand_Voice_Guardian, Hashtag_SEO

### Lead Generation
- **Required**: Lead_Creator
- **Recommended**: Engagement_Analyst

### Social Media
- **Required**: Social_Manager
- **Recommended**: Scheduler, Hashtag_SEO, Trend_Hunter

### Analytics
- **Required**: Engagement_Analyst
- **Recommended**: Algorithm_Hunter, Trend_Hunter

## Recommendation Priority

**High Priority** - Critical for task success:
- Campaign_Director (for campaigns)
- Brand_Voice_Guardian (for brand consistency)
- Content_Creator (for content tasks)

**Medium Priority** - Significant improvement:
- Scheduler (optimal timing)
- Hashtag_SEO (reach expansion)
- Engagement_Analyst (performance insights)

**Low Priority** - Nice to have:
- Trend_Hunter (trend detection)
- Competitor_Watchdog (competitive intel)

## Integration Checklist

Where to integrate the Orchestrator:

- [ ] **Campaign Creation** (`/app/campaigns`) - Analyze before creating
- [ ] **Template Execution** (`/app/playbooks`) - Check agents and template limits before running (see plan limits)
- [ ] **Workflow Run** (`/app/workflows`) - Verify agents for each step (plan/add-on gating)
- [ ] **Content Creation** (`/app/assets`) - Recommend content agents (add-ons available)
- [ ] **Schedule Posts** (`/app/schedule`) - Suggest timing optimization
- [ ] **Lead Management** (`/app/leads`) - Recommend lead agents (add-ons available)
- [ ] **Run Page** (`/app/run`) - Analyze any manual run

## Benefits

### For Users
✅ **Know what they're missing** - Clear agent recommendations
✅ **Understand value** - See exact benefits and improvements
✅ **Easy upgrade path** - One-click to marketplace
✅ **Can proceed anyway** - Not blocked if they don't want to upgrade

### For Business
✅ **Increased subscriptions** - Contextual upsells
✅ **Higher engagement** - Users see value of premium agents
✅ **Better results** - Users get optimal agent assignments
✅ **Transparent AI** - Users understand how AI orchestration works

## Advanced Features

### 1. Confidence Score
```typescript
decision.confidence // 0-100
// 100 = All required agents available
// 50 = Half of required agents available
```

### 2. Execution Plan
```typescript
decision.executionPlan // Array of steps
// Shows which agents run in what order
// Identifies parallel execution opportunities
```

### 3. Estimated Improvement
```typescript
recommendation.estimatedImprovement // "+60% engagement"
// Data-driven estimates for each agent
```

### 4. Decision Logging
All Orchestrator decisions are logged to Firestore:
- Collection: `orchestrator_decisions`
- Fields: taskType, assignedAgents, recommendations, confidence, etc.
- Use for analytics and optimization

## Next Steps

1. **Test the Orchestrator**:
   - Go to `/app/campaigns` or `/app/playbooks`
   - Try to run a template
   - See recommendations popup

2. **Customize Recommendations**:
   - Edit `orchestratorProdigy.ts`
   - Modify `determineRequiredAgents()` for your task types
   - Adjust `generateRecommendations()` for your agents

3. **Track Performance**:
   - Query `orchestrator_decisions` collection
   - See which agents are most recommended
   - Measure conversion from recommendation → purchase

4. **Expand Intelligence**:
   - Add more task types
   - Implement learning from past decisions
   - A/B test different recommendation strategies

---

**The Orchestrator is now the brain of your entire system. Every task goes through it.**
