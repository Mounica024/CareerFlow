import type { Profile, JobMatchResult, Job } from '@/types';

export interface JobMatchingEngine {
  calculateMatch(profile: Profile, job: Job): JobMatchResult;
}

// Technical skills that meaningfully indicate job fit
const TECHNICAL_SKILLS = new Set([
  'java', 'python', 'javascript', 'react', 'node.js', 'nodejs', 'sql', 'aws', 'docker',
  'kubernetes', 'typescript', 'c++', 'c#', 'go', 'ruby', 'php', 'swift',
  'kotlin', 'flutter', 'android', 'ios', 'html', 'css', 'linux',
  'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'graphql',
  'rest api', 'microservices', 'ci/cd', 'jenkins', 'terraform', 'ansible',
  'machine learning', 'data science', 'tensorflow', 'pytorch', 'pandas',
  'numpy', 'tableau', 'power bi', 'spring boot', 'django',
  'flask', 'angular', 'vue', 'next.js', 'express', 'redux', 'tailwind',
  'selenium', 'cypress', 'junit', 'kafka', 'rabbitmq', 'spark', 'hadoop',
  'cybersecurity', 'penetration testing', 'network security', 'siem',
  'firewall', 'encryption', 'cryptography', 'risk assessment', 'compliance',
  'iso 27001', 'nist', 'owasp', 'burp suite', 'wireshark', 'nessus',
  'active directory', 'windows server', 'powershell', 'bash', 'shell scripting',
]);

// Generic/soft skills — these should NOT be the sole basis for a 0% match
const GENERIC_SKILLS = new Set([
  'git', 'excel', 'communication', 'leadership', 'teamwork', 'problem solving',
  'agile', 'scrum', 'project management', 'analytical', 'critical thinking',
  'presentation',
]);

const ALL_KNOWN_SKILLS = new Set([...TECHNICAL_SKILLS, ...GENERIC_SKILLS]);

// Patterns to detect years-of-experience requirements in job descriptions.
// Each pattern captures the minimum years in group 1 (or group 2 for "minimum"/"at least").
// Range patterns also capture the max in another group for display.
const EXPERIENCE_PATTERNS: RegExp[] = [
  // "Experience: 6 to 15 Years" / "Experience: 7–12 Years" / "Experience: 5+ Years"
  /experience\s*[:\-]?\s*(\d+)\s*(?:to|[-–])\s*(\d+)\s*years?/i,
  /experience\s*[:\-]?\s*(\d+)\+?\s*years?/i,
  // "6 to 15 years of experience" / "6-15 years experience"
  /(\d+)\s*to\s*(\d+)\s*years?\s*(?:of\s*)?experience/i,
  /(\d+)\s*[-–]\s*(\d+)\s*years?\s*(?:of\s*)?experience/i,
  // "5+ years of professional experience"
  /(\d+)\+?\s*years?\s*(?:of\s*)?(?:professional\s*|relevant\s*)?experience/i,
  // "minimum 5 years" / "at least 5 years"
  /minimum\s*(?:of\s*)?(\d+)\s*years?/i,
  /at least\s*(\d+)\s*years?/i,
];

// Seniority keywords in job titles
const SENIORITY_KEYWORDS: Record<string, string[]> = {
  senior: ['senior', 'sr.', 'sr '],
  lead: ['lead', 'staff', 'principal', 'senior staff'],
};

function extractYearsRequired(description: string): { min: number; max: number | null; raw: string } | null {
  for (const pattern of EXPERIENCE_PATTERNS) {
    const match = description.match(pattern);
    if (match) {
      const min = parseInt(match[1] || match[2] || '0');
      if (min <= 0) continue;
      const max = match[2] ? parseInt(match[2]) : null;
      const raw = max !== null ? `${min}–${max} years` : `${min}+ years`;
      return { min, max, raw };
    }
  }
  return null;
}

