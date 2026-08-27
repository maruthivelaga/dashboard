const bcrypt = require('bcryptjs');
const Team = require('./models/Team');
const Participant = require('./models/Participant');
const Submission = require('./models/Submission');
const Admin = require('./models/Admin');

const FIRST_NAMES = [
  "Rahul", "Priya", "Amit", "Sneha", "Karan", "Ananya", "Rohan", "Divya", "Siddharth", "Neha",
  "Aditya", "Vikram", "Shreya", "Abhishek", "Deepika", "Arjun", "Kriti", "Rajesh", "Sujata", "Vijay",
  "Aisha", "Varun", "Meera", "Sanjay", "Preeti", "Alok", "Pooja", "Sunil", "Geeta", "Ramesh",
  "Kiran", "Harish", "Swati", "Manoj", "Jyoti", "Karthik", "Ritu", "Anil", "Radha", "Nikhil",
  "Ashwin", "Devi", "Pranav", "Shruti", "Manish", "Komal", "Gaurav", "Vandana", "Tarun", "Nisha"
];

const LAST_NAMES = [
  "Kumar", "Sharma", "Nair", "Patel", "Reddy", "Singh", "Gupta", "Iyer", "Joshi", "Verma",
  "Rao", "Choudhury", "Das", "Mehta", "Sen", "Bose", "Mishra", "Pandey", "Chatterjee", "Roy",
  "Pillai", "Menon", "Saxena", "Kapoor", "Dubey", "Trivedi", "Banerjee", "Mukherjee", "Prasad", "Deshmukh",
  "Kulkarni", "Bhatt", "Shetty", "Naidu", "Subramanian", "Jha", "Pathak", "Gowda", "Desai", "Malhotra"
];

