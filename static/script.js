// OpenLaw Frontend Logic — Vanilla JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('drop-zone');
    const pdfInput = document.getElementById('pdf-input');
    const fileInfo = document.getElementById('file-info');
    const fileNameDisplay = document.getElementById('file-name');
    const fileSizeDisplay = document.getElementById('file-size');
    const changeFileBtn = document.getElementById('change-file-btn');
    const analyzeBtn = document.getElementById('analyze-btn');

    const errorBanner = document.getElementById('error-banner');
    const errorMessage = document.getElementById('error-message');
    const closeErrorBtn = document.getElementById('close-error');

    const loadingCard = document.getElementById('loading-card');
    const loadingStatus = document.getElementById('loading-status');
    const resultsContainer = document.getElementById('results-container');

    const downloadTxtBtn = document.getElementById('download-txt-btn');
    const printPdfBtn = document.getElementById('print-pdf-btn');

    const askForm = document.getElementById('ask-form');
    const askInput = document.getElementById('ask-input');
    const askBtn = document.getElementById('ask-btn');
    const askResults = document.getElementById('ask-results');

    // State Variables
    let selectedFile = null;
    let currentAnalysisData = null;

    // Chart instances
    let clauseChartInstance = null;
    let attentionChartInstance = null;

    // --- File Drag & Drop Handlers ---
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelected(files[0]);
        }
    });

    pdfInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelected(e.target.files[0]);
        }
    });

    changeFileBtn.addEventListener('click', () => {
        resetFileSelection();
    });

    closeErrorBtn.addEventListener('click', () => {
        errorBanner.classList.add('hidden');
    });

    function handleFileSelected(file) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            showError('Please select a valid PDF file.');
            return;
        }

        selectedFile = file;
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = formatBytes(file.size);

        fileInfo.classList.remove('hidden');
        analyzeBtn.classList.remove('hidden');
        hideError();
    }

    function resetFileSelection() {
        selectedFile = null;
        pdfInput.value = '';
        fileInfo.classList.add('hidden');
        analyzeBtn.classList.add('hidden');
        resultsContainer.classList.add('hidden');
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorBanner.classList.remove('hidden');
    }

    function hideError() {
        errorBanner.classList.add('hidden');
    }

    // --- Analyze Document Action ---
    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            showError('Please upload a PDF file.');
            return;
        }

        hideError();
        resultsContainer.classList.add('hidden');
        loadingCard.classList.remove('hidden');
        analyzeBtn.disabled = true;

        // Progressive Loading Messages
        loadingStatus.textContent = 'Extracting document...';

        const stepTimer1 = setTimeout(() => {
            loadingStatus.textContent = 'Analyzing document with AI...';
        }, 1500);

        const stepTimer2 = setTimeout(() => {
            loadingStatus.textContent = 'Preparing results...';
        }, 4000);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            clearTimeout(stepTimer1);
            clearTimeout(stepTimer2);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze document.');
            }

            // Render output
            displayResults(data);

        } catch (err) {
            showError(err.message || 'Unable to analyze the document right now. Please try again.');
        } finally {
            loadingCard.classList.add('hidden');
            analyzeBtn.disabled = false;
        }
    });

    // --- Render Analysis Results ---
    function displayResults(data) {
        currentAnalysisData = data;

        // Document Overview
        document.getElementById('doc-type').textContent = data.document_type || 'Legal Document';
        document.getElementById('doc-summary').textContent = data.summary || 'No summary available.';
        document.getElementById('doc-simple-explanation').textContent = data.simple_explanation || 'No explanation available.';

        // Overall Attention Level Badge
        const badgeElem = document.getElementById('overall-attention-badge');
        const level = (data.overall_attention_level || 'Medium').trim();
        badgeElem.textContent = `Attention: ${level}`;
        badgeElem.className = 'badge ' + getBadgeClass(level);

        // Key Information Lists
        renderList('parties-list', data.parties);
        renderList('dates-list', data.important_dates);
        renderList('financial-list', data.financial_obligations);

        // Combine key_points, rights, responsibilities cleanly
        const combinedKeyPoints = [];
        if (data.rights && data.rights.length > 0) combinedKeyPoints.push(...data.rights.map(r => `Right: ${r}`));
        if (data.key_points && data.key_points.length > 0) combinedKeyPoints.push(...data.key_points);
        if (data.responsibilities && data.responsibilities.length > 0) combinedKeyPoints.push(...data.responsibilities.map(r => `Responsibility: ${r}`));
        
        const uniquePoints = Array.from(new Set(combinedKeyPoints));
        renderList('key-points-list', uniquePoints);

        // Important Clauses Cards
        renderClauses(data.important_clauses || []);

        // Attention Areas Cards
        renderAttentionAreas(data.attention_areas || []);

        // Render Charts
        renderCharts(data.important_clauses || [], data.attention_areas || []);

        // Clear previous Q&A thread
        askResults.innerHTML = '';

        // Show Results Section
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function renderList(elementId, items) {
        const listElem = document.getElementById(elementId);
        listElem.innerHTML = '';

        if (!items || items.length === 0) {
            listElem.innerHTML = '<li class="text-muted">Not specified in the document.</li>';
            return;
        }

        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            listElem.appendChild(li);
        });
    }

    function renderClauses(clauses) {
        const container = document.getElementById('clauses-container');
        container.innerHTML = '';

        if (clauses.length === 0) {
            container.innerHTML = '<p class="text-muted">No key clauses highlighted.</p>';
            return;
        }

        clauses.forEach(item => {
            const card = document.createElement('div');
            card.className = 'clause-card';

            const importance = item.importance || 'Medium';
            const badgeClass = getBadgeClass(importance);

            card.innerHTML = `
                <div class="clause-header">
                    <h3 class="clause-title">${escapeHtml(item.clause || 'Important Clause')}</h3>
                    <span class="badge ${badgeClass}">${escapeHtml(importance)}</span>
                </div>
                ${item.original_text ? `<div class="original-quote">"${escapeHtml(item.original_text)}"</div>` : ''}
                <p class="clause-explanation"><strong>Simple Explanation:</strong> ${escapeHtml(item.simple_explanation || 'N/A')}</p>
            `;

            container.appendChild(card);
        });
    }

    function renderAttentionAreas(areas) {
        const container = document.getElementById('attention-container');
        container.innerHTML = '';

        if (areas.length === 0) {
            container.innerHTML = '<p class="text-muted">No specific attention areas identified.</p>';
            return;
        }

        areas.forEach(item => {
            const card = document.createElement('div');
            card.className = 'attention-card';

            const severity = item.severity || 'Medium';
            const badgeClass = getBadgeClass(severity);

            card.innerHTML = `
                <div class="attention-header">
                    <h3 class="attention-title">${escapeHtml(item.title || 'Attention Area')}</h3>
                    <span class="badge ${badgeClass}">${escapeHtml(severity)}</span>
                </div>
                <p class="clause-explanation">${escapeHtml(item.description || 'N/A')}</p>
            `;

            container.appendChild(card);
        });
    }

    function getBadgeClass(level) {
        const l = (level || '').toLowerCase();
        if (l.includes('high')) return 'badge-high';
        if (l.includes('low')) return 'badge-low';
        return 'badge-medium';
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // --- Chart Visualizations ---
    function renderCharts(clauses, attentionAreas) {
        // Count clause importance
        const clauseCounts = { High: 0, Medium: 0, Low: 0 };
        clauses.forEach(c => {
            const imp = (c.importance || 'Medium').toLowerCase();
            if (imp.includes('high')) clauseCounts.High++;
            else if (imp.includes('low')) clauseCounts.Low++;
            else clauseCounts.Medium++;
        });

        // Count attention severities
        const attentionCounts = { High: 0, Medium: 0, Low: 0 };
        attentionAreas.forEach(a => {
            const sev = (a.severity || 'Medium').toLowerCase();
            if (sev.includes('high')) attentionCounts.High++;
            else if (sev.includes('low')) attentionCounts.Low++;
            else attentionCounts.Medium++;
        });

        // Destroy previous instances
        if (clauseChartInstance) clauseChartInstance.destroy();
        if (attentionChartInstance) attentionChartInstance.destroy();

        // Chart 1: Clause Importance Bar Chart
        const ctx1 = document.getElementById('clauseChart').getContext('2d');
        clauseChartInstance = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{
                    label: 'Number of Clauses',
                    data: [clauseCounts.High, clauseCounts.Medium, clauseCounts.Low],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });

        // Chart 2: Attention Severity Doughnut Chart
        const ctx2 = document.getElementById('attentionChart').getContext('2d');
        attentionChartInstance = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['High Severity', 'Medium Severity', 'Low Severity'],
                datasets: [{
                    data: [attentionCounts.High, attentionCounts.Medium, attentionCounts.Low],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // --- Ask Question Action ---
    askForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = askInput.value.trim();

        if (!question) return;

        askBtn.disabled = true;
        askBtn.textContent = 'Thinking...';

        try {
            const response = await fetch('/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: question })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get answer.');
            }

            // Append Q&A bubble
            const bubble = document.createElement('div');
            bubble.className = 'qa-bubble';
            bubble.innerHTML = `
                <div class="qa-question">Q: ${escapeHtml(question)}</div>
                <div class="qa-answer">${escapeHtml(data.answer)}</div>
            `;

            askResults.prepend(bubble);
            askInput.value = '';

        } catch (err) {
            showError(err.message || 'Error answering question.');
        } finally {
            askBtn.disabled = false;
            askBtn.textContent = 'Ask AI';
        }
    });

    // --- Download Report Handlers ---
    if (downloadTxtBtn) {
        downloadTxtBtn.addEventListener('click', () => {
            if (!currentAnalysisData) {
                alert('No analysis data available to download.');
                return;
            }
            downloadTextReport(currentAnalysisData);
        });
    }

    if (printPdfBtn) {
        printPdfBtn.addEventListener('click', () => {
            window.print();
        });
    }

    function downloadTextReport(data) {
        let report = '====================================================================\n';
        report += '                      OPENLAW ANALYSIS REPORT                      \n';
        report += '====================================================================\n\n';
        report += `Document Type: ${data.document_type || 'Legal Document'}\n`;
        report += `Overall Attention Level: ${data.overall_attention_level || 'Medium'}\n\n`;

        report += '--------------------------------------------------------------------\n';
        report += '1. SUMMARY\n';
        report += '--------------------------------------------------------------------\n';
        report += `${data.summary || 'N/A'}\n\n`;

        report += '--------------------------------------------------------------------\n';
        report += '2. SIMPLE EXPLANATION\n';
        report += '--------------------------------------------------------------------\n';
        report += `${data.simple_explanation || 'N/A'}\n\n`;

        report += '--------------------------------------------------------------------\n';
        report += '3. PARTIES INVOLVED\n';
        report += '--------------------------------------------------------------------\n';
        if (data.parties && data.parties.length > 0) {
            data.parties.forEach(p => report += `- ${p}\n`);
        } else {
            report += 'Not specified in the document.\n';
        }
        report += '\n';

        report += '--------------------------------------------------------------------\n';
        report += '4. IMPORTANT DATES\n';
        report += '--------------------------------------------------------------------\n';
        if (data.important_dates && data.important_dates.length > 0) {
            data.important_dates.forEach(d => report += `- ${d}\n`);
        } else {
            report += 'Not specified in the document.\n';
        }
        report += '\n';

        report += '--------------------------------------------------------------------\n';
        report += '5. FINANCIAL OBLIGATIONS\n';
        report += '--------------------------------------------------------------------\n';
        if (data.financial_obligations && data.financial_obligations.length > 0) {
            data.financial_obligations.forEach(f => report += `- ${f}\n`);
        } else {
            report += 'Not specified in the document.\n';
        }
        report += '\n';

        report += '--------------------------------------------------------------------\n';
        report += '6. IMPORTANT CLAUSES\n';
        report += '--------------------------------------------------------------------\n';
        if (data.important_clauses && data.important_clauses.length > 0) {
            data.important_clauses.forEach((c, idx) => {
                report += `[Clause ${idx + 1}] ${c.clause || 'Clause'} (Importance: ${c.importance || 'Medium'})\n`;
                if (c.original_text) report += `Original Text: "${c.original_text}"\n`;
                report += `Simple Explanation: ${c.simple_explanation || 'N/A'}\n\n`;
            });
        } else {
            report += 'No key clauses highlighted.\n';
        }

        report += '--------------------------------------------------------------------\n';
        report += '7. AI-IDENTIFIED AREAS REQUIRING ATTENTION\n';
        report += '--------------------------------------------------------------------\n';
        if (data.attention_areas && data.attention_areas.length > 0) {
            data.attention_areas.forEach((a, idx) => {
                report += `[Area ${idx + 1}] ${a.title || 'Attention Item'} (Severity: ${a.severity || 'Medium'})\n`;
                report += `Description: ${a.description || 'N/A'}\n\n`;
            });
        } else {
            report += 'No specific attention areas identified.\n';
        }

        report += '====================================================================\n';
        report += 'LEGAL DISCLAIMER:\n';
        report += 'OpenLaw provides AI-generated explanations for informational and\n';
        report += 'educational purposes only. It does not provide legal advice.\n';
        report += '====================================================================\n';

        // Trigger text download
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = (data.document_type || 'Legal_Document').replace(/[^a-z0-9]/gi, '_');
        a.download = `OpenLaw_${safeName}_Report.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});
