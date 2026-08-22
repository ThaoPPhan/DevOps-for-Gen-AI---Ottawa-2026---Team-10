import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Code2, 
  ExternalLink,
  ShieldCheck,
  Send
} from 'lucide-react';

export const ApiDocs: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pythonSnippet = `# AgenticScale Python AI Agent Safety Wrapper
import requests

def execute_safe_action(agent_id, action_name, target_resource, payload, prompt_input=""):
    """
    Evaluates in-flight agent actions through the AgenticScale Cloudflare Edge Gateway.
    Returns: 'ALLOW', 'REVIEW', or 'BLOCK'
    """
    url = "https://agenticscale.org/api/gateway/evaluate"
    response = requests.post(url, json={
        "agent_id": agent_id,
        "action_name": action_name,
        "target_resource": target_resource,
        "payload": payload,
        "prompt_input": prompt_input
    })
    
    result = response.json()
    decision = result.get("decision")
    
    if decision == "ALLOW":
        print(f"✓ [AgenticScale] Action '{action_name}' APPROVED (Latency: {result.get('latency_ms')}ms)")
        # Proceed with actual tool execution...
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
  const res = await fetch('https://agenticscale.org/api/gateway/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const evaluation = await res.json();
  if (evaluation.decision === 'BLOCK') {
    throw new Error(\`AgenticScale Blocked Action: \${evaluation.reasons.join(', ')}\`);
  }
  return evaluation;
}`;

  const curlSnippet = `curl -X POST https://agenticscale.org/api/gateway/evaluate \\
  -H "Content-Type: application/json" \\
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
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-mono mb-2">
          <span>Developer Integration & REST Endpoints</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          AgenticScale Safety Gateway API
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Integrate continuous safety assurance into any AI agent framework (LangChain, LlamaIndex, CrewAI, AutoGen, or custom LLM loops) with sub-15ms edge evaluation.
        </p>
      </div>

      {/* Code Snippets */}
      <div className="space-y-6">
        
        {/* Python */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-brand-400" />
              <span>Python Integration (LangChain / CrewAI / Raw Python)</span>
            </span>
            <button
              onClick={() => copyToClipboard(pythonSnippet, 'python')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5"
            >
              {copiedKey === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'python' ? 'Copied' : 'Copy Python'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed">
            {pythonSnippet}
          </pre>
        </div>

        {/* TypeScript */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>TypeScript / Node.js Integration</span>
            </span>
            <button
              onClick={() => copyToClipboard(tsSnippet, 'ts')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5"
            >
              {copiedKey === 'ts' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'ts' ? 'Copied' : 'Copy TypeScript'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed">
            {tsSnippet}
          </pre>
        </div>

        {/* cURL */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>cURL Direct Gateway Evaluation</span>
            </span>
            <button
              onClick={() => copyToClipboard(curlSnippet, 'curl')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5"
            >
              {copiedKey === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'curl' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed">
            {curlSnippet}
          </pre>
        </div>

      </div>

    </div>
  );
};
