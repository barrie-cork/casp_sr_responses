# TROUBLESHOOTING: SR Response Viewer Not Showing Data

## Problem Summary

The SR viewer at https://barrie-cork.github.io/casp_sr_responses/ returns empty data despite the SR form having responses.

**Root Cause:** The Apps Script Web App is not reading data from the correct Google Sheet.

## Diagnostic Test Results

```bash
# API returns empty data
curl -L "https://script.google.com/macros/s/AKfycbxQyAI89eyOkoxdvFlUU3OgvysWkBQxFqrrT7SV9U6czT6eYPn_TA0sOAwdPGsBdEtSlQ/exec"
# Returns: {"questions": [], "totalStudents": 0}
```

This indicates the Apps Script's `getResponses()` function is finding less than 2 rows (header + data).

## Step-by-Step Fix

### Step 1: Verify the SR Form's Response Sheet

1. **Open the SR Form:**
   ```
   https://docs.google.com/forms/d/1PUTVQ1MOBffjvWDZNDzX-tkYGV3rGqDEIbvhnrp7PRA/edit
   ```

2. **Go to the Responses tab**
   - Click "Responses" at the top of the form
   - Verify you see student responses listed

3. **Link to Google Sheet (if not already linked):**
   - Click the green Sheets icon in the Responses tab
   - If sheet doesn't exist: Click "Create Spreadsheet" → "Create a new spreadsheet"
   - If sheet exists: It will open the existing sheet
   - **CRITICAL:** Note the exact URL of the opened Google Sheet

4. **Verify Sheet Tab Name:**
   - In the Google Sheet, check the tab name at the bottom
   - It MUST be exactly `Form Responses 1` (case-sensitive)
   - If different, rename it to `Form Responses 1`

### Step 2: Test with Debug Endpoint (NEW)

The updated Apps Script now includes a debug endpoint. After redeploying (Step 3), test it:

```bash
# Get debug information
curl -L "https://script.google.com/macros/s/AKfycbxQyAI89eyOkoxdvFlUU3OgvysWkBQxFqrrT7SV9U6czT6eYPn_TA0sOAwdPGsBdEtSlQ/exec?action=debug"
```

This will show:
- Spreadsheet name and ID
- Available sheet names
- Row/column counts
- Whether data exists
- Sample data from first row

### Step 3: Redeploy Apps Script from CORRECT Sheet

**CRITICAL:** You must deploy the Apps Script from the SR form's response sheet, NOT the RCT sheet.

1. **Open the SR Form Response Sheet:**
   - Use the link from Step 1
   - Verify this is the sheet linked to form `1PUTVQ1MOBffjvWDZNDzX-tkYGV3rGqDEIbvhnrp7PRA`

2. **Open Apps Script Editor:**
   - In the Google Sheet: Extensions → Apps Script
   - This opens the script editor

3. **Replace the Code:**
   - Select all existing code (Cmd+A / Ctrl+A)
   - Delete it
   - Copy the ENTIRE contents of `/Users/barrie/Documents/Teaching/UCC/Critical_appraisal/CASP forms/casp-response-viewer-sr/apps-script/Code.gs`
   - Paste into the editor
   - Click the disk icon to save

4. **Deploy as Web App:**
   - Click "Deploy" → "New deployment"
   - Click the gear icon → Select "Web app"
   - Settings:
     - Description: "CASP SR Response Viewer Backend (v2)" or similar
     - Execute as: **Me** (your account)
     - Who has access: **Anyone**
   - Click "Deploy"

5. **Authorize the Script:**
   - Click "Authorize access"
   - Select your Google account
   - Click "Advanced" → "Go to [Project name] (unsafe)"
   - Click "Allow"

6. **Copy the New Web App URL:**
   - After authorization, copy the "Web app URL"
   - It should look like: `https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`

7. **Update config.js:**
   - Edit `/Users/barrie/Documents/Teaching/UCC/Critical_appraisal/CASP forms/casp-response-viewer-sr/config.js`
   - Replace the `API_URL` with your new Web App URL
   - Save the file

### Step 4: Test the New Deployment

```bash
# Navigate to the viewer directory
cd "/Users/barrie/Documents/Teaching/UCC/Critical_appraisal/CASP forms/casp-response-viewer-sr"

# Test the new API URL (replace with your actual URL)
curl -L "https://script.google.com/macros/s/[YOUR_NEW_DEPLOYMENT_ID]/exec" | python3 -m json.tool

# Should now return actual questions and student data
```

