# Email Helper Extension

The Email Helper Extension is an AI-powered productivity tool designed to assist executives and professionals in managing their inboxes. It features a Google Chrome Extension that integrates directly into the Gmail interface and a FastAPI backend powered by CrewAI to orchestrate specialized AI agents for text analysis and generation.

## Architecture

This project is divided into two primary components:

1.  **Backend (FastAPI + CrewAI)**: A Python-based server that receives text from the extension and utilizes specialized AI agents (Email Analyst and Communications Executive) to parse threads, determine priority, extract action items, and draft context-aware replies.
2.  **Frontend (Chrome Extension)**: A lightweight Manifest V3 extension that injects interactive UI elements into Gmail, allowing users to summarize threads, generate smart replies based on explicit intent, and configure custom system prompts.

## Prerequisites

To set up the project on your local system, ensure you have the following installed:

*   Python 3.10 or higher
*   Google Chrome (or a Chromium-based browser)
*   Git

## Setup Instructions

The backend API is already securely hosted on Google Cloud Run, which means you only need to install the frontend Chrome Extension to get started.

### Setting up the Chrome Extension

The Chrome extension needs to be loaded into your browser in Developer Mode.

1.  Clone or download this repository to your local machine:
    ```bash
    git clone https://github.com/manavidubey/email_helper_extension.git
    ```

2.  Open Google Chrome and navigate to the Extensions page:
    ```text
    chrome://extensions/
    ```

3.  Enable **Developer mode** by toggling the switch in the top right corner of the page.

4.  Click the **Load unpacked** button.

5.  Select the `extension` folder located within this downloaded repository.

### Usage

1.  Navigate to Gmail in your Chrome browser.
2.  Open any email thread. You will see an "Email Helper" button injected into the bottom right corner of the page.
3.  Click the button to access the dashboard.
4.  Use the **Summarize Thread** feature to extract key priorities and action items, or use the **Smart Reply** feature with a specified intent to automatically draft a contextual response.
5.  Click the **Settings (gear) icon** in the dashboard header to customize the system prompts that guide the AI agents. You can add specific instructions like "use no subject line" or "always use a highly formal tone."

## Backend Details (For Developers)

The backend is a FastAPI application that utilizes LiteLLM to interface with language models (defaulting to Groq for speed and efficiency) and CrewAI to orchestrate the "Email Analyst" and "Communications Executive" multi-agent workflows.

If you wish to run your own instance of the backend:

1.  Navigate to the `backend` directory.
2.  Install dependencies: `pip install -r requirements.txt`.
3.  Set your environment variables in a `.env` file (e.g., `GROQ_API_KEY`, `OPENROUTER_API_KEY`).
4.  Run the server: `python main.py`.
5.  Update the `API_BASE_URL` in `extension/content.js` to point to your new local or cloud URL.
