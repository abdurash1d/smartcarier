export type SkillProfile = {
  label: string;
  keywords: string[];
  technical: string[];
  soft: string[];
};

export const commonSkills: Readonly<{
  technical: string[];
  soft: string[];
}> = {
  technical: [
    "MS Excel",
    "Google Sheets",
    "Microsoft Office",
    "Email communication",
    "Report writing",
    "Data entry",
    "Document management",
    "Presentation skills",
    "CRM basics",
    "Task prioritization",
    "Internet research",
    "Time management tools",
  ],
  soft: [
    "Communication",
    "Teamwork",
    "Problem solving",
    "Time management",
    "Adaptability",
    "Attention to detail",
    "Critical thinking",
    "Responsibility",
    "Organization",
    "Customer focus",
  ],
};

export const skillProfiles: SkillProfile[] = [
  {
    label: "Software Developer",
    keywords: [
      "software developer",
      "software engineer",
      "full stack developer",
      "backend developer",
      "frontend developer",
      "programmer",
      "developer",
      "dasturchi",
      "veb dasturchi",
      "razrabotchik",
      "programmist",
      "it mutaxassis",
    ],
    technical: [
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "REST API",
      "SQL",
      "Git",
      "Docker",
      "Unit testing",
      "Debugging",
    ],
    soft: [
      "Analytical thinking",
      "Collaboration",
      "Problem solving",
      "Ownership",
      "Communication",
    ],
  },
  {
    label: "Mobile Developer",
    keywords: [
      "mobile developer",
      "android developer",
      "ios developer",
      "react native developer",
      "flutter developer",
      "mobil dasturchi",
      "android dasturchi",
      "ios dasturchi",
      "mobilnyy razrabotchik",
    ],
    technical: [
      "Kotlin",
      "Swift",
      "React Native",
      "Flutter",
      "Dart",
      "Firebase",
      "REST API",
      "Mobile UI",
      "App Store deployment",
      "Performance optimization",
    ],
    soft: ["Attention to detail", "User empathy", "Problem solving", "Communication", "Adaptability"],
  },
  {
    label: "DevOps Engineer",
    keywords: [
      "devops",
      "devops engineer",
      "site reliability engineer",
      "sre",
      "platform engineer",
      "infrastructure engineer",
      "devops mutaxassis",
      "inzhener devops",
    ],
    technical: [
      "Linux",
      "Docker",
      "Kubernetes",
      "CI/CD",
      "Terraform",
      "AWS",
      "Monitoring",
      "Shell scripting",
      "GitOps",
      "Infrastructure as code",
    ],
    soft: ["Incident management", "Collaboration", "Ownership", "Stress resilience", "Communication"],
  },
  {
    label: "QA Engineer",
    keywords: [
      "qa engineer",
      "qa tester",
      "software tester",
      "manual tester",
      "test engineer",
      "sifat nazorati",
      "tester",
      "testirovshchik",
      "kontrol kachestva",
    ],
    technical: [
      "Test case design",
      "Bug reporting",
      "Regression testing",
      "API testing",
      "Postman",
      "Selenium",
      "Jira",
      "SQL",
      "Test automation",
      "Performance testing",
    ],
    soft: ["Attention to detail", "Critical thinking", "Communication", "Persistence", "Time management"],
  },
  {
    label: "Data Analyst",
    keywords: [
      "data analyst",
      "business analyst",
      "analytics specialist",
      "data analytics",
      "analitik",
      "malumotlar tahlili",
      "biznes analitik",
      "analitik dannykh",
    ],
    technical: [
      "SQL",
      "Excel",
      "Power BI",
      "Tableau",
      "Data visualization",
      "Python",
      "Statistics",
      "Dashboarding",
      "Data cleaning",
      "Reporting",
    ],
    soft: ["Analytical thinking", "Storytelling", "Attention to detail", "Communication", "Business understanding"],
  },
  {
    label: "Data Scientist",
    keywords: [
      "data scientist",
      "machine learning engineer",
      "ml engineer",
      "ai engineer",
      "suniy intellekt",
      "data science",
      "data scientist mutaxassis",
      "spetsialist po dannym",
    ],
    technical: [
      "Python",
      "Pandas",
      "NumPy",
      "Scikit-learn",
      "Machine learning",
      "Deep learning",
      "SQL",
      "Feature engineering",
      "Model evaluation",
      "A/B testing",
    ],
    soft: ["Research mindset", "Critical thinking", "Communication", "Problem solving", "Curiosity"],
  },
  {
    label: "Accountant",
    keywords: [
      "accountant",
      "bookkeeper",
      "chief accountant",
      "buxgalter",
      "hisobchi",
      "glavnyy buxgalter",
      "finansovyy uchet",
    ],
    technical: [
      "Financial reporting",
      "General ledger",
      "Tax accounting",
      "Payroll",
      "Accounts payable",
      "Accounts receivable",
      "1C",
      "Excel",
      "Reconciliation",
      "Cost accounting",
    ],
    soft: ["Accuracy", "Integrity", "Time management", "Confidentiality", "Organization"],
  },
  {
    label: "Auditor",
    keywords: [
      "auditor",
      "internal auditor",
      "external auditor",
      "audit specialist",
      "auditor mutaxassis",
      "ichki auditor",
      "vnutrenniy auditor",
    ],
    technical: [
      "Audit planning",
      "Risk assessment",
      "Internal controls",
      "Compliance",
      "Financial statements",
      "Sampling techniques",
      "Excel",
      "Documentation",
      "Audit reporting",
      "IFRS",
    ],
    soft: ["Ethics", "Analytical thinking", "Attention to detail", "Objectivity", "Communication"],
  },
  {
    label: "Financial Analyst",
    keywords: [
      "financial analyst",
      "finance analyst",
      "investment analyst",
      "finans analitik",
      "moliyaviy analitik",
      "analitik finansov",
    ],
    technical: [
      "Financial modeling",
      "Budgeting",
      "Forecasting",
      "Variance analysis",
      "Excel advanced",
      "PowerPoint",
      "KPI tracking",
      "Valuation",
      "Scenario analysis",
      "SQL",
    ],
    soft: ["Analytical thinking", "Business acumen", "Presentation", "Accuracy", "Decision making"],
  },
  {
    label: "UI UX Designer",
    keywords: [
      "ui ux designer",
      "product designer",
      "ux designer",
      "ui designer",
      "dizayner interfeysa",
      "ux dizayner",
      "interfeys dizayneri",
      "web designer",
    ],
    technical: [
      "Figma",
      "Wireframing",
      "Prototyping",
      "User research",
      "Design systems",
      "Usability testing",
      "Information architecture",
      "Interaction design",
      "Accessibility",
      "Visual hierarchy",
    ],
    soft: ["Empathy", "Communication", "Creativity", "Collaboration", "Problem solving"],
  },
  {
    label: "Graphic Designer",
    keywords: [
      "graphic designer",
      "brand designer",
      "visual designer",
      "motion designer",
      "grafik dizayner",
      "graficheskiy dizayner",
      "dizayner grafiki",
    ],
    technical: [
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Adobe InDesign",
      "Brand identity",
      "Typography",
      "Layout design",
      "Social media creatives",
      "Print design",
      "Color theory",
      "Asset preparation",
    ],
    soft: ["Creativity", "Attention to detail", "Communication", "Time management", "Adaptability"],
  },
  {
    label: "Marketing Manager",
    keywords: [
      "marketing manager",
      "digital marketer",
      "marketing specialist",
      "marketolog",
      "marketing mutaxassis",
      "raqamli marketing",
      "marketolog specialist",
    ],
    technical: [
      "Market research",
      "Campaign management",
      "Content strategy",
      "Email marketing",
      "SEO",
      "Google Analytics",
      "Performance marketing",
      "Brand positioning",
      "Lead generation",
      "A/B testing",
    ],
    soft: ["Strategic thinking", "Creativity", "Communication", "Data-driven mindset", "Project coordination"],
  },
  {
    label: "SMM Specialist",
    keywords: [
      "smm specialist",
      "social media manager",
      "content manager",
      "sotsial media",
      "smm mutaxassis",
      "kontent menejer",
      "social media specialist",
    ],
    technical: [
      "Content planning",
      "Instagram marketing",
      "TikTok marketing",
      "Copywriting",
      "Canva",
      "Analytics reporting",
      "Community management",
      "Paid social ads",
      "Trend analysis",
      "Influencer collaboration",
    ],
    soft: ["Creativity", "Communication", "Adaptability", "Time management", "Audience empathy"],
  },
  {
    label: "Sales Manager",
    keywords: [
      "sales manager",
      "account executive",
      "sales specialist",
      "sales representative",
      "sotuv menejeri",
      "menedzher po prodazham",
      "prodazhi",
    ],
    technical: [
      "CRM",
      "Lead qualification",
      "Pipeline management",
      "Negotiation",
      "Sales forecasting",
      "Client presentations",
      "Objection handling",
      "Proposal writing",
      "Prospecting",
      "Upselling",
    ],
    soft: ["Persuasion", "Relationship building", "Resilience", "Communication", "Result orientation"],
  },
  {
    label: "Business Development Manager",
    keywords: [
      "business development",
      "bizdev",
      "partnership manager",
      "growth manager",
      "biznes rivojlantirish",
      "menedzher po razvitiyu biznesa",
      "bdm",
    ],
    technical: [
      "Market mapping",
      "Partnership strategy",
      "Lead generation",
      "Negotiation",
      "Deal structuring",
      "CRM",
      "Competitive analysis",
      "Proposal development",
      "Revenue planning",
      "Stakeholder management",
    ],
    soft: ["Strategic thinking", "Communication", "Networking", "Initiative", "Adaptability"],
  },
  {
    label: "Recruiter HR Specialist",
    keywords: [
      "recruiter",
      "hr specialist",
      "talent acquisition",
      "human resources",
      "kadrlar boi limi",
      "hr mutaxassis",
      "rekruter",
      "kadrovik",
    ],
    technical: [
      "Candidate sourcing",
      "Interviewing",
      "ATS",
      "Job description writing",
      "Onboarding",
      "Employer branding",
      "HR documentation",
      "Labor law basics",
      "Performance review process",
      "Compensation benchmarking",
    ],
    soft: ["Communication", "Empathy", "Confidentiality", "Negotiation", "Organization"],
  },
  {
    label: "Project Manager",
    keywords: [
      "project manager",
      "pm",
      "delivery manager",
      "project coordinator",
      "loyiha menejeri",
      "menedzher proektov",
      "project lead",
    ],
    technical: [
      "Project planning",
      "Risk management",
      "Budget control",
      "Scope management",
      "Agile",
      "Scrum",
      "Stakeholder reporting",
      "Jira",
      "Roadmap planning",
      "Resource allocation",
    ],
    soft: ["Leadership", "Communication", "Organization", "Conflict resolution", "Decision making"],
  },
  {
    label: "Product Manager",
    keywords: [
      "product manager",
      "product owner",
      "product lead",
      "prodakt menejer",
      "mahsulot menejeri",
      "menedzher produkta",
      "po",
    ],
    technical: [
      "Product strategy",
      "Roadmapping",
      "User stories",
      "Prioritization",
      "Market research",
      "A/B testing",
      "Analytics",
      "Go to market",
      "Backlog management",
      "Requirements definition",
    ],
    soft: ["Strategic thinking", "Communication", "Leadership", "Customer empathy", "Decision making"],
  },
  {
    label: "Operations Manager",
    keywords: [
      "operations manager",
      "operations specialist",
      "process manager",
      "operatsionnyy menedzher",
      "operatsiyalar menejeri",
      "biznes operatsiyalari",
    ],
    technical: [
      "Process optimization",
      "SOP development",
      "KPI management",
      "Resource planning",
      "Cross functional coordination",
      "Excel",
      "Workflow mapping",
      "Vendor management",
      "Cost optimization",
      "Reporting",
    ],
    soft: ["Organization", "Leadership", "Problem solving", "Communication", "Accountability"],
  },
  {
    label: "Customer Support Specialist",
    keywords: [
      "customer support",
      "support specialist",
      "call center",
      "customer service",
      "mijozlar bilan ishlash",
      "podderzhka klientov",
      "operator",
    ],
    technical: [
      "Ticketing systems",
      "CRM",
      "Live chat support",
      "Email support",
      "Knowledge base management",
      "Issue troubleshooting",
      "Escalation handling",
      "Service level management",
      "Call handling",
      "Product documentation",
    ],
    soft: ["Patience", "Empathy", "Communication", "Conflict resolution", "Stress resilience"],
  },
  {
    label: "Teacher",
    keywords: [
      "teacher",
      "educator",
      "tutor",
      "instructor",
      "oqituvchi",
      "muallim",
      "prepodavatel",
      "uchitel",
    ],
    technical: [
      "Lesson planning",
      "Curriculum development",
      "Classroom management",
      "Assessment design",
      "Online teaching tools",
      "Presentation skills",
      "Student progress tracking",
      "Educational technology",
      "Learning strategies",
      "Academic reporting",
    ],
    soft: ["Communication", "Patience", "Empathy", "Adaptability", "Organization"],
  },
  {
    label: "Translator",
    keywords: [
      "translator",
      "interpreter",
      "localization specialist",
      "tarjimon",
      "perevodchik",
      "lingvist",
      "language specialist",
    ],
    technical: [
      "Written translation",
      "Simultaneous interpretation",
      "CAT tools",
      "Terminology management",
      "Proofreading",
      "Localization QA",
      "Style guide compliance",
      "Subtitling",
      "Editing",
      "Language quality review",
    ],
    soft: ["Attention to detail", "Communication", "Cultural awareness", "Time management", "Confidentiality"],
  },
  {
    label: "Lawyer",
    keywords: [
      "lawyer",
      "legal counsel",
      "attorney",
      "yurist",
      "advokat",
      "yuridik maslahatchi",
      "pravoved",
    ],
    technical: [
      "Legal research",
      "Contract drafting",
      "Compliance",
      "Case analysis",
      "Regulatory review",
      "Negotiation",
      "Legal writing",
      "Corporate law basics",
      "Risk assessment",
      "Client consultation",
    ],
    soft: ["Critical thinking", "Ethics", "Communication", "Negotiation", "Attention to detail"],
  },
  {
    label: "Procurement Specialist",
    keywords: [
      "procurement specialist",
      "purchasing manager",
      "buyer",
      "supply specialist",
      "xarid mutaxassisi",
      "zakupki",
      "spetsialist po zakupkam",
    ],
    technical: [
      "Vendor sourcing",
      "RFQ management",
      "Contract negotiation",
      "Cost analysis",
      "Purchase order management",
      "Supplier evaluation",
      "Inventory coordination",
      "ERP basics",
      "Compliance documentation",
      "Spend reporting",
    ],
    soft: ["Negotiation", "Analytical thinking", "Communication", "Attention to detail", "Organization"],
  },
  {
    label: "Logistics Specialist",
    keywords: [
      "logistics specialist",
      "supply chain specialist",
      "warehouse coordinator",
      "transport manager",
      "logistika mutaxassisi",
      "logist",
      "spetsialist logistiki",
    ],
    technical: [
      "Route planning",
      "Shipment tracking",
      "Inventory management",
      "Warehouse operations",
      "Customs documentation",
      "TMS systems",
      "Cost optimization",
      "Supplier coordination",
      "Delivery scheduling",
      "Excel",
    ],
    soft: ["Organization", "Problem solving", "Communication", "Stress resilience", "Attention to detail"],
  },
  {
    label: "Administrative Assistant",
    keywords: [
      "administrative assistant",
      "office manager",
      "executive assistant",
      "administrator",
      "ofis menejeri",
      "administrator ofisa",
      "yordamchi",
    ],
    technical: [
      "Calendar management",
      "Document preparation",
      "Email management",
      "Travel coordination",
      "Meeting coordination",
      "MS Office",
      "Data entry",
      "Record keeping",
      "Office operations",
      "Correspondence",
    ],
    soft: ["Organization", "Communication", "Time management", "Discretion", "Multitasking"],
  },
  {
    label: "Doctor",
    keywords: [
      "doctor",
      "physician",
      "medical doctor",
      "vrach",
      "shifokor",
      "terapevt",
      "klinicheskiy vrach",
    ],
    technical: [
      "Patient assessment",
      "Diagnosis",
      "Treatment planning",
      "Clinical documentation",
      "Medical ethics",
      "Electronic health records",
      "Emergency response",
      "Preventive care",
      "Patient education",
      "Interdisciplinary coordination",
    ],
    soft: ["Empathy", "Communication", "Decision making", "Stress resilience", "Attention to detail"],
  },
  {
    label: "Nurse",
    keywords: [
      "nurse",
      "registered nurse",
      "clinical nurse",
      "medsestra",
      "hamshira",
      "meditsinskaya sestra",
    ],
    technical: [
      "Patient care",
      "Vital signs monitoring",
      "Medication administration",
      "Clinical documentation",
      "Infection control",
      "Emergency support",
      "Care planning",
      "Electronic health records",
      "Patient education",
      "Team coordination",
    ],
    soft: ["Empathy", "Patience", "Communication", "Attention to detail", "Stress resilience"],
  },
  {
    label: "Business Analyst",
    keywords: [
      "business analyst",
      "systems analyst",
      "process analyst",
      "biznes analitik",
      "analitik biznesa",
      "talablar analitigi",
    ],
    technical: [
      "Requirements gathering",
      "Process mapping",
      "Stakeholder interviews",
      "User stories",
      "SQL",
      "Documentation",
      "Gap analysis",
      "Acceptance criteria",
      "BPMN",
      "Backlog refinement",
    ],
    soft: ["Communication", "Analytical thinking", "Facilitation", "Problem solving", "Organization"],
  },
  {
    label: "Content Writer",
    keywords: [
      "content writer",
      "copywriter",
      "editor",
      "content creator",
      "matn yozuvchi",
      "kopirayter",
      "kontent avtor",
    ],
    technical: [
      "Copywriting",
      "SEO writing",
      "Editing",
      "Research",
      "Content planning",
      "CMS",
      "Tone of voice",
      "Proofreading",
      "Social media copy",
      "Email copy",
    ],
    soft: ["Creativity", "Communication", "Attention to detail", "Time management", "Curiosity"],
  },
  {
    label: "Cybersecurity Specialist",
    keywords: [
      "cybersecurity specialist",
      "security analyst",
      "information security",
      "soc analyst",
      "kiberxavfsizlik",
      "spetsialist po bezopasnosti",
      "infosec",
    ],
    technical: [
      "SIEM",
      "Incident response",
      "Vulnerability assessment",
      "Network security",
      "Access control",
      "Threat analysis",
      "Security policies",
      "Penetration testing basics",
      "Endpoint security",
      "Risk management",
    ],
    soft: ["Analytical thinking", "Attention to detail", "Integrity", "Communication", "Calm under pressure"],
  },
  {
    label: "System Administrator",
    keywords: [
      "system administrator",
      "sysadmin",
      "it administrator",
      "network administrator",
      "tizim administratori",
      "sistemnyy administrator",
    ],
    technical: [
      "Windows Server",
      "Linux administration",
      "Network configuration",
      "Active Directory",
      "Backup and recovery",
      "User access management",
      "Hardware troubleshooting",
      "Virtualization",
      "Monitoring tools",
      "Security patching",
    ],
    soft: ["Problem solving", "Responsibility", "Communication", "Time management", "Service mindset"],
  },
];

