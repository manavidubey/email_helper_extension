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

## Local Setup Instructions

### 1. Backend Configuration

The backend relies on the LiteLLM library to interface with language models (defaulting to Groq for speed and efficiency).

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install the required Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3.  Configure your environment variables. Create a `.env` file in the `backend` directory and add your API keys:
    ```env
    GROQ_API_KEY=your_groq_api_key_here
    LLM_MODEL=groq/llama-3.1-8b-instant
    ```

4.  Start the FastAPI server:
    ```bash
    python main.py
    ```
    The backend will start running locally at `http://localhost:8080`.

### 2. Frontend Configuration (Chrome Extension)

The Chrome extension needs to be loaded into your browser in Developer Mode.

1.  Open Google Chrome and navigate to the Extensions page:
    ```text
    chrome://extensions/
    ```

2.  Enable **Developer mode** by toggling the switch in the top right corner of the page.

3.  Click the **Load unpacked** button.

4.  Select the `extension` directory located within this project's root folder.

### 3. Usage

1.  Navigate to Gmail in your Chrome browser.
2.  Open any email thread. You will see a "Email Helper" button injected into the bottom right corner of the page.
3.  Click the button to access the dashboard.
4.  Use the **Summarize Thread** feature to extract key decisions and action items, or use the **Smart Reply** feature with a specified intent to automatically draft a contextual response.
5.  Click the Settings (gear) icon in the dashboard header to customize the system prompts that guide the AI agents.

## Deployment

The backend is containerized and can be deployed to cloud platforms such as Google Cloud Run. A `deploy.sh` script is included in the root directory as an example of deploying the service via Google Cloud Build to Artifact Registry and Cloud Run.

To deploy to Google Cloud Run, ensure the Google Cloud CLI is authenticated and configured, then execute:

```bash
bash deploy.sh
```

Remember to update the `API_BASE_URL` in `extension/content.js` to point to your new live cloud endpoint after a successful deployment.