If you still get empty data, test the debug endpoint:

```bash
curl -L "https://script.google.com/macros/s/[YOUR_NEW_DEPLOYMENT_ID]/exec?action=debug" | python3 -m json.tool
```

### Step 5: Deploy Frontend Updates

Once the API is working, deploy the improved frontend code:

```bash
# Navigate to viewer directory
cd "/Users/barrie/Documents/Teaching/UCC/Critical_appraisal/CASP forms/casp-response-viewer-sr"

# Check uncommitted changes
git status

# Review changes
git diff

# Commit the improved code
git add app.js index.html apps-script/Code.gs TROUBLESHOOTING-SR-VIEWER.md
git commit -m "Fix: improve vote loading logic and add debug endpoint

- Enhanced vote loading to handle multiple data formats
- Added debug endpoint for troubleshooting (action=debug)
- Fixed capitalization to follow sentence case standards
- Added troubleshooting documentation

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push origin main
```

GitHub Pages will automatically redeploy within 2-3 minutes.

### Step 6: Verify the Fix

1. **Wait 2-3 minutes** for GitHub Pages to deploy

2. **Open the viewer:**
   ```
   https://barrie-cork.github.io/casp_sr_responses/
   ```

3. **Check browser console (F12):**
   - Should see "Loaded votes: {}" or similar
   - No red error messages
   - Network tab should show successful API calls

4. **Verify responses appear:**
   - Should see question cards
   - Should see student responses
   - Vote buttons should work

## Common Issues

### Issue 1: "Sheet 'Form Responses 1' not found"

**Solution:**
- Check the sheet tab name is exactly `Form Responses 1`
- Rename if necessary

### Issue 2: Still showing 0 students after redeployment

**Possible causes:**
1. Deployed from wrong Google Sheet (RCT instead of SR)
2. Sheet has no data yet
3. Column structure doesn't match expectations

**Debug:**
```bash
# Use the debug endpoint to see what the script sees
curl -L "https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec?action=debug"
```

### Issue 3: CORS errors in browser

**Solution:**
- This is normal for Apps Script
- Make sure you're deploying with "Who has access: Anyone"
- The fetch calls in app.js should handle CORS correctly

### Issue 4: Old data cached

**Solution:**
```bash
# Clear browser cache and hard reload
# Chrome/Firefox: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

## Verification Checklist

- [ ] SR form has responses (not the RCT form)
- [ ] Google Sheet is linked to SR form
- [ ] Sheet tab is named exactly "Form Responses 1"
- [ ] Apps Script is deployed FROM the SR response sheet
- [ ] Apps Script authorization completed
- [ ] Web App URL is updated in config.js
- [ ] API returns actual data (not empty)
- [ ] Frontend code is committed and pushed
- [ ] GitHub Pages has redeployed (2-3 min wait)
- [ ] Viewer displays responses

## File Locations

**SR Viewer Repository:**
- Root: `/Users/barrie/Documents/Teaching/UCC/Critical_appraisal/CASP forms/casp-response-viewer-sr`
- Config: `config.js`
- Frontend: `app.js`, `index.html`
- Backend: `apps-script/Code.gs`

**Deployed URLs:**
- Viewer: `https://barrie-cork.github.io/casp_sr_responses/`
- API: `https://script.google.com/macros/s/AKfycbxQyAI89eyOkoxdvFlUU3OgvysWkBQxFqrrT7SV9U6czT6eYPn_TA0sOAwdPGsBdEtSlQ/exec`

**SR Form:**
- Form ID: `1PUTVQ1MOBffjvWDZNDzX-tkYGV3rGqDEIbvhnrp7PRA`
- Form URL: `https://docs.google.com/forms/d/1PUTVQ1MOBffjvWDZNDzX-tkYGV3rGqDEIbvhnrp7PRA/edit`

## Quick Reference: Key Apps Script Code

The Apps Script expects this structure in the Google Sheet:

```
Column 0: Timestamp
Column 1: Student Name
Column 2: Paper Title
Column 3: Author
Column 4: DOI/URL
Column 5: Appraisal Date
Columns 6-7: Q1 (answer, justification)
Columns 8-9: Q2 (answer, justification)
Columns 10-11: Q3 (answer, justification)
... continues for all 10 questions
Columns 26-28: Summary (positive, negative, unknowns)
```

Total: 29 columns (0-28)
