const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to make POST/GET/PUT requests
function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (data) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING BACKEND INTEGRATION TESTS ---');

  try {
    // 1. Admin login test
    console.log('\nTest 1: Admin Authentication...');
    const loginRes = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginRes.statusCode === 200 && loginRes.data.token) {
      console.log('✓ Admin login successful! Token received.');
    } else {
      console.log('✗ Admin login failed:', loginRes.statusCode, loginRes.data);
      process.exit(1);
    }
    
    const adminToken = loginRes.data.token;

    // 2. Draft save test
    console.log('\nTest 2: Autosave Draft Submission...');
    const draftRes = await request('POST', '/api/submissions/draft', {
      teamName: 'MahaDevs Test Team',
      members: [
        { registrationNo: '23A91A9999', name: 'Test Student 1', year: '3rd Year', section: 'C' }
      ],
      agentName: 'Test Draft Agent',
      category: 'Education'
    });

    let draftSubId = '';
    if (draftRes.statusCode === 200 && draftRes.data.submissionId) {
      draftSubId = draftRes.data.submissionId;
      console.log(`✓ Draft saved successfully. Submission ID generated: ${draftSubId}`);
    } else {
      console.log('✗ Draft save failed:', draftRes.statusCode, draftRes.data);
      process.exit(1);
    }

    // 3. Final submission test
    console.log('\nTest 3: Final Project Submission...');
    const submitRes = await request('POST', '/api/submissions/submit', {
      submissionId: draftSubId,
      teamName: 'MahaDevs Test Team',
      members: [
        { registrationNo: '23A91A9999', name: 'Test Student 1', year: '3rd Year', section: 'C' }
      ],
      agentName: 'MahaTutor: Adaptive Teaching Agent',
      category: 'Education',
      problemStatement: 'Students struggle with finding localized tutorial support for vocational engineering.',
      targetUsers: 'Vocational institute students',
      userInputs: 'Text prompt detailing homework questions',
      informationSources: 'National vocational curriculums',
      decisions: 'Decides math complexity levels and filters off-topic prompts',
      tools: ['LLM', 'RAG', 'Database'],
      workflowSteps: [
        { stepNumber: 1, stepTitle: 'Prompt Input', description: 'User enters a textbook question' },
        { stepNumber: 2, stepTitle: 'Verify curriculum', description: 'Agent matches it with syllabus details' },
        { stepNumber: 3, stepTitle: 'Synthesize solution', description: 'LLM outputs a step-by-step math proof' }
      ],
      expectedResult: 'A customized, audio-supported syllabus solution draft',
      successMetrics: 'Student retention rate improvement',
      risks: 'Math hallucination risks in calculus',
      humanOversight: 'Tutors review answers before final print',
      githubUrl: 'https://github.com/mahadavs/tutor',
      demoUrl: 'https://mahadavs-tutor.vercel.app'
    });

    if (submitRes.statusCode === 200 && submitRes.data.status === 'Submitted') {
      console.log('✓ Project submitted successfully!');
    } else {
      console.log('✗ Submission failed:', submitRes.statusCode, submitRes.data);
      process.exit(1);
    }

    // 4. Retrieve single project
    console.log('\nTest 4: Get Detailed Submission...');
    const getDetailRes = await request('GET', `/api/submissions/${draftSubId}`);
    if (getDetailRes.statusCode === 200 && getDetailRes.data.submissionId === draftSubId) {
      console.log('✓ Single submission details retrieved successfully.');
    } else {
      console.log('✗ Get detail failed:', getDetailRes.statusCode, getDetailRes.data);
      process.exit(1);
    }
    
    const dbRecordId = getDetailRes.data._id;

    // 5. Submit review evaluation test
    console.log('\nTest 5: Submit Evaluation Review...');
    const reviewRes = await request('PUT', `/api/submissions/${dbRecordId}/review`, {
      problemRelevance: 8,
      agenticReasoning: 9,
      technicalFeasibility: 7,
      innovation: 8,
      usefulness: 9,
      humanOversight: 9,
      demoReadiness: 8,
      reviewerComments: 'Solid execution and safety constraints. Impressive math agent.',
      internalNotes: 'Top 10 contender',
      shortlisted: true
    }, {
      'Authorization': `Bearer ${adminToken}`
    });

    if (reviewRes.statusCode === 200 && reviewRes.data.submission.status === 'Shortlisted') {
      console.log(`✓ Review saved successfully! Status updated to: ${reviewRes.data.submission.status}`);
      console.log(`  Calculated Average Score: ${reviewRes.data.submission.review.averageScore}`);
    } else {
      console.log('✗ Review save failed:', reviewRes.statusCode, reviewRes.data);
      process.exit(1);
    }

    // 6. Query submissions list with search and filters
    console.log('\nTest 6: Querying submissions with search and status filters...');
    const listRes = await request('GET', `/api/submissions?search=MahaTutor&status=Shortlisted`);
    if (listRes.statusCode === 200 && listRes.data.submissions.length > 0) {
      console.log(`✓ List query successful. Found ${listRes.data.submissions.length} matching entries.`);
      console.log(`  Team: ${listRes.data.submissions[0].teamName}`);
    } else {
      console.log('✗ List query failed:', listRes.statusCode, listRes.data);
      process.exit(1);
    }

    console.log('\n--- ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
    process.exit(0);

  } catch (err) {
    console.error('✗ Test suite crashed:', err);
    process.exit(1);
  }
}

// Give the database a moment to seed if needed, then execute
setTimeout(runTests, 1500);
