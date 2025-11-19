/**
 * CASP SR Response Viewer - Main Application
 * Displays student responses to CASP Systematic Reviews questions with voting and statistics
 */

class CASPResponseViewer {
    constructor() {
        this.data = null;
        this.votes = {};
        this.currentQuestionIndex = 0;
        this.currentFilter = 'all';
        this.autoRefresh = CONFIG.AUTO_REFRESH;
        this.refreshInterval = null;
        this.charts = {};

        this.init();
    }

    async init() {
        this.attachEventListeners();
        await this.loadData();

        if (this.autoRefresh) {
            this.startAutoRefresh();
        }
    }

    attachEventListeners() {
        // Navigation
        document.getElementById('prevQuestion').addEventListener('click', () => this.previousQuestion());
        document.getElementById('nextQuestion').addEventListener('click', () => this.nextQuestion());
        document.getElementById('questionSelector').addEventListener('change', (e) => {
            this.currentQuestionIndex = parseInt(e.target.value);
            this.displayCurrentQuestion();
        });

        // Filter
        document.getElementById('filterAnswer').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.displayResponses();
        });

        // Statistics
        document.getElementById('showStatistics').addEventListener('click', () => this.showStatistics());

        // Modal close
        document.querySelector('.modal-close').addEventListener('click', () => {
            document.getElementById('statisticsModal').style.display = 'none';
        });

        // Click outside modal to close
        document.getElementById('statisticsModal').addEventListener('click', (e) => {
            if (e.target.id === 'statisticsModal') {
                document.getElementById('statisticsModal').style.display = 'none';
            }
        });

        // Refresh toggle
        document.getElementById('toggleRefresh').addEventListener('click', () => this.toggleAutoRefresh());

        // Retry button
        document.getElementById('retryButton').addEventListener('click', () => this.loadData());

        // CONSIDER prompt toggle
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('consider-toggle')) {
                const content = e.target.nextElementSibling;
                const isShowing = content.style.display === 'block';
                content.style.display = isShowing ? 'none' : 'block';
                e.target.textContent = isShowing ? '▼ Show CONSIDER prompts' : '▲ Hide CONSIDER prompts';
            }
        });
    }

    async loadData() {
        try {
            this.showLoading(true);
            this.hideError();

            // Check if API URL is configured
            if (CONFIG.API_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
                throw new Error('API URL not configured. Please update config.js');
            }

            // Fetch responses
            const response = await fetch(CONFIG.API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.data = await response.json();

            // Fetch votes
            if (CONFIG.ENABLE_VOTING) {
                await this.loadVotes();
            }

            // Load user's votes from localStorage
            this.loadUserVotes();

            // Populate question selector
            this.populateQuestionSelector();

            // Display current question
            this.displayCurrentQuestion();

            // Update last refresh time
            document.getElementById('lastUpdate').textContent =
                `Last updated: ${new Date().toLocaleTimeString()}`;

            this.showLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError(error.message);
            this.showLoading(false);
        }
    }

    async loadVotes() {
        try {
            const response = await fetch(`${CONFIG.API_URL}?action=getVotes`);
            if (response.ok) {
                const votesData = await response.json();

                // The API returns votes in format: {"q0_s0": 2, "q1_s3": 1, ...}
                // We need to convert to: {"0_0": 2, "1_3": 1, ...}
                this.votes = {};

                if (votesData && typeof votesData === 'object') {
                    // Check if it's the direct format from getVotes
                    Object.entries(votesData).forEach(([key, count]) => {
                        // Parse the key format "q0_s0" to "0_0"
                        const match = key.match(/q(\d+)_s(\d+)/);
                        if (match) {
                            const newKey = `${match[1]}_${match[2]}`;
                            this.votes[newKey] = count;
                        }
                    });

                    console.log('Loaded votes:', this.votes);
                } else if (votesData.votes) {
                    // Alternative format with votes array
                    votesData.votes.forEach(vote => {
                        const key = `${vote.questionIndex}_${vote.studentRowIndex}`;
                        this.votes[key] = (this.votes[key] || 0) + 1;
                    });
                }
            }
        } catch (error) {
            console.error('Error loading votes:', error);
            // Continue without votes
        }
    }

    loadUserVotes() {
        // Check localStorage for which responses this user has voted for
        this.userVotes = {};
        for (let q = 0; q < CONFIG.TOTAL_QUESTIONS; q++) {
            for (let s = 0; s < 100; s++) { // Assume max 100 students
                const key = `${CONFIG.STORAGE_PREFIX}q${q}_s${s}`;
                if (localStorage.getItem(key)) {
                    this.userVotes[`${q}_${s}`] = true;
                }
            }
        }
    }

    populateQuestionSelector() {
        const selector = document.getElementById('questionSelector');
        selector.innerHTML = '';

        if (!this.data || !this.data.questions) {
            return;
        }

        this.data.questions.forEach((question, index) => {
            const option = document.createElement('option');
            option.value = index;
            // Truncate long question text for dropdown
            const questionText = question.questionText.length > 60
                ? question.questionText.substring(0, 60) + '...'
                : question.questionText;
            option.textContent = `Question ${index + 1}: ${questionText}`;
            selector.appendChild(option);
        });

        selector.value = this.currentQuestionIndex;
    }

    displayCurrentQuestion() {
        if (!this.data || !this.data.questions[this.currentQuestionIndex]) {
            return;
        }

        const question = this.data.questions[this.currentQuestionIndex];

        // Update question text
        document.getElementById('questionText').textContent =
            `Question ${this.currentQuestionIndex + 1}: ${question.questionText}`;

        // Update CONSIDER prompts
        const considerContent = document.querySelector('.consider-content');
        if (question.considerPrompt) {
            considerContent.innerHTML = this.formatConsiderPrompt(question.considerPrompt);
        } else {
            considerContent.innerHTML = '<em>No CONSIDER prompts available for this question.</em>';
        }

        // Update navigation buttons
        document.getElementById('prevQuestion').disabled = this.currentQuestionIndex === 0;
        document.getElementById('nextQuestion').disabled =
            this.currentQuestionIndex === CONFIG.TOTAL_QUESTIONS - 1;

        // Display responses
        this.displayResponses();

        // Update response count
        this.updateResponseCount();
    }

    formatConsiderPrompt(prompt) {
        // Convert bullet points to HTML list
        const lines = prompt.split('\n');
        let html = '<ul>';
        lines.forEach(line => {
            if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                html += `<li>${line.replace(/^[•\-]\s*/, '')}</li>`;
            } else if (line.trim()) {
                html += `</ul><p>${line}</p><ul>`;
            }
        });
        html += '</ul>';
        return html;
    }

    displayResponses() {
        const container = document.getElementById('responsesContainer');
        const noResults = document.getElementById('noResults');

        if (!this.data || !this.data.questions[this.currentQuestionIndex]) {
            container.innerHTML = '<p>No data available.</p>';
            return;
        }

        const question = this.data.questions[this.currentQuestionIndex];
        let responses = [...question.responses]; // Create copy for sorting

        // Apply filter
        if (this.currentFilter !== 'all') {
            responses = responses.filter(r => r.answer === this.currentFilter);
        }

        // Sort by vote count (descending)
        responses.sort((a, b) => {
            const votesA = this.getVoteCount(this.currentQuestionIndex, a.studentRowIndex);
            const votesB = this.getVoteCount(this.currentQuestionIndex, b.studentRowIndex);
            return votesB - votesA;
        });

        // Show/hide no results message
        if (responses.length === 0) {
            container.style.display = 'none';
            noResults.style.display = 'block';
            return;
        } else {
            container.style.display = 'grid';
            noResults.style.display = 'none';
        }

        // Find top vote count
        const topVoteCount = Math.max(...responses.map(r =>
            this.getVoteCount(this.currentQuestionIndex, r.studentRowIndex)));

        // Render response cards
        container.innerHTML = responses.map(response => {
            const voteCount = this.getVoteCount(this.currentQuestionIndex, response.studentRowIndex);
            const isTopVoted = voteCount > 0 && voteCount === topVoteCount;
            const hasUserVoted = this.hasUserVoted(this.currentQuestionIndex, response.studentRowIndex);

            return `
                <div class="response-card ${isTopVoted ? 'top-voted' : ''} ${hasUserVoted ? 'user-voted' : ''}">
                    <div class="card-header">
                        <span class="student-info">${response.studentName}</span>
                        <span class="answer-badge answer-${this.getAnswerClass(response.answer)}">
                            ${response.answer}
                        </span>
                    </div>
                    <div class="explanation-text">
                        ${this.escapeHtml(response.explanation)}
                    </div>
                    ${CONFIG.ENABLE_VOTING ? `
                        <div class="card-actions">
                            <button class="btn btn-vote ${hasUserVoted ? 'voted' : ''}"
                                    onclick="viewer.vote(${this.currentQuestionIndex}, ${response.studentRowIndex})"
                                    ${hasUserVoted ? 'disabled' : ''}>
                                ${hasUserVoted ? 'Voted' : '👍 Vote for this'}
                            </button>
                            <span class="vote-count">${voteCount} vote${voteCount !== 1 ? 's' : ''}</span>
                            ${isTopVoted ? '<span class="vote-count">⭐ Top voted</span>' : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    getAnswerClass(answer) {
        switch(answer) {
            case 'Yes': return 'yes';
            case 'No': return 'no';
            case "Can't Tell": return 'cant-tell';
            default: return 'unknown';
        }
    }

    getVoteCount(questionIndex, studentRowIndex) {
        const key = `${questionIndex}_${studentRowIndex}`;
        return this.votes[key] || 0;
    }

    hasUserVoted(questionIndex, studentRowIndex) {
        const key = `${questionIndex}_${studentRowIndex}`;
        return this.userVotes[key] === true;
    }

    async vote(questionIndex, studentRowIndex) {
        // Check if already voted using localStorage
        const storageKey = `${CONFIG.STORAGE_PREFIX}q${questionIndex}_s${studentRowIndex}`;

        if (localStorage.getItem(storageKey)) {
            this.showToast('You have already voted for this response', 'info');
            return;
        }

        try {
            // Record vote on server
            const url = `${CONFIG.API_URL}?action=recordVote&questionIndex=${questionIndex}&studentRowIndex=${studentRowIndex}`;
            const response = await fetch(url);

            if (response.ok) {
                // Mark as voted in localStorage
                localStorage.setItem(storageKey, new Date().toISOString());

                // Update userVotes cache
                this.userVotes[`${questionIndex}_${studentRowIndex}`] = true;

                // Show success message
                this.showToast('Vote recorded successfully!', 'success');

                // Reload data to show updated vote counts
                await this.loadData();
            } else {
                throw new Error('Failed to record vote');
            }
        } catch (error) {
            console.error('Error voting:', error);
            this.showToast('Failed to record vote. Please try again.', 'error');
        }
    }

    showToast(message, type = 'info') {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            document.getElementById('questionSelector').value = this.currentQuestionIndex;
            this.displayCurrentQuestion();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < CONFIG.TOTAL_QUESTIONS - 1) {
            this.currentQuestionIndex++;
            document.getElementById('questionSelector').value = this.currentQuestionIndex;
            this.displayCurrentQuestion();
        }
    }

    updateResponseCount() {
        if (!this.data || !this.data.questions[this.currentQuestionIndex]) {
            return;
        }

        const question = this.data.questions[this.currentQuestionIndex];
        const total = question.responses.length;
        const filtered = this.currentFilter === 'all'
            ? total
            : question.responses.filter(r => r.answer === this.currentFilter).length;

        let text = `Showing ${filtered} response${filtered !== 1 ? 's' : ''}`;
        if (this.currentFilter !== 'all') {
            text += ` (filtered from ${total} total)`;
        }

        document.getElementById('responseCount').textContent = text;
    }

    showStatistics() {
        if (!this.data) return;

        document.getElementById('statisticsModal').style.display = 'flex';
        this.drawCharts();
    }

    drawCharts() {
        const question = this.data.questions[this.currentQuestionIndex];

        // Completion rate
        const totalStudents = this.data.totalStudents || question.responses.length;
        const completionRate = (question.responses.length / totalStudents) * 100;
        document.getElementById('completionRate').textContent =
            `${completionRate.toFixed(0)}% completion (${question.responses.length} of ${totalStudents} students)`;

        // Answer distribution pie chart
        this.drawAnswerDistribution(question);

        // Top voted responses bar chart
        this.drawTopVoted(question);

        // Uncertainty chart (Can't Tell frequency)
        this.drawUncertaintyChart();
    }

    drawAnswerDistribution(question) {
        const ctx = document.getElementById('answerChart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.charts.answer) {
            this.charts.answer.destroy();
        }

        const answerCounts = {
            'Yes': 0,
            'No': 0,
            "Can't Tell": 0
        };

        question.responses.forEach(r => {
            if (answerCounts.hasOwnProperty(r.answer)) {
                answerCounts[r.answer]++;
            }
        });

        this.charts.answer = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(answerCounts),
                datasets: [{
                    data: Object.values(answerCounts),
                    backgroundColor: [
                        CONFIG.CHART_COLORS.yes,
                        CONFIG.CHART_COLORS.no,
                        CONFIG.CHART_COLORS.cantTell
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    drawTopVoted(question) {
        const section = document.getElementById('topVotedSection');

        // Get responses with votes
        const votedResponses = question.responses
            .map(r => ({
                student: r.studentName,
                votes: this.getVoteCount(this.currentQuestionIndex, r.studentRowIndex)
            }))
            .filter(r => r.votes > 0)
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 5); // Top 5

        if (votedResponses.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        const ctx = document.getElementById('voteChart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.charts.votes) {
            this.charts.votes.destroy();
        }

        this.charts.votes = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: votedResponses.map(r => r.student),
                datasets: [{
                    label: 'Votes',
                    data: votedResponses.map(r => r.votes),
                    backgroundColor: CONFIG.CHART_COLORS.yes
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    drawUncertaintyChart() {
        const ctx = document.getElementById('uncertaintyChart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.charts.uncertainty) {
            this.charts.uncertainty.destroy();
        }

        // Calculate "Can't Tell" counts for each question
        const cantTellCounts = this.data.questions.map((q, index) => ({
            question: `Q${index + 1}`,
            fullText: q.questionText.substring(0, 40) + '...',
            count: q.responses.filter(r => r.answer === "Can't Tell").length,
            percentage: (q.responses.filter(r => r.answer === "Can't Tell").length / q.responses.length * 100).toFixed(1)
        }));

        this.charts.uncertainty = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: cantTellCounts.map(x => x.question),
                datasets: [{
                    label: "Can't Tell Responses",
                    data: cantTellCounts.map(x => x.count),
                    backgroundColor: CONFIG.CHART_COLORS.cantTell
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return cantTellCounts[context[0].dataIndex].fullText;
                            },
                            label: function(context) {
                                const data = cantTellCounts[context.dataIndex];
                                return `${data.count} responses (${data.percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh;

        if (this.autoRefresh) {
            this.startAutoRefresh();
            document.getElementById('refreshStatus').textContent = 'Auto-refresh: ON';
            this.showToast('Auto-refresh enabled', 'success');
        } else {
            this.stopAutoRefresh();
            document.getElementById('refreshStatus').textContent = 'Auto-refresh: OFF';
            this.showToast('Auto-refresh disabled', 'info');
        }
    }

    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            this.loadData();
        }, CONFIG.REFRESH_INTERVAL);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
        document.getElementById('responsesContainer').style.display = show ? 'none' : 'grid';
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('error').style.display = 'block';
    }

    hideError() {
        document.getElementById('error').style.display = 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the viewer when DOM is ready
let viewer;
document.addEventListener('DOMContentLoaded', () => {
    viewer = new CASPResponseViewer();
});