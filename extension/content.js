/**
 * AI Executive Mail Assistant - Content Script
 * Handles button injection and Gmail interaction.
 */

const API_BASE_URL = 'https://ai-exec-backend-1012403291370.us-central1.run.app';

// Icons
const sparkleIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`;
const gearIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

// Helper: Inject buttons into Gmail
function injectButtons() {
    console.log('Checking for Gmail injection points...');

    // 1. Inject "Improve Draft" in Compose Window
    // Target only the exact compose toolbar row to prevent duplicates
    const composeToolbars = document.querySelectorAll('.btC');
    if (composeToolbars.length > 0) console.log(`Found ${composeToolbars.length} compose toolbars.`);

    composeToolbars.forEach(toolbar => {
        if (toolbar.dataset.aiInjected) return;
        toolbar.dataset.aiInjected = 'true';

        if (!toolbar.querySelector('.ai-exec-improve')) {
            console.log('Injecting Improve Draft button...');
            const btn = document.createElement('button');
            btn.className = 'ai-exec-improve ai-exec-btn';
            btn.innerHTML = `${sparkleIcon} <span>Improve Draft</span>`;
            btn.type = 'button';

            btn.onclick = async (e) => {
                e.preventDefault();
                const composeBox = toolbar.closest('.M9').querySelector('.Am'); // Editable area
                if (composeBox) {
                    const originalText = composeBox.innerText || composeBox.textContent;
                    if (!originalText.trim()) return;

                    btn.classList.add('ai-exec-loading');
                    btn.disabled = true;

                    try {
                        const customPrompt = await new Promise(resolve => {
                            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                                chrome.storage.local.get(['improvePrompt'], result => resolve(result.improvePrompt || ""));
                            } else {
                                resolve(""); // fallback if running outside extension
                            }
                        });

                        const response = await fetch(`${API_BASE_URL}/improve`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: originalText, custom_prompt: customPrompt })
                        });
                        const data = await response.json();
                        if (data.improved_text) {
                            // Inject improved text
                            composeBox.focus();
                            document.execCommand('selectAll', false, null);
                            document.execCommand('insertText', false, data.improved_text);
                        }
                    } catch (err) {
                        console.error('AI Assistant Error (Improve):', err);
                        alert(`Could not connect to backend: ${err.message}. Check console for details.`);
                    } finally {
                        btn.classList.remove('ai-exec-loading');
                        btn.disabled = false;
                    }
                }
            };

            // Add to the right of the Send button
            const sendBtnContainer = toolbar.querySelector('.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3');
            if (sendBtnContainer) {
                sendBtnContainer.parentNode.insertBefore(btn, sendBtnContainer.nextSibling);
            } else {
                toolbar.appendChild(btn);
            }
        }
    });

    // 2. Inject floating Chief of Staff Toggle Button (Manual override)
    if (!document.querySelector('.ai-exec-toggle-btn')) {
        console.log('Injecting permanent Email Helper toggle button...');

        // The Toggle Button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'ai-exec-toggle-btn';
        toggleBtn.innerHTML = `✨ Email Helper`;
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.bottom = '20px';
        toggleBtn.style.right = '20px';
        toggleBtn.style.zIndex = '999999';
        toggleBtn.style.backgroundColor = '#1a73e8';
        toggleBtn.style.color = 'white';
        toggleBtn.style.border = 'none';
        toggleBtn.style.borderRadius = '24px';
        toggleBtn.style.padding = '12px 20px';
        toggleBtn.style.fontSize = '14px';
        toggleBtn.style.fontWeight = '600';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.boxShadow = '0 4px 12px rgba(26, 115, 232, 0.4)';
        toggleBtn.style.transition = 'all 0.2s';

        // Hover effect inline
        toggleBtn.onmouseover = () => toggleBtn.style.transform = 'translateY(-2px)';
        toggleBtn.onmouseout = () => toggleBtn.style.transform = 'translateY(0)';

        // The Widget Panel (Hidden by default)
        const widget = document.createElement('div');
        widget.className = 'ai-exec-floating-widget';
        widget.style.position = 'fixed';
        widget.style.bottom = '70px'; // Above the toggle button
        widget.style.right = '20px';
        widget.style.zIndex = '999999';
        widget.style.display = 'none'; // Hidden initially
        widget.style.flexDirection = 'column';
        widget.style.gap = '10px';
        widget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
        widget.style.padding = '16px';
        widget.style.borderRadius = '12px';
        widget.style.backgroundColor = 'white';
        widget.style.border = '1px solid #e2e8f0';
        widget.style.width = '260px';

        const headerContainer = document.createElement('div');
        headerContainer.style.display = 'flex';
        headerContainer.style.justifyContent = 'space-between';
        headerContainer.style.alignItems = 'center';
        headerContainer.style.marginBottom = '8px';
        
        const header = document.createElement('div');
        header.innerHTML = '<strong>✨ Email Helper</strong>';
        header.style.fontSize = '14px';
        header.style.color = '#1e293b';
        
        const settingsBtn = document.createElement('div');
        settingsBtn.innerHTML = gearIcon;
        settingsBtn.style.cursor = 'pointer';
        settingsBtn.style.color = '#64748b';
        settingsBtn.style.display = 'flex';
        settingsBtn.title = 'Settings';
        settingsBtn.onmouseover = () => settingsBtn.style.color = '#1e293b';
        settingsBtn.onmouseout = () => settingsBtn.style.color = '#64748b';
        settingsBtn.onclick = () => openSettingsModal();
        
        headerContainer.appendChild(header);
        headerContainer.appendChild(settingsBtn);
        widget.appendChild(headerContainer);

        // Summarize Button
        const summarizeBtn = document.createElement('button');
        summarizeBtn.className = 'ai-exec-btn';
        summarizeBtn.innerHTML = `<span>Summarize Thread</span>`;
        summarizeBtn.style.backgroundColor = '#f8fafc';
        summarizeBtn.style.color = '#0f172a';
        summarizeBtn.style.border = '1px solid #e2e8f0';
        summarizeBtn.style.width = '100%';
        summarizeBtn.onclick = () => handleSummarize();

        // Reply Button
        const replyBtn = document.createElement('button');
        replyBtn.className = 'ai-exec-btn';
        replyBtn.innerHTML = `<span>Smart Reply</span>`;
        replyBtn.style.backgroundColor = '#2563eb';
        replyBtn.style.color = 'white';
        replyBtn.style.width = '100%';
        replyBtn.style.border = 'none';

        // Intent UI Panel (Hidden by default)
        const intentPanel = document.createElement('div');
        intentPanel.style.display = 'none';
        intentPanel.style.flexDirection = 'column';
        intentPanel.style.gap = '8px';
        intentPanel.style.marginTop = '4px';
        intentPanel.style.borderTop = '1px solid #e2e8f0';
        intentPanel.style.paddingTop = '12px';

        const intentPrompt = document.createElement('div');
        intentPrompt.innerHTML = 'What is your intent?';
        intentPrompt.style.fontSize = '12px';
        intentPrompt.style.color = '#64748b';
        intentPrompt.style.marginBottom = '4px';
        intentPanel.appendChild(intentPrompt);

        // Grid for quick action buttons
        const buttonGrid = document.createElement('div');
        buttonGrid.style.display = 'grid';
        buttonGrid.style.gridTemplateColumns = '1fr 1fr';
        buttonGrid.style.gap = '6px';
        intentPanel.appendChild(buttonGrid);

        const intents = [
            { label: '✅ Approve', value: 'Approve and agree with the email' },
            { label: '❌ Decline', value: 'Politely decline or say no' },
            { label: '📅 Schedule', value: 'Propose to schedule a meeting' },
            { label: '❓ Ask Info', value: 'Ask for more information or clarification' },
            { label: '⏳ Delay', value: 'Acknowledge but delay action to later' },
            { label: '👔 Generic', value: 'Write a standard professional reply' }
        ];

        intents.forEach(intent => {
            const btn = document.createElement('button');
            btn.innerHTML = intent.label;
            btn.style.padding = '6px';
            btn.style.backgroundColor = '#f1f5f9';
            btn.style.color = '#334155';
            btn.style.border = '1px solid #cbd5e1';
            btn.style.borderRadius = '6px';
            btn.style.cursor = 'pointer';
            btn.style.fontSize = '12px';
            btn.style.fontWeight = '500';
            btn.style.transition = 'background-color 0.2s';

            btn.onmouseover = () => btn.style.backgroundColor = '#e2e8f0';
            btn.onmouseout = () => btn.style.backgroundColor = '#f1f5f9';

            btn.onclick = () => {
                // Update all buttons to loading state visually
                const allBtns = buttonGrid.querySelectorAll('button');
                allBtns.forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
                btn.innerHTML = 'Generating...';
                btn.style.opacity = '1';
                btn.classList.add('ai-exec-loading');

                handleReply(intent.value, summarizeBtn, replyBtn, intentPanel, btn, allBtns, intent.label);
            };
            buttonGrid.appendChild(btn);
        });

        // Custom Typed Intent Support
        const customIntentDiv = document.createElement('div');
        customIntentDiv.style.display = 'flex';
        customIntentDiv.style.gap = '6px';
        customIntentDiv.style.marginTop = '6px';

        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.placeholder = 'Or type custom intent...';
        customInput.style.flex = '1';
        customInput.style.padding = '8px 10px';
        customInput.style.border = '1px solid #cbd5e1';
        customInput.style.borderRadius = '6px';
        customInput.style.fontSize = '12px';
        customInput.style.outline = 'none';

        const customGoBtn = document.createElement('button');
        customGoBtn.innerHTML = '✨';
        customGoBtn.style.padding = '8px 12px';
        customGoBtn.style.backgroundColor = '#1a73e8';
        customGoBtn.style.color = 'white';
        customGoBtn.style.border = 'none';
        customGoBtn.style.borderRadius = '6px';
        customGoBtn.style.cursor = 'pointer';

        customGoBtn.onclick = () => {
            const text = customInput.value.trim();
            if (!text) return;

            const allBtns = intentPanel.querySelectorAll('button');
            allBtns.forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
            customGoBtn.innerHTML = '...';
            customGoBtn.style.opacity = '1';
            
            handleReply(text, summarizeBtn, replyBtn, intentPanel, customGoBtn, allBtns, '✨');
        };

        customInput.onkeypress = (e) => {
            if (e.key === 'Enter') customGoBtn.click();
        };

        customIntentDiv.appendChild(customInput);
        customIntentDiv.appendChild(customGoBtn);
        intentPanel.appendChild(customIntentDiv);

        const cancelBtn = document.createElement('button');
        cancelBtn.innerHTML = `Cancel`;
        cancelBtn.style.padding = '6px';
        cancelBtn.style.backgroundColor = 'transparent';
        cancelBtn.style.color = '#94a3b8';
        cancelBtn.style.border = 'none';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.fontSize = '12px';
        cancelBtn.style.marginTop = '4px';
        
        cancelBtn.onmouseover = () => cancelBtn.style.color = '#ef4444';
        cancelBtn.onmouseout = () => cancelBtn.style.color = '#94a3b8';

        cancelBtn.onclick = () => {
            intentPanel.style.display = 'none';
            summarizeBtn.style.display = 'inline-flex';
            replyBtn.style.display = 'inline-flex';
            customInput.value = ''; // clear when cancelling
        };
        intentPanel.appendChild(cancelBtn);

        replyBtn.onclick = () => {
            replyBtn.style.display = 'none';
            summarizeBtn.style.display = 'none';
            intentPanel.style.display = 'flex';
        };


        widget.appendChild(summarizeBtn);
        widget.appendChild(replyBtn);
        widget.appendChild(intentPanel);

        // Toggle logic
        toggleBtn.onclick = () => {
            if (widget.style.display === 'none') {
                widget.style.display = 'flex';
                toggleBtn.innerHTML = `✕ Close`;
                toggleBtn.style.backgroundColor = '#ef4444'; // Red when open
                toggleBtn.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
            } else {
                widget.style.display = 'none';
                toggleBtn.innerHTML = `✨ Email Helper`;
                toggleBtn.style.backgroundColor = '#1a73e8'; // Blue when closed
                toggleBtn.style.boxShadow = '0 4px 12px rgba(26, 115, 232, 0.4)';
                // Reset intent panel if it was open
                cancelBtn.click();
            }
        };

        document.body.appendChild(toggleBtn);
        document.body.appendChild(widget);
    }
}

// Action: Handle Reply
async function handleReply(intent, summarizeBtn, replyBtn, intentPanel, clickedBtn, allBtns, originalLabel) {
    const threadText = extractThreadText();
    if (!threadText) {
        alert("Could not extract email text. Please open an email thread payload first.");

        // Reset UI if error occurs early
        clickedBtn.innerHTML = originalLabel;
        clickedBtn.classList.remove('ai-exec-loading');
        allBtns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
        return;
    }

    try {
        const customPrompt = await new Promise(resolve => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['replyPrompt'], result => resolve(result.replyPrompt || ""));
            } else {
                resolve("");
            }
        });

        const response = await fetch(`${API_BASE_URL}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: threadText, intent: (intent || "").trim(), custom_prompt: customPrompt })
        });
        const data = await response.json();

        // 1. Try to click Gmail's internal reply button to open the compose box
        const gmailReplyBtn = document.querySelector('.ams.bkH, .T-I.J-J5-Ji.T-I-KE.L3, div[data-tooltip="Reply"]');
        if (gmailReplyBtn) {
            gmailReplyBtn.click();
        }

        // Wait a short moment for the compose box to animate in
        setTimeout(() => {
            const composeBox = document.querySelector('.Am.Al.editable, div[aria-label="Message Body"]');
            if (composeBox) {
                composeBox.focus();
                document.execCommand('selectAll', false, null);
                document.execCommand('insertText', false, data.reply_text);
            } else {
                showModal("Generated Reply", `
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">Intent: ${originalLabel || "Generic"}</div>
                    <div style="margin-bottom: 15px; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">${data.reply_text.replace(/\n/g, '<br>')}</div>
                    <div style="font-size: 12px; color: #ef4444;">Could not automatically find the compose box. Please copy manually.</div>
                `);
            }
        }, 800);

    } catch (err) {
        alert("Could not connect to backend.");
    } finally {
        clickedBtn.innerHTML = originalLabel;
        clickedBtn.classList.remove('ai-exec-loading');
        allBtns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });

        // Reset widget UI
        intentPanel.style.display = 'none';
        summarizeBtn.style.display = 'inline-flex';
        replyBtn.style.display = 'inline-flex';
    }
}


