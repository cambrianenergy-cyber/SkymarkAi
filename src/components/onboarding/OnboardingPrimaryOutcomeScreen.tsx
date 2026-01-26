import { useState } from "react";
import { useAllowedTools } from "../../hooks/useAllowedTools";
import { NextButton } from "../../hooks/NextButton";

const outcomes = [
  "Customer support + inbox automation",
  "Sales follow-up + lead nurturing",
  "Internal ops automation (tasks, approvals)",
  "Content + marketing automation",
  "Data extraction + reporting",
  "Build my own workflows from scratch",
];

const tools = [
  "Gmail / Outlook",
  "Slack / Teams",
  "HubSpot / Salesforce",
  "Notion / Airtable",
  "Google Drive / Dropbox",
  "Zapier / Make",
  "Custom API",
];

  const [primaryOutcome, setPrimaryOutcome] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const { allowedTools, loading: allowedLoading } = useAllowedTools(workspaceId);

  function handleToolChange(tool: string) {
    if (allowedTools && !allowedTools.includes(tool)) {
      setErr(`You are not allowed to select the tool: ${tool}`);
      return;
    }
    setSelectedTools(prev =>
      prev.includes(tool)
        ? prev.filter(t => t !== tool)
        : prev.length < 2
        ? [...prev, tool]
        : prev
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (allowedTools && selectedTools.some(t => !allowedTools.includes(t))) {
      setErr("One or more selected tools are not allowed by your policy.");
      return;
    }
    await fetch(`/api/workspace_onboarding/${workspaceId}/inputs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryOutcome, tools: selectedTools }),
    });
  }

  return (
    <form className="p-6 max-w-xl mx-auto" onSubmit={handleSubmit}>
      {allowedLoading && <div>Loading allowed tools...</div>}
      <h2 className="text-2xl font-bold mb-4">What do you want Uqentra to do first?</h2>
      <div className="mb-4">
        <label>Pick one primary goal:</label>
        <div className="grid grid-cols-1 gap-2 mt-2">
          {outcomes.map(outcome => (
            <label key={outcome} className={`p-2 border rounded cursor-pointer ${primaryOutcome === outcome ? "bg-blue-100 border-blue-500" : "bg-white"}`}>
              <input type="radio" name="primaryOutcome" value={outcome} checked={primaryOutcome === outcome} onChange={() => setPrimaryOutcome(outcome)} /> {outcome}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label>Pick Top 2 systems you use:</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {tools.map(tool => (
            <label key={tool} className={`p-2 border rounded cursor-pointer ${selectedTools.includes(tool) ? "bg-blue-100 border-blue-500" : "bg-white"}`}>
              <input
                type="checkbox"
                name="tools"
                value={tool}
                checked={selectedTools.includes(tool)}
                onChange={() => handleToolChange(tool)}
                disabled={
                  (allowedTools && !allowedTools.includes(tool)) ||
                  (!selectedTools.includes(tool) && selectedTools.length >= 2)
                }
                title={allowedTools && !allowedTools.includes(tool) ? "Not allowed by your policy" : undefined}
              /> {tool}
            </label>
          ))}
        </div>
      </div>
      {err && <div className="text-red-600 text-sm mt-2">{err}</div>}
      <NextButton workspaceId={workspaceId} currentStep={onboarding.currentStep} />
    </form>
  );
}