const AGENT_PROJECTS = [
  {
    name: "AgriMitra",
    problem: "Smallholder farmers in India lack real-time localized advisory for crop diseases, leading to up to 30% yield loss, and struggle with accessing current mandi prices.",
    target: "Marginal farmers, agricultural extension workers, and local mandi traders.",
    inputs: "Text descriptions of crop symptoms, images of infected leaves, and region name.",
    infoSources: "ICAR crop advisory databases, current regional weather APIs, and Agmarknet mandi price feeds.",
    decisions: "Diagnose disease severity, recommend organic or chemical treatments, suggest watering schedule adjustments, and identify the highest-paying local mandis.",
    tools: ["LLM", "RAG", "External API", "Web Search", "Computer Vision"],
    workflow: [
      { stepNumber: 1, stepTitle: "Receive Input", description: "Farmer uploads crop image and inputs locality name." },
      { stepNumber: 2, stepTitle: "Analyze leaf image", description: "Computer Vision tool parses the crop leaf for disease spots." },
      { stepNumber: 3, stepTitle: "Retrieve documentation", description: "RAG retrieves matching disease remedies from ICAR guidelines." },
      { stepNumber: 4, stepTitle: "Fetch mandi prices", description: "External API pulls current commodity prices for that crop in nearby mandis." },
      { stepNumber: 5, stepTitle: "Synthesize advice", description: "LLM merges the diagnosis and market data into a simple regional language summary." }
    ],
    result: "A text message and audio memo diagnosing the crop disease, listing exact remedy dosages, and showing nearby mandi price comparisons.",
    metrics: "Reduction in response time to crop failure signs, and accuracy of market price matches verified against government portals.",
    risks: "Hallucinated pesticide dosages could damage crops or soil health if LLM over-recommends chemical quantities.",
    oversight: "An expert agricultural officer flags and audits any high-toxicity pesticide recommendations before they are dispatched via SMS."
  },
  {
    name: "SvasthaCare",
    problem: "Rural healthcare centers (Primary Health Centres) have high patient-to-doctor ratios, causing long queues and delayed attention for critical symptoms.",
    target: "PHC nurse practitioners, community health workers (ASHAs), and triage staff.",
    inputs: "Patient vitals (heart rate, temperature, BP), current symptom description, and medical history notes.",
    infoSources: "WHO clinical triage protocols, past patient records database, and local pharmacy inventory catalogs.",
    decisions: "Determine patient triage level (Red/Emergency, Yellow/Urgent, Green/Standard) and draft initial clinical summary.",
    tools: ["LLM", "RAG", "Database"],
    workflow: [
      { stepNumber: 1, stepTitle: "Vitals check", description: "Nurse inputs patient vital signs and symptom description." },
      { stepNumber: 2, stepTitle: "Retrieve guidelines", description: "RAG queries WHO triage manual to match vital thresholds." },
      { stepNumber: 3, stepTitle: "Formulate priority", description: "Agent analyzes history and vital thresholds to assign triage color." },
      { stepNumber: 4, stepTitle: "Draft summary", description: "LLM writes a structured clinical memo for the doctor." }
    ],
    result: "A color-coded triage ticket with a summary of vitals, suspected risk level, and suggested immediate actions (e.g. administer paracetamol).",
    metrics: "Average time saved per patient intake and consistency of triage priority compared to senior doctor diagnoses.",
    risks: "Under-diagnosing a silent heart attack as generic indigestion.",
    oversight: "A resident nurse must review and physically sign off on every triage classification before the patient is routed."
  },
  {
    name: "Kautilya Finance",
    problem: "Retail investors struggle to rebalance portfolios dynamically during sudden market volatility, often panicking or making emotional trades.",
    target: "Middle-income retail investors and freelance wealth managers.",
    inputs: "User risk tolerance profile, current portfolio holding weights, and investable surplus.",
    infoSources: "Real-time stock price tickers, corporate quarterly reports, and macroeconomic news outlets.",
    decisions: "Recommend optimal asset allocation weight shifts and draft buy/sell orders.",
    tools: ["LLM", "REST API", "Database", "Authentication"],
    workflow: [
      { stepNumber: 1, stepTitle: "Fetch Portfolios", description: "Queries DB for user's current holdings and targets." },
      { stepNumber: 2, stepTitle: "Analyze Market Sentiment", description: "LLM scans news articles and tickers to assess market conditions." },
      { stepNumber: 3, stepTitle: "Calculate Allocations", description: "Rerun rebalancing formulas to calculate target buy/sell transactions." },
      { stepNumber: 4, stepTitle: "Generate Advice", description: "Provide detailed report with justification for each reallocation." }
    ],
    result: "A proposed portfolio trade list with percentage adjustments and a comprehensive risk report.",
    metrics: "Average portfolio return variance relative to index benchmark and user trust score.",
    risks: "Making high-frequency trading recommendations during high slippage, increasing transaction fee overhead.",
    oversight: "Users must manually authorize each individual transaction via OAuth token confirmation; the agent cannot trade autonomously."
  },
  {
    name: "Dharma Guard",
    problem: "Small scale businesses struggle to stay compliant with changing regional labor and tax laws, resulting in heavy fines.",
    target: "HR managers, SMB owners, and compliance auditors.",
    inputs: "Company HR policy manual (PDF) and local labor regulation amendment files.",
    infoSources: "State gazette publications, labor court judgments database, and national tax code tables.",
    decisions: "Identify clauses that violate current laws and recommend specific text updates.",
    tools: ["LLM", "RAG", "File Processing"],
    workflow: [
      { stepNumber: 1, stepTitle: "Upload Documents", description: "User uploads company policy PDFs." },
      { stepNumber: 2, stepTitle: "Extract Text", description: "File Processing tool parses the document layout and text." },
      { stepNumber: 3, stepTitle: "Search Regulations", description: "RAG queries government gazette updates for compliance limits." },
      { stepNumber: 4, stepTitle: "Clause Audit", description: "LLM compares policies and highlights conflicts with active regulations." }
    ],
    result: "A structured report highlighting non-compliant clauses, citing the exact regulation violated, and proposing rewritten text.",
    metrics: "Number of compliance errors identified prior to annual audit.",
    risks: "Giving false assurance of 100% compliance due to missing local state amendments in the database.",
    oversight: "A certified corporate legal advisor must verify all proposed policy changes before final adoption."
  },
  {
    name: "MahaVani",
    problem: "Gram Panchayat administrators struggle to communicate with regional departments due to language barriers and manual paperwork.",
    target: "Panchayat secretaries, rural citizens, and public relations officers.",
    inputs: "Voice message in local dialects (Marathi, Telugu, Hindi) describing civic grievances.",
    infoSources: "State scheme documents, government terminology vocabularies, and previous resolved templates.",
    decisions: "Transcribe audio, translate to official state language, and auto-populate formal grievance forms.",
    tools: ["LLM", "Speech", "REST API", "Database"],
    workflow: [
      { stepNumber: 1, stepTitle: "Audio Capture", description: "Citizen records their issue via mobile app." },
      { stepNumber: 2, stepTitle: "Transcription", description: "Speech-to-Text tool transcribes local dialect audio to text." },
      { stepNumber: 3, stepTitle: "Translate & Formalize", description: "LLM translates regional dialect text into official administrative English/Hindi." },
      { stepNumber: 4, stepTitle: "Form Population", description: "Agent fills out the department-specific ticket schema and saves to database." }
    ],
    result: "A fully completed digital grievance form with both original voice text, official translation, and categorization.",
    metrics: "Average time to log a complaint and satisfaction rates of non-English speaking citizens.",
    risks: "Mistranslating technical terms or names, resulting in wrong department assignments.",
    oversight: "A bilingual desk officer checks the translation summary before routing the ticket to state departments."
  }
];