// Helper: Extract thread text
function extractThreadText() {
    // Target the actual message bodies in Gmail
    const messages = document.querySelectorAll('.a3s.aiL, .ii.gt, .adn.ads');
    let text = "";

    // Use a Set to avoid duplicating nested quotes
    const seenTexts = new Set();

    messages.forEach(msg => {
        const msgText = (msg.innerText || msg.textContent || "").trim();
        if (msgText && !seenTexts.has(msgText)) {
            text += "--- Message ---\n";
            text += msgText + "\n\n";
            seenTexts.add(msgText);
        }
    });
    return text;
}

// Action: Handle Summarize
async function handleSummarize() {
    const threadText = extractThreadText();
    if (!threadText) {
        alert("Could not extract email text. Please ensure the email is fully expanded/opened.");
        return;
    }

    showModal("Email Helper: Analyzing Thread...");

    try {
        const customPrompt = await new Promise(resolve => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['summarizePrompt'], result => resolve(result.summarizePrompt || ""));
            } else {
                resolve("");
            }
        });

        const response = await fetch(`${API_BASE_URL}/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: threadText, custom_prompt: customPrompt })
        });

        let data = await response.json();

        // Sometimes LLMs return the JSON wrapped in markdown blocks
        if (typeof data === 'string') {
            try { data = JSON.parse(data.replace(/```json/g, '').replace(/```/g, '').trim()); } catch (e) { }
        }

        let priorityColor = data.priority === 'High' ? '#ef4444' : (data.priority === 'Medium' ? '#f59e0b' : '#3b82f6');

        let html = `
            <div style="margin-bottom: 16px; display: flex; justify-content: right;">
                <span style="background: ${priorityColor}; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 600; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">${data.priority || 'Normal'} Priority</span>
            </div>
            
            <div style="margin-bottom: 20px; font-size: 15px; color: #1e293b; line-height: 1.6; background: #f8fafc; padding: 12px; border-left: 3px solid #3b82f6; border-radius: 4px;">
                ${data.summary || "No summary available."}
            </div>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                <h4 style="margin: 0 0 12px 0; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">✓ Action Items</h4>
                ${data.action_items && data.action_items.length > 0 ? `
                <ul style="margin: 0; padding-left: 20px; color: #475569;">
                    ${data.action_items.map(item => `<li>${item}</li>`).join('')}
                </ul>
                ` : '<div style="color: #64748b; font-style: italic;">No clear action items identified.</div>'}
            </div>
        `;

        updateModal("Email Helper Dashboard", html);
    } catch (err) {
        console.error(err);
        updateModal("Error", "Could not parse analysis. The model might not have returned valid JSON.");
    }
}

// UI: Simple Modal
function showModal(title, content = "Processing...") {
    let modal = document.querySelector('.ai-exec-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'ai-exec-modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="ai-exec-modal-header">
            <span>${title}</span>
            <span class="ai-exec-modal-close">✕</span>
        </div>
        <div class="ai-exec-modal-content">
            ${content.replace(/\n/g, '<br>')}
        </div>
    `;

    modal.querySelector('.ai-exec-modal-close').onclick = () => modal.remove();
}

