"use strict";
/* ---------------------------------------------------------------------------
 * Lead capture.
 * Set REPORT_INBOX to the inbox that receives emailed reports. When set, a
 * "Get your report reviewed" form appears: the visitor enters their work
 * email and their results are posted to FormSubmit, which emails the full
 * report plus lead details to REPORT_INBOX. Leave "" to hide the form.
 *
 * One-time setup: the first submission triggers a FormSubmit activation
 * email to REPORT_INBOX. The inbox owner must click the activation link
 * once; after that, submissions arrive automatically.
 * ------------------------------------------------------------------------- */
const REPORT_INBOX = "n.harvard@aitechpros.ai";
const LEAD_STORE_KEY = "soc2lead";

function leadEndpoint(inbox) {
  return "https://formsubmit.co/ajax/" + encodeURIComponent(inbox);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* Builds the JSON body posted to the lead endpoint. Pure: safe to unit test. */
function buildLeadPayload(company, visitorEmail, score, report) {
  return {
    _subject: "SOC 2 Readiness Report lead" + (company ? " - " + company : ""),
    _template: "table",
    name: company || "(no company given)",
    email: visitorEmail,
    readiness_score: score.overall.pct + "% (" + score.overall.earned + " of " +
      score.overall.applicable + " criteria implemented)",
    open_gaps: String(score.gaps.length),
    critical_gaps: String(score.gaps.filter(g => g.priority === "critical").length),
    message: report
  };
}

function loadLead() {
  try {
    const raw = window.localStorage.getItem(LEAD_STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function saveLead(lead) {
  try { window.localStorage.setItem(LEAD_STORE_KEY, JSON.stringify(lead)); }
  catch (e) { /* storage unavailable; lead capture still works */ }
}

/* Dataset: AICPA Trust Services Criteria, embedded at build time from
 * data/tsc.json so the app works from file:// with no network. */
const TSC = {"framework":"AICPA Trust Services Criteria","edition":"2017 Trust Services Criteria (TSP Section 100), with 2022 revised points of focus","total_criteria":61,"categories":{"Security":{"code":"CC","required":true,"description":"Protection of information and systems against unauthorized access. The Common Criteria apply to every SOC 2 engagement."},"Availability":{"code":"A1","required":false,"description":"Information and systems are available for operation and use as committed or agreed."},"Processing Integrity":{"code":"PI1","required":false,"description":"System processing is complete, valid, accurate, timely, and authorized."},"Confidentiality":{"code":"C1","required":false,"description":"Information designated as confidential is protected as committed or agreed."},"Privacy":{"code":"P","required":false,"description":"Personal information is collected, used, retained, disclosed, and disposed of as committed and in line with privacy objectives."}},"series":{"CC1":"Control Environment","CC2":"Communication and Information","CC3":"Risk Assessment","CC4":"Monitoring Activities","CC5":"Control Activities","CC6":"Logical and Physical Access Controls","CC7":"System Operations","CC8":"Change Management","CC9":"Risk Mitigation","A1":"Availability","PI1":"Processing Integrity","C1":"Confidentiality","P":"Privacy"},"notes":["Security (Common Criteria) is mandatory for every SOC 2 engagement.","Availability, Processing Integrity, Confidentiality, and Privacy are included only when the entity commits to them in the engagement scope.","Type I reports assess control design at a point in time; Type II reports assess operating effectiveness over a period, typically 3 to 12 months.","Summaries and evidence suggestions are original plain-English guidance, not AICPA text. This dataset is a readiness aid, not an audit opinion."],"criteria":[{"id":"CC1.1","category":"Security","series":"CC1","series_name":"Control Environment","title":"Integrity and ethical values","summary":"Leadership sets the tone: the company defines and demonstrates integrity and ethical values, and holds people to them.","typical_evidence":["Signed code of conduct","Ethics policy acknowledgment records","Board minutes showing values discussion"],"priority":"high"},{"id":"CC1.2","category":"Security","series":"CC1","series_name":"Control Environment","title":"Independent board oversight","summary":"Whoever governs the company (board, owners, advisors) oversees controls independently from day-to-day management.","typical_evidence":["Board charter or operating agreement","Meeting minutes showing oversight of security","Org chart showing reporting lines"],"priority":"high"},{"id":"CC1.3","category":"Security","series":"CC1","series_name":"Control Environment","title":"Structure, reporting lines, and responsibilities","summary":"The org chart is real: structures, reporting lines, and who owns which controls are defined, assigned, and kept current.","typical_evidence":["Current org chart","RACI or responsibility matrix","Job descriptions with security duties"],"priority":"high"},{"id":"CC1.4","category":"Security","series":"CC1","series_name":"Control Environment","title":"Commitment to competence","summary":"The company hires, trains, and retains people competent for their control responsibilities, including security training.","typical_evidence":["Hiring criteria for technical roles","Security awareness training completion records","Performance review templates"],"priority":"high"},{"id":"CC1.5","category":"Security","series":"CC1","series_name":"Control Environment","title":"Accountability for controls","summary":"People are held accountable for their control responsibilities, with consequences when controls fail.","typical_evidence":["Accountability language in role descriptions","Disciplinary policy","Management review records"],"priority":"high"},{"id":"CC2.1","category":"Security","series":"CC2","series_name":"Communication and Information","title":"Internal communication of control responsibilities","summary":"Control objectives and responsibilities are communicated internally so everyone knows what is expected of them.","typical_evidence":["All-hands or onboarding decks covering security","Internal wiki or policy portal","Acknowledgment logs"],"priority":"high"},{"id":"CC2.2","category":"Security","series":"CC2","series_name":"Communication and Information","title":"External communication with customers and partners","summary":"The company communicates system operation, commitments, and relevant control info to customers and business partners.","typical_evidence":["Status page and incident communications","Customer-facing security documentation","M SA or DPA security exhibits"],"priority":"high"},{"id":"CC2.3","category":"Security","series":"CC2","series_name":"Communication and Information","title":"Communication with regulators and authorities","summary":"The company knows which regulators and authorities matter and communicates with them as required, including breach notification duties.","typical_evidence":["Breach notification procedure","Regulatory contact list","Records of past notifications, if any"],"priority":"high"},{"id":"CC3.1","category":"Security","series":"CC3","series_name":"Risk Assessment","title":"Defined objectives for risk identification","summary":"Objectives are specific enough that risks to meeting them can actually be identified.","typical_evidence":["Documented security objectives","Risk assessment scope statement"],"priority":"high"},{"id":"CC3.2","category":"Security","series":"CC3","series_name":"Risk Assessment","title":"Risk identification and analysis","summary":"The company identifies and analyzes risks to achieving its objectives, and decides how to manage them.","typical_evidence":["Risk register","Risk assessment report","Risk treatment decisions"],"priority":"high"},{"id":"CC3.3","category":"Security","series":"CC3","series_name":"Risk Assessment","title":"Fraud risk assessment","summary":"Fraud gets its own look: incentives, pressures, and opportunities for fraud are assessed explicitly.","typical_evidence":["Fraud risk assessment section","Segregation of duties analysis","Whistleblower or reporting channel"],"priority":"high"},{"id":"CC3.4","category":"Security","series":"CC3","series_name":"Risk Assessment","title":"Assessment of significant changes","summary":"Big changes (new product, new vendor, new infrastructure, leadership change) trigger a fresh risk look.","typical_evidence":["Change-triggered risk review records","New vendor onboarding risk review"],"priority":"high"},{"id":"CC4.1","category":"Security","series":"CC4","series_name":"Monitoring Activities","title":"Ongoing and separate control evaluations","summary":"Controls are checked both continuously (monitoring) and periodically (separate evaluations like internal audits or pen tests).","typical_evidence":["Continuous monitoring dashboards","Penetration test reports","Internal audit or self-assessment records"],"priority":"high"},{"id":"CC4.2","category":"Security","series":"CC4","series_name":"Monitoring Activities","title":"Evaluation and communication of deficiencies","summary":"Control failures and gaps are identified, rated by severity, reported to the right people, and fixed on a timeline.","typical_evidence":["Deficiency log with severity ratings","Remediation tracking","Management reporting on open findings"],"priority":"high"},{"id":"CC5.1","category":"Security","series":"CC5","series_name":"Control Activities","title":"Control activities that mitigate risk","summary":"Control activities are chosen and built to actually mitigate the risks identified, not just check a box.","typical_evidence":["Control matrix mapping risks to controls","Control design documentation"],"priority":"high"},{"id":"CC5.2","category":"Security","series":"CC5","series_name":"Control Activities","title":"Technology general controls","summary":"IT general controls cover the tech stack: access, changes, operations, and data backup for the systems that matter.","typical_evidence":["IT general controls policy","Backup and restore test logs","Job scheduling and operations procedures"],"priority":"high"},{"id":"CC5.3","category":"Security","series":"CC5","series_name":"Control Activities","title":"Policies deployed through procedures","summary":"Policies are not shelfware: they are deployed through real procedures, assigned owners, and followed in practice.","typical_evidence":["Information security policy suite","Procedure documents with owners","Policy exception log"],"priority":"high"},{"id":"CC6.1","category":"Security","series":"CC6","series_name":"Logical and Physical Access Controls","title":"System boundaries protected against unauthorized access","summary":"The logical boundary of the system is defined and defended: firewalls, network segmentation, and edge controls keep outsiders out.","typical_evidence":["Network diagrams","Firewall rule reviews","VPC and segmentation documentation"],"priority":"critical"},{"id":"CC6.2","category":"Security","series":"CC6","series_name":"Logical and Physical Access Controls","title":"Registration and authorization of new users","summary":"New users, both employees and external, are registered and their access authorized before they get in.","typical_evidence":["Access request and approval tickets","Onboarding checklist with access provisioning"],"priority":"critical"},{"id":"CC6.3","category":"Security","series":"CC6","series_name":"Logical and Physical Access Controls","title":"Timely removal of access for departing users","summary":"When people leave or change roles, their access is removed or adjusted promptly, not whenever someone remembers.","typical_evidence":["Offboarding checklist with access revocation","Termination tickets with timestamps","Periodic access review showing leavers removed"],"priority":"critical"},{"id":"CC6.4","category":"Security","series":"CC6","series_name":"Logical and Physical Access Controls","title":"Physical access restrictions","summary":"Physical access to facilities, data centers, and server rooms is restricted to authorized people.","typical_evidence":["Badge access logs","Data center SOC 2 report or attestation","Visitor logs"],"priority":"critical"},{"id":"CC6.5","category":"Security","series":"CC6","series_name":"Logical and Physical Access Controls","title":"Protection against unauthorized asset disposal","summary":"Hardware and media leaving the company are tracked and sanitized so data does not walk out the door.","typical_evidence":["Asset disposal records","Drive destruction certificates","Media sanitization log"],"priority":"critical"},{"id":"CC6.6","category":"Security","series":"CC6","series_name":"Logical and Physical Access Controls","title":"Role-based logical access and least privilege","summary":"Access follows roles and least privilege: people get the minimum access their job needs, enforced by the system.","typical_evidence":["Role-based access matrix","MFA enforcement evidence","Privileged access reviews"],"priority":"critical"},{"id":"CC6.7","category":"Security","series":"CC6","series_name":"Logical and Physical Access Controls","title":"Controls over data transmission and portable media","summary":"Data in transit is protected (encryption), and movement of data onto portable media or outside the boundary is restricted.","typical_evidence":["TLS configuration evidence","DLP or egress control records","Encryption-in-transit documentation"],"priority":"critical"},{"id":"CC6.8","category":"Security","series":"CC6","series_name":"Logical and Physical Access Controls","title":"Prevention of unauthorized software","summary":"Only approved software runs in the environment: unauthorized software is prevented or detected.","typical_evidence":["Approved software inventory","Endpoint protection console reports","Application allowlisting policy"],"priority":"critical"},{"id":"CC7.1","category":"Security","series":"CC7","series_name":"System Operations","title":"Vulnerability identification and remediation","summary":"Vulnerabilities are found (scanning, threat intel) and fixed on a risk-based timeline.","typical_evidence":["Vulnerability scan reports","Patch records with timelines","Threat intel subscription or feed"],"priority":"critical"},{"id":"CC7.2","category":"Security","series":"CC7","series_name":"System Operations","title":"Monitoring of system components","summary":"Infrastructure and software are monitored for anomalies: uptime, performance, and security signals.","typical_evidence":["SIEM or monitoring dashboards","Alerting rules and alert history","Log retention configuration"],"priority":"critical"},{"id":"CC7.3","category":"Security","series":"CC7","series_name":"System Operations","title":"Security event triage and evaluation","summary":"Anomalies get triaged: the company evaluates whether something is a real security event and how bad it is.","typical_evidence":["Triage procedures","Event tickets with severity classification","Escalation records"],"priority":"critical"},{"id":"CC7.4","category":"Security","series":"CC7","series_name":"System Operations","title":"Incident response","summary":"When a security event becomes an incident, the response plan kicks in: contain, eradicate, recover, learn.","typical_evidence":["Incident response plan","Tabletop exercise records","Past incident reports with lessons learned"],"priority":"critical"},{"id":"CC7.5","category":"Security","series":"CC7","series_name":"System Operations","title":"Corrective actions from monitoring","summary":"Monitoring findings turn into fixes: corrective actions are identified, tracked, and verified.","typical_evidence":["Corrective action log","Verification of fix effectiveness"],"priority":"critical"},{"id":"CC8.1","category":"Security","series":"CC8","series_name":"Change Management","title":"Controlled change management process","summary":"Changes to infrastructure, software, and procedures go through a controlled process: request, test, approve, implement, review.","typical_evidence":["Change tickets with approvals","Deployment pipeline with gates","Emergency change records"],"priority":"critical"},{"id":"CC9.1","category":"Security","series":"CC9","series_name":"Risk Mitigation","title":"Business disruption risk mitigation","summary":"Risks of business disruption are identified and mitigated: continuity and disaster recovery are planned, not improvised.","typical_evidence":["Business continuity plan","Disaster recovery plan","BIAs for critical processes"],"priority":"high"},{"id":"CC9.2","category":"Security","series":"CC9","series_name":"Risk Mitigation","title":"Vendor and business partner risk management","summary":"Vendors and partners with access to the system are risk-assessed, contracted with security commitments, and monitored.","typical_evidence":["Vendor risk assessments","Vendor list with criticality ratings","Vendor SOC 2 reports on file"],"priority":"critical"},{"id":"A1.1","category":"Availability","series":"A1","series_name":"Availability","title":"Capacity planning and monitoring","summary":"Capacity is planned and monitored so the system stays available under expected and peak demand.","typical_evidence":["Capacity plans and forecasts","Utilization monitoring and alerts","Load test results"],"priority":"high"},{"id":"A1.2","category":"Availability","series":"A1","series_name":"Availability","title":"Backup and recovery procedures","summary":"Backup and recovery procedures exist and are operated so the system can be restored after a failure.","typical_evidence":["Backup procedures and schedules","Backup success logs","Recovery runbooks"],"priority":"high"},{"id":"A1.3","category":"Availability","series":"A1","series_name":"Availability","title":"Recovery plan testing","summary":"Recovery plans are actually tested, not just written: tests prove restore works within committed timeframes.","typical_evidence":["Disaster recovery test plans and results","RTO and RPO measurements"],"priority":"high"},{"id":"PI1.1","category":"Processing Integrity","series":"PI1","series_name":"Processing Integrity","title":"Quality information for processing objectives","summary":"The company defines what good data looks like: data definitions, product specs, and quality requirements for processing.","typical_evidence":["Data dictionaries","Product and service specifications"],"priority":"high"},{"id":"PI1.2","category":"Processing Integrity","series":"PI1","series_name":"Processing Integrity","title":"Controls over system inputs","summary":"Inputs are checked for completeness and accuracy before processing: bad data gets caught at the door.","typical_evidence":["Input validation rules","Error and rejection logs","Reconciliation procedures"],"priority":"high"},{"id":"PI1.3","category":"Processing Integrity","series":"PI1","series_name":"Processing Integrity","title":"Controls over system processing","summary":"Processing itself is controlled: authorized, complete, accurate, and timely, with errors detected and corrected.","typical_evidence":["Processing controls documentation","Error detection and correction logs","Batch and transaction controls"],"priority":"high"},{"id":"PI1.4","category":"Processing Integrity","series":"PI1","series_name":"Processing Integrity","title":"Controls over system outputs","summary":"Outputs are complete, accurate, timely, protected, and delivered only to intended parties.","typical_evidence":["Output distribution controls","Output accuracy checks","Delivery logs"],"priority":"high"},{"id":"PI1.5","category":"Processing Integrity","series":"PI1","series_name":"Processing Integrity","title":"Controls over stored data","summary":"Data at rest, inputs in queue, and outputs awaiting delivery are stored completely, accurately, and protected.","typical_evidence":["Data storage procedures","Archive and retention controls","Storage integrity checks"],"priority":"high"},{"id":"C1.1","category":"Confidentiality","series":"C1","series_name":"Confidentiality","title":"Identification and protection of confidential information","summary":"Confidential information is identified when received or created, marked, and protected for its retention period.","typical_evidence":["Data classification policy","Confidential data inventory","Handling procedures"],"priority":"high"},{"id":"C1.2","category":"Confidentiality","series":"C1","series_name":"Confidentiality","title":"Disposal of confidential information","summary":"When retention ends, confidential information is destroyed in a way that prevents recovery.","typical_evidence":["Disposal procedures","Destruction certificates or logs"],"priority":"high"},{"id":"P1.1","category":"Privacy","series":"P","series_name":"Privacy","title":"Privacy notice to data subjects","summary":"People are told what you collect, why, and what their rights are, in clear language, before or when you collect it.","typical_evidence":["Published privacy notice","Notice version history","Evidence of notice delivery"],"priority":"high"},{"id":"P2.1","category":"Privacy","series":"P","series_name":"Privacy","title":"Choice and consent communication","summary":"Data subjects are told their choices about collection, use, and disclosure, and consent is obtained where required.","typical_evidence":["Consent records","Opt-in and opt-out mechanisms","Consent for new purposes"],"priority":"high"},{"id":"P3.1","category":"Privacy","series":"P","series_name":"Privacy","title":"Collection limited to stated objectives","summary":"Collection is limited to personal information needed for the stated privacy objectives, gathered fairly and lawfully.","typical_evidence":["Data minimization review","Collection method documentation"],"priority":"high"},{"id":"P3.2","category":"Privacy","series":"P","series_name":"Privacy","title":"Explicit consent before collecting sensitive information","summary":"For sensitive personal information, explicit consent is communicated, obtained, and documented before collection.","typical_evidence":["Sensitive data consent records","Consent documentation retention"],"priority":"high"},{"id":"P4.1","category":"Privacy","series":"P","series_name":"Privacy","title":"Use limited to identified purposes","summary":"Personal information is used only for the purposes it was collected for, unless law requires otherwise.","typical_evidence":["Purpose limitation review","New-use approval records"],"priority":"high"},{"id":"P4.2","category":"Privacy","series":"P","series_name":"Privacy","title":"Retention consistent with objectives","summary":"Personal information is kept no longer than needed for the stated purposes, and protected while retained.","typical_evidence":["Retention schedule","Retention enforcement evidence"],"priority":"high"},{"id":"P4.3","category":"Privacy","series":"P","series_name":"Privacy","title":"Secure disposal of personal information","summary":"When personal information is no longer needed, it is anonymized, disposed of, or destroyed so it cannot be recovered.","typical_evidence":["Disposal procedures","Deletion request log","Destruction verification"],"priority":"high"},{"id":"P5.1","category":"Privacy","series":"P","series_name":"Privacy","title":"Data subject access to personal information","summary":"Identified and authenticated individuals can see what personal information you hold about them and get a copy.","typical_evidence":["Access request log","Identity verification procedure","Response records"],"priority":"high"},{"id":"P5.2","category":"Privacy","series":"P","series_name":"Privacy","title":"Correction of personal information on request","summary":"People can correct their personal information, corrections flow to third parties who got the bad data, and denials are explained.","typical_evidence":["Correction request log","Third-party correction notices","Denial communications"],"priority":"high"},{"id":"P6.1","category":"Privacy","series":"P","series_name":"Privacy","title":"Third-party disclosure only with consent","summary":"Personal information goes to third parties only with consent, for the purposes collected, and only to parties with proper agreements.","typical_evidence":["Third-party disclosure log","Data processing agreements","Consent records for disclosures"],"priority":"high"},{"id":"P6.2","category":"Privacy","series":"P","series_name":"Privacy","title":"Records of authorized disclosures","summary":"A complete, accurate, timely record exists of every authorized disclosure of personal information.","typical_evidence":["Disclosure register","Reconciliation of disclosures"],"priority":"high"},{"id":"P6.3","category":"Privacy","series":"P","series_name":"Privacy","title":"Records of unauthorized disclosures and breaches","summary":"Detected or reported unauthorized disclosures, including breaches, are recorded completely, accurately, and promptly.","typical_evidence":["Breach register","Detection and reporting records"],"priority":"high"},{"id":"P6.4","category":"Privacy","series":"P","series_name":"Privacy","title":"Vendor privacy commitments and compliance checks","summary":"Vendors with access to personal information sign privacy commitments, and their compliance is checked periodically with corrective action when needed.","typical_evidence":["Vendor privacy addenda","Vendor compliance assessments","Corrective action records"],"priority":"high"},{"id":"P6.5","category":"Privacy","series":"P","series_name":"Privacy","title":"Vendor breach notification commitments","summary":"Vendors commit to notify you of actual or suspected unauthorized disclosures, and those notifications reach the right people fast.","typical_evidence":["Vendor notification clauses","Notification handling records"],"priority":"high"},{"id":"P6.6","category":"Privacy","series":"P","series_name":"Privacy","title":"Breach notification to data subjects and regulators","summary":"Breaches and incidents are notified to affected people, regulators, and others as required, through an established process.","typical_evidence":["Breach notification procedure","Notification records and timelines"],"priority":"high"},{"id":"P6.7","category":"Privacy","series":"P","series_name":"Privacy","title":"Accounting of disclosures on request","summary":"On request, data subjects get an accounting of the personal information held about them and who it was disclosed to.","typical_evidence":["Accounting request log","Response records"],"priority":"high"},{"id":"P7.1","category":"Privacy","series":"P","series_name":"Privacy","title":"Accuracy and completeness of personal information","summary":"Personal information collected and kept is accurate, up to date, complete, and relevant for its purpose.","typical_evidence":["Data quality checks","Accuracy review records"],"priority":"high"},{"id":"P8.1","category":"Privacy","series":"P","series_name":"Privacy","title":"Privacy inquiry and complaint handling","summary":"There is a real process for privacy questions, complaints, and disputes: intake, resolution, communication, and monitoring for repeat issues.","typical_evidence":["Complaint log with resolutions","Contact channel published in notice","Compliance monitoring records"],"priority":"high"}]};

/* ============================ pure logic ================================= */
const STATUSES = ["implemented", "partial", "not", "na"];
const STATUS_LABEL = { implemented: "Implemented", partial: "Partial", not: "Not implemented", na: "N/A" };

function statusValue(s) {
  if (s === "implemented") return 1;
  if (s === "partial") return 0.5;
  return 0;
}

function inScope(criterion, scope) {
  return !!scope[criterion.category];
}

function isApplicable(criterion, scope, statuses) {
  return inScope(criterion, scope) && (statuses[criterion.id] || "not") !== "na";
}

/* Returns { overall:{pct, earned, applicable}, byCategory:{}, bySeries:{}, gaps:[] }.
 * gaps: applicable, in-scope, status "not" or "partial", critical first then by id. */
function computeScore(criteria, scope, statuses) {
  const byCategory = {};
  const bySeries = {};
  const gaps = [];
  let earned = 0, applicable = 0;
  for (const c of criteria) {
    if (!inScope(c, scope)) continue;
    const st = statuses[c.id] || "not";
    if (st === "na") continue;
    const v = statusValue(st);
    earned += v; applicable += 1;
    if (!byCategory[c.category]) byCategory[c.category] = { earned: 0, applicable: 0 };
    byCategory[c.category].earned += v; byCategory[c.category].applicable += 1;
    const skey = c.series;
    if (!bySeries[skey]) bySeries[skey] = { name: c.series_name, earned: 0, applicable: 0 };
    bySeries[skey].earned += v; bySeries[skey].applicable += 1;
    if (st === "not" || st === "partial") {
      gaps.push({ id: c.id, title: c.title, summary: c.summary, priority: c.priority,
                  category: c.category, status: st });
    }
  }
  const pctOf = (e, a) => (a === 0 ? 0 : Math.round((e / a) * 1000) / 10);
  const out = {
    overall: { pct: pctOf(earned, applicable), earned: Math.round(earned * 10) / 10, applicable },
    byCategory: {}, bySeries: {}, gaps: []
  };
  for (const k of Object.keys(byCategory)) {
    const b = byCategory[k];
    out.byCategory[k] = { pct: pctOf(b.earned, b.applicable), earned: Math.round(b.earned * 10) / 10, applicable: b.applicable };
  }
  for (const k of Object.keys(bySeries)) {
    const b = bySeries[k];
    out.bySeries[k] = { name: b.name, pct: pctOf(b.earned, b.applicable), earned: Math.round(b.earned * 10) / 10, applicable: b.applicable };
  }
  const rank = { critical: 0, high: 1 };
  gaps.sort((a, b) => (rank[a.priority] - rank[b.priority]) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  out.gaps = gaps;
  return out;
}

function scopeLabel(scope) {
  return Object.keys(scope).filter(k => scope[k]).join(", ");
}

function reportDate(d) {
  const dt = d || new Date();
  return dt.toISOString().slice(0, 10);
}

function buildMarkdown(criteria, scope, statuses, score, company) {
  const lines = [];
  lines.push("# SOC 2 Readiness Report");
  lines.push("");
  lines.push("Company: " + (company || "(not named)"));
  lines.push("Date: " + reportDate());
  lines.push("Scope: " + scopeLabel(scope));
  lines.push("Framework: AICPA Trust Services Criteria, 2017 (TSP Section 100), 61 criteria");
  lines.push("");
  lines.push("> Readiness aid only. Not an audit, attestation, CPA opinion, or legal advice. " +
             "SOC 2 examinations are performed by licensed CPA firms.");
  lines.push("");
  lines.push("SOC 2 has no official numeric score. The percentages below estimate how much of " +
             "the in-scope criteria are implemented. Partial counts as half. N/A criteria are excluded.");
  lines.push("");
  lines.push("## Overall readiness: " + score.overall.pct + "%");
  lines.push("");
  lines.push("Implemented value " + score.overall.earned + " of " + score.overall.applicable + " applicable criteria.");
  lines.push("");
  lines.push("## By category");
  lines.push("");
  lines.push("| Category | Readiness | Implemented value | Applicable |");
  lines.push("| --- | --- | --- | --- |");
  for (const cat of Object.keys(score.byCategory)) {
    const b = score.byCategory[cat];
    lines.push("| " + cat + " | " + b.pct + "% | " + b.earned + " | " + b.applicable + " |");
  }
  lines.push("");
  lines.push("## By series");
  lines.push("");
  lines.push("| Series | Name | Readiness | Applicable |");
  lines.push("| --- | --- | --- | --- |");
  const seriesKeys = Object.keys(score.bySeries).sort();
  for (const k of seriesKeys) {
    const b = score.bySeries[k];
    lines.push("| " + k + " | " + b.name + " | " + b.pct + "% | " + b.applicable + " |");
  }
  lines.push("");
  lines.push("## Fix first: critical-priority gaps");
  lines.push("");
  const critical = score.gaps.filter(g => g.priority === "critical");
  const high = score.gaps.filter(g => g.priority === "high");
  if (critical.length === 0) lines.push("None. All critical-priority criteria are implemented.");
  for (const g of critical) {
    lines.push("- **" + g.id + "** " + g.title + " (" + STATUS_LABEL[g.status] + ")");
  }
  lines.push("");
  lines.push("## High-priority gaps");
  lines.push("");
  if (high.length === 0) lines.push("None.");
  for (const g of high) {
    lines.push("- **" + g.id + "** " + g.title + " (" + STATUS_LABEL[g.status] + ")");
  }
  lines.push("");
  lines.push("## All in-scope criteria");
  lines.push("");
  lines.push("| ID | Category | Title | Status | Priority |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const c of criteria) {
    if (!inScope(c, scope)) continue;
    const st = statuses[c.id] || "not";
    lines.push("| " + c.id + " | " + c.category + " | " + c.title + " | " + STATUS_LABEL[st] + " | " + c.priority + " |");
  }
  lines.push("");
  lines.push("Built by AI Tech Pros. Dataset: https://github.com/nehemiah313/tsc-dataset");
  return lines.join("\n");
}

function csvCell(v) {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function buildCSV(criteria, scope, statuses) {
  const rows = [["id", "category", "series", "series_name", "title", "status", "priority", "summary"]];
  for (const c of criteria) {
    if (!inScope(c, scope)) continue;
    rows.push([c.id, c.category, c.series, c.series_name, c.title,
               STATUS_LABEL[statuses[c.id] || "not"], c.priority, c.summary]);
  }
  return rows.map(r => r.map(csvCell).join(",")).join("\n");
}

/* ============================ browser app ================================ */
if (typeof document !== "undefined") {
  const LS_KEY = "soc2calc";
  const OPTIONAL = ["Availability", "Processing Integrity", "Confidentiality", "Privacy"];

  let state = { scope: { Security: true }, statuses: {}, company: "" };
  for (const c of OPTIONAL) state.scope[c] = false;

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s && typeof s === "object") {
        if (s.scope) for (const c of OPTIONAL) state.scope[c] = !!s.scope[c];
        state.scope.Security = true;
        if (s.statuses) state.statuses = s.statuses;
        if (typeof s.company === "string") state.company = s.company;
      }
    } catch (e) { /* corrupted storage: start fresh */ }
  }

  function saveState() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function renderScope() {
    const row = document.getElementById("scope-row");
    row.innerHTML = "";
    const mk = (name, locked) => {
      const label = el("label", "scope-chip" + (locked ? " locked" : ""));
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = !!state.scope[name];
      box.disabled = locked;
      box.setAttribute("aria-label", name + (locked ? " (always in scope)" : ""));
      box.addEventListener("change", () => {
        state.scope[name] = box.checked;
        saveState(); renderAll();
      });
      label.appendChild(box);
      label.appendChild(el("span", null, name));
      if (locked) label.appendChild(el("span", "lock", "always in scope"));
      return label;
    };
    row.appendChild(mk("Security", true));
    for (const c of OPTIONAL) row.appendChild(mk(c, false));
  }

  function renderDashboard() {
    const criteria = TSC.criteria;
    const score = computeScore(criteria, state.scope, state.statuses);
    document.getElementById("overall-pct").textContent = score.overall.pct + "%";
    document.getElementById("overall-fill").style.width = score.overall.pct + "%";
    document.getElementById("overall-detail").textContent =
      score.overall.earned + " of " + score.overall.applicable + " applicable criteria implemented (partial counts as half)";

    const bars = document.getElementById("cat-bars");
    bars.innerHTML = "";
    for (const cat of Object.keys(score.byCategory)) {
      const b = score.byCategory[cat];
      const wrap = el("div", "cat-bar");
      const lab = el("div", "cat-label");
      lab.appendChild(el("span", null, cat));
      lab.appendChild(el("span", null, b.pct + "%  (" + b.earned + "/" + b.applicable + ")"));
      const track = el("div", "cat-track");
      const fill = el("div", "cat-fill");
      fill.style.width = b.pct + "%";
      track.appendChild(fill);
      wrap.appendChild(lab); wrap.appendChild(track);
      bars.appendChild(wrap);
    }

    const tbody = document.querySelector("#series-table tbody");
    tbody.innerHTML = "";
    const seriesKeys = Object.keys(score.bySeries).sort();
    if (seriesKeys.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4; td.textContent = "No criteria in scope yet.";
      tr.appendChild(td); tbody.appendChild(tr);
    }
    for (const k of seriesKeys) {
      const b = score.bySeries[k];
      const tr = document.createElement("tr");
      tr.appendChild(el("td", null, k));
      tr.appendChild(el("td", null, b.name));
      tr.appendChild(el("td", null, b.earned + " / " + b.applicable));
      tr.appendChild(el("td", null, b.pct + "%"));
      tbody.appendChild(tr);
    }

    const crit = score.gaps.filter(g => g.priority === "critical");
    const high = score.gaps.filter(g => g.priority === "high");
    const critList = document.getElementById("critical-gaps");
    critList.innerHTML = "";
    if (crit.length === 0) {
      const li = document.createElement("li");
      li.textContent = "None. Every critical-priority criterion is marked implemented.";
      critList.appendChild(li);
    }
    for (const g of crit) critList.appendChild(gapItem(g));
    const highList = document.getElementById("high-gaps");
    highList.innerHTML = "";
    document.getElementById("high-gap-count").textContent = String(high.length);
    for (const g of high) highList.appendChild(gapItem(g));
  }

  function gapItem(g) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "linklike";
    btn.innerHTML = "";
    const idSpan = el("strong", "gap-id", g.id + " ");
    btn.appendChild(idSpan);
    btn.appendChild(document.createTextNode(g.title + " "));
    const st = el("span", "gap-status", "(" + STATUS_LABEL[g.status] + ", " + g.category + ")");
    li.appendChild(btn); li.appendChild(st);
    btn.addEventListener("click", () => {
      const anchor = document.getElementById("crit-" + g.id);
      if (!anchor) return;
      const group = anchor.closest(".series-group");
      if (group && !group.classList.contains("open")) group.classList.add("open");
      anchor.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return li;
  }

  function seriesOf(criterion) { return criterion.series; }

  function renderCriteria() {
    const host = document.getElementById("series-groups");
    host.innerHTML = "";
    const criteria = TSC.criteria;
    const order = [];
    const seen = {};
    for (const c of criteria) {
      if (!inScope(c, state.scope)) continue;
      if (!seen[c.series]) { seen[c.series] = true; order.push(c.series); }
    }
    const query = (document.getElementById("criterion-search").value || "").toLowerCase().trim();
    for (const skey of order) {
      const groupCriteria = criteria.filter(c => c.series === skey && inScope(c, state.scope));
      const visible = groupCriteria.filter(c => {
        if (!query) return true;
        return (c.id + " " + c.title + " " + c.summary).toLowerCase().indexOf(query) !== -1;
      });
      if (visible.length === 0) continue;
      const group = el("div", "series-group");
      const head = el("div", "series-head");
      head.setAttribute("role", "button");
      head.setAttribute("tabindex", "0");
      const h3 = el("h3", null, skey + ": " + groupCriteria[0].series_name);
      const prog = el("span", "series-progress");
      const done = groupCriteria.filter(c => (state.statuses[c.id] || "not") === "implemented").length;
      prog.textContent = done + "/" + groupCriteria.length + " implemented";
      head.appendChild(h3); head.appendChild(prog);
      const body = el("div", "series-body");
      for (const c of visible) body.appendChild(criterionCard(c));
      group.appendChild(head); group.appendChild(body);
      const toggle = () => group.classList.toggle("open");
      head.addEventListener("click", toggle);
      head.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
      if (query) group.classList.add("open");
      host.appendChild(group);
    }
    if (host.children.length === 0) {
      host.appendChild(el("p", "muted", "No criteria match your search."));
    }
  }

  function criterionCard(c) {
    const card = el("div", "criterion");
    card.id = "crit-" + c.id;
    const top = el("div", "crit-top");
    top.appendChild(el("span", "crit-id", c.id));
    top.appendChild(el("span", null, c.title));
    top.appendChild(el("span", "badge " + c.priority, c.priority));
    card.appendChild(top);
    card.appendChild(el("p", "crit-summary", c.summary));
    const det = document.createElement("details");
    det.className = "crit-evidence";
    const sum = document.createElement("summary");
    sum.textContent = "Typical evidence (" + c.typical_evidence.length + ")";
    det.appendChild(sum);
    const ul = document.createElement("ul");
    for (const e of c.typical_evidence) ul.appendChild(el("li", null, e));
    det.appendChild(ul);
    card.appendChild(det);
    const row = el("div", "status-row");
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", c.id + " status");
    const current = state.statuses[c.id] || "not";
    for (const s of STATUSES) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "status-btn"; b.dataset.status = s;
      b.textContent = STATUS_LABEL[s];
      b.setAttribute("aria-pressed", s === current ? "true" : "false");
      b.addEventListener("click", () => {
        state.statuses[c.id] = s;
        saveState();
        row.querySelectorAll(".status-btn").forEach(x =>
          x.setAttribute("aria-pressed", x.dataset.status === s ? "true" : "false"));
        renderDashboard();
        renderSeriesProgress();
      });
      row.appendChild(b);
    }
    card.appendChild(row);
    return card;
  }

  function renderSeriesProgress() {
    document.querySelectorAll(".series-group").forEach(group => {
      const cards = group.querySelectorAll(".criterion");
      let done = 0;
      cards.forEach(card => {
        const id = card.id.replace("crit-", "");
        if ((state.statuses[id] || "not") === "implemented") done += 1;
      });
      const prog = group.querySelector(".series-progress");
      if (prog) prog.textContent = done + "/" + cards.length + " implemented";
    });
  }

  function renderAll() {
    renderScope(); renderDashboard(); renderCriteria();
  }

  function currentScore() {
    return computeScore(TSC.criteria, state.scope, state.statuses);
  }

  function wire() {
    document.getElementById("company-name").value = state.company;
    document.getElementById("company-name").addEventListener("input", e => {
      state.company = e.target.value; saveState();
    });
    document.getElementById("criterion-search").addEventListener("input", renderCriteria);
    document.getElementById("expand-all").addEventListener("click", () =>
      document.querySelectorAll(".series-group").forEach(g => g.classList.add("open")));
    document.getElementById("collapse-all").addEventListener("click", () =>
      document.querySelectorAll(".series-group").forEach(g => g.classList.remove("open")));
    document.getElementById("export-md").addEventListener("click", () => {
      const md = buildMarkdown(TSC.criteria, state.scope, state.statuses, currentScore(), state.company);
      download("soc2-readiness-report-" + reportDate() + ".md", md, "text/markdown");
    });
    document.getElementById("export-csv").addEventListener("click", () => {
      const csv = buildCSV(TSC.criteria, state.scope, state.statuses);
      download("soc2-readiness-" + reportDate() + ".csv", csv, "text/csv");
    });
    const leadCapture = document.getElementById("lead-capture");
    if (!REPORT_INBOX) {
      leadCapture.hidden = true;
    } else {
      const savedLead = loadLead();
      if (savedLead && savedLead.email) {
        document.getElementById("lead-email").value = savedLead.email;
      }
      document.getElementById("lead-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const emailEl = document.getElementById("lead-email");
        const statusEl = document.getElementById("lead-status");
        const submitBtn = document.getElementById("lead-submit");
        const visitorEmail = emailEl.value.trim();
        if (!isValidEmail(visitorEmail)) {
          statusEl.textContent = "Enter a valid work email address.";
          emailEl.focus();
          return;
        }
        submitBtn.disabled = true;
        statusEl.textContent = "Sending your results...";
        const score = currentScore();
        const md = buildMarkdown(TSC.criteria, state.scope, state.statuses, score, state.company);
        try {
          const res = await fetch(leadEndpoint(REPORT_INBOX), {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(buildLeadPayload(state.company, visitorEmail, score, md))
          });
          if (!res.ok) throw new Error("lead post failed: " + res.status);
          saveLead({ email: visitorEmail });
          statusEl.textContent = "Sent. Watch your inbox: we will reply with your report and next steps.";
        } catch (err) {
          statusEl.textContent = "Could not send right now. Download your report above and try again later.";
        } finally {
          submitBtn.disabled = false;
        }
      });
    }
    document.getElementById("reset-all").addEventListener("click", () => {
      if (!window.confirm("Reset all answers and scope selections? This cannot be undone.")) return;
      state = { scope: { Security: true }, statuses: {}, company: "" };
      for (const c of OPTIONAL) state.scope[c] = false;
      document.getElementById("company-name").value = "";
      document.getElementById("criterion-search").value = "";
      saveState(); renderAll();
    });
  }

  loadState();
  renderScope();
  wire();
  renderDashboard();
  renderCriteria();
}
