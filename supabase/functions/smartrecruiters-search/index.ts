const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchRequest {
  query?: string;
  location?: string;
  page?: number;
  results_per_page?: number;
  experience_level?: string;
  work_arrangement?: string;
  sort?: string;
}

interface SmartRecruitersPosting {
  id: string;
  name: string;
  jobAdId?: string;
  jobAd?: { sections?: Record<string, { title?: string; text?: string }> };
  location?: { city?: string; region?: string; country?: string; remote?: boolean };
  department?: { label?: string };
  employmentType?: { code?: string; label?: string };
  industry?: { label?: string };
  experienceLevel?: { code?: string; label?: string };
  createdOn?: string;
  postingDate?: { date?: string };
  applyUrl?: string;
  url?: string;
  ref?: string;
  compensation?: { summary?: string; min?: number; max?: number; currency?: string };
  customField?: { fieldLabel?: string; valueLabel?: string }[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    let body: SearchRequest = {};
    if (req.method === "POST") {
      body = await req.json();
    }

    const page = Math.max(1, body.page || 1);
    const resultsPerPage = Math.min(Math.max(1, body.results_per_page || 10), 50);
    const offset = (page - 1) * resultsPerPage;

    // Verified SmartRecruiters company IDs — these are public company slugs.
    // The SmartRecruiters Posting API is keyless and public for companies that have it enabled.
    // Source: https://developers.smartrecruiters.com/docs/public-api
    const srCompanies: { id: string; name: string }[] = [
      { id: "smartrecruiters", name: "SmartRecruiters" },
      { id: "bosch", name: "Bosch" },
      { id: "cbre", name: "CBRE" },
      { id: "verizon", name: "Verizon" },
      { id: "mkorporated", name: "M-KOPA" },
    ];

    // Fetch all postings from all companies in parallel
    const fetches = srCompanies.map(async ({ id, name }) => {
      const apiUrl = `https://api.smartrecruiters.com/v1/companies/${id}/postings?limit=100&offset=0`;
      try {
        const resp = await fetch(apiUrl, { headers: { Accept: "application/json" } });
        if (!resp.ok) return [];
        const data = await resp.json();
        if (!data.content || !Array.isArray(data.content)) return [];
        return (data.content as SmartRecruitersPosting[]).map((p) => ({ ...p, _companyName: name }));
      } catch {
        return [];
      }
    });

    const allNested = await Promise.all(fetches);
    const allPostings = allNested.flat() as (SmartRecruitersPosting & { _companyName?: string })[];

    // Apply query filter
    let filtered = allPostings;
    if (body.query && body.query.trim()) {
      const q = body.query.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const title = (p.name || "").toLowerCase();
        const dept = (p.department?.label || "").toLowerCase();
        return title.includes(q) || dept.includes(q);
      });
    }

    // Apply location filter
    if (body.location && body.location.trim()) {
      const loc = body.location.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const jobLoc = [p.location?.city, p.location?.region, p.location?.country].filter(Boolean).join(", ").toLowerCase();
        return jobLoc.includes(loc);
      });
    }

    // Map to CareerFlow Job shape
    const mappedJobs = filtered.map((p) => {
      const company = p._companyName || "Unknown Company";
      const location = [p.location?.city, p.location?.region, p.location?.country].filter(Boolean).join(", ") || undefined;

      // Build description from job ad sections
      let description = "";
      if (p.jobAd?.sections) {
        const parts: string[] = [];
        for (const sectionKey of Object.keys(p.jobAd.sections)) {
          const section = p.jobAd.sections[sectionKey];
          if (section?.title && section?.text) {
            parts.push(`${section.title}\n${section.text.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()}`);
          }
        }
        description = parts.join("\n\n");
      }
      description = description
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();

      const title = p.name || "Untitled Position";
      const titleLower = title.toLowerCase();
      const descLower = description.toLowerCase();

      // Determine employment type
      let employmentType = "full_time";
      const empCode = p.employmentType?.code || "";
      const empLabel = (p.employmentType?.label || "").toLowerCase();
      if (empCode === "PART_TIME" || empLabel.includes("part")) {
        employmentType = "part_time";
      } else if (empCode === "CONTRACTOR" || empLabel.includes("contract")) {
        employmentType = "contract";
      } else if (titleLower.includes("intern") || descLower.includes("internship")) {
        employmentType = "internship";
      }

      // Determine work arrangement
      let workArrangement = "on_site";
      if (p.location?.remote === true || descLower.includes("remote")) {
        workArrangement = "remote";
      } else if (descLower.includes("hybrid")) {
        workArrangement = "hybrid";
      }

      // Determine experience level
      let experienceLevel = "not_specified";
      const expLabel = (p.experienceLevel?.label || "").toLowerCase();
      if (titleLower.includes("senior") || titleLower.includes("sr.") || titleLower.includes("lead") || expLabel.includes("senior")) {
        experienceLevel = "senior";
      } else if (titleLower.includes("principal") || titleLower.includes("staff") || titleLower.includes("director")) {
        experienceLevel = "lead";
      } else if (titleLower.includes("mid") || titleLower.includes("ii ")) {
        experienceLevel = "mid";
      } else if (titleLower.includes("junior") || titleLower.includes("jr.") || titleLower.includes("entry") || titleLower.includes("graduate") || expLabel.includes("entry") || expLabel.includes("junior")) {
        experienceLevel = "entry_level";
      } else if (descLower.match(/(7\+|8\+|9\+|10\+)\s*years?/)) {
        experienceLevel = "lead";
      } else if (descLower.match(/(5\+|6\+)\s*years?/)) {
        experienceLevel = "senior";
      } else if (descLower.match(/(3\+|4\+)\s*years?/)) {
        experienceLevel = "mid";
      } else if (descLower.match(/(1\+|2\+)\s*years?/)) {
        experienceLevel = "junior";
      }

      // Extract skills
      const skills: string[] = [];
      const commonSkills = [
        "java", "python", "javascript", "react", "node.js", "sql", "aws", "docker",
        "kubernetes", "typescript", "c++", "c#", "go", "ruby", "php", "swift",
        "kotlin", "flutter", "android", "ios", "html", "css", "git", "linux",
        "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "graphql",
        "rest api", "microservices", "ci/cd", "jenkins", "terraform", "ansible",
        "machine learning", "data science", "tensorflow", "pytorch", "pandas",
        "numpy", "tableau", "power bi", "excel", "spring boot", "django",
        "flask", "angular", "vue", "next.js", "express", "redux", "tailwind",
        "selenium", "cypress", "junit", "kafka", "rabbitmq", "spark", "hadoop",
        "cybersecurity", "penetration testing", "network security", "siem",
        "firewall", "encryption", "cryptography", "risk assessment", "compliance",
        "iso 27001", "nist", "owasp", "burp suite", "wireshark", "nessus",
        "active directory", "windows server", "powershell", "bash", "shell scripting",
      ];
      const descLowerForSkills = description.toLowerCase();
      for (const skill of commonSkills) {
        if (descLowerForSkills.includes(skill) && !skills.includes(skill)) {
          skills.push(skill);
        }
      }

      // Salary range
      let salaryRange: string | undefined;
      if (p.compensation?.summary) {
        salaryRange = p.compensation.summary;
      } else if (p.compensation?.min && p.compensation?.max) {
        salaryRange = `${p.compensation.min.toLocaleString()} - ${p.compensation.max.toLocaleString()} ${p.compensation.currency || ""}`.trim();
      }

      // Posted date
      const postedAt = p.createdOn || p.postingDate?.date || undefined;

      // Application URL — prefer applyUrl, fall back to the posting URL
      const applyUrl = p.applyUrl || p.url || `https://careers.smartrecruiters.com/${p._companyName ? p._companyName.toLowerCase().replace(/\s+/g, "") : ""}/${p.id}`;

      return {
        id: `smartrecruiters-${p.id}`,
        title,
        company,
        location,
        employment_type: employmentType,
        work_arrangement: workArrangement,
        experience_level: experienceLevel,
        description,
        requirements: skills.map((s) => ({ skill: s, required: false })),
        skills,
        application_deadline: null,
        application_url: applyUrl,
        job_source: "SmartRecruiters",
        source_type: "company_careers",
        source_url: p.url || applyUrl,
        posted_at: postedAt,
        salary_range: salaryRange,
      };
    });

    // Apply experience_level filter
    let resultJobs = mappedJobs;
    if (body.experience_level) {
      resultJobs = resultJobs.filter((j) => j.experience_level === body.experience_level);
    }

    // Apply work_arrangement filter
    if (body.work_arrangement) {
      resultJobs = resultJobs.filter((j) => j.work_arrangement === body.work_arrangement);
    }

    // Quality gate
    resultJobs = resultJobs.filter((j) => {
      if (!j.title || !j.title.trim() || j.title === "Untitled Position") return false;
      if (!j.company || j.company === "Unknown Company" || j.company.includes("[object Object]")) return false;
      if (!j.application_url || typeof j.application_url !== "string") return false;
      try {
        const u = new URL(j.application_url);
        if (u.protocol !== "http:" && u.protocol !== "https:") return false;
      } catch {
        return false;
      }
      if (j.description && j.description.includes("[object Object]")) return false;
      return true;
    });

    // Sort
    if (body.sort === "latest") {
      resultJobs.sort((a, b) => {
        const da = a.posted_at ? new Date(a.posted_at).getTime() : 0;
        const db = b.posted_at ? new Date(b.posted_at).getTime() : 0;
        return db - da;
      });
    }

    // Deduplicate
    const seenIds = new Set<string>();
    resultJobs = resultJobs.filter((j) => {
      if (seenIds.has(j.id)) return false;
      seenIds.add(j.id);
      return true;
    });

    // Pagination
    const start = (page - 1) * resultsPerPage;
    const paginatedJobs = resultJobs.slice(start, start + resultsPerPage);
    const total = resultJobs.length;
    const hasMore = start + resultsPerPage < total;

    const result = {
      jobs: paginatedJobs,
      total,
      has_more: hasMore,
      source: "SmartRecruiters",
      configured: true,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Internal server error", configured: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