function updateModal(title, content) {
    const modal = document.querySelector('.ai-exec-modal');
    if (modal) {
        modal.querySelector('.ai-exec-modal-header span').innerText = title;
        modal.querySelector('.ai-exec-modal-content').innerHTML = content.replace(/\n/g, '<br>');
    }
}

// Observe for Gmail DOM changes
const observer = new MutationObserver((mutations) => {
    // Debounce injection slightly to prevent UI thrashing
    clearTimeout(window.aiExecTimeout);
    window.aiExecTimeout = setTimeout(injectButtons, 200);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Fallback interval to ensure it stays injected
setInterval(injectButtons, 1500);

// Initial injection
injectButtons();
console.log('Email Helper loaded.');

// UI: Settings Modal
function openSettingsModal() {
    let modal = document.querySelector('.ai-exec-settings-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'ai-exec-settings-modal'; 
        
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.backgroundColor = 'white';
        modal.style.padding = '24px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        modal.style.zIndex = '10000000';
        modal.style.width = '400px';
        modal.style.maxWidth = '90vw';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.gap = '16px';
        
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'flex';
    
    const renderModal = (result) => {
        const defaultImprove = "You are an executive communication assistant. Write concise, professional, and clear emails.";
        const defaultSummarize = "Identify the overall priority of the most recent message (High, Medium, or Low).\\nExtract any concrete action items or next steps required of the executive.";
        const defaultReply = "Write a highly polished, professional, and precise email reply that strictly adheres to the executive's intent. Do not include placeholder text like '[Your Name]'. Do not include conversational filler before or after the email draft.";

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                <h3 style="margin: 0; font-size: 16px; color: #1e293b;">⚙️ Email Helper Settings</h3>
                <span class="ai-exec-settings-close" style="cursor: pointer; color: #94a3b8; font-size: 18px;">✕</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 12px; font-weight: 600; color: #475569;">Improve Draft Settings</label>
                <textarea id="ai-exec-improve-prompt" style="width: 100%; height: 60px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; resize: none; outline: none; box-sizing: border-box;">${result.improvePrompt || defaultImprove}</textarea>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 12px; font-weight: 600; color: #475569;">Summarize Settings</label>
                <textarea id="ai-exec-summarize-prompt" style="width: 100%; height: 60px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; resize: none; outline: none; box-sizing: border-box;">${result.summarizePrompt || defaultSummarize}</textarea>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 12px; font-weight: 600; color: #475569;">Smart Reply Settings</label>
                <textarea id="ai-exec-reply-prompt" style="width: 100%; height: 60px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; resize: none; outline: none; box-sizing: border-box;">${result.replyPrompt || defaultReply}</textarea>
            </div>
            
            <button id="ai-exec-save-settings" style="margin-top: 8px; background-color: #1a73e8; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer;">Save Settings</button>
        `;
        
        modal.querySelector('.ai-exec-settings-close').onclick = () => modal.style.display = 'none';
        
        modal.querySelector('#ai-exec-save-settings').onclick = () => {
            const btn = modal.querySelector('#ai-exec-save-settings');
            const improvePrompt = modal.querySelector('#ai-exec-improve-prompt').value;
            const summarizePrompt = modal.querySelector('#ai-exec-summarize-prompt').value;
            const replyPrompt = modal.querySelector('#ai-exec-reply-prompt').value;
            
            btn.innerText = 'Saving...';
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({
                    improvePrompt: improvePrompt,
                    summarizePrompt: summarizePrompt,
                    replyPrompt: replyPrompt
                }, () => {
                    btn.innerText = '✓ Saved Successfully';
                    btn.style.backgroundColor = '#10b981';
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 1000);
                });
            } else {
                alert("Chrome storage not available out side of extension context.");
            }
        };
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['improvePrompt', 'summarizePrompt', 'replyPrompt'], function(result) {
            renderModal(result);
        });
    } else {
        renderModal({});
    }
}