// Helper to pick random elements
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomElements(arr, num) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

function generateRegistrationNo(yearNum, sectionStr, idx) {
  const yearCode = 26 - yearNum; // e.g. 4th year is 22, 3rd year is 23, 2nd is 24, 1st is 25
  const roll = String(idx).padStart(2, '0');
  return `${yearCode}A91A05${roll}`;
}

async function seedDatabase() {
  try {
    // 1. Seed Admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({
        username: 'admin',
        password: hashedPassword,
        name: 'Super Administrator'
      });
      console.log('Seeded admin account (admin / admin123).');
    }

    // Check if teams exist
    const teamCount = await Team.countDocuments();
    if (teamCount > 0) {
      console.log('Database already contains team data. Skipping seeding.');
      return;
    }

    console.log('Seeding mock hackathon database...');

    // Clear collections just in case
    await Team.deleteMany({});
    await Participant.deleteMany({});
    await Submission.deleteMany({});

    const totalTeamsCount = 42;
    const submittedCount = 38;
    const draftCount = 4;
    const underReviewTarget = 15;
    const shortlistedTarget = 8;
    const reviewedTarget = 15; // 38 - 15 - 8 = 15

    // We have 42 teams.
    // Index 0 to 3 -> Draft (4 teams)
    // Index 4 to 18 -> Under Review (15 teams)
    // Index 19 to 33 -> Reviewed (15 teams)
    // Index 34 to 41 -> Shortlisted (8 teams)

    const categories = ["Education", "Healthcare", "Finance", "Cybersecurity", "Productivity", "Automation", "Other"];
    const toolsPool = ["LLM", "RAG", "Database", "REST API", "Web Search", "Authentication", "External API", "File Processing", "Computer Vision", "Speech"];
    const yearsPool = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    const sectionsPool = ["A", "B", "C", "D"];

    let regCounter = 1;

    for (let i = 0; i < totalTeamsCount; i++) {
      // Generate unique Team Name
      let teamName = '';
      if (i < AGENT_PROJECTS.length) {
        teamName = `${AGENT_PROJECTS[i].name} Developers`;
      } else {
        const noun = getRandomElement(["Innovators", "Builders", "Coders", "Agents", "Synthetics", "Pioneers", "Architects", "Logicians", "Minds"]);
        teamName = `${getRandomElement(FIRST_NAMES)}'s ${noun}`;
      }

      // Ensure teamName is unique
      let dup = await Team.findOne({ name: teamName });
      if (dup) {
        teamName = `${teamName} ${i}`;
      }

      const teamYear = getRandomElement(yearsPool);
      const teamSection = getRandomElement(sectionsPool);
      const yearNum = parseInt(teamYear[0]); // e.g. 3

      // Generate 3 members
      const members = [];
      for (let m = 0; m < 3; m++) {
        const first = getRandomElement(FIRST_NAMES);
        const last = getRandomElement(LAST_NAMES);
        const regNo = generateRegistrationNo(yearNum, teamSection, regCounter++);
        members.push({
          registrationNo: regNo,
          name: `${first} ${last}`,
          year: teamYear,
          section: teamSection
        });
      }

      // Assign Status
      let status = 'Draft';
      if (i >= draftCount) {
        if (i < draftCount + underReviewTarget) {
          status = 'Under Review';
        } else if (i < draftCount + underReviewTarget + reviewedTarget) {
          status = 'Reviewed';
        } else {
          status = 'Shortlisted';
        }
      }

      // Determine Project details
      let projTemplate = AGENT_PROJECTS[i % AGENT_PROJECTS.length];
      let agentName = `${projTemplate.name} ${i >= AGENT_PROJECTS.length ? 'v2' : ''}`;
      
      let score = 0;
      let shortlisted = false;
      let reviewData = {};

      if (status === 'Reviewed' || status === 'Shortlisted') {
        const isShort = status === 'Shortlisted';
        const problemRelevance = isShort ? Math.floor(Math.random() * 2) + 9 : Math.floor(Math.random() * 4) + 6; // 9-10 or 6-9
        const agenticReasoning = isShort ? Math.floor(Math.random() * 2) + 9 : Math.floor(Math.random() * 4) + 6;
        const technicalFeasibility = isShort ? Math.floor(Math.random() * 2) + 9 : Math.floor(Math.random() * 4) + 5;
        const innovation = isShort ? Math.floor(Math.random() * 3) + 8 : Math.floor(Math.random() * 5) + 5;
        const usefulness = isShort ? Math.floor(Math.random() * 2) + 9 : Math.floor(Math.random() * 4) + 6;
        const humanOversight = Math.floor(Math.random() * 4) + 7; // 7-10
        const demoReadiness = isShort ? Math.floor(Math.random() * 2) + 9 : Math.floor(Math.random() * 4) + 6;

        const totalScore = problemRelevance + agenticReasoning + technicalFeasibility + innovation + usefulness + humanOversight + demoReadiness;
        const averageScore = Math.round((totalScore / 7) * 10) / 10;
        score = averageScore;
        shortlisted = isShort;

        reviewData = {
          problemRelevance,
          agenticReasoning,
          technicalFeasibility,
          innovation,
          usefulness,
          humanOversight,
          demoReadiness,
          totalScore,
          averageScore,
          reviewerComments: isShort 
            ? "Excellent demonstration of autonomous tool calling and safety fallback options. Exceeded criteria."
            : "Strong implementation, but workflow could include tighter human-in-the-loop triggers.",
          internalNotes: isShort ? "Highly recommended for final presentation." : "Good candidate, reserve pool.",
          shortlisted,
          reviewedAt: new Date()
        };
      }

      // Create Team record
      const teamDoc = await Team.create({
        name: teamName,
        members,
        year: teamYear,
        section: teamSection,
        agentName: status !== 'Draft' ? agentName : '',
        submissionStatus: status,
        score,
        shortlisted
      });

      // Create Participant records
      for (const member of members) {
        await Participant.create({
          registrationNo: member.registrationNo,
          name: member.name,
          teamId: teamDoc._id,
          teamName: teamDoc.name,
          year: member.year,
          section: member.section,
          agentName: status !== 'Draft' ? agentName : '',
          submissionStatus: status
        });
      }

      // Create Submission (only if status is not Draft, or if Draft contains some details)
      // We will create Submissions for drafts too, just with draft status!
      const subId = `AGX-2026-${String(1000 + i).padStart(4, '0')}`;
      
      const githubUser = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const githubUrl = status !== 'Draft' ? `https://github.com/${githubUser}/agent` : '';
      const demoUrl = status !== 'Draft' ? `https://agent-expo-demo.vercel.app/${githubUser}` : '';

      await Submission.create({
        submissionId: subId,
        teamId: teamDoc._id,
        teamName: teamDoc.name,
        members,
        agentName: status !== 'Draft' ? agentName : 'Draft Agent ' + (i + 1),
        category: status !== 'Draft' ? getRandomElement(categories) : 'Other',
        problemStatement: status !== 'Draft' ? projTemplate.problem : 'Draft problem statement.',
        targetUsers: status !== 'Draft' ? projTemplate.target : '',
        userInputs: status !== 'Draft' ? projTemplate.inputs : '',
        informationSources: status !== 'Draft' ? projTemplate.infoSources : '',
        decisions: status !== 'Draft' ? projTemplate.decisions : '',
        tools: status !== 'Draft' ? projTemplate.tools : [],
        workflowSteps: status !== 'Draft' ? projTemplate.workflow : [],
        expectedResult: status !== 'Draft' ? projTemplate.result : '',
        successMetrics: status !== 'Draft' ? projTemplate.metrics : '',
        risks: status !== 'Draft' ? projTemplate.risks : '',
        humanOversight: status !== 'Draft' ? projTemplate.oversight : '',
        githubUrl,
        demoUrl,
        status,
        review: (status === 'Reviewed' || status === 'Shortlisted') ? reviewData : {
          problemRelevance: 0,
          agenticReasoning: 0,
          technicalFeasibility: 0,
          innovation: 0,
          usefulness: 0,
          humanOversight: 0,
          demoReadiness: 0,
          totalScore: 0,
          averageScore: 0,
          reviewerComments: '',
          internalNotes: '',
          shortlisted: false
        }
      });
    }

    console.log('Seeded database successfully with mock hackathon details:');
    console.log(`- 42 Teams created.`);
    console.log(`- 126 Participants created.`);
    console.log(`- 38 Projects submitted (15 Under Review, 15 Reviewed, 8 Shortlisted).`);
    console.log(`- 4 Draft projects.`);
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

module.exports = seedDatabase;
