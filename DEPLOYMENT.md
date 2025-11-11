# CASP SR Response Viewer - Deployment Guide

Step-by-step guide to deploy the CASP Systematic Reviews Response Viewer.

## Prerequisites Checklist

- [ ] Google Sheet with SR form responses (from `create_casp_sr_form.py`)
- [ ] Google account with Apps Script access
- [ ] Text editor (VS Code, Notepad++, etc.)
- [ ] Web browser (Chrome recommended)
- [ ] 10-15 minutes for full deployment

## Phase 1: Google Apps Script Deployment (5 minutes)

### Step 1: Access Apps Script

1. Open your SR responses Google Sheet
2. Click **Extensions** → **Apps Script**
3. You'll see a new tab with the Apps Script editor

### Step 2: Add the Backend Code

1. Delete any existing code in the editor
2. Open `apps-script/Code.gs` from this project
3. Select all (Ctrl+A / Cmd+A)
4. Copy (Ctrl+C / Cmd+C)
5. Paste into the Apps Script editor (Ctrl+V / Cmd+V)

### Step 3: Save and Name the Project

1. Click the **Untitled project** text at the top
2. Name it: `CASP SR Response Viewer Backend`
3. Click **OK**
4. Press Ctrl+S (Cmd+S on Mac) to save

### Step 4: Deploy as Web App

1. Click **Deploy** button (top right)
2. Select **New Deployment**
3. Click the gear icon ⚙️ next to "Select type"
4. Choose **Web app**
5. Configure deployment:
   - **Description**: `CASP SR Response Viewer API v1`
   - **Execute as**: `Me (your@email.com)`
   - **Who has access**: `Anyone`
6. Click **Deploy**

### Step 5: Authorize the Script

1. You'll see an "Authorization required" dialog
2. Click **Authorize access**
3. Choose your Google account
4. You may see "Google hasn't verified this app"
   - Click **Advanced**
   - Click **Go to CASP SR Response Viewer Backend (unsafe)**
   - This is safe - it's your own script
5. Click **Allow**

### Step 6: Copy the Web App URL

1. After deployment, you'll see a confirmation
2. **IMPORTANT**: Copy the Web App URL
   - It looks like: `https://script.google.com/macros/s/AKfycbw.../exec`
3. Click **Done**

## Phase 2: Frontend Configuration (2 minutes)

### Step 1: Update Configuration

1. Open `config.js` in your text editor
2. Find this line:
   ```javascript
   API_URL: 'YOUR_APPS_SCRIPT_URL_HERE',
   ```
3. Replace with your Web App URL:
   ```javascript
   API_URL: 'https://script.google.com/macros/s/AKfycbw.../exec',
   ```
4. Save the file (Ctrl+S / Cmd+S)

### Step 2: Verify Configuration

Open config.js and check:
- [ ] API_URL is updated with your URL
- [ ] TOTAL_QUESTIONS is 10 (for SR)
- [ ] AUTO_REFRESH is true
- [ ] ENABLE_VOTING is true

## Phase 3: Create Votes Sheet (1 minute)

### Step 1: Add Votes Tab

1. Go back to your Google Sheet
2. Click the **+** button at bottom left to add a new sheet
3. Name it exactly: `Votes` (case-sensitive)
4. Add headers in row 1:
   - A1: `Timestamp`
   - B1: `QuestionIndex`
   - C1: `StudentRowIndex`
5. Bold the header row (select row 1, Ctrl+B / Cmd+B)

## Phase 4: Launch the Viewer (2 minutes)

### Option A: Local File Access (Quickest)

1. Navigate to `casp-response-viewer-sr/` folder
2. Double-click `index.html`
3. It opens in your default browser
4. Bookmark the page for easy access

**Note**: Some browsers may restrict localStorage in local files. If voting doesn't work, use Option B or C.

### Option B: Local Web Server

If you have Python installed:
```bash
cd casp-response-viewer-sr
python -m http.server 8000
```
Then open: http://localhost:8000

