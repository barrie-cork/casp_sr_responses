/**
 * Google Apps Script - CASP SR Response Viewer Backend
 *
 * This script serves as the backend API for the CASP Systematic Reviews Response Viewer.
 * It reads data from Google Sheets and returns JSON responses.
 *
 * DEPLOYMENT:
 * 1. Open your Google Sheet with SR form responses
 * 2. Extensions → Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Click Deploy → New Deployment
 * 5. Type: Web App, Execute as: Me, Access: Anyone
 * 6. Copy the Web App URL to config.js
 */

// Configuration - Update sheet names if different
const SHEET_NAMES = {
  RESPONSES: 'Form Responses 1',  // Default name from Google Forms
  VOTES: 'Votes'                   // Create this sheet manually
};

// SR Form Structure - 10 questions with column mappings
// Columns in Google Sheets (0-indexed):
// 0: Timestamp, 1: Name, 2: Paper Title, 3: Author, 4: DOI/URL, 5: Date
// 6-7: Q1 (answer, justification)
// 8-9: Q2 (answer, justification)
// ... continues for all 10 questions
// 26-28: Summary fields

const QUESTION_PAIRS = [
  {
    questionText: "1. Did the review address a clearly focused question?",
    answerColumn: 6,
    explanationColumn: 7,
    considerPrompt: `CONSIDER WHETHER:
• Did the researchers state a research question?
• For a systematic review, a research question can be 'formulated' in terms of the PECO framework:
  - Population
  - Exposure/Risk factor
  - Comparator/Controls
  - Outcome/s or Event/s`
  },
  {
    questionText: "2. Did the authors look for the right type of papers?",
    answerColumn: 8,
    explanationColumn: 9,
    considerPrompt: `CONSIDER WHETHER the best sort of studies would:
• Address the review's question
• Have an appropriate study design (usually RCTs for papers evaluating interventions)`
  },
  {
    questionText: "3. Do you think all the important, relevant studies were included?",
    answerColumn: 10,
    explanationColumn: 11,
    considerPrompt: `CONSIDER WHETHER:
• Which bibliographic databases were used
• Follow up from reference lists
• Personal contact with experts
• Unpublished as well as published studies
• Non-English language studies`
  },
  {
    questionText: "4. Did the review's authors do enough to assess quality of the included studies?",
    answerColumn: 12,
    explanationColumn: 13,
    considerPrompt: `CONSIDER WHETHER:
The authors need to consider the rigour of the studies they have identified. Lack of rigour may affect the studies' results.
("All that glisters is not gold" - Merchant of Venice, Act II Scene 7)`
  },
  {
    questionText: "5. If the results of the review have been combined, was it reasonable to do so?",
    answerColumn: 14,
    explanationColumn: 15,
    considerPrompt: `CONSIDER WHETHER:
• Results were similar from study to study
• Results of all the included studies are clearly displayed
• Results of different studies are similar
• Reasons for any variations in results are discussed`
  },
  {
    questionText: "6. What are the overall results of the review?",
    answerColumn: 16,
    explanationColumn: 17,
    considerPrompt: `CONSIDER WHETHER:
• If you are clear about the review's 'bottom line' results
• What these are (numerically if appropriate)
• How were the results expressed (NNT, odds ratio etc.)`
  },
  {
    questionText: "7. How precise are the results?",
    answerColumn: 18,
    explanationColumn: 19,
    considerPrompt: `CONSIDER WHETHER:
Look at the confidence intervals, if given`
  },
  {
    questionText: "8. Can the results be applied to the local population?",
    answerColumn: 20,
    explanationColumn: 21,
    considerPrompt: `CONSIDER WHETHER:
• The patients covered by the review could be sufficiently different to your population to cause concern
• Your local setting is likely to differ much from that of the review`
  },
  {
    questionText: "9. Were all important outcomes considered?",
    answerColumn: 22,
    explanationColumn: 23,
    considerPrompt: `CONSIDER WHETHER:
There is other information you would like to have seen`
  },
  {
    questionText: "10. Are the benefits worth the harms and costs?",
    answerColumn: 24,
    explanationColumn: 25,
    considerPrompt: `CONSIDER WHETHER:
Even if this is not addressed by the review, what do you think?`
  }
];

// Summary field columns (after all Q&A pairs)
const SUMMARY_COLUMNS = {
  POSITIVE: 26,
  NEGATIVE: 27,
  UNKNOWNS: 28
};

