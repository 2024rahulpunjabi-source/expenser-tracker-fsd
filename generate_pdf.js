import fs from 'fs';
import path from 'path';

class SimplePdfBuilder {
  constructor() {
    this.pages = [];
    this.currentPage = null;
    this.pageWidth = 595.28;
    this.pageHeight = 841.89;
    this.marginLeft = 40;
    this.marginRight = 40;
    this.contentWidth = this.pageWidth - this.marginLeft - this.marginRight;
    this.cursorY = 800;
  }

  escapeText(str) {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x20-\x7E]/g, (char) => {
        if (char === '₹') return 'Rs. ';
        if (char === '•' || char === '●') return '- ';
        if (char === '→' || char === '➜') return '-> ';
        if (char === '—' || char === '–') return '- ';
        if (char === '“' || char === '”') return '"';
        if (char === '‘' || char === '’') return "'";
        return '';
      });
  }

  addPage() {
    if (this.currentPage) {
      this.drawFooter();
    }
    this.currentPage = {
      commands: [],
      pageNumber: this.pages.length + 1,
    };
    this.pages.push(this.currentPage);
    this.cursorY = 800;
  }

  checkPageBreak(neededHeight) {
    if (this.cursorY - neededHeight < 50) {
      this.addPage();
    }
  }

  drawFooter() {
    if (!this.currentPage) return;
    const pageNum = this.currentPage.pageNumber;
    const cmd = `
0.8 0.83 0.88 RG
0.5 w
${this.marginLeft} 38 m ${this.marginLeft + this.contentWidth} 38 l S
0.4 0.45 0.55 rg
BT
/F1 8 Tf
${this.marginLeft} 26 Td
(ExpenseTracker PRO - Mini Project Evaluation Guide) Tj
ET
BT
/F2 8 Tf
${this.marginLeft + this.contentWidth - 60} 26 Td
(Page ${pageNum}) Tj
ET
`;
    this.currentPage.commands.push(cmd);
  }

  drawRect(x, y, w, h, fillRGB = null, strokeRGB = null, lineWidth = 1) {
    let cmd = '';
    if (fillRGB) {
      cmd += `${fillRGB[0]} ${fillRGB[1]} ${fillRGB[2]} rg\n`;
    }
    if (strokeRGB) {
      cmd += `${strokeRGB[0]} ${strokeRGB[1]} ${strokeRGB[2]} RG\n${lineWidth} w\n`;
    }
    cmd += `${x} ${y} ${w} ${h} re ${fillRGB && strokeRGB ? 'B' : fillRGB ? 'f' : 'S'}\n`;
    this.currentPage.commands.push(cmd);
  }

  drawText(text, x, y, options = {}) {
    const {
      font = 'F1',
      size = 10,
      color = [0.1, 0.1, 0.1],
    } = options;
    const escaped = this.escapeText(text);
    const cmd = `
${color[0]} ${color[1]} ${color[2]} rg
BT
/${font} ${size} Tf
${x} ${y} Td
(${escaped}) Tj
ET
`;
    this.currentPage.commands.push(cmd);
  }

  wrapText(text, font, size, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    const charWidth = font === 'F4' ? size * 0.60 : font === 'F2' ? size * 0.54 : size * 0.50;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = testLine.length * charWidth;
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  drawWrappedText(text, x, y, maxWidth, options = {}) {
    const {
      font = 'F1',
      size = 9.5,
      color = [0.2, 0.25, 0.3],
      lineHeight = 13,
    } = options;

    const lines = this.wrapText(text, font, size, maxWidth);
    let currentY = y;
    for (const line of lines) {
      this.drawText(line, x, currentY, { font, size, color });
      currentY -= lineHeight;
    }
    return lines.length * lineHeight;
  }

  build() {
    if (this.currentPage) {
      this.drawFooter();
    }

    const objects = [];
    const addObject = (c) => {
      objects.push(c);
      return objects.length;
    };

    // 1: Catalog
    // 2: Pages
    // 3: Font F1 (Helvetica)
    // 4: Font F2 (Helvetica-Bold)
    // 5: Font F3 (Helvetica-Oblique)
    // 6: Font F4 (Courier)
    const catObj = addObject('<< /Type /Catalog /Pages 2 0 R >>');
    addObject(''); // placeholder for Pages (obj 2)
    const f1 = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const f2 = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const f3 = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>');
    const f4 = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');

    const pageObjNums = [];

    for (const p of this.pages) {
      const streamContent = p.commands.join('\n');
      const streamLen = Buffer.byteLength(streamContent, 'utf8');
      const streamObjNum = addObject(`<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream`);

      const pageObjNum = addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Contents ${streamObjNum} 0 R /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R /F3 ${f3} 0 R /F4 ${f4} 0 R >> >> >>`);
      pageObjNums.push(pageObjNum);
    }

    // Update Pages obj (obj 2)
    objects[1] = `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${this.pages.length} >>`;

    // Render binary
    let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const xref = [0];

    for (let i = 0; i < objects.length; i++) {
      xref.push(Buffer.byteLength(out, 'binary'));
      out += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const startxref = Buffer.byteLength(out, 'binary');
    out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      const offset = String(xref[i]).padStart(10, '0');
      out += `${offset} 00000 n \n`;
    }
    out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

    return Buffer.from(out, 'binary');
  }
}

export function generateEvaluationGuidePdf(outputPath) {
  const doc = new SimplePdfBuilder();

  // Helper for drawing Topic Box
  const drawTopic = (num, title, badge, whatToShow, codeToShow, whatToSay) => {
    // Height estimation
    const boxWidth = doc.contentWidth;
    
    // Estimate heights
    const showLines = whatToShow.reduce((acc, item) => acc + doc.wrapText(item, 'F1', 8.5, boxWidth - 30).length, 0);
    const codeLines = codeToShow.reduce((acc, item) => acc + doc.wrapText(item, 'F4', 8, boxWidth - 30).length, 0);
    const sayLines = doc.wrapText(whatToSay, 'F3', 8.5, boxWidth - 26).length;

    const estimatedHeight = 32 + (showLines * 11 + 10) + (codeLines * 10 + 10) + (sayLines * 11 + 14) + 12;
    doc.checkPageBreak(estimatedHeight);

    const startY = doc.cursorY;
    const boxBottom = startY - estimatedHeight;

    // Outer card
    doc.drawRect(doc.marginLeft, boxBottom, boxWidth, estimatedHeight, [0.99, 0.99, 1.0], [0.86, 0.90, 0.94], 0.8);

    // Header bar
    doc.drawRect(doc.marginLeft, startY - 24, boxWidth, 24, [0.95, 0.96, 0.99], [0.86, 0.90, 0.94], 0.5);

    // Number pill
    doc.drawRect(doc.marginLeft + 8, startY - 19, 16, 14, [0.31, 0.27, 0.90]);
    doc.drawText(String(num), doc.marginLeft + 13, startY - 15, { font: 'F2', size: 9, color: [1, 1, 1] });

    // Title
    doc.drawText(title, doc.marginLeft + 30, startY - 15, { font: 'F2', size: 10, color: [0.08, 0.12, 0.2] });

    // Badge
    const badgeW = badge.length * 5.2 + 10;
    doc.drawRect(doc.marginLeft + boxWidth - badgeW - 8, startY - 18, badgeW, 12, [0.93, 0.95, 1.0], [0.78, 0.82, 0.98], 0.5);
    doc.drawText(badge, doc.marginLeft + boxWidth - badgeW - 3, startY - 15, { font: 'F2', size: 7.5, color: [0.26, 0.22, 0.79] });

    let currentY = startY - 34;

    // What to Show
    doc.drawText('WHAT TO DEMONSTRATE ON SCREEN:', doc.marginLeft + 10, currentY, { font: 'F2', size: 7.5, color: [0.01, 0.45, 0.78] });
    currentY -= 11;
    for (const item of whatToShow) {
      doc.drawText('-', doc.marginLeft + 12, currentY, { font: 'F2', size: 8.5, color: [0.2, 0.4, 0.7] });
      const h = doc.drawWrappedText(item, doc.marginLeft + 22, currentY, boxWidth - 32, { font: 'F1', size: 8.5, color: [0.15, 0.2, 0.25], lineHeight: 11 });
      currentY -= h;
    }

    currentY -= 3;
    // Code in VS Code
    doc.drawText('CODE & ARCHITECTURE TO POINT TO IN VS CODE:', doc.marginLeft + 10, currentY, { font: 'F2', size: 7.5, color: [0.45, 0.15, 0.85] });
    currentY -= 10;
    for (const item of codeToShow) {
      doc.drawText('>', doc.marginLeft + 12, currentY, { font: 'F2', size: 8, color: [0.5, 0.2, 0.8] });
      const h = doc.drawWrappedText(item, doc.marginLeft + 22, currentY, boxWidth - 32, { font: 'F4', size: 8, color: [0.2, 0.25, 0.35], lineHeight: 10 });
      currentY -= h;
    }

    currentY -= 4;
    // What to Say
    doc.drawText('WHAT TO SAY (VERBATIM VIVA SCRIPT):', doc.marginLeft + 10, currentY, { font: 'F2', size: 7.5, color: [0.03, 0.55, 0.35] });
    currentY -= 10;

    const sayH = doc.wrapText(whatToSay, 'F3', 8.5, boxWidth - 30).length * 11 + 6;
    doc.drawRect(doc.marginLeft + 10, currentY - sayH + 8, boxWidth - 20, sayH, [0.94, 0.99, 0.96], [0.65, 0.90, 0.75], 0.5);
    // green indicator bar
    doc.drawRect(doc.marginLeft + 10, currentY - sayH + 8, 3, sayH, [0.06, 0.65, 0.4]);
    doc.drawWrappedText(`"${whatToSay}"`, doc.marginLeft + 18, currentY, boxWidth - 34, { font: 'F3', size: 8.5, color: [0.03, 0.32, 0.2], lineHeight: 11 });

    doc.cursorY = boxBottom - 10;
  };

  // ================= PAGE 1 =================
  doc.addPage();

  // Document Title Header
  doc.drawRect(doc.marginLeft, doc.cursorY - 45, doc.contentWidth, 50, [0.98, 0.99, 1.0], [0.8, 0.85, 0.95], 1);
  doc.drawRect(doc.marginLeft, doc.cursorY - 45, 4, 50, [0.31, 0.27, 0.90]);

  doc.drawText('Mini Project Evaluation & Viva Master Guide', doc.marginLeft + 14, doc.cursorY - 12, { font: 'F2', size: 14, color: [0.06, 0.09, 0.16] });
  doc.drawText('ExpenseTracker PRO  |  Full-Stack Web Development (FSD)  |  100% Checklist Compliant', doc.marginLeft + 14, doc.cursorY - 26, { font: 'F2', size: 8.5, color: [0.31, 0.27, 0.90] });
  doc.drawText('Complete 9-Point Live Demonstration Script, Code Pointers, and Viva Q&A', doc.marginLeft + 14, doc.cursorY - 38, { font: 'F1', size: 8, color: [0.4, 0.45, 0.55] });

  doc.cursorY -= 56;

  // Pre-Demo Setup Box
  doc.drawRect(doc.marginLeft, doc.cursorY - 68, doc.contentWidth, 68, [0.96, 0.97, 0.99], [0.82, 0.86, 0.92], 0.8);
  doc.drawRect(doc.marginLeft, doc.cursorY - 68, 3, 68, [0.08, 0.55, 0.95]);

  doc.drawText('PRE-DEMO ENVIRONMENT SETUP (DO THIS BEFORE THE PROFESSOR ARRIVES)', doc.marginLeft + 10, doc.cursorY - 12, { font: 'F2', size: 8.5, color: [0.05, 0.35, 0.75] });

  doc.drawText('1. Open terminal at C:\\rahul\\expense-tracker-fsd and run:  npm run dev', doc.marginLeft + 12, doc.cursorY - 25, { font: 'F4', size: 8, color: [0.15, 0.2, 0.3] });
  doc.drawText('2. Open 3 browser tabs side-by-side:', doc.marginLeft + 12, doc.cursorY - 37, { font: 'F1', size: 8, color: [0.2, 0.25, 0.35] });
  doc.drawText('   * Tab 1 (Main App): http://localhost:5173  (Sign in as Admin: admin@example.com / Admin@123)', doc.marginLeft + 12, doc.cursorY - 48, { font: 'F4', size: 7.5, color: [0.25, 0.3, 0.4] });
  doc.drawText('   * Tab 2 (Incognito / 2nd Window): http://localhost:5173 (Sign in as User: user@example.com / User@123)', doc.marginLeft + 12, doc.cursorY - 58, { font: 'F4', size: 7.5, color: [0.25, 0.3, 0.4] });
  doc.drawText('   * Tab 3 (Swagger API Docs): http://localhost:5000/api-docs   |   Keep VS Code open at project root.', doc.marginLeft + 12, doc.cursorY - 68, { font: 'F4', size: 7.5, color: [0.25, 0.3, 0.4] });

  doc.cursorY -= 80;

  // Section Header: Topic Demonstrations
  doc.drawText('STEP-BY-STEP LIVE DEMONSTRATION SCRIPT (THE 9 CHECKLIST TOPICS)', doc.marginLeft, doc.cursorY, { font: 'F2', size: 10, color: [0.08, 0.12, 0.2] });
  doc.drawRect(doc.marginLeft, doc.cursorY - 4, doc.contentWidth, 1, [0.31, 0.27, 0.90]);
  doc.cursorY -= 12;

  // Topic 1
  drawTopic(
    1,
    'Frontend with Tailwind CSS',
    'Responsive UI & Themes',
    [
      'Open http://localhost:5173/login. Highlight the modern fintech aesthetic, gradients, and soft cards.',
      'Click the Sun/Moon toggle icon in top navbar: demonstrate instant Dark & Light mode switching.',
      'Press F12 and toggle Mobile / Tablet view in Chrome DevTools: show responsive collapsible sidebar and grid wrap.'
    ],
    [
      'client/tailwind.config.js - shows darkMode: "class", custom color palettes (brand), and responsive typography.',
      'client/src/components/Navbar.jsx - shows Tailwind utility classes (backdrop-blur-md, dark:bg-slate-900, transition-colors).'
    ],
    'I implemented a 100% utility-first responsive interface using Tailwind CSS without writing monolithic custom CSS. It features full mobile, tablet, and desktop responsiveness with an instant dark and light mode toggle synchronized with localStorage and HTML class attributes.'
  );

  // Topic 2
  drawTopic(
    2,
    'React & State Management',
    'Hooks & Context API',
    [
      'Open Transactions page: type "Food" or "Salary" in search - show instant debounced filtering without lag.',
      'Show that authentication session, theme, expenses, and socket state are globally available across routes.'
    ],
    [
      'client/src/context/AuthContext.jsx & ExpenseContext.jsx - React Context API providers avoiding prop drilling.',
      'client/src/hooks/useDebounce.js & useLocalStorage.js - custom reusable React hooks authored from scratch.'
    ],
    'Instead of relying on heavy third-party state managers like Redux, I utilized Reacts native Context API with 4 domain-separated contexts: AuthContext, ExpenseContext, ThemeContext, and SocketContext. I also authored custom hooks like useDebounce for search rate-limiting and useLocalStorage for persistence.'
  );

  // ================= PAGE 2 =================
  doc.addPage();

  // Topic 3
  drawTopic(
    3,
    'Backend REST API & Documentation',
    'Express & Swagger UI',
    [
      'Open Tab 3: http://localhost:5000/api-docs. Present the complete OpenAPI 3.0 Swagger interactive interface.',
      'Expand GET /api/expenses and click "Try it out" -> "Execute": show live 200 OK response with pagination.'
    ],
    [
      'server/src/routes/expenseRoutes.js - RESTful resource naming and HTTP verbs (GET, POST, PUT, DELETE).',
      'server/src/controllers/expenseController.js - semantic HTTP status codes (201 Created, 200 OK, 400, 404).',
      'server/src/config/swagger.js - OpenAPI 3.0 specifications for schemas, parameters, and endpoints.'
    ],
    'The backend is built with Node.js and Express following strict RESTful principles. It utilizes proper HTTP verbs, semantic status codes, modular routing, and features automated interactive Swagger documentation adhering to the OpenAPI 3.0 standard.'
  );

  // Topic 4
  drawTopic(
    4,
    'MongoDB & Mongoose Modeling',
    'Aggregation Pipelines',
    [
      'Go to Dashboard: showcase the Category Breakdown Pie Chart and 6-Month Cash Flow Trends.',
      'Show that total income, spend, and monthly trends are calculated on the database engine.'
    ],
    [
      'server/src/models/Expense.js - Mongoose schema, references (ref: "User"), and compound indexes ({ user: 1, date: -1 }).',
      'server/src/controllers/expenseController.js (lines 280-370) - multi-stage MongoDB aggregation ($match, $group, $sort).'
    ],
    'I designed normalized Mongoose schemas with compound indexes to optimize query speed on user and date lookups. Financial analytics are processed directly on the database engine using MongoDB aggregation pipelines rather than memory-heavy JavaScript loops in application memory.'
  );

  // Topic 5
  drawTopic(
    5,
    'Data Validation & Error Handling',
    'Security & Middleware',
    [
      'Click "Add Transaction", leave Title blank, and enter a negative amount -500. Submit to show instant client & server validation error banners and toasts.'
    ],
    [
      'server/src/middleware/validationMiddleware.js - express-validator rules for strings, positive numbers, and ISO dates.',
      'server/src/middleware/errorMiddleware.js - centralized error handler catching CastErrors, duplicates (11000), and API exceptions.'
    ],
    'Validation occurs on both tiers: client-side form checking and strict server-side validation using express-validator. All exceptions are caught by a centralized Express error-handling middleware that returns standardized, consistent JSON error payloads.'
  );

  // ================= PAGE 3 =================
  doc.addPage();

  // Topic 6
  drawTopic(
    6,
    'Authentication & Authorization (RBAC)',
    'JWT & Role Security',
    [
      'Sign in as Demo User (user@example.com). Manually navigate to /admin in URL bar -> show 403 Forbidden Screen.',
      'Logout and sign in as Admin (admin@example.com). The Admin Panel appears in navigation with system analytics and user controls.'
    ],
    [
      'server/src/middleware/authMiddleware.js - stateless JWT verification extracting user ID and role.',
      'server/src/middleware/roleMiddleware.js - authorize("admin") role-based guard on privileged API routes.',
      'server/src/models/User.js - bcrypt password hashing with 10 salt rounds prior to persistence.'
    ],
    'Authentication uses stateless JSON Web Tokens signed with HMAC-SHA256 and salted bcrypt password hashing. Role-Based Access Control separates regular users from administrators, enforcing permissions on both backend endpoints and frontend React routes with HTTP 403 authorization.'
  );

  // Topic 7
  drawTopic(
    7,
    'Real-Time Features (Socket.IO)',
    'Full-Duplex WebSockets',
    [
      'Place Tab 1 (Admin) on left and Tab 2 (Incognito / User) on right side of screen.',
      'On Tab 2, click "Add Transaction" and add an expense for Rs. 1,500 on "Electronics".',
      'Watch Tab 1: transaction table and charts update INSTANTLY in real time without refreshing either page!',
      'Open Live Chat tab on both windows: type a message on Tab 1 and watch it appear instantaneously on Tab 2.'
    ],
    [
      'server/src/sockets/socketHandler.js - Socket.IO server initialization, room joins, and event broadcasting.',
      'client/src/context/SocketContext.jsx - WebSocket listeners for expense:added, chat:message, and admin:stats_updated.'
    ],
    'I integrated Socket.IO for bi-directional event-driven communication. When any transaction or budget is modified, the server broadcasts WebSocket events to synchronize state across all active sessions instantly, eliminating the need for periodic HTTP polling.'
  );

  // Topic 8
  drawTopic(
    8,
    'Docker & Containerization',
    'Multi-Stage Dockerfiles',
    [
      'Show container configuration files in root of VS Code.'
    ],
    [
      'docker-compose.yml - orchestrates 3 microservices: mongo (with named volumes), backend, and frontend.',
      'client/Dockerfile - multi-stage build: Stage 1 builds Vite bundle on Node Alpine; Stage 2 serves it via Nginx.',
      'server/Dockerfile - lightweight production Node.js Alpine container with container healthchecks.'
    ],
    'The complete stack is containerized with Docker. I created multi-stage Dockerfiles for optimized production image sizes, compiling React in Stage 1 and serving it via high-performance Nginx in Stage 2. docker-compose.yml coordinates the frontend, backend, and MongoDB with isolated networks.'
  );

  // ================= PAGE 4 =================
  doc.addPage();

  // Topic 9
  drawTopic(
    9,
    'DevOps, CI/CD & Automated Testing',
    'GitHub Actions Pipeline',
    [
      'Open terminal and run: npm test - show the automated API smoke test suite passing 10/10 tests live!'
    ],
    [
      '.github/workflows/ci.yml - automated GitHub Actions pipeline linting, building, and running smoke tests on push.',
      'render.yaml & client/vercel.json - Infrastructure-as-Code deployment blueprints for production cloud deployment.'
    ],
    'For DevOps, I implemented continuous integration using GitHub Actions in .github/workflows/ci.yml. Every code change triggers automated linting, compilation, and smoke test execution. The repository also includes cloud deployment blueprints for Render and Vercel.'
  );

  // Viva Q&A Section Header
  doc.drawText('MOST FREQUENT VIVA QUESTIONS & MODEL TECHNICAL ANSWERS', doc.marginLeft, doc.cursorY, { font: 'F2', size: 10, color: [0.08, 0.12, 0.2] });
  doc.drawRect(doc.marginLeft, doc.cursorY - 4, doc.contentWidth, 1, [0.31, 0.27, 0.90]);
  doc.cursorY -= 12;

  const drawQaCard = (question, answer) => {
    const boxWidth = doc.contentWidth;
    const qLines = doc.wrapText(`Q: ${question}`, 'F2', 8.5, boxWidth - 20).length;
    const aLines = doc.wrapText(`A: "${answer}"`, 'F1', 8, boxWidth - 20).length;
    const cardHeight = qLines * 11 + aLines * 10 + 14;

    doc.checkPageBreak(cardHeight + 6);
    const startY = doc.cursorY;
    const bottomY = startY - cardHeight;

    doc.drawRect(doc.marginLeft, bottomY, boxWidth, cardHeight, [0.98, 0.98, 0.99], [0.85, 0.88, 0.93], 0.6);
    doc.drawRect(doc.marginLeft, bottomY, 3, cardHeight, [0.31, 0.27, 0.90]);

    doc.drawWrappedText(`Q: ${question}`, doc.marginLeft + 10, startY - 10, boxWidth - 20, { font: 'F2', size: 8.5, color: [0.1, 0.15, 0.25], lineHeight: 11 });
    doc.drawWrappedText(`A: "${answer}"`, doc.marginLeft + 10, startY - 10 - qLines * 11, boxWidth - 20, { font: 'F1', size: 8, color: [0.25, 0.3, 0.35], lineHeight: 10 });

    doc.cursorY = bottomY - 6;
  };

  drawQaCard(
    'Why did you choose React Context API over Redux?',
    'For an application of this scale, Redux introduces significant boilerplate, extra actions, and bundle overhead. Reacts native Context API, separated into domain providers (Auth, Expenses, Theme, Socket), delivers lightweight global state management with zero external dependencies.'
  );

  drawQaCard(
    'How does JWT authentication work end-to-end?',
    'Upon valid login credentials, the server signs a JSON payload containing user ID and role with an HMAC secret. The client receives the token, stores it, and sends it in the Authorization: Bearer header on subsequent requests, verified by our protect auth middleware.'
  );

  drawQaCard(
    'Why use compound indexing in MongoDB?',
    'Queries frequently filter by the logged-in user and sort by transaction date ({ user: 1, date: -1 }). A compound index enables MongoDB to satisfy both filtering and sorting directly in B-tree memory without performing expensive collection-wide scans.'
  );

  drawQaCard(
    'Why use WebSockets instead of periodic HTTP polling?',
    'HTTP polling creates continuous server load with repeated TCP handshakes and header payloads even when no updates exist. WebSockets establish a single persistent full-duplex TCP connection, pushing events (new expenses, budget alerts, chat) to clients with sub-millisecond latency.'
  );

  drawQaCard(
    'What is the key advantage of a multi-stage Docker build?',
    'A single-stage build retains Node.js, npm caches, and build tools inside the production image, often exceeding 800MB. Multi-stage builds compile Vite assets in Stage 1 and copy only the compiled static output into an Alpine Nginx image in Stage 2, shrinking the final image to under 25MB.'
  );

  const pdfBuffer = doc.build();
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`PDF successfully generated at: ${outputPath} (${pdfBuffer.length} bytes)`);
}

// Generate the PDF directly into both the project directory and artifacts directory
const targetProjectPdf = 'C:\\rahul\\expense-tracker-fsd\\EVALUATION_GUIDE.pdf';
generateEvaluationGuidePdf(targetProjectPdf);