function estimateStudentYears(profile: Profile): number {
  const experiences = profile.experience || [];
  let totalYears = 0;
  for (const exp of experiences) {
    if (!exp.duration) continue;
    const yearMatch = exp.duration.match(/(\d+)\s*year/i);
    if (yearMatch) {
      totalYears += parseInt(yearMatch[1]);
    } else if (exp.duration.match(/month/i)) {
      const monthMatch = exp.duration.match(/(\d+)\s*month/i);
      if (monthMatch) totalYears += parseInt(monthMatch[1]) / 12;
    }
  }
  return totalYears;
}

function getSeniorityFromTitle(title: string): string | null {
  const lower = title.toLowerCase();
  for (const [level, keywords] of Object.entries(SENIORITY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return level;
  }
  return null;
}

export class DefaultJobMatchingEngine implements JobMatchingEngine {
  calculateMatch(profile: Profile, job: Job): JobMatchResult {
    const studentSkills = new Set(
      [...(profile.skills || []), ...(profile.programming_languages || [])].map((s) =>
        s.toLowerCase().trim()
      )
    );

    // --- 1. Collect job skills ---
    const requiredSkills = (job.requirements || [])
      .filter((r) => r.required)
      .map((r) => r.skill.toLowerCase().trim());
    const preferredSkills = (job.requirements || [])
      .filter((r) => !r.required)
      .map((r) => r.skill.toLowerCase().trim());
    const jobSkillsList: string[] = (job.skills || []).map((s) => s.toLowerCase().trim());

    // Fallback: extract skills from description
    let extractedFromDescription = false;
    if (jobSkillsList.length === 0 && requiredSkills.length === 0 && preferredSkills.length === 0 && job.description) {
      extractedFromDescription = true;
      const descLower = job.description.toLowerCase();
      for (const skill of ALL_KNOWN_SKILLS) {
        if (descLower.includes(skill) && !jobSkillsList.includes(skill)) {
          jobSkillsList.push(skill);
        }
      }
    }

    // Separate technical vs generic skills found in the job
    const allJobSkills = new Set([...requiredSkills, ...preferredSkills, ...jobSkillsList]);
    const technicalJobSkills = [...allJobSkills].filter((s) => TECHNICAL_SKILLS.has(s));
    const genericJobSkills = [...allJobSkills].filter((s) => GENERIC_SKILLS.has(s));
    const unknownJobSkills = [...allJobSkills].filter((s) => !TECHNICAL_SKILLS.has(s) && !GENERIC_SKILLS.has(s));

    // --- 2. Check for experience requirement ---
    const description = job.description || '';
    const expRequirement = extractYearsRequired(description);
    const seniorityFromTitle = getSeniorityFromTitle(job.title);
    const studentYears = estimateStudentYears(profile);

    const experienceRequirements: string[] = [];
    let experienceNotMet = false;

    if (expRequirement !== null) {
      experienceRequirements.push(`${expRequirement.raw} of professional experience required`);
      if (studentYears < expRequirement.min) {
        experienceNotMet = true;
      }
    }

    // If title indicates senior/lead but no explicit years, note it
    if (seniorityFromTitle && expRequirement === null) {
      const label = seniorityFromTitle === 'lead' ? 'Lead/Staff/Principal level' : 'Senior level';
      experienceRequirements.push(`${label} role — typically requires significant experience`);
    }

    // --- 3. If no extractable requirements at all ---
    if (allJobSkills.size === 0 && experienceRequirements.length === 0) {
      return {
        status: 'unable_to_determine',
        match_percentage: null,
        matching_skills: [],
        missing_skills: [],
        other_requirements: [],
        explanation:
          'This job listing does not include enough requirement details to calculate a reliable match. Review the description to decide if it fits your goals.',
      };
    }

    // --- 4. Calculate skill match ---
    // Use technical skills as primary weight, generic as secondary
    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    // Only count technical and known skills for match percentage — generic skills
    // alone should never produce a 0% score
    const skillsForMatching = [...technicalJobSkills, ...unknownJobSkills];
    const genericOnly = skillsForMatching.length === 0 && genericJobSkills.length > 0;

    for (const skill of allJobSkills) {
      if (studentSkills.has(skill)) {
        matchingSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }

    const matchingTechnical = matchingSkills.filter((s) => TECHNICAL_SKILLS.has(s) || !GENERIC_SKILLS.has(s));
    const matchingGeneric = matchingSkills.filter((s) => GENERIC_SKILLS.has(s));

    // Calculate percentage based on technical/meaningful skills only
    let matchPercentage: number | null;
    if (genericOnly) {
      // Only generic skills like "communication" found — not enough for a real score
      matchPercentage = null;
    } else if (skillsForMatching.length > 0) {
      matchPercentage = Math.round((matchingTechnical.length / skillsForMatching.length) * 100);
    } else {
      matchPercentage = 0;
    }

    const requiredSet = new Set(requiredSkills);
    const missingRequired = missingSkills.filter((s) => requiredSet.has(s));

    // --- 5. Determine status ---
    let status: JobMatchResult['status'];
    let explanation = '';

    // If experience is explicitly not met, that takes priority
    if (experienceNotMet) {
      status = 'requirements_missing';
      matchPercentage = null;
      explanation = `Experience requirement not met — ${expRequirement!.raw} required`;
      if (studentYears > 0) {
        explanation += `. Your profile shows approximately ${studentYears.toFixed(1)} year(s) of experience.`;
      } else {
        explanation += '. Your profile does not show professional experience yet.';
      }
      if (matchingTechnical.length > 0) {
        explanation += ` You do match ${matchingTechnical.length} technical skill(s): ${matchingTechnical.join(', ')}.`;
      }
      if (missingSkills.length > 0) {
        const techMissing = missingSkills.filter((s) => TECHNICAL_SKILLS.has(s));
        if (techMissing.length > 0) {
          explanation += ` Missing skills: ${techMissing.join(', ')}.`;
        }
      }
    } else if (genericOnly) {
      // Only generic skills found — not enough for a real match score
      status = 'unable_to_determine';
      explanation =
        'The job description does not include specific technical requirements. Only general skills were found. Review the full description to assess fit.';
    } else if (matchingTechnical.length === 0 && skillsForMatching.length > 0) {
      // Has technical requirements but student matches none
      status = 'requirements_missing';
      const techMissing = missingSkills.filter((s) => TECHNICAL_SKILLS.has(s));
      explanation = `You match 0% of the technical skills required. Missing: ${techMissing.join(', ')}.`;
      if (experienceRequirements.length > 0) {
        explanation += ` ${experienceRequirements.join('; ')}.`;
      }
      explanation += ' Consider upskilling before applying.';
    } else if (missingRequired.length === 0 && matchingTechnical.length > 0) {
      status = 'strong_match';
      const pct = matchPercentage ?? 100;
      explanation = extractedFromDescription
        ? `You match ${matchingTechnical.length} of ${skillsForMatching.length} technical skills found in the job description (${pct}%).`
        : `You meet all required skills. ${pct}% overall match.`;
      if (experienceRequirements.length > 0) {
        explanation += ` ${experienceRequirements.join('; ')}.`;
      }
    } else if (matchPercentage !== null && matchPercentage >= 50) {
      status = 'partial_match';
      explanation = `You match ${matchPercentage}% of the required skills.`;
      if (missingRequired.length > 0) {
        explanation += ` Missing required: ${missingRequired.join(', ')}.`;
      }
      if (experienceRequirements.length > 0) {
        explanation += ` ${experienceRequirements.join('; ')}.`;
      }
    } else {
      status = 'requirements_missing';
      const pct = matchPercentage ?? 0;
      explanation = `You match ${pct}% of skills. Missing: ${missingSkills.filter((s) => TECHNICAL_SKILLS.has(s) || !GENERIC_SKILLS.has(s)).join(', ')}.`;
      if (experienceRequirements.length > 0) {
        explanation += ` ${experienceRequirements.join('; ')}.`;
      }
      explanation += ' Consider upskilling before applying.';
    }

    return {
      status,
      match_percentage: matchPercentage,
      matching_skills: matchingSkills,
      missing_skills: missingSkills,
      other_requirements: experienceRequirements,
      explanation,
    };
  }
}

export const matchingEngine = new DefaultJobMatchingEngine();
