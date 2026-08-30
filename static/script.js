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
    const tryDemoBtn = document.getElementById('try-demo-btn');

    if (tryDemoBtn) {
        tryDemoBtn.addEventListener('click', () => {
            const sampleData = {
                document_type: "Residential Lease Agreement (Demo Sample)",
                summary: "Standard 11-month residential rental agreement for property located in Pune, Maharashtra.",
                simple_explanation: "This agreement outlines an 11-month tenancy at ₹35,000 monthly rent with ₹100,000 security deposit. Either party may terminate with 30 days notice.",
                overall_attention_level: "Medium",
                parties: [
                    "Arjun Mehta (Landlord), Pune",
                    "BluePeak Solutions (Tenant), Mumbai"
                ],
                important_dates: [
                    "Effective Date: August 15, 2026",
                    "Contract Duration: 11 Months",
                    "Rent Due Date: 5th of every month"
                ],
                financial_obligations: [
                    "Monthly Rent: ₹35,000",
                    "Security Deposit: ₹100,000 (Refundable)",
                    "Late Fee: 2% per month after 10 days"
                ],
                key_points: [
                    "Landlord handles major structural repairs.",
                    "Subletting requires landlord's written approval.",
                    "Deposit refunded within 15 days of handover."
                ],
                rights: [
                    "Client has the right to 30 days notice before eviction.",
                    "Tenant receives full deposit refund minus verified damages."
                ],
                responsibilities: [
                    "Tenant must pay monthly maintenance fee of ₹3,000.",
                    "Tenant must keep premises in good clean condition."
                ],
                important_clauses: [
                    {
                        clause: "Notice Period",
                        original_text: "Either party may terminate this agreement by giving 30 days written notice.",
                        simple_explanation: "You or the landlord can end the tenancy with 1 month notice.",
                        importance: "High"
                    }
                ],
                attention_areas: [
                    {
                        title: "Late Payment Penalty",
                        description: "2% monthly fee charged for rent delayed beyond 10 days.",
                        severity: "Medium"
                    }
                ],
                favorability_analysis: {
                    parties: ["Arjun Mehta (Landlord)", "BluePeak Solutions (Tenant)"],
                    favored_party: "Landlord (Arjun Mehta)",
                    favorability_score: 65,
                    party_scores: [
                        { party: "Landlord (Arjun Mehta)", score: 65 },
                        { party: "Tenant (BluePeak Solutions)", score: 35 }
                    ],
                    confidence: "High",
                    verdict: "Moderately favors the Landlord",
                    overall_assessment: "The landlord appears more favored due to strict late-payment penalties and subletting restrictions, though standard tenant termination rights remain intact.",
                    reasons: [
                        "Imposes a 2% monthly fee on delayed payments after a 10-day grace period.",
                        "Strictly prohibits subletting without mandatory written landlord approval.",
                        "Deposit return timeframe is set to 15 days post-handover."
                    ],
                    supporting_clauses: [
                        {
                            clause: "Penalty Clause",
                            target_party: "Landlord",
                            explanation: "Favors Landlord by ensuring monthly interest on late rent payments."
                        },
                        {
                            clause: "Subletting Restriction",
                            target_party: "Landlord",
                            explanation: "Favors Landlord by giving full approval veto over third-party occupancy."
                        },
                        {
                            clause: "Termination & Notice",
                            target_party: "Tenant",
                            explanation: "Favors Tenant by permitting equal 30 days notice to end lease."
                        }
                    ]
                }
            };
            displayResults(sampleData);
        });
    }

    // State Variables
    let selectedFile = null;
    let currentAnalysisData = null;

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

    // --- Safe String & Object Formatting Helper ---
    function safeString(val, fallback = '') {
        if (val === null || val === undefined) return fallback;

        if (typeof val === 'string') {
            const trimmed = val.trim();
            if (trimmed === '[object Object]') return fallback;
            return trimmed || fallback;
        }

        if (typeof val === 'number' || typeof val === 'boolean') {
            return String(val);
        }

        if (Array.isArray(val)) {
            if (val.length === 0) return fallback;
            const items = val.map(item => safeString(item)).filter(Boolean);
            return items.join(', ') || fallback;
        }

        if (typeof val === 'object') {
            const keys = Object.keys(val);
            if (keys.length === 0) return fallback;

            // 1. Date objects: { date: "...", event: "..." }
            if (val.event && val.date) {
                return `${safeString(val.event)}: ${safeString(val.date)}`;
            }
            if (val.date && val.title) {
                return `${safeString(val.title)}: ${safeString(val.date)}`;
            }

            // 2. Financial objects: { amount: "...", description: "..." }
            if (val.description && val.amount) {
                return `${safeString(val.description)}: ${safeString(val.amount)}`;
            }
            if (val.title && val.amount) {
                return `${safeString(val.title)}: ${safeString(val.amount)}`;
            }
            if (val.item && val.amount) {
                return `${safeString(val.item)}: ${safeString(val.amount)}`;
            }

            // 3. Party objects: { name: "...", role: "..." }
            if (val.name && (val.role || val.type || val.party)) {
                const r = val.role || val.type || val.party;
                return `${safeString(val.name)}: ${safeString(r)}`;
            }
            if (val.party && (val.role || val.type)) {
                const r = val.role || val.type;
                return `${safeString(val.party)}: ${safeString(r)}`;
            }

            // 4. Clause objects: { clause: "...", simple_explanation: "..." }
            if (val.clause && (val.simple_explanation || val.explanation || val.description)) {
                const exp = val.simple_explanation || val.explanation || val.description;
                return `${safeString(val.clause)}: ${safeString(exp)}`;
            }

            // Generic object fallback: map non-empty key-value pairs cleanly
            const parts = [];
            for (const [k, v] of Object.entries(val)) {
                if (v !== null && v !== undefined && v !== '') {
                    const formattedVal = safeString(v);
                    if (formattedVal) {
                        const formattedKey = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        parts.push(`${formattedKey}: ${formattedVal}`);
                    }
                }
            }
            return parts.join(' · ') || fallback;
        }

        return String(val) || fallback;
    }

    // --- Render Analysis Results ---
    function displayResults(data) {
        currentAnalysisData = data;
        if (!data || typeof data !== 'object') return;

        // Document Overview
        document.getElementById('doc-type').textContent = safeString(data.document_type, 'Legal Document');
        document.getElementById('doc-summary').textContent = safeString(data.summary, 'No summary available.');
        document.getElementById('doc-simple-explanation').textContent = safeString(data.simple_explanation, 'No explanation available.');

        // Overall Attention Level Badge
        const badgeElem = document.getElementById('overall-attention-badge');
        const level = safeString(data.overall_attention_level, 'Medium').trim();
        badgeElem.textContent = `Attention: ${level}`;
        badgeElem.className = 'badge ' + getBadgeClass(level);

        // Key Information Lists
        renderList('parties-list', data.parties);
        renderList('dates-list', data.important_dates);
        renderList('financial-list', data.financial_obligations);

        // Combine key_points, rights, responsibilities, etc. cleanly
        const rawKeyPoints = [];
        const appendField = (val) => {
            if (!val) return;
            if (Array.isArray(val)) rawKeyPoints.push(...val);
            else rawKeyPoints.push(val);
        };

        appendField(data.key_points);
        appendField(data.rights);
        appendField(data.responsibilities);
        appendField(data.termination_conditions);
        appendField(data.applicable_laws);
        appendField(data.questions_to_consider);

        const cleanedKeyPoints = rawKeyPoints.map(item => cleanRightText(item)).filter(Boolean);
        const uniquePoints = Array.from(new Set(cleanedKeyPoints));
        renderList('key-points-list', uniquePoints);

        // Important Clauses Cards
        renderClauses(data.important_clauses || []);

        // Attention Areas Cards
        renderAttentionAreas(data.attention_areas || []);

        // Render Party Favorability Analysis
        renderFavorabilityAnalysis(data);

        // Clear previous Q&A thread
        askResults.innerHTML = '';

        // Show Results Section
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function cleanRightText(text) {
        if (!text) return '';
        let s = safeString(text);
        if (!s) return '';
        // Remove repetitive "Right:" or "Right: " prefix at start
        s = s.replace(/^Right:\s*/i, '').trim();
        return s;
    }

    function renderList(elementId, items) {
        const listElem = document.getElementById(elementId);
        if (!listElem) return;
        listElem.innerHTML = '';

        let arrayItems = [];
        if (Array.isArray(items)) {
            arrayItems = items;
        } else if (items !== null && items !== undefined && items !== '') {
            arrayItems = [items];
        }

        if (arrayItems.length === 0) {
            listElem.innerHTML = '<li class="text-muted">Not specified in the document.</li>';
            return;
        }

        let addedCount = 0;
        arrayItems.forEach(rawItem => {
            const formattedString = safeString(rawItem);
            const item = cleanRightText(formattedString);
            if (!item) return;

            addedCount++;
            const li = document.createElement('li');

            // Format labeled items such as "Agreement Start Date: ..." or "Client Right: ..." cleanly
            if (item.includes(':')) {
                const colonIdx = item.indexOf(':');
                const label = item.substring(0, colonIdx).trim();
                const detailText = item.substring(colonIdx + 1).trim();

                if (detailText) {
                    li.innerHTML = `<strong class="right-label-badge">${escapeHtml(label)}</strong><div class="right-item-text">${escapeHtml(detailText)}</div>`;
                } else {
                    li.textContent = item;
                }
            } else {
                li.textContent = item;
            }
            listElem.appendChild(li);
        });

        if (addedCount === 0) {
            listElem.innerHTML = '<li class="text-muted">Not specified in the document.</li>';
        }
    }

    function renderClauses(clauses) {
        const container = document.getElementById('clauses-container');
        if (!container) return;
        container.innerHTML = '';

        let clauseList = [];
        if (Array.isArray(clauses)) {
            clauseList = clauses;
        } else if (clauses && typeof clauses === 'object') {
            clauseList = [clauses];
        }

        if (clauseList.length === 0) {
            container.innerHTML = '<p class="text-muted">No key clauses highlighted.</p>';
            return;
        }

        clauseList.forEach((item, index) => {
            const numStr = String(index + 1).padStart(2, '0');
            let clauseTitle = '';
            let simpleExp = '';
            let originalText = '';
            let importance = 'Medium';

            if (typeof item === 'string' || typeof item === 'number') {
                clauseTitle = 'Clause ' + (index + 1);
                simpleExp = safeString(item);
            } else if (item && typeof item === 'object') {
                clauseTitle = safeString(item.clause || item.title || item.name || item.heading, 'Important Clause');
                simpleExp = safeString(item.simple_explanation || item.explanation || item.description || item.summary, 'N/A');
                originalText = safeString(item.original_text || item.text || item.quote, '');
                importance = safeString(item.importance || item.severity, 'Medium');
            } else {
                clauseTitle = 'Clause ' + (index + 1);
                simpleExp = safeString(item, 'N/A');
            }

            const badgeClass = getBadgeClass(importance);
            const row = document.createElement('div');
            row.className = 'clause-row-block';

            row.innerHTML = `
                <div class="clause-row-header">
                    <div class="clause-row-left">
                        <span class="clause-number">${numStr}</span>
                        <h3 class="clause-row-title">${escapeHtml(clauseTitle)}</h3>
                    </div>
                    <div class="clause-row-actions">
                        <span class="badge ${badgeClass}">${escapeHtml(importance.toUpperCase())}</span>
                        ${originalText ? `<button class="btn-text toggle-clause-btn">View Original Clause</button>` : ''}
                    </div>
                </div>
                <div class="clause-body-content">
                    <p class="clause-explanation-text">${escapeHtml(simpleExp)}</p>
                    ${originalText ? `
                        <div class="clause-original-drawer hidden">
                            <strong class="text-muted" style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em;">Original Clause Text</strong>
                            <div class="original-text-quote">"${escapeHtml(originalText)}"</div>
                        </div>
                    ` : ''}
                </div>
            `;

            const toggleBtn = row.querySelector('.toggle-clause-btn');
            if (toggleBtn) {
                const drawer = row.querySelector('.clause-original-drawer');
                toggleBtn.addEventListener('click', () => {
                    drawer.classList.toggle('hidden');
                    toggleBtn.textContent = drawer.classList.contains('hidden') ? 'View Original Clause' : 'Hide Original Clause';
                });
            }

            container.appendChild(row);
        });
    }

    function renderAttentionAreas(areas) {
        const container = document.getElementById('attention-container');
        if (!container) return;
        container.innerHTML = '';

        let areaList = [];
        if (Array.isArray(areas)) {
            areaList = areas;
        } else if (areas && typeof areas === 'object') {
            areaList = [areas];
        }

        if (areaList.length === 0) {
            container.innerHTML = '<p class="text-muted">No specific attention areas identified.</p>';
            return;
        }

        areaList.forEach((item, index) => {
            const numStr = String(index + 1).padStart(2, '0');
            let title = '';
            let description = '';
            let severity = 'Medium';

            if (typeof item === 'string' || typeof item === 'number') {
                title = 'Provision ' + (index + 1);
                description = safeString(item);
            } else if (item && typeof item === 'object') {
                title = safeString(item.title || item.clause || item.name || item.topic, 'Attention Provision');
                description = safeString(item.description || item.simple_explanation || item.explanation || item.summary, 'N/A');
                severity = safeString(item.severity || item.importance, 'Medium');
            } else {
                title = 'Provision ' + (index + 1);
                description = safeString(item, 'N/A');
            }

            const badgeClass = getBadgeClass(severity);
            const row = document.createElement('div');
            row.className = 'attention-row-card';

            row.innerHTML = `
                <div style="display:flex; gap:20px; align-items:flex-start;">
                    <span class="clause-number">${numStr}</span>
                    <div>
                        <h3 class="attention-row-title">${escapeHtml(title)}</h3>
                        <p class="attention-row-desc">${escapeHtml(description)}</p>
                    </div>
                </div>
                <div>
                    <span class="badge ${badgeClass}">${escapeHtml(severity.toUpperCase())}</span>
                </div>
            `;

            container.appendChild(row);
        });
    }

    function getBadgeClass(level) {
        const l = safeString(level).toLowerCase();
        if (l.includes('high')) return 'badge-high';
        if (l.includes('low')) return 'badge-low';
        return 'badge-medium';
    }

    function escapeHtml(str) {
        return safeString(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // --- Party Favorability Analysis ---
    function renderFavorabilityAnalysis(data) {
        const fav = (data && data.favorability_analysis) ? data.favorability_analysis : {};
        const partyNameElem = document.getElementById('fav-party-name');
        const scoreDisplayElem = document.getElementById('fav-score-display');
        const confidenceBadgeElem = document.getElementById('fav-confidence-badge');
        const verdictDisplayElem = document.getElementById('fav-verdict-display');
        const scoresContainer = document.getElementById('fav-party-scores-container');
        const leadTextElem = document.getElementById('fav-overall-assessment');
        const reasonsListElem = document.getElementById('fav-reasons-list');
        const clausesGridElem = document.getElementById('fav-supporting-clauses');

        if (!partyNameElem) return;

        const favoredParty = safeString(fav.favored_party, 'Balanced');
        const score = fav.favorability_score !== undefined ? safeString(fav.favorability_score) : '50';
        const confidence = safeString(fav.confidence, 'Medium');
        const verdict = safeString(fav.verdict, 'Relatively balanced between the parties');
        const overallAssessment = safeString(fav.overall_assessment, 'No specific favorability assessment provided for this document.');
        const reasons = Array.isArray(fav.reasons) ? fav.reasons : (fav.reasons ? [fav.reasons] : []);
        const supportingClauses = Array.isArray(fav.supporting_clauses) ? fav.supporting_clauses : (fav.supporting_clauses ? [fav.supporting_clauses] : []);

        partyNameElem.textContent = favoredParty;
        scoreDisplayElem.textContent = `${score}/100`;

        confidenceBadgeElem.textContent = confidence.toUpperCase();
        confidenceBadgeElem.className = 'badge ' + getBadgeClass(confidence);

        verdictDisplayElem.textContent = verdict;
        leadTextElem.textContent = overallAssessment;

        // Render party score breakdown bars
        scoresContainer.innerHTML = '';
        const partyScores = Array.isArray(fav.party_scores) ? fav.party_scores : [];
        if (partyScores.length > 0) {
            partyScores.forEach(ps => {
                const item = document.createElement('div');
                item.className = 'party-score-row';
                const pName = escapeHtml(safeString(ps.party || ps.name || 'Party'));
                const rawScore = parseInt(ps.score || ps.value || 50, 10);
                const pScore = isNaN(rawScore) ? 50 : Math.min(100, Math.max(0, rawScore));
                item.innerHTML = `
                    <div class="party-score-label">
                        <span>${pName}</span>
                        <strong>${pScore}%</strong>
                    </div>
                    <div class="party-score-bar-bg">
                        <div class="party-score-bar-fill" style="width: ${pScore}%;"></div>
                    </div>
                `;
                scoresContainer.appendChild(item);
            });
        }

        // Render Reasons (Why?)
        reasonsListElem.innerHTML = '';
        if (reasons.length === 0) {
            reasonsListElem.innerHTML = '<li class="text-muted">No specific reasons detailed.</li>';
        } else {
            reasons.forEach(r => {
                const li = document.createElement('li');
                li.textContent = safeString(r);
                reasonsListElem.appendChild(li);
            });
        }

        // Render Supporting Clauses
        clausesGridElem.innerHTML = '';
        if (supportingClauses.length === 0) {
            clausesGridElem.innerHTML = '<p class="text-muted">No specific supporting clauses highlighted.</p>';
        } else {
            supportingClauses.forEach(sc => {
                const card = document.createElement('div');
                card.className = 'fav-clause-card';
                const clauseTitle = safeString(sc.clause || sc.title || 'Clause');
                const targetParty = safeString(sc.target_party || sc.party || sc.favors, '');
                const explanation = safeString(sc.explanation || sc.description || sc.reason, '');

                card.innerHTML = `
                    <div class="fav-clause-header">
                        <span class="fav-clause-title">${escapeHtml(clauseTitle)}</span>
                        ${targetParty ? `<span class="badge badge-medium">${escapeHtml(targetParty.toUpperCase())}</span>` : ''}
                    </div>
                    <p class="fav-clause-explanation">${escapeHtml(explanation)}</p>
                `;
                clausesGridElem.appendChild(card);
            });
        }
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
                <div class="qa-answer">${escapeHtml(safeString(data.answer))}</div>
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
        report += `Document Type: ${safeString(data.document_type, 'Legal Document')}\n`;
        report += `Overall Attention Level: ${safeString(data.overall_attention_level, 'Medium')}\n\n`;

        report += '--------------------------------------------------------------------\n';
        report += '1. SUMMARY\n';
        report += '--------------------------------------------------------------------\n';
        report += `${safeString(data.summary, 'N/A')}\n\n`;

        report += '--------------------------------------------------------------------\n';
        report += '2. SIMPLE EXPLANATION\n';
        report += '--------------------------------------------------------------------\n';
        report += `${safeString(data.simple_explanation, 'N/A')}\n\n`;

        report += '--------------------------------------------------------------------\n';
        report += '3. PARTIES INVOLVED\n';
        report += '--------------------------------------------------------------------\n';
        if (data.parties && ((Array.isArray(data.parties) && data.parties.length > 0) || typeof data.parties === 'object')) {
            const partyList = Array.isArray(data.parties) ? data.parties : [data.parties];
            partyList.forEach(p => report += `- ${safeString(p)}\n`);
        } else {
            report += 'Not specified in the document.\n';
        }
        report += '\n';

        report += '--------------------------------------------------------------------\n';
        report += '4. IMPORTANT DATES\n';
        report += '--------------------------------------------------------------------\n';
        if (data.important_dates && ((Array.isArray(data.important_dates) && data.important_dates.length > 0) || typeof data.important_dates === 'object')) {
            const dateList = Array.isArray(data.important_dates) ? data.important_dates : [data.important_dates];
            dateList.forEach(d => report += `- ${safeString(d)}\n`);
        } else {
            report += 'Not specified in the document.\n';
        }
        report += '\n';

        report += '--------------------------------------------------------------------\n';
        report += '5. FINANCIAL OBLIGATIONS\n';
        report += '--------------------------------------------------------------------\n';
        if (data.financial_obligations && ((Array.isArray(data.financial_obligations) && data.financial_obligations.length > 0) || typeof data.financial_obligations === 'object')) {
            const finList = Array.isArray(data.financial_obligations) ? data.financial_obligations : [data.financial_obligations];
            finList.forEach(f => report += `- ${safeString(f)}\n`);
        } else {
            report += 'Not specified in the document.\n';
        }
        report += '\n';

        report += '--------------------------------------------------------------------\n';
        report += '6. IMPORTANT CLAUSES\n';
        report += '--------------------------------------------------------------------\n';
        if (data.important_clauses && ((Array.isArray(data.important_clauses) && data.important_clauses.length > 0) || typeof data.important_clauses === 'object')) {
            const clauseList = Array.isArray(data.important_clauses) ? data.important_clauses : [data.important_clauses];
            clauseList.forEach((c, idx) => {
                const cTitle = safeString(c.clause || c.title || 'Clause');
                const cImp = safeString(c.importance || 'Medium');
                const cOrig = safeString(c.original_text || c.text, '');
                const cExp = safeString(c.simple_explanation || c.explanation, 'N/A');

                report += `[Clause ${idx + 1}] ${cTitle} (Importance: ${cImp})\n`;
                if (cOrig) report += `Original Text: "${cOrig}"\n`;
                report += `Simple Explanation: ${cExp}\n\n`;
            });
        } else {
            report += 'No key clauses highlighted.\n';
        }

        report += '--------------------------------------------------------------------\n';
        report += '7. AI-IDENTIFIED AREAS REQUIRING ATTENTION\n';
        report += '--------------------------------------------------------------------\n';
        if (data.attention_areas && ((Array.isArray(data.attention_areas) && data.attention_areas.length > 0) || typeof data.attention_areas === 'object')) {
            const areaList = Array.isArray(data.attention_areas) ? data.attention_areas : [data.attention_areas];
            areaList.forEach((a, idx) => {
                const aTitle = safeString(a.title || a.clause || 'Attention Item');
                const aSev = safeString(a.severity || 'Medium');
                const aDesc = safeString(a.description || a.simple_explanation, 'N/A');

                report += `[Area ${idx + 1}] ${aTitle} (Severity: ${aSev})\n`;
                report += `Description: ${aDesc}\n\n`;
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
        const safeName = safeString(data.document_type, 'Legal_Document').replace(/[^a-z0-9]/gi, '_');
        a.download = `OpenLaw_${safeName}_Report.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});
