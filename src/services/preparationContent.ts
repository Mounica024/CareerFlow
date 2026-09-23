import type { PreparationCategory } from '@/types';

export interface PrepSection {
  title: string;
  notes: string[];
}

export interface PracticeQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface InterviewQuestion {
  question: string;
  answer: string;
  keyPoints: string[];
  followUp?: string;
}

export interface PrepTopicContent {
  topic: string;
  category: PreparationCategory;
  overview: string;
  keyConcepts: PrepSection[];
  practice: PracticeQuestion[];
  interviewQuestions: InterviewQuestion[];
}

const TOPIC_CONTENT: Record<string, PrepTopicContent> = {
  // ── Technical concepts ──
  'network security': {
    topic: 'Network Security',
    category: 'technical_concepts',
    overview: 'Network security protects data during transmission across networks. It involves firewalls, encryption, VPNs, and intrusion detection systems to defend against unauthorized access and attacks.',
    keyConcepts: [
      { title: 'Network Security Basics', notes: ['CIA triad: Confidentiality, Integrity, Availability', 'Defense in depth: multiple layers of security', 'Least privilege: give only the access needed'] },
      { title: 'TCP/IP Basics', notes: ['Four layers: Application, Transport, Internet, Network Access', 'Common ports: HTTP 80, HTTPS 443, SSH 22, DNS 53', 'TCP is connection-oriented; UDP is connectionless'] },
      { title: 'Firewalls', notes: ['Filters traffic based on rules (allow/deny)', 'Types: packet filtering, stateful inspection, proxy', 'Controls traffic between trusted and untrusted networks'] },
      { title: 'VPN (Virtual Private Network)', notes: ['Creates encrypted tunnel over public network', 'Common protocols: IPSec, SSL/TLS, OpenVPN', 'Used for secure remote access to internal networks'] },
      { title: 'IDS/IPS', notes: ['IDS: Intrusion Detection System — detects and alerts', 'IPS: Intrusion Prevention System — detects and blocks', 'Signature-based vs anomaly-based detection'] },
      { title: 'Common Network Attacks', notes: ['MITM: Man-in-the-Middle intercepts communication', 'DDoS: overwhelms with traffic', 'Port scanning: discovers open ports and services'] },
    ],
    practice: [
      { question: 'Which device controls traffic based on security rules?', options: ['Firewall', 'Monitor', 'Keyboard', 'Compiler'], correctIndex: 0, explanation: 'A firewall filters network traffic based on configured security rules, allowing or blocking packets.' },
      { question: 'What does a VPN do?', options: ['Speeds up internet', 'Creates an encrypted tunnel over a public network', 'Blocks all ads', 'Stores files'], correctIndex: 1, explanation: 'A VPN creates an encrypted tunnel over a public network so data remains private during transmission.' },
      { question: 'What is the difference between IDS and IPS?', options: ['IDS blocks, IPS alerts', 'IDS alerts, IPS blocks', 'They are identical', 'IDS is hardware, IPS is software'], correctIndex: 1, explanation: 'IDS (Intrusion Detection System) detects and alerts, while IPS (Intrusion Prevention System) can also block the threat.' },
      { question: 'Which port is used by HTTPS?', options: ['80', '443', '22', '53'], correctIndex: 1, explanation: 'HTTPS uses port 443 for secure web communication. Port 80 is HTTP (unencrypted).' },
    ],
    interviewQuestions: [
      { question: 'What is a firewall?', answer: 'A firewall is a network security device that monitors and filters incoming and outgoing network traffic based on predetermined security rules. It acts as a barrier between a trusted internal network and an untrusted external network.', keyPoints: ['Filters by rules', 'Barrier between trusted/untrusted networks', 'Types: packet filtering, stateful, proxy'] },
      { question: 'What is the difference between IDS and IPS?', answer: 'An IDS detects suspicious activity and raises alerts but does not take action. An IPS goes a step further and can block or prevent the detected threat in real time.', keyPoints: ['IDS = detect + alert', 'IPS = detect + block', 'Both can be signature or anomaly based'] },
      { question: 'Explain the CIA triad.', answer: 'The CIA triad is a foundational security model: Confidentiality ensures data is only accessible to authorized users, Integrity ensures data is not altered tampered with, and Availability ensures data is accessible when needed.', keyPoints: ['Confidentiality = privacy', 'Integrity = accuracy', 'Availability = access'] },
    ],
  },

  'firewall': {
    topic: 'Firewall Basics',
    category: 'technical_concepts',
    overview: 'Firewalls are network security systems that monitor and control incoming and outgoing traffic based on security rules. They are the first line of defense in network security.',
    keyConcepts: [
      { title: 'What is a Firewall?', notes: ['A barrier between trusted and untrusted networks', 'Inspects packets and applies allow/deny rules', 'Can be hardware, software, or both'] },
      { title: 'Types of Firewalls', notes: ['Packet filtering: checks headers, fast but basic', 'Stateful inspection: tracks connection state', 'Proxy firewall: acts as intermediary'] },
      { title: 'Firewall Rules', notes: ['Based on source/destination IP, port, protocol', 'Default deny: block unless explicitly allowed', 'Rule order matters — first match wins'] },
    ],
    practice: [
      { question: 'Which firewall type tracks connection state?', options: ['Packet filtering', 'Stateful inspection', 'Proxy', 'None'], correctIndex: 1, explanation: 'Stateful inspection firewalls track the state of active connections, allowing them to make smarter filtering decisions.' },
      { question: 'What is a "default deny" policy?', options: ['Allow all traffic by default', 'Block all traffic unless explicitly allowed', 'Only block known threats', 'Deny only on weekends'], correctIndex: 1, explanation: 'Default deny blocks all traffic unless a rule explicitly allows it — the most secure approach.' },
    ],
    interviewQuestions: [
      { question: 'What are the different types of firewalls?', answer: 'The main types are packet filtering (checks packet headers), stateful inspection (tracks connection state), and proxy firewalls (acts as an intermediary between client and server).', keyPoints: ['Packet filtering — basic', 'Stateful — tracks connections', 'Proxy — intermediary'] },
    ],
  },

  'vpn': {
    topic: 'VPN Fundamentals',
    category: 'technical_concepts',
    overview: 'A Virtual Private Network creates an encrypted tunnel over a public network, allowing secure remote access to internal resources.',
    keyConcepts: [
      { title: 'What is a VPN?', notes: ['Encrypted tunnel over public network', 'Provides confidentiality and integrity', 'Common in remote work scenarios'] },
      { title: 'VPN Protocols', notes: ['IPSec: widely used, strong encryption', 'SSL/TLS: used in web-based VPNs', 'OpenVPN: open source, highly configurable'] },
      { title: 'Use Cases', notes: ['Remote access for employees', 'Site-to-site connectivity between offices', 'Bypassing geo-restrictions (not a security use case)'] },
    ],
    practice: [
      { question: 'What does a VPN primarily provide?', options: ['Faster internet', 'Encrypted tunnel over public network', 'Free storage', 'Antivirus protection'], correctIndex: 1, explanation: 'A VPN creates an encrypted tunnel so data transmitted over a public network remains private.' },
      { question: 'Which is a common VPN protocol?', options: ['HTTP', 'IPSec', 'FTP', 'SMTP'], correctIndex: 1, explanation: 'IPSec is a widely used VPN protocol that provides strong encryption and authentication.' },
    ],
    interviewQuestions: [
      { question: 'How does a VPN work?', answer: 'A VPN creates an encrypted tunnel between the client and a VPN server. All traffic passes through this tunnel, so even if intercepted, the data is encrypted and unreadable.', keyPoints: ['Encrypted tunnel', 'Client to server', 'Protects data in transit'] },
    ],
  },

  'ids/ips': {
    topic: 'IDS/IPS Fundamentals',
    category: 'technical_concepts',
    overview: 'Intrusion Detection Systems (IDS) and Intrusion Prevention Systems (IPS) monitor network traffic for suspicious activity and security policy violations.',
    keyConcepts: [
      { title: 'IDS vs IPS', notes: ['IDS: detects and alerts — does not block', 'IPS: detects and actively blocks threats', 'Both monitor network or system activity'] },
      { title: 'Detection Methods', notes: ['Signature-based: matches known attack patterns', 'Anomaly-based: detects deviations from normal behavior', 'Hybrid: combines both approaches'] },
      { title: 'Placement', notes: ['IDS: typically placed behind firewall (monitoring)', 'IPS: placed inline to block traffic', 'Both can be network-based or host-based'] },
    ],
    practice: [
      { question: 'What does an IDS do when it detects a threat?', options: ['Blocks it', 'Alerts but does not block', 'Shuts down the server', 'Does nothing'], correctIndex: 1, explanation: 'An IDS (Intrusion Detection System) detects and alerts but does not actively block the threat.' },
      { question: 'Which detection method matches known attack patterns?', options: ['Anomaly-based', 'Signature-based', 'Heuristic', 'Random'], correctIndex: 1, explanation: 'Signature-based detection compares traffic against a database of known attack signatures.' },
    ],
    interviewQuestions: [
      { question: 'What is the difference between IDS and IPS?', answer: 'An IDS detects and alerts on suspicious activity but takes no action. An IPS can detect and also block or prevent the threat in real time by being placed inline with traffic.', keyPoints: ['IDS = alert only', 'IPS = alert + block', 'IPS is inline'] },
    ],
  },

  // ── Coding / DSA ──
  'arrays': {
    topic: 'Arrays and Strings',
    category: 'coding',
    overview: 'Arrays store elements in contiguous memory. Strings are arrays of characters. Mastering array manipulation is fundamental for coding interviews.',
    keyConcepts: [
      { title: 'Array Basics', notes: ['O(1) access by index', 'O(n) search in unsorted array', 'Fixed size in many languages (dynamic in Python/JS)'] },
      { title: 'Common Patterns', notes: ['Two pointers: move from both ends toward center', 'Sliding window: maintain a window of elements', 'Prefix sums: precompute cumulative sums'] },
      { title: 'String Manipulation', notes: ['Strings are immutable in many languages', 'Common operations: reverse, substring, split', 'Watch for off-by-one errors'] },
    ],
    practice: [
      { question: 'What is the time complexity of accessing an element by index in an array?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n log n)'], correctIndex: 1, explanation: 'Array elements are stored in contiguous memory, so accessing by index is O(1).' },
      { question: 'Which technique uses two indices moving toward each other?', options: ['Sliding window', 'Two pointers', 'Binary search', 'BFS'], correctIndex: 1, explanation: 'The two-pointer technique uses two indices moving from opposite ends toward the center.' },
    ],
    interviewQuestions: [
      { question: 'How do you reverse an array in place?', answer: 'Use two pointers: one at the start and one at the end. Swap elements and move pointers toward the center until they meet. This is O(n) time and O(1) space.', keyPoints: ['Two pointers', 'Swap in place', 'O(n) time, O(1) space'] },
    ],
  },

  'sql': {
    topic: 'SQL Fundamentals',
    category: 'coding',
    overview: 'SQL (Structured Query Language) is used to interact with relational databases. It is essential for backend, data, and full-stack roles.',
    keyConcepts: [
      { title: 'Basic Queries', notes: ['SELECT: retrieve data', 'WHERE: filter rows', 'ORDER BY: sort results'] },
      { title: 'Joins', notes: ['INNER JOIN: matching rows from both tables', 'LEFT JOIN: all rows from left + matching from right', 'GROUP BY: aggregate rows by column'] },
      { title: 'Advanced', notes: ['Subqueries: query within a query', 'Indexes: speed up lookups', 'Normalization: reduce data redundancy'] },
    ],
    practice: [
      { question: 'Which JOIN returns only matching rows from both tables?', options: ['LEFT JOIN', 'INNER JOIN', 'RIGHT JOIN', 'FULL JOIN'], correctIndex: 1, explanation: 'INNER JOIN returns only rows that have matching values in both tables.' },
      { question: 'What does GROUP BY do?', options: ['Sorts results', 'Groups rows with same values for aggregation', 'Filters rows', 'Joins tables'], correctIndex: 1, explanation: 'GROUP BY groups rows that have the same values into summary rows, typically used with aggregate functions like COUNT or SUM.' },
    ],
    interviewQuestions: [
      { question: 'What is the difference between INNER JOIN and LEFT JOIN?', answer: 'INNER JOIN returns only rows with matching values in both tables. LEFT JOIN returns all rows from the left table and matching rows from the right table; unmatched right rows appear as NULL.', keyPoints: ['INNER = matching only', 'LEFT = all left + matching right', 'Unmatched = NULL'] },
    ],
  },

  'python': {
    topic: 'Python Fundamentals',
    category: 'coding',
    overview: 'Python is a high-level, interpreted language widely used in web development, data science, automation, and scripting.',
    keyConcepts: [
      { title: 'Python Basics', notes: ['Dynamic typing — no need to declare types', 'Indentation defines code blocks', 'Lists, tuples, dicts, sets are built-in data structures'] },
      { title: 'Key Features', notes: ['List comprehensions for concise loops', 'Slicing: arr[start:stop:step]', 'Generators: yield instead of return for lazy evaluation'] },
      { title: 'Common Patterns', notes: ['Dictionary for key-value lookup', 'try/except for error handling', 'with statement for resource management'] },
    ],
    practice: [
      { question: 'How do you create a list of squares using a comprehension?', options: ['[x^2 for x in range(10)]', '[x**2 for x in range(10)]', '[x*x in range(10)]', 'list(x*2 for x in 10)'], correctIndex: 1, explanation: 'List comprehension syntax is [expression for item in iterable]. x**2 is the power operator in Python.' },
      { question: 'What does slicing arr[1:4] return?', options: ['Elements at index 1, 2, 3', 'Elements at index 1, 2, 3, 4', 'Elements at index 0, 1, 2, 3', 'Elements at index 1 only'], correctIndex: 0, explanation: 'Python slicing is [start:stop] where stop is exclusive, so arr[1:4] returns indices 1, 2, 3.' },
    ],
    interviewQuestions: [
      { question: 'What is the difference between a list and a tuple in Python?', answer: 'Lists are mutable (can be modified after creation) while tuples are immutable. Tuples are faster and used for fixed data; lists are used when elements may change.', keyPoints: ['List = mutable', 'Tuple = immutable', 'Tuples faster for fixed data'] },
    ],
  },

  'java': {
    topic: 'Java Fundamentals',
    category: 'coding',
    overview: 'Java is a strongly-typed, object-oriented language used extensively in enterprise applications, Android, and backend systems.',
    keyConcepts: [
      { title: 'Java Basics', notes: ['JVM: Java Virtual Machine runs bytecode', 'Strong typing — variables need declared types', 'Object-oriented: classes, inheritance, polymorphism'] },
      { title: 'Key Concepts', notes: ['Garbage collection: automatic memory management', 'Interfaces vs abstract classes', 'Collections Framework: List, Set, Map'] },
      { title: 'Common Patterns', notes: ['try-catch-finally for exception handling', 'Streams for functional-style operations', 'Generics for type-safe collections'] },
    ],
    practice: [
      { question: 'What runs Java bytecode?', options: ['Compiler', 'JVM', 'OS directly', 'Browser'], correctIndex: 1, explanation: 'The Java Virtual Machine (JVM) executes compiled Java bytecode, enabling platform independence.' },
      { question: 'Which is true about Java strings?', options: ['Mutable', 'Immutable', 'Primitive type', 'Cannot be compared'], correctIndex: 1, explanation: 'Java String objects are immutable — once created, their value cannot be changed.' },
    ],
    interviewQuestions: [
      { question: 'What is the JVM?', answer: 'The Java Virtual Machine is an abstract machine that executes Java bytecode. It makes Java platform-independent — write once, run anywhere.', keyPoints: ['Executes bytecode', 'Platform independent', 'Garbage collection'] },
    ],
  },

  'javascript': {
    topic: 'JavaScript Fundamentals',
    category: 'coding',
    overview: 'JavaScript is the language of the web, used for frontend and backend (Node.js) development.',
    keyConcepts: [
      { title: 'JS Basics', notes: ['Dynamic typing', 'Functions are first-class objects', 'Prototypal inheritance (not class-based like Java)'] },
      { title: 'Key Concepts', notes: ['Closures: function retains access to outer scope', 'Event loop: async via callbacks, promises, async/await', 'this keyword: depends on call context'] },
      { title: 'Modern JS', notes: ['let/const for block scoping (not var)', 'Arrow functions: concise syntax, lexical this', 'Destructuring and spread operator'] },
    ],
    practice: [
      { question: 'What is a closure?', options: ['A function with no name', 'A function that retains access to its outer scope', 'A way to close a browser tab', 'A type of loop'], correctIndex: 1, explanation: 'A closure is a function that remembers the variables from its outer scope even after the outer function has returned.' },
      { question: 'Which keyword creates a block-scoped variable?', options: ['var', 'let', 'function', 'static'], correctIndex: 1, explanation: 'let creates a block-scoped variable. var is function-scoped and can cause unexpected behavior.' },
    ],
    interviewQuestions: [
      { question: 'Explain closures in JavaScript.', answer: 'A closure is a function that retains access to variables from its lexical scope even after the outer function has finished executing. This is useful for data privacy and function factories.', keyPoints: ['Retains outer scope', 'Data privacy', 'Function factories'] },
    ],
  },

  'react': {
    topic: 'React Fundamentals',
    category: 'coding',
    overview: 'React is a JavaScript library for building user interfaces using a component-based architecture.',
    keyConcepts: [
      { title: 'React Basics', notes: ['Components: reusable UI pieces', 'JSX: HTML-like syntax in JavaScript', 'Virtual DOM: efficient updates'] },
      { title: 'State and Props', notes: ['State: internal component data', 'Props: data passed from parent', 'useState/useEffect hooks for state and side effects'] },
      { title: 'Key Patterns', notes: ['Conditional rendering', 'List rendering with keys', 'Lifting state up to parent'] },
    ],
    practice: [
      { question: 'What is the Virtual DOM?', options: ['A backup of the real DOM', 'A lightweight copy of the DOM for efficient updates', 'A browser feature', 'A CSS tool'], correctIndex: 1, explanation: 'The Virtual DOM is a lightweight in-memory representation of the real DOM. React compares it with the previous version and updates only changed parts.' },
      { question: 'Which hook manages side effects?', options: ['useState', 'useEffect', 'useContext', 'useRef'], correctIndex: 1, explanation: 'useEffect handles side effects like data fetching, subscriptions, and DOM manipulation after render.' },
    ],
    interviewQuestions: [
      { question: 'What is the difference between state and props?', answer: 'State is internal data managed by the component itself, while props are data passed from a parent component. State can change; props are read-only from the component\'s perspective.', keyPoints: ['State = internal, mutable', 'Props = external, read-only', 'Lifting state up for sharing'] },
    ],
  },

  // ── Cloud / DevOps ──
  'docker': {
    topic: 'Docker Fundamentals',
    category: 'technical_concepts',
    overview: 'Docker is a containerization platform that packages applications and their dependencies into portable containers.',
    keyConcepts: [
      { title: 'What is Docker?', notes: ['Containers: lightweight, isolated environments', 'Images: read-only templates for containers', 'Dockerfile: instructions to build an image'] },
      { title: 'Key Commands', notes: ['docker build: create image from Dockerfile', 'docker run: start a container', 'docker-compose: manage multi-container apps'] },
      { title: 'Concepts', notes: ['Port mapping: expose container ports to host', 'Volumes: persist data outside containers', 'Networks: connect containers securely'] },
    ],
    practice: [
      { question: 'What is a Docker container?', options: ['A virtual machine', 'A lightweight isolated environment for running applications', 'A database', 'A web server'], correctIndex: 1, explanation: 'A Docker container is a lightweight, standalone package that includes everything needed to run an application.' },
      { question: 'What does a Dockerfile do?', options: ['Runs containers', 'Defines how to build a Docker image', 'Manages networks', 'Stores data'], correctIndex: 1, explanation: 'A Dockerfile contains instructions for building a Docker image, which is then used to create containers.' },
    ],
    interviewQuestions: [
      { question: 'What is the difference between a container and a virtual machine?', answer: 'Containers share the host OS kernel and are lightweight, while VMs include a full OS. Containers start faster and use fewer resources, but VMs provide stronger isolation.', keyPoints: ['Containers share kernel', 'VMs have full OS', 'Containers are lighter'] },
    ],
  },

  'aws': {
    topic: 'AWS Fundamentals',
    category: 'technical_concepts',
    overview: 'Amazon Web Services is the leading cloud platform, offering computing, storage, networking, and many other services.',
    keyConcepts: [
      { title: 'Core Services', notes: ['EC2: virtual servers', 'S3: object storage', 'RDS: managed databases'] },
      { title: 'Networking', notes: ['VPC: virtual private cloud', 'IAM: identity and access management', 'CloudFront: CDN for content delivery'] },
      { title: 'Key Concepts', notes: ['Regions and availability zones', 'Pay-as-you-go pricing', 'Security groups: firewall rules'] },
    ],
    practice: [
      { question: 'What does Amazon S3 provide?', options: ['Virtual servers', 'Object storage', 'Managed databases', 'DNS management'], correctIndex: 1, explanation: 'Amazon S3 (Simple Storage Service) provides scalable object storage for files and data.' },
      { question: 'What manages access control in AWS?', options: ['EC2', 'IAM', 'S3', 'Lambda'], correctIndex: 1, explanation: 'IAM (Identity and Access Management) controls who can access which AWS resources and what they can do.' },
    ],
    interviewQuestions: [
      { question: 'What is the difference between EC2 and Lambda?', answer: 'EC2 provides virtual servers you manage (start, stop, configure). Lambda is serverless — you upload code and AWS runs it automatically, scaling without server management.', keyPoints: ['EC2 = managed servers', 'Lambda = serverless', 'Lambda scales automatically'] },
    ],
  },

  // ── HR Questions ──
  'hr_interview': {
    topic: 'HR Interview Preparation',
    category: 'hr_questions',
    overview: 'HR interviews assess your communication, personality, cultural fit, and motivation. Prepare clear, honest answers for common questions. This is general interview preparation — not specific to any particular company.',
    keyConcepts: [
      { title: 'Tell Me About Yourself', notes: ['Structure: present, past, future', 'Keep it to 1-2 minutes', 'Focus on relevant experience and skills', 'Example: "I am a Computer Science student from XYZ College. I have skills in Python and Java, and I built a web app for my project..."'] },
      { title: 'Why Should We Hire You?', notes: ['Connect your skills to the job requirements', 'Give specific examples of your work', 'Show enthusiasm for the role', 'Highlight what makes you different from other candidates'] },
      { title: 'Strengths and Weaknesses', notes: ['Strengths: relate to job needs — e.g., quick learner, problem solver', 'Weakness: pick a real one you are actively improving', 'Show concrete action taken to improve', 'Never say "I have no weaknesses"'] },
      { title: 'Why Do You Want This Role?', notes: ['Align with your career interests and goals', 'Mention specific aspects of the role that excite you', 'Connect your skills to what the role requires', 'Show genuine interest, not just "I need a job"'] },
      { title: 'Why This Company?', notes: ['Research the company beforehand — their products, values, culture', 'Mention something specific you admire about them', 'Connect it to your career goals', 'Avoid generic answers like "it is a great company"'] },
      { title: 'Career Goals', notes: ['Short-term: what you want to learn in this role', 'Long-term: where you see yourself in 3-5 years', 'Show ambition but be realistic', 'Connect goals to the company\'s growth path'] },
      { title: 'Handling Challenges', notes: ['Use the STAR method: Situation, Task, Action, Result', 'Describe a real challenge you faced', 'Explain your specific action and the positive outcome', 'Show problem-solving and resilience'] },
      { title: 'Teamwork', notes: ['Share an example of working in a team', 'Highlight your role and contribution', 'Mention how you handled disagreements', 'Show you can collaborate effectively'] },
      { title: 'Communication', notes: ['Give an example where clear communication helped', 'Mention presentations, documentation, or team coordination', 'Show you can explain technical things simply', 'Active listening is part of communication'] },
      { title: 'Project Discussion', notes: ['Explain what the project is and why you chose it', 'Describe your specific role and contribution', 'Mention the tech stack and tools used', 'Share challenges faced, how you solved them, and what you learned'] },
    ],
    practice: [
      { question: 'When asked "Tell me about yourself", what should you focus on?', options: ['Personal life story', 'Relevant skills and experience', 'Salary expectations', 'Why you dislike your current job'], correctIndex: 1, explanation: 'Focus on your relevant skills, experience, and career goals. Keep it professional and concise — 1 to 2 minutes maximum.' },
      { question: 'How should you answer "What is your weakness?"', options: ['Say you have none', 'Pick a real weakness and show how you are improving', 'Say you work too hard', 'Refuse to answer'], correctIndex: 1, explanation: 'Choose a genuine weakness and demonstrate the steps you are taking to improve it. This shows self-awareness and a growth mindset.' },
      { question: 'What is the STAR method for answering behavioral questions?', options: ['Situation, Task, Action, Result', 'Speak, Think, Act, Reflect', 'Start, Talk, Ask, Respond', 'Strategy, Tactics, Actions, Review'], correctIndex: 0, explanation: 'STAR stands for Situation, Task, Action, Result. Describe the situation, your task, the action you took, and the positive result.' },
      { question: 'When asked "Why this company?", what is the best approach?', options: ['Say it pays well', 'Mention something specific you researched about the company', 'Say a friend recommended it', 'Say any company would be fine'], correctIndex: 1, explanation: 'Research the company beforehand and mention something specific — their products, values, or culture — that genuinely interests you.' },
    ],
    interviewQuestions: [
      { question: 'Tell me about yourself.', answer: 'I am a [degree/branch] student from [college]. I have skills in [key skills] and have worked on [projects/internships]. I am passionate about [field] and eager to start my career in [role].', keyPoints: ['Present → Past → Future', '1-2 minutes', 'Relevant to the role'] },
      { question: 'Why should we hire you?', answer: 'I have the technical skills required for this role — [mention 2-3 skills]. I am a quick learner, adaptable, and have demonstrated [specific achievement]. I am excited about contributing to your team.', keyPoints: ['Connect skills to job', 'Give examples', 'Show enthusiasm'] },
      { question: 'Why do you want this role?', answer: 'This role aligns with my career interest in [field]. I am excited about [specific aspect of the role]. My skills in [area] make me a good fit, and I see this as a great opportunity to grow.', keyPoints: ['Align with career goals', 'Specific about role', 'Show genuine interest'] },
      { question: 'Why do you want to join this company?', answer: 'I admire [specific thing about the company — product, culture, value]. It aligns with my career goals because [connection]. I believe my skills in [area] would let me contribute meaningfully.', keyPoints: ['Research the company', 'Be specific', 'Connect to your goals'] },
      { question: 'What are your strengths?', answer: 'One of my key strengths is [strength] — for example, [specific example]. I am also a quick learner and adapt well to new technologies and environments.', keyPoints: ['Relate to job needs', 'Give concrete examples', 'Be genuine'] },
      { question: 'What is one area you are improving?', answer: 'I am currently working on [skill/area]. I have been [specific action taken — e.g., taking a course, building a project]. I have already seen improvement in [result].', keyPoints: ['Be genuine', 'Show action taken', 'Demonstrate progress'] },
      { question: 'Where do you see yourself in 5 years?', answer: 'In 5 years, I see myself as a skilled professional in [field], having grown from a junior role to taking on more responsibility. I want to deepen my expertise in [area] and eventually mentor others.', keyPoints: ['Show ambition', 'Be realistic', 'Connect to the role'] },
      { question: 'Tell me about your project.', answer: 'I worked on [project name] which [brief description]. My role was [specific contribution]. The tech stack was [technologies]. The main challenge was [challenge] and I solved it by [solution]. I learned [key takeaway].', keyPoints: ['What, why, how', 'Your specific role', 'Challenges and learnings'] },
      { question: 'How do you handle working in a team?', answer: 'I enjoy collaborating. In my project, I worked with a team of [size]. I contributed by [your role]. When we had disagreements, I [how you resolved them]. Good communication and respect for different viewpoints are key.', keyPoints: ['Share a real example', 'Your contribution', 'Conflict resolution'] },
      { question: 'Why [your field, e.g., cybersecurity]?', answer: 'I became interested in [field] because [specific reason — course, project, news event]. I enjoy [aspect of the field]. I have been building skills through [learning activities] and want to start my career in this area.', keyPoints: ['Show genuine interest', 'Specific reason', 'Back it up with action'] },
    ],
  },

  // ── Aptitude ──
  'aptitude': {
    topic: 'Aptitude Fundamentals',
    category: 'aptitude',
    overview: 'Aptitude tests assess quantitative ability, logical reasoning, and problem-solving skills. They are common in placement exams.',
    keyConcepts: [
      { title: 'Quantitative', notes: ['Percentages, profit/loss, ratios', 'Time/speed/distance problems', 'Number series and simplification'] },
      { title: 'Logical Reasoning', notes: ['Syllogisms and Venn diagrams', 'Blood relations and directions', 'Coding-decoding puzzles'] },
      { title: 'Data Interpretation', notes: ['Tables and bar charts', 'Pie charts and line graphs', 'Caselet-based problems'] },
    ],
    practice: [
      { question: 'If a train travels 60 km in 45 minutes, what is its speed?', options: ['60 km/h', '80 km/h', '75 km/h', '90 km/h'], correctIndex: 1, explanation: '45 minutes = 0.75 hours. Speed = 60 / 0.75 = 80 km/h.' },
      { question: 'A shopkeeper marks up goods by 40% and gives a 10% discount. What is the profit percentage?', options: ['26%', '30%', '36%', '40%'], correctIndex: 0, explanation: 'Let cost = 100. Marked price = 140. Selling price = 140 × 0.9 = 126. Profit = 26%.' },
    ],
    interviewQuestions: [],
  },
};