const PROFILE_MATCH_THRESHOLD = 1;

const CYRILLIC_TO_LATIN: Readonly<Record<string, string>> = {
  "\u0430": "a",
  "\u0431": "b",
  "\u0432": "v",
  "\u0433": "g",
  "\u0434": "d",
  "\u0435": "e",
  "\u0451": "e",
  "\u0436": "zh",
  "\u0437": "z",
  "\u0438": "i",
  "\u0439": "y",
  "\u043a": "k",
  "\u043b": "l",
  "\u043c": "m",
  "\u043d": "n",
  "\u043e": "o",
  "\u043f": "p",
  "\u0440": "r",
  "\u0441": "s",
  "\u0442": "t",
  "\u0443": "u",
  "\u0444": "f",
  "\u0445": "kh",
  "\u0446": "ts",
  "\u0447": "ch",
  "\u0448": "sh",
  "\u0449": "shch",
  "\u044a": "",
  "\u044b": "y",
  "\u044c": "",
  "\u044d": "e",
  "\u044e": "yu",
  "\u044f": "ya",
  "\u045e": "u",
  "\u049b": "q",
  "\u0493": "g",
  "\u04b3": "h",
  "\u045b": "q",
  "\u0453": "g",
  "\u04b2": "h",
};

const profileKeywordIndex: ReadonlyArray<{ profile: SkillProfile; normalizedKeywords: string[] }> =
  skillProfiles.map((profile) => ({
    profile,
    normalizedKeywords: profile.keywords.map((keyword) => normalizeText(keyword)).filter(Boolean),
  }));