If you have Node.js installed:
```bash
npx http-server casp-response-viewer-sr
```

### Option C: GitHub Pages (Best for Sharing)

1. Create GitHub repository
2. Upload all files from `casp-response-viewer-sr/`
3. Go to Settings → Pages
4. Source: Deploy from a branch
5. Branch: main, folder: / (root)
6. Click Save
7. Wait 2-3 minutes
8. Access at: `https://[username].github.io/[repository]/`

## Phase 5: Testing (5 minutes)

### Initial Load Test

1. Open the viewer in your browser
2. You should see:
   - [ ] "CASP Systematic Reviews Response Viewer" header
   - [ ] Question selector with 10 questions
   - [ ] Loading indicator briefly
   - [ ] Response cards appearing

### Voting Test

1. Click "👍 Vote for this" on any response
2. You should see:
   - [ ] Toast message: "Vote recorded successfully!"
   - [ ] Button changes to "✓ Voted"
   - [ ] Vote count increases
   - [ ] Green border on voted card

3. Try voting again on same response:
   - [ ] Toast message: "You have already voted for this response"
   - [ ] Vote not duplicated

### Statistics Test

1. Click "📊 Show Statistics"
2. You should see:
   - [ ] Completion rate percentage
   - [ ] Pie chart of Yes/No/Can't Tell
   - [ ] Bar chart of top voted (if votes exist)
   - [ ] Uncertainty chart showing Can't Tell frequency

### Navigation Test

1. Use arrow buttons to navigate
2. Use dropdown to jump to questions
3. Filter by answer type
4. Toggle auto-refresh

## Troubleshooting

### "Configuration Error" on Load

**Problem**: API_URL not configured
**Solution**:
1. Check config.js has correct URL
2. No typos or extra spaces
3. URL ends with `/exec`

### "Error loading data"

**Problem**: Apps Script not accessible
**Solution**:
1. Check deployment settings (must be "Anyone")
2. Verify Sheet name is "Form Responses 1"
3. Re-deploy if needed

### Votes Not Saving

**Problem**: Votes sheet missing or wrong name
**Solution**:
1. Create sheet named exactly "Votes"
2. Add proper headers
3. Refresh the viewer

### No Responses Showing

**Problem**: No data in sheet or wrong columns
**Solution**:
1. Verify responses exist in Google Sheet
2. Check column mappings match SR form
3. Look at browser console for errors (F12)

## Advanced Configuration

### Custom Refresh Interval

Edit config.js:
```javascript
REFRESH_INTERVAL: 60000,  // 60 seconds instead of 30
```

### Disable Voting

Edit config.js:
```javascript
ENABLE_VOTING: false,
```

### Change Anonymization

Edit Code.gs line 174:
```javascript
// Option 1: Student N format (default)
return `Student ${index + 1}`;

// Option 2: Use initials
if (name) {
  const parts = name.trim().split(' ');
  return parts.map(p => p[0]).join('') + (index + 1);
}

// Option 3: Show real names
return name || `Student ${index + 1}`;
```

## Deployment Checklist

### Pre-Deployment
- [ ] SR form responses collected in Google Sheet
- [ ] Familiar with Google Apps Script
- [ ] Have Web App URL ready

### Deployment
- [ ] Apps Script deployed as Web App
- [ ] config.js updated with Web App URL
- [ ] Votes sheet created with headers
- [ ] Viewer loads without errors

### Post-Deployment
- [ ] Test voting functionality
- [ ] Verify statistics work
- [ ] Check all 10 questions display
- [ ] Share URL with teaching team

## Security Notes

- **Web App runs as you**: Be careful with permissions
- **Anyone can access**: No authentication required
- **Read-only by default**: Only votes are written
- **No personal data**: Student names anonymized

## Support

If you encounter issues:

1. Check browser console (F12) for errors
2. Verify all steps completed in order
3. Try incognito/private browsing mode
4. Clear browser cache and localStorage

---

**Deployment Time**: 10-15 minutes
**Difficulty**: Easy
**Last Updated**: November 2024