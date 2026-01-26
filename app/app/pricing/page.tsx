import React from "react";
import Link from "next/link";
import styles from "./pricing.module.css";

const plans = [
  {
    name: "ACCELERATE",
    price: "$499 / mo",
    bestFor: "Growing teams",
    workspaces: "2",
    agents: "2 base agents + specialty agents available",
    includedAgents: [
      "Content Writer (Manual)",
      "Lead Qualifier",
    ],
    core: true,
    optimization: false,
    orchestration: false,
    strategic: false,
    workflow: "Advanced",
    inbox: true,
    campaign: true,
    scheduling: true,
    analytics: "Standard",
    customization: "Standard",
    priority: false,
    support: "Priority",
  },
  {
    name: "DOMINION",
    price: "$999 / mo",
    bestFor: "Agencies & scale",
    workspaces: "5",
    agents: "4 base agents (Accelerate + 2 more) + specialty agents",
    includedAgents: [
      "Content Writer (Manual)",
      "Lead Qualifier",
      "Scheduler",
      "Follow-up Automation",
    ],
    core: true,
    optimization: true,
    orchestration: true,
    strategic: false,
    workflow: "Full",
    inbox: true,
    campaign: true,
    scheduling: true,
    analytics: "Advanced",
    customization: "Advanced",
    priority: true,
    support: "Priority+",
  },
  {
    name: "SOVEREIGN",
    price: "$1,999 / mo",
    bestFor: "Enterprise & multi-brand",
    workspaces: "Custom",
    agents: "6 base agents (Dominion + 2 more) + specialty agents",
    includedAgents: [
      "Content Writer (Manual)",
      "Lead Qualifier",
      "Scheduler",
      "Follow-up Automation",
      "Campaign Generator",
      "Analytics Insights",
    ],
    core: true,
    optimization: true,
    orchestration: true,
    strategic: true,
    workflow: "Unlimited",
    inbox: true,
    campaign: true,
    scheduling: true,
    analytics: "Enterprise",
    customization: "Full",
    priority: true,
    support: "Dedicated",
  },
];

const addons = [
  { name: "Specialty AI Agents (22 available)", price: "$49-$129 / mo each" },
  { name: "Content Writer Agent (24/7)", price: "$129 / mo" },
  { name: "Review Responder Agent", price: "$79 / mo" },
  { name: "Unified Inbox Router", price: "$79 / mo" },
  { name: "Sales Automation Pack", price: "$99 / mo" },
  { name: "Marketing Intelligence Pack", price: "$149 / mo" },
  { name: "Agency Pack (3 agents)", price: "$299 / mo" },
];

export default function PricingPage() {
  return (
    <div className={styles.pricingPage}>
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 16 }}>
        <Link href="/app" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          margin: '12px 0 24px 0',
          padding: '7px 18px',
          background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)',
          color: '#fff',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 15,
          textDecoration: 'none',
          boxShadow: '0 1px 4px 0 rgba(30,41,59,0.08)',
          transition: 'background 0.2s',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', verticalAlign: 'middle' }}>
            <path d="M11.25 14.25L6.75 9.75L11.25 5.25" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </Link>
      </div>
      <h1 className={styles.title}> Pricing Plans & Agent Access</h1>
      <p className={styles.subtitle}>
        Each plan unlocks a higher level of AI execution  from core automation to full multi-agent orchestration.
      </p>
      <div className={styles.tableWrapper}>
        <table className={styles.pricingTable}>
          <thead>
            <tr>
              <th>Feature</th>
              {plans.map((plan) => (
                <th key={plan.name}>
                  {plan.name}
                  <br />
                  <span className={styles.price}>{plan.price}</span>
                  <br />
                  <span className={styles.bestFor}>{plan.bestFor}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Workspaces Included</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.workspaces}</td>
              ))}
            </tr>
            <tr>
              <td>Included AI Agents</td>
              {plans.map((plan) => (
                <td key={plan.name}>
                  <div style={{ fontWeight: 600 }}>{plan.agents}</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                    {plan.includedAgents.map((agent: string) => (
                      <li key={agent}>{agent}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
            <tr>
              <td>Core Execution Agents</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.core ? "" : ""}</td>
              ))}
            </tr>
            <tr>
              <td>Optimization Agents</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.optimization ? "" : ""}</td>
              ))}
            </tr>
            <tr>
              <td>Orchestration Agents</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.orchestration ? "" : ""}</td>
              ))}
            </tr>
            <tr>
              <td>Strategic / Advisory Agents</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.strategic ? "" : ""}</td>
              ))}
            </tr>
            <tr>
              <td>Workflow Automation</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.workflow}</td>
              ))}
            </tr>
            <tr>
              <td>Unified Inbox</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.inbox ? "" : ""}</td>
              ))}
            </tr>
            <tr>
              <td>Campaign Generation</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.campaign ? "" : ""}</td>
              ))}
            </tr>
            <tr>
              <td>Scheduling & Publishing</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.scheduling ? "" : ""}</td>
              ))}
            </tr>
            <tr>
              <td>Analytics & Reporting</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.analytics}</td>
              ))}
            </tr>
            <tr>
              <td>Agent Customization</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.customization}</td>
              ))}
            </tr>
            <tr>
              <td>Priority Processing</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.priority ? "" : ""}</td>
              ))}
            </tr>
            <tr>
              <td>Support Level</td>
              {plans.map((plan) => (
                <td key={plan.name}>{plan.support}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <h2 className={styles.addonTitle}> Add-Ons (Available on All Plans)</h2>
      <table className={styles.addonTable}>
        <thead>
          <tr>
            <th>Add-On</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {addons.map((addon) => (
            <tr key={addon.name}>
              <td>{addon.name}</td>
              <td>{addon.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

