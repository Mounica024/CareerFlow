import type { Profile, Application, PreparationCategory } from '@/types';
import { matchingEngine } from '@/services/matchingEngine';
import { hasTopicContent, HR_TOPIC, APTITUDE_TOPIC } from '@/services/preparationContent';

export interface PrepRecommendation {
  topic: string;
  category: PreparationCategory;
  reason: string;
  relatedJobs: string[];
  priority: 'High' | 'Medium' | 'Low';
  hasContent: boolean;
}

// Skills that are too generic to be meaningful preparation topics
const SKIP_SKILLS = new Set([
  'communication', 'leadership', 'teamwork', 'problem solving', 'agile', 'scrum',
  'project management', 'analytical', 'critical thinking', 'presentation',
  'git', 'excel',
]);

// Contextual skill matching — avoids treating common English words as skills
// "go" in "you will go to" is not Go the language; "go" in "Go programming" is
function isLikelySkill(skill: string, jobContext: string): boolean {
  const lower = skill.toLowerCase().trim();
  if (SKIP_SKILLS.has(lower)) return false;

  // Single common English words that should not be skills
  const commonWords = new Set([
    'go', 'work', 'system', 'application', 'network', 'security', 'data',
    'service', 'support', 'development', 'design', 'analysis', 'research',
    'management', 'testing', 'deployment', 'monitoring', 'reporting',
  'planning', 'documentation', 'training', 'communication', 'team',
  'process', 'project', 'product', 'customer', 'client', 'user',
    'business', 'company', 'organization', 'solution', 'platform',
    'technology', 'tool', 'environment', 'framework', 'architecture',
  'implementation', 'integration', 'configuration', 'administration',
  'operations', 'maintenance', 'troubleshooting', 'optimization',
    'performance', 'scalability', 'reliability', 'availability',
  'connectivity', 'infrastructure', 'protocol', 'interface', 'module',
    'component', 'feature', 'functionality', 'capability', 'requirement',
    'specification', 'standard', 'policy', 'procedure', 'guideline',
    'best practice', 'quality', 'compliance', 'governance', 'strategy',
    'objective', 'goal', 'target', 'outcome', 'result', 'deliverable',
    'milestone', 'timeline', 'schedule', 'budget', 'resource', 'stakeholder',
  'vendor', 'partner', 'supplier', 'contract', 'agreement', 'service level',
  'help', 'need', 'must', 'should', 'will', 'may', 'can', 'shall',
  'able', 'strong', 'good', 'excellent', 'proficient', 'experienced',
    'knowledge', 'understanding', 'familiarity', 'expertise', 'proficiency',
    'ability', 'skill', 'experience', 'background', 'qualification',
    'education', 'certification', 'training', 'course', 'degree',
    'diploma', 'bachelor', 'master', 'engineer', 'developer', 'architect',
    'analyst', 'manager', 'consultant', 'specialist', 'administrator',
    'coordinator', 'assistant', 'associate', 'junior', 'senior', 'lead',
    'principal', 'staff', 'chief', 'head', 'director', 'officer',
  'year', 'month', 'day', 'week', 'hour', 'minute', 'second',
    'full', 'part', 'time', 'contract', 'permanent', 'temporary',
    'remote', 'onsite', 'hybrid', 'office', 'location', 'city', 'country',
    'state', 'region', 'zone', 'area', 'division', 'department', 'team',
    'group', 'unit', 'section', 'branch', 'sector', 'industry', 'market',
    'segment', 'domain', 'vertical', 'horizontal', 'layer', 'tier', 'level',
    'type', 'kind', 'sort', 'form', 'format', 'structure', 'model', 'pattern',
    'approach', 'method', 'methodology', 'technique', 'practice', 'principle',
    'concept', 'idea', 'theory', 'concept', 'topic', 'subject', 'theme',
    'issue', 'problem', 'challenge', 'risk', 'threat', 'vulnerability',
    'impact', 'effect', 'cause', 'reason', 'factor', 'element', 'aspect',
    'dimension', 'perspective', 'view', 'opinion', 'viewpoint', 'angle',
    'side', 'face', 'phase', 'stage', 'step', 'point', 'item', 'detail',
    'point', 'note', 'comment', 'remark', 'observation', 'finding',
    'conclusion', 'summary', 'overview', 'introduction', 'background',
    'context', 'scope', 'objective', 'purpose', 'aim', 'intent',
    'focus', 'emphasis', 'priority', 'preference', 'choice', 'option',
    'alternative', 'solution', 'recommendation', 'suggestion', 'advice',
    'guidance', 'direction', 'instruction', 'rule', 'regulation', 'law',
    'standard', 'norm', 'criteria', 'measure', 'metric', 'indicator',
    'benchmark', 'baseline', 'target', 'threshold', 'limit', 'boundary',
    'range', 'scope', 'extent', 'degree', 'level', 'amount', 'quantity',
    'volume', 'size', 'scale', 'proportion', 'ratio', 'percentage',
    'fraction', 'portion', 'share', 'part', 'piece', 'segment',
  ]);

  if (commonWords.has(lower) && !hasTopicContent(lower)) return false;

  // If the skill has dedicated content, it's a real topic
  if (hasTopicContent(lower)) return true;

  // Multi-word skills are more likely real
  if (lower.includes(' ') || lower.includes('/')) return true;

  // Single word — check if it appears in a technical context in the job
  const contextLower = jobContext.toLowerCase();
  const techIndicators = [
    `${lower} programming`, `${lower} language`, `${lower} developer`,
    `${lower} engineer`, `${lower} framework`, `${lower} database`,
    `${lower} server`, `${lower} cloud`, `skills in ${lower}`,
    `knowledge of ${lower}`, `experience with ${lower}`, `proficiency in ${lower}`,
  ];
  for (const indicator of techIndicators) {
    if (contextLower.includes(indicator)) return true;
  }

  // If it's a known technical skill from the matching engine, accept it
  return false;
}

