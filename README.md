# Nexus ITAM — Software Asset Management

<div align="center">

**Smarter software asset and license management.**

A centralized platform for managing software inventory, vendors, licenses, costs, and updates, with the support of locally hosted Artificial Intelligence.

</div>

---

## About the Project

**Nexus ITAM** is a software asset management application designed to centralize and simplify the management of an organization's software inventory, vendors, and licenses.

The platform helps organizations monitor their software assets, track license expiration dates, identify outdated software, and gain visibility into software-related costs.

It also integrates with **Ollama**, enabling locally hosted AI capabilities to generate recommendations and support data-driven administrative decisions.

## Features

### Dashboard

- Overview of software inventory indicators.
- Total number of registered software products and vendors.
- Monitoring of active, expired, and expiring licenses.
- Identification of outdated software.
- Annual software cost overview.
- Charts displaying software distribution by vendor and costs by vendor.

### Software Management

- Register software products.
- Associate software with vendors.
- Track installed and recommended versions.
- Identify outdated software.
- Edit and delete software records.

### Vendor Management

- Register software vendors.
- Store vendor contact information.
- View, edit, and delete vendor records.

### License Management

- Register software licenses.
- Manage license quantities and annual costs.
- Track license start and expiration dates.
- Identify active, expired, and expiring licenses.
- Edit and delete license records.

### Artificial Intelligence Integration

- Integration with Ollama for locally hosted AI execution.
- AI-generated recommendations to support software asset management.
- Analysis of registered information to assist administrative decision-making.

## Technologies

| Technology | Purpose |
|---|---|
| HTML5 | Frontend structure |
| CSS3 | Styling and responsive interface |
| JavaScript | Frontend interactivity and API integration |
| Chart.js | Data visualization and charts |
| Python | Backend development |
| FastAPI | REST API development |
| SQLite | Database management |
| Ollama | Local Artificial Intelligence integration |

## Project Structure

```text
gestao-softwares/
│
├── backend/
│   ├── routers/
│   │   ├── dashboard.py
│   │   ├── fornecedores.py
│   │   ├── licencas.py
│   │   └── softwares.py
│   ├── database.py
│   ├── schemas.py
│   └── ...
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
│
├── .gitignore
└── README.md
```

*Note: This tree represents the main project structure. Additional files and modules may exist.*

## Getting Started

Follow the steps below to run the application locally.

### Prerequisites

Make sure you have installed:

- Python 3
- Git
- Ollama (for AI features)
- Visual Studio Code (recommended for frontend development)

### 1. Clone the repository

```bash
git clone https://github.com/Maria-Basilio/gestao-softwares.git
cd gestao-softwares
```

### 2. Set up the virtual environment

```bash
cd backend
python3 -m venv .venv
```

Activate the environment:

**macOS / Linux**

```bash
source .venv/bin/activate
```

**Windows**

```bash
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the backend

```bash
uvicorn main:app --reload
```

The API will be available at:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

### 5. Run the frontend

With the backend running, open the `frontend` folder using a development server, such as the Live Server extension in Visual Studio Code.

The frontend is configured to communicate with the local API at:

`http://127.0.0.1:8000`

### 6. Configure local AI

Install Ollama and download the model used by the project:

```bash
ollama pull llama3.2
```

Make sure Ollama is running before accessing the AI-powered features.

## Project Goals

Nexus ITAM aims to make software asset management more efficient by providing a centralized view of software inventory, vendors, licenses, costs, and updates.

Beyond operational management, the application explores the use of locally hosted Artificial Intelligence to turn registered information into actionable recommendations, helping identify potential risks and opportunities for improvement.

## Author

**Maria Eduarda Basilio**

Software Engineering Student | Backend Development | Artificial Intelligence

[GitHub Profile](https://github.com/Maria-Basilio)

---

<div align="center">

**Nexus ITAM**

*More control. More intelligence. Better software asset management.*

</div>
