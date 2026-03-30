#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Build Sarkari Afsar - a government jobs and schemes portal (sarkariafsar.com) with Next.js. Features: Job listings from external API (https://sarkariafsar.com/api), Government Scheme listings, Blog, Search, AI-powered summaries and FAQs using Gemini AI (gemini-2.5-flash-lite), and static pages (About, Contact, Privacy, Disclaimer)."

backend:
  - task: "Gemini AI Summarize API (/api/ai/summarize)"
    implemented: true
    working: true
    file: "app/api/ai/summarize/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Gemini AI summarize route works. Returns summary in ~600ms. Tested via curl."
      - working: true
        agent: "testing"
        comment: "Comprehensive testing completed. API returns proper JSON with summary field containing 3 sentences. Tested with job content, response time ~3s. Gemini-2.5-flash-lite model working correctly."

  - task: "Gemini AI FAQ API (/api/ai/faq)"
    implemented: true
    working: true
    file: "app/api/ai/faq/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "FAQ route works. Returns 4 FAQs as JSON array. Tested via curl."
      - working: true
        agent: "testing"
        comment: "Comprehensive testing completed. API returns proper JSON with faqs array containing 4 question/answer objects. Tested with scheme content, response time ~3s. JSON parsing and structure validation working correctly."

  - task: "External API proxy - Jobs listing"
    implemented: true
    working: true
    file: "app/jobs/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Calls https://sarkariafsar.com/api/post/ directly from client side. Returns real job data."

  - task: "External API proxy - Schemes listing"
    implemented: true
    working: true
    file: "app/yojana/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Calls https://sarkariafsar.com/api/schemes/ directly. Returns real schemes data."

frontend:
  - task: "Home Page with Jobs, Schemes, Blog sections"
    implemented: true
    working: true
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Home page renders with real data from external API. Hero section, stats bar, job cards, scheme cards visible."

  - task: "Job Detail Page with Gemini AI Summary + FAQ"
    implemented: true
    working: true
    file: "app/jobs/[slug]/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Job detail page shows Gemini AI summary and 4 FAQs server-side rendered. Verified with curl and screenshot."
      - working: true
        agent: "testing"
        comment: "Server-side AI integration working correctly. Job detail page loads with AI Assistant section containing summary and FAQ. Tested with /jobs/bpsc-dso-2026 slug. AI content generated server-side as expected."

  - task: "Scheme Detail Page with Gemini AI Summary + FAQ"
    implemented: true
    working: true
    file: "app/yojana/[slug]/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Scheme detail shows AI summary, required docs, process steps with Gemini AI FAQ. Verified with screenshot."
      - working: true
        agent: "testing"
        comment: "Server-side AI integration working correctly. Scheme detail page loads with AI Assistant section containing summary and FAQ. Tested with /yojana/indira-gandhi-national-disability-pension-scheme-igndps-viklang-pension slug. AI content generated server-side as expected."

  - task: "Jobs listing page with search and filters"
    implemented: true
    working: true
    file: "app/jobs/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Jobs listing with section filter buttons, search, pagination. Client-side with real API data."

  - task: "Yojana listing page with state filters"
    implemented: true
    working: true
    file: "app/yojana/page.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Yojana listing with state dropdown, search, state pills. Pagination included."

  - task: "Blog listing and detail pages"
    implemented: true
    working: true
    file: "app/blog/page.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Blog listing and detail pages implemented. Data from external API."

  - task: "Search page with cross-type results"
    implemented: true
    working: true
    file: "app/search/page.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Search page with Jobs, Schemes, Blog results grouped. useSearchParams with Suspense."

  - task: "Static pages (About, Contact, Privacy, Disclaimer)"
    implemented: true
    working: true
    file: "app/about/page.js, app/contact/page.js, app/privacy-policy/page.js, app/disclaimer/page.js"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "All static pages implemented with content. Contact form functional."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus:
    - "Gemini AI Summarize API (/api/ai/summarize)"
    - "Gemini AI FAQ API (/api/ai/faq)"
    - "Job Detail Page with Gemini AI Summary + FAQ"
    - "Scheme Detail Page with Gemini AI Summary + FAQ"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Built complete Sarkari Afsar portal. Key features: (1) Home page with real data from external API, (2) Jobs listing/detail with Gemini AI summary+FAQ server-side, (3) Yojana listing/detail with Gemini AI, (4) Blog, Search, all static pages. AI is called server-side in Next.js server components - NOT client-side, to avoid proxy timeouts. External API: https://sarkariafsar.com/api. Gemini model: gemini-2.5-flash-lite."
  - agent: "testing"
    message: "Completed comprehensive backend testing. All 9 backend tests PASSED: (1) Gemini AI Summarize API returns proper JSON with summary field, (2) Gemini AI FAQ API returns array of question/answer objects, (3) Home page loads successfully, (4) Job detail page shows AI summary server-side, (5) Scheme detail page shows AI summary server-side, (6) Jobs listing works, (7) Yojana listing works, (8) Search page works, (9) All static pages (About, Contact, Privacy, Disclaimer) work. Backend APIs are fully functional with proper Gemini AI integration."