// Map lowercase skill names to content keys
const SKILL_TO_CONTENT_KEY: Record<string, string> = {
  'network security': 'network security',
  'firewall': 'firewall',
  'firewalls': 'firewall',
  'vpn': 'vpn',
  'ids/ips': 'ids/ips',
  'ids': 'ids/ips',
  'ips': 'ids/ips',
  'intrusion detection': 'ids/ips',
  'arrays': 'arrays',
  'array': 'arrays',
  'sql': 'sql',
  'databases': 'sql',
  'database': 'sql',
  'python': 'python',
  'java': 'java',
  'javascript': 'javascript',
  'js': 'javascript',
  'react': 'react',
  'docker': 'docker',
  'containers': 'docker',
  'aws': 'aws',
  'cloud': 'aws',
  'aptitude': 'aptitude',
  'quantitative': 'aptitude',
  'aptitude fundamentals': 'aptitude',
  'hr interview preparation': 'hr_interview',
  'hr interview': 'hr_interview',
  'hr questions': 'hr_interview',
};

export function getTopicContent(topic: string): PrepTopicContent | null {
  const key = SKILL_TO_CONTENT_KEY[topic.toLowerCase().trim()];
  if (key && TOPIC_CONTENT[key]) return TOPIC_CONTENT[key];
  // Try direct match
  if (TOPIC_CONTENT[topic.toLowerCase().trim()]) return TOPIC_CONTENT[topic.toLowerCase().trim()];
  return null;
}

export function hasTopicContent(topic: string): boolean {
  return getTopicContent(topic) !== null;
}

export const HR_TOPIC = 'HR Interview Preparation';
export const APTITUDE_TOPIC = 'Aptitude Fundamentals';

export const ALL_CONTENT_TOPICS = Object.keys(TOPIC_CONTENT);
