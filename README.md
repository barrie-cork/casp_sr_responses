# CASP Systematic Reviews Response Viewer

A web-based viewer for displaying and analyzing student responses to CASP Systematic Reviews Critical Appraisal questions. Features voting, statistics, and real-time updates.

## Features

- 📊 **10 SR Questions**: Navigate through all CASP SR questions
- 👍 **One-Vote-Per-Person**: Uses browser localStorage (no login required)
- 📈 **Statistics Dashboard**: Answer distribution, top voted, uncertainty analysis
- 🔄 **Real-time Updates**: Auto-refresh every 30 seconds
- 📱 **Responsive Design**: Works on projectors and mobile devices
- 🔒 **Privacy**: Student names anonymized to "Student N"

## Quick Start (5 minutes)

### Prerequisites
- Google Sheet with SR form responses
- Google account (for Apps Script deployment)
- Web browser (Chrome recommended)

### Step 1: Deploy Google Apps Script (3 minutes)

1. Open your SR responses Google Sheet
2. Click **Extensions → Apps Script**
3. Delete any existing code
4. Copy all content from `apps-script/Code.gs`
5. Paste into the Apps Script editor
6. Click **Deploy → New Deployment**
7. Configure:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy**
9. Copy the **Web App URL**

### Step 2: Configure Frontend (1 minute)

1. Open `config.js`
2. Replace `YOUR_APPS_SCRIPT_URL_HERE` with your Web App URL:
   ```javascript
   API_URL: 'https://script.google.com/macros/s/YOUR-SCRIPT-ID/exec',
   ```
3. Save the file

### Step 3: Launch Viewer (1 minute)

#### Option A: Local File
1. Open `index.html` in your browser
2. Bookmark for easy access

#### Option B: GitHub Pages
1. Upload to GitHub repository
2. Enable GitHub Pages in Settings
3. Access at: `https://yourusername.github.io/repo-name/`

## File Structure

```
casp-response-viewer-sr/
├── index.html              # Main HTML interface
├── app.js                  # Application logic with voting
├── styles.css              # Styling (responsive)
├── config.js              # Configuration (UPDATE THIS!)
├── apps-script/
│   └── Code.gs            # Google Apps Script backend
└── README.md              # This file
```

## How It Works

### Data Flow
1. Students submit SR appraisals via Google Form
2. Responses saved to Google Sheet
3. Apps Script reads sheet data
4. Frontend fetches JSON via API
5. Displays responses with voting

### Voting System
- **One vote per response per browser**
- Uses localStorage to track votes
- Visual feedback for voted responses
- Top voted responses highlighted in gold
- Vote counts displayed on each card

### Statistics
- **Answer Distribution**: Pie chart of Yes/No/Can't Tell
- **Top Voted**: Bar chart of highest voted responses
- **Uncertainty Analysis**: Questions with most "Can't Tell"
- **Completion Rate**: Percentage of students who responded

## Configuration Options

Edit `config.js` to customize:

```javascript
const CONFIG = {
    API_URL: 'your-url-here',      // Your Apps Script URL
    TOTAL_QUESTIONS: 10,            // SR has 10 questions
    REFRESH_INTERVAL: 30000,        // 30 seconds
    AUTO_REFRESH: true,             // Enable auto-refresh
    ENABLE_VOTING: true,            // Enable voting feature
    ENABLE_STATISTICS: true         // Enable statistics
};
```

## Google Sheets Structure

Your form responses sheet should have columns:

| Column | Content | Index |
|--------|---------|-------|
| A | Timestamp | 0 |
| B | Student Name | 1 |
| C | Paper Title | 2 |
| D | Author | 3 |
| E | DOI/URL | 4 |
| F | Appraisal Date | 5 |
| G | Q1 Answer | 6 |
| H | Q1 Justification | 7 |
| I | Q2 Answer | 8 |
| J | Q2 Justification | 9 |
| ... | ... | ... |
| Y | Q10 Answer | 24 |
| Z | Q10 Justification | 25 |
| AA | Positive Summary | 26 |
| AB | Negative Summary | 27 |
| AC | Unknowns Summary | 28 |

## Troubleshooting

### "Configuration Error" Message
- Update `API_URL` in config.js
- Ensure you copied the correct Web App URL

### No Data Showing
- Check Sheet name is "Form Responses 1"
- Verify Apps Script is deployed
- Check browser console for errors

### Votes Not Working
- Create "Votes" sheet tab manually if needed
- Clear browser cache and localStorage
- Ensure Apps Script has write permissions

### Slow Loading
- Normal first load: 2-3 seconds
- Check network connection
- Reduce refresh interval if needed

## Classroom Usage Tips

### For Instructors

1. **Project on screen** during discussion
2. **Navigate questions** with arrow buttons
3. **Filter responses** to focus on specific answers
4. **Show statistics** to reveal patterns
5. **Highlight top voted** for exemplary reasoning

### For Students

1. **Vote for best explanations** (one vote per response)
2. **View statistics** to see class trends
3. **Compare approaches** across different responses
4. **Learn from peers** through voted examples

## Privacy & Security

- Student names anonymized to "Student 1", "Student 2", etc.
- No authentication required for viewing
- Votes stored in Google Sheet (no personal data)
- LocalStorage only stores vote flags, no content

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ✅ Full support |
| Edge | ✅ Full support |
| Mobile | ✅ Responsive design |

## Updates & Maintenance

### To Update Questions
Edit `apps-script/Code.gs` lines 36-106 (QUESTION_PAIRS array)

### To Change Anonymization
Edit `apps-script/Code.gs` line 174 (anonymizeStudent function)

### To Add Features
- Vote deduplication: See app.js lines 155-175
- New statistics: See app.js lines 380-480
- Custom styling: Edit styles.css

## License

Educational use permitted. Based on CASP checklists © Critical Appraisal Skills Programme.

## Support

For issues or questions:
1. Check this README
2. Review browser console for errors
3. Contact your course instructor

---

**Version**: 1.0.0
**Last Updated**: November 2024
**CASP SR Checklist Version**: 2024