function categorizeSkill(skill: string): PreparationCategory {
  const lower = skill.toLowerCase().trim();
  const codingSkills = new Set([
    'python', 'java', 'javascript', 'js', 'react', 'angular', 'vue',
    'node.js', 'nodejs', 'sql', 'arrays', 'array', 'c++', 'c#',
    'ruby', 'php', 'typescript', 'go', 'swift', 'kotlin', 'flask',
    'django', 'spring boot', 'express', 'redux', 'next.js',
  'selenium', 'cypress', 'junit',
  ]);
  const techConcepts = new Set([
    'docker', 'aws', 'kubernetes', 'network security', 'firewall',
    'firewalls', 'vpn', 'ids/ips', 'ids', 'ips', 'linux', 'mongodb',
    'postgresql', 'mysql', 'redis', 'elasticsearch', 'graphql',
    'rest api', 'microservices', 'ci/cd', 'jenkins', 'terraform',
    'ansible', 'machine learning', 'data science', 'tensorflow',
    'pytorch', 'pandas', 'numpy', 'tableau', 'power bi',
    'cybersecurity', 'penetration testing', 'network security',
    'siem', 'encryption', 'cryptography', 'risk assessment',
    'compliance', 'iso 27001', 'nist', 'owasp', 'burp suite',
    'wireshark', 'nessus', 'active directory', 'windows server',
    'powershell', 'bash', 'shell scripting', 'kafka', 'rabbitmq',
    'spark', 'hadoop', 'intrusion detection',
  ]);

  if (codingSkills.has(lower)) return 'coding';
  if (techConcepts.has(lower)) return 'technical_concepts';
  return 'role_specific';
}

export function generateRecommendations(
  profile: Profile,
  applications: Application[]
): PrepRecommendation[] {
  if (applications.length === 0) return [];

  const studentSkills = new Set(
    [...(profile.skills || []), ...(profile.programming_languages || [])].map((s) =>
      s.toLowerCase().trim()
    )
  );

  // Collect all missing skills from tracked jobs
  const skillToJobs: Map<string, string[]> = new Map();

  for (const app of applications) {
    const match = matchingEngine.calculateMatch(profile, app.job_data);
    for (const skill of match.missing_skills) {
      const lower = skill.toLowerCase().trim();
      if (!isLikelySkill(lower, app.job_data.description || app.job_data.title || '')) continue;

      if (!skillToJobs.has(lower)) {
        skillToJobs.set(lower, []);
      }
      const jobs = skillToJobs.get(lower)!;
      const jobLabel = `${app.job_data.title} — ${app.job_data.company}`;
      if (!jobs.includes(jobLabel)) jobs.push(jobLabel);
    }
  }

  const recommendations: PrepRecommendation[] = [];

  for (const [skill, jobs] of skillToJobs) {
    const category = categorizeSkill(skill);
    const hasContent = hasTopicContent(skill);
    const jobCount = jobs.length;

    let priority: 'High' | 'Medium' | 'Low';
    if (jobCount >= 3) priority = 'High';
    else if (jobCount >= 2) priority = 'Medium';
    else priority = 'Low';

    const reason = jobCount === 1
      ? `Required by your tracked job: ${jobs[0]}`
      : `Appears in ${jobCount} of your tracked job requirements`;

    recommendations.push({
      topic: skill,
      category,
      reason,
      relatedJobs: jobs,
      priority,
      hasContent,
    });
  }

  // Always recommend HR interview prep
  recommendations.push({
    topic: HR_TOPIC,
    category: 'hr_questions',
    reason: 'HR interviews are part of most hiring processes. Prepare your answers in advance.',
    relatedJobs: [],
    priority: 'Medium',
    hasContent: true,
  });

  // Always recommend aptitude if no coding topics yet
  const hasCodingTopic = recommendations.some((r) => r.category === 'coding' || r.category === 'aptitude');
  if (!hasCodingTopic) {
    recommendations.push({
      topic: APTITUDE_TOPIC,
      category: 'aptitude',
      reason: 'Aptitude tests are common in campus placements and screening rounds.',
      relatedJobs: [],
      priority: 'Medium',
      hasContent: true,
    });
  }

  // Sort by priority then by job count
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  recommendations.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.relatedJobs.length - a.relatedJobs.length;
  });

  return recommendations;
}