/**
 * Main entry point for GET requests
 * Handles different actions based on query parameters
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getResponses';

    switch(action) {
      case 'getResponses':
        return ContentService.createTextOutput(JSON.stringify(getResponses()))
          .setMimeType(ContentService.MimeType.JSON);

      case 'recordVote':
        const questionIndex = parseInt(e.parameter.questionIndex);
        const studentRowIndex = parseInt(e.parameter.studentRowIndex);
        return ContentService.createTextOutput(JSON.stringify(recordVote(questionIndex, studentRowIndex)))
          .setMimeType(ContentService.MimeType.JSON);

      case 'getVotes':
        return ContentService.createTextOutput(JSON.stringify(getVotes()))
          .setMimeType(ContentService.MimeType.JSON);

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all form responses organized by question
 */
function getResponses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.RESPONSES);

  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAMES.RESPONSES}" not found`);
  }

  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    return { questions: [], totalStudents: 0 };
  }

  // Skip header row
  const responses = data.slice(1);

  // Structure data by question
  const questions = QUESTION_PAIRS.map((questionPair, qIndex) => {
    const questionResponses = [];

    responses.forEach((row, rowIndex) => {
      // Skip if no answer for this question
      if (!row[questionPair.answerColumn]) {
        return;
      }

      questionResponses.push({
        studentName: anonymizeStudent(row[1], rowIndex),
        studentRowIndex: rowIndex,
        answer: row[questionPair.answerColumn],
        explanation: row[questionPair.explanationColumn] || '',
        paperTitle: row[2] || '',
        author: row[3] || '',
        date: row[5] || ''
      });
    });

    return {
      questionIndex: qIndex,
      questionText: questionPair.questionText,
      considerPrompt: questionPair.considerPrompt,
      responses: questionResponses
    };
  });

  // Add summary data
  const summaryData = responses.map((row, rowIndex) => ({
    studentName: anonymizeStudent(row[1], rowIndex),
    positive: row[SUMMARY_COLUMNS.POSITIVE] || '',
    negative: row[SUMMARY_COLUMNS.NEGATIVE] || '',
    unknowns: row[SUMMARY_COLUMNS.UNKNOWNS] || ''
  }));

  return {
    questions: questions,
    totalStudents: responses.length,
    summaryData: summaryData,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Anonymize student names for privacy
 */
function anonymizeStudent(name, index) {
  // You can customize this logic
  // Option 1: Use "Student N" format
  return `Student ${index + 1}`;

  // Option 2: Use initials
  // if (name) {
  //   const parts = name.trim().split(' ');
  //   return parts.map(p => p[0]).join('') + (index + 1);
  // }
  // return `Student ${index + 1}`;

  // Option 3: Return actual name (only if privacy is not a concern)
  // return name || `Student ${index + 1}`;
}

/**
 * Get all votes from the Votes sheet
 */
function getVotes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let votesSheet = ss.getSheetByName(SHEET_NAMES.VOTES);

  // Create Votes sheet if it doesn't exist
  if (!votesSheet) {
    votesSheet = ss.insertSheet(SHEET_NAMES.VOTES);
    votesSheet.getRange(1, 1, 1, 3).setValues([['Timestamp', 'QuestionIndex', 'StudentRowIndex']]);
    votesSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  }

  const data = votesSheet.getDataRange().getValues();

  if (data.length < 2) {
    return { votes: [] };
  }

  // Skip header row
  const votes = data.slice(1).map(row => ({
    timestamp: row[0],
    questionIndex: row[1],
    studentRowIndex: row[2]
  }));

  return { votes: votes };
}

/**
 * Record a vote for a specific response
 */
function recordVote(questionIndex, studentRowIndex) {
  if (isNaN(questionIndex) || isNaN(studentRowIndex)) {
    return { error: 'Invalid parameters' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let votesSheet = ss.getSheetByName(SHEET_NAMES.VOTES);

  // Create Votes sheet if it doesn't exist
  if (!votesSheet) {
    votesSheet = ss.insertSheet(SHEET_NAMES.VOTES);
    votesSheet.getRange(1, 1, 1, 3).setValues([['Timestamp', 'QuestionIndex', 'StudentRowIndex']]);
    votesSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  }

  // Add vote record
  votesSheet.appendRow([new Date(), questionIndex, studentRowIndex]);

  return { success: true, message: 'Vote recorded' };
}

/**
 * Utility function to test the script
 */
function testGetResponses() {
  const result = getResponses();
  console.log(JSON.stringify(result, null, 2));
  console.log(`Total questions: ${result.questions.length}`);
  console.log(`Total students: ${result.totalStudents}`);
}