export function normalizeText(value: string): string {
  const lowercase = value.toLowerCase();
  const transliterated = Array.from(lowercase)
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['`]/g, "");

  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function uniqueSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const skill of skills) {
    const clean = skill.trim();
    if (!clean) {
      continue;
    }

    const normalized = normalizeText(clean);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(clean);
  }

  return result;
}

function scoreProfile(normalizedInput: string, normalizedKeywords: string[]): number {
  let score = 0;

  for (const keyword of normalizedKeywords) {
    if (!keyword) {
      continue;
    }

    if (normalizedInput.includes(keyword)) {
      score += 1;
    }
  }

  return score;
}

export function detectSkillProfile(input: string): SkillProfile | null {
  const normalizedInput = normalizeText(input);
  if (!normalizedInput) {
    return null;
  }

  let bestProfile: SkillProfile | null = null;
  let bestScore = 0;

  for (const entry of profileKeywordIndex) {
    const score = scoreProfile(normalizedInput, entry.normalizedKeywords);
    if (score > bestScore) {
      bestScore = score;
      bestProfile = entry.profile;
    }
  }

  if (bestScore < PROFILE_MATCH_THRESHOLD) {
    return null;
  }

  return bestProfile;
}

export function getSkillSuggestions(
  input: string,
  selectedTechnical: string[],
  selectedSoft: string[]
): {
  profile: SkillProfile | null;
  technical: string[];
  soft: string[];
} {
  const profile = detectSkillProfile(input);
  const selectedTechnicalSet = new Set(
    selectedTechnical.map((skill) => normalizeText(skill)).filter(Boolean)
  );
  const selectedSoftSet = new Set(
    selectedSoft.map((skill) => normalizeText(skill)).filter(Boolean)
  );

  const technicalPool = [...(profile?.technical ?? []), ...commonSkills.technical];
  const softPool = [...(profile?.soft ?? []), ...commonSkills.soft];

  const technicalSuggestions = uniqueSkills(technicalPool).filter(
    (skill) => !selectedTechnicalSet.has(normalizeText(skill))
  );
  const softSuggestions = uniqueSkills(softPool).filter(
    (skill) => !selectedSoftSet.has(normalizeText(skill))
  );

  return {
    profile,
    technical: technicalSuggestions.slice(0, 12),
    soft: softSuggestions,
  };
}
