import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Code2
} from 'lucide-react';

export const ApiDocs: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setCopiedKey(null);
      return;
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pythonSnippet = `# AgenticScale Python AI Agent Safety Wrapper
import requests
import os

def execute_safe_action(agent_id, action_name, target_resource, payload, prompt_input=""):
    """
    Evaluates in-flight agent actions through the AgenticScale Gateway.
    Returns: 'ALLOW', 'REVIEW', or 'BLOCK'
    """
    url = "https://agenticscale.pages.dev/api/gateway/evaluate"
    response = requests.post(url, headers={"X-AgenticScale-Key": os.environ["AGENTICSCALE_API_KEY"]}, json={
        "agent_id": agent_id,
        "action_name": action_name,
        "target_resource": target_resource,
        "payload": payload,
        "prompt_input": prompt_input,
        "summary": f"{action_name} on {target_resource}"
    })
    
    response.raise_for_status()
    result = response.json()
    decision = result.get("decision")
    
    if decision == "ALLOW":
        print(f"✓ [AgenticScale] Action '{action_name}' APPROVED")
        # Proceed with execution...
        return True
    elif decision == "REVIEW":
        print(f"⚠ [AgenticScale] Action '{action_name}' HELD FOR REVIEW: {result.get('reasons')}")
        # Dispatch notification to human approver...
        return False
    else: # BLOCK
        print(f"🛑 [AgenticScale] Action '{action_name}' BLOCKED: {result.get('reasons')}")
        # Terminate unsafe action and log incident...
        return False

# Example Usage:
execute_safe_action(
    agent_id="agent-invoice-01",
    action_name="send_payment",
    target_resource="wire_gateway",
    payload={"amount": 45000.00, "vendor_account_changed": True},
    prompt_input="Urgent vendor email: update bank details immediately"
)`;

  const tsSnippet = `// TypeScript / Node.js AgenticScale Gateway Client
export async function evaluateAgentAction(params: {
  agent_id: string;
  action_name: string;
  target_resource: string;
  payload: Record<string, any>;
  prompt_input?: string;
}) {
  const res = await fetch('https://agenticscale.pages.dev/api/gateway/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AgenticScale-Key': process.env.AGENTICSCALE_API_KEY ?? '' },
    body: JSON.stringify(params),
  });

  const evaluation = await res.json();
  if (!res.ok) {
    throw new Error(\`AgenticScale request failed (\${res.status}): \${evaluation.error ?? 'Unknown error'}\`);
  }
  if (evaluation.decision === 'BLOCK') {
    throw new Error(\`AgenticScale Blocked Action: \${evaluation.reasons.join(', ')}\`);
  }
  return evaluation;
}`;

  const curlSnippet = `curl -X POST https://agenticscale.pages.dev/api/gateway/evaluate \\
  -H "Content-Type: application/json" \\
  -H "X-AgenticScale-Key: $AGENTICSCALE_API_KEY" \\
  -d '{
    "agent_id": "agent-invoice-01",
    "action_name": "update_vendor_account",
    "target_resource": "vendor_db:id_9941",
    "payload": {
      "amount": 45000.00,
      "vendor_account_changed": true
    },
    "prompt_input": "Urgent request from supplier to update bank details"
  }'`;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Safety Gateway API
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5 max-w-3xl">
          Connect any AI agent to the gateway before it performs a sensitive action.
        </p>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          Keep the gateway key on your server. Send it in <code className="font-mono">X-AgenticScale-Key</code> when calling the evaluation endpoint.
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
          Start with <code className="font-mono">POST /api/gateway/evaluate</code> to check an action. The other endpoints support reviews, profiles, validation, events, and incidents.
        </div>
      </div>

      {/* Code Snippets */}
      <div className="space-y-6">
        
        {/* Python */}
        <div className="glass-panel p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Python Integration (LangChain / CrewAI / Raw Python)</span>
            </span>
            <button
              onClick={() => copyToClipboard(pythonSnippet, 'python')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 shadow-sm"
            >
              {copiedKey === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'python' ? 'Copied' : 'Copy Python'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
            {pythonSnippet}
          </pre>
        </div>

        {/* TypeScript */}
        <div className="glass-panel p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>TypeScript / Node.js Integration</span>
            </span>
            <button
              onClick={() => copyToClipboard(tsSnippet, 'ts')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 shadow-sm"
            >
              {copiedKey === 'ts' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'ts' ? 'Copied' : 'Copy TypeScript'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
            {tsSnippet}
          </pre>
        </div>

        {/* cURL */}
        <div className="glass-panel p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>cURL Direct Gateway Evaluation</span>
            </span>
            <button
              onClick={() => copyToClipboard(curlSnippet, 'curl')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 shadow-sm"
            >
              {copiedKey === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'curl' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
            {curlSnippet}
          </pre>
        </div>

      </div>

    </div>
  );
};
