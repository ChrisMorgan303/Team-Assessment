<div id="app" style="max-width:640px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <h3>2-Minute Team Snapshot</h3>
  <p id="progress" style="color:#666;"></p>
  <p id="category" style="font-weight:600;margin-top:10px;"></p>
  <div id="question" style="margin:15px 0;"></div>
  <div id="options" style="display:flex;gap:10px;"></div>

  <div style="margin-top:20px; display:flex; justify-content:space-between;">
    <button id="backBtn" onclick="goBack()">Back</button>
  </div>
</div>

<script>
const questions = [/* unchanged */];

let current = 0;
let answers = Array(questions.length).fill(null);

function render() {
  const q = questions[current];

  progress.innerText = `Question ${current + 1} of ${questions.length}`;
  category.innerText = q.category;
  question.innerHTML = `<p>${q.text}</p>`;

  options.innerHTML = q.labels.map((label, i) => {
    const selected = answers[current] === i + 1;
    return `
      <button onclick="select(${i + 1})"
        style="
          flex:1;
          padding:12px;
          border-radius:10px;
          border:1px solid ${selected ? '#000' : '#ccc'};
          background:${selected ? '#000' : '#f5f5f7'};
          color:${selected ? '#fff' : '#333'};
          cursor:pointer;
        ">
        ${label}
      </button>
    `;
  }).join("");

  backBtn.style.visibility = current === 0 ? "hidden" : "visible";
}

function formatAnswers() {
  return answers.map((score, i) => {
    const q = questions[i];
    return `Q${i+1} | ${q.category} | Score: ${score} | ${q.text}`;
  }).join("\n");
}

async function getAIReport() {
  const res = await fetch("https://team-assessment-delta.vercel.app/api/snapshot?v=" + Date.now(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: formatAnswers() })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");

  return data.result;
}

function formatReport(text) {
  return text
    .replace(/^Scores by Dimension/gm, "<div style='margin-top:20px;font-weight:600;'>Scores by Dimension</div>")
    .replace(/^Overall Assessment/gm, "<div style='margin-top:20px;font-weight:600;'>Overall Assessment</div>")
    .replace(/^Key Strengths/gm, "<div style='margin-top:20px;font-weight:600;'>Key Strengths</div>")
    .replace(/^Key Development Areas/gm, "<div style='margin-top:20px;font-weight:600;'>Key Development Areas</div>")
    .replace(/^Targeted Recommendations/gm, "<div style='margin-top:20px;font-weight:600;'>Targeted Recommendations</div>")
    .replace(/^Priority Focus/gm, "<div style='margin-top:25px;font-weight:700;'>Priority Focus</div>")
    .replace(/^Alignment$/gm, "<div style='margin-top:10px;font-weight:500;'>Alignment</div>")
    .replace(/^Organization$/gm, "<div style='margin-top:10px;font-weight:500;'>Organization</div>")
    .replace(/^People$/gm, "<div style='margin-top:10px;font-weight:500;'>People</div>")
    .replace(/(Alignment: \d\.\d)/g, "<strong>$1</strong>")
    .replace(/(Organization: \d\.\d)/g, "<strong>$1</strong>")
    .replace(/(People: \d\.\d)/g, "<strong>$1</strong>")
    .replace(/^- /gm, "• ")
    .replace(/\n/g, "<br>");
}

function downloadPDF() {
  const content = document.getElementById("reportContent").innerHTML;
  const win = window.open('', '', 'width=800,height=700');

  win.document.write(`
    <html>
    <head>
      <title>Team Assessment</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding:40px; line-height:1.6; }
      </style>
    </head>
    <body>
      <h1>Team Assessment</h1>
      ${content}
    </body>
    </html>
  `);

  win.document.close();
  win.print();
}

async function select(value) {
  answers[current] = value;

  if (current < questions.length - 1) {
    current++;
    render();
  } else {
    app.innerHTML = "<p>Analyzing your team…</p>";

    try {
      const report = await getAIReport();

      app.innerHTML = `
        <h3>Team Assessment</h3>

        <div id="reportContent" style="line-height:1.7;">
          ${formatReport(report)}
        </div>

        <div style="margin-top:25px;">
          <button onclick="downloadPDF()">Download PDF</button>
        </div>
      `;
    } catch (err) {
      app.innerHTML = `<h3>Error</h3><pre>${err.message}</pre>`;
    }
  }
}

function goBack() {
  if (current > 0) {
    current--;
    render();
  }
}

render();
</script>
