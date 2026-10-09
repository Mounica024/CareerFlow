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

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at: string;
  location: { name: string } | null;
  departments: { name: string }[];
  metadata: { name: string; value: string }[];
  content?: string;
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

    // Verified Greenhouse board tokens — these are public, per-company slugs.
    // The Greenhouse Job Board API is keyless and public.
    // Source: https://developers.greenhouse.io/job-board.html
    // Verified working board tokens — tested against the live Greenhouse API.
    // Source: https://developers.greenhouse.io/job-board.html
    const greenhouseBoards: { token: string; name: string }[] = [
      { token: "anthropic", name: "Anthropic" },
      { token: "stripe", name: "Stripe" },
      { token: "airbnb", name: "Airbnb" },
      { token: "coinbase", name: "Coinbase" },
      { token: "brex", name: "Brex" },
      { token: "monzo", name: "Monzo" },
      { token: "mercury", name: "Mercury" },
    ];

    // Fetch all jobs from all boards in parallel
    const fetches = greenhouseBoards.map(async ({ token, name }) => {
      const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
      try {
        const resp = await fetch(apiUrl, { headers: { Accept: "application/json" } });
        if (!resp.ok) return [];
        const data = await resp.json();
        if (!data.jobs || !Array.isArray(data.jobs)) return [];
        return (data.jobs as GreenhouseJob[]).map((j) => ({ ...j, _companyName: name }));
      } catch {
        return [];
      }
    });

    const allJobsNested = await Promise.all(fetches);
    const allJobs = allJobsNested.flat() as (GreenhouseJob & { _companyName?: string })[];

    // Apply query filter
    let filtered = allJobs;
    if (body.query && body.query.trim()) {
      const q = body.query.trim().toLowerCase();
      filtered = filtered.filter((j) => {
        const title = (j.title || "").toLowerCase();
        const desc = (j.content || "").toLowerCase();
        const dept = (j.departments?.map((d) => d.name).join(" ") || "").toLowerCase();
        return title.includes(q) || desc.includes(q) || dept.includes(q);
      });
    }

    // Apply location filter
    if (body.location && body.location.trim()) {
      const loc = body.location.trim().toLowerCase();
      filtered = filtered.filter((j) => {
        const jobLoc = (j.location?.name || "").toLowerCase();
        return jobLoc.includes(loc);
      });
    }

    // Map to CareerFlow Job shape
    const mappedJobs = filtered.map((j) => {
      const company = j._companyName || "Unknown Company";
      const location = j.location?.name || undefined;
      const descriptionRaw = j.content || "";
      const description = descriptionRaw
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/<[^>]*>/g, " ")
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
      const title = j.title || "Untitled Position";
      const titleLower = title.toLowerCase();
      const descLower = description.toLowerCase();

      // Determine employment type
      let employmentType = "full_time";
      if (titleLower.includes("intern") || descLower.includes("internship")) {
        employmentType = "internship";
      } else if (titleLower.includes("contract") || descLower.includes("contract position")) {
        employmentType = "contract";
      } else if (titleLower.includes("part-time") || descLower.includes("part time")) {
        employmentType = "part_time";
      }

      // Determine work arrangement
      let workArrangement = "on_site";
      if (descLower.includes("remote") || titleLower.includes("remote")) {
        workArrangement = "remote";
      } else if (descLower.includes("hybrid") || titleLower.includes("hybrid")) {
        workArrangement = "hybrid";
      }

      // Determine experience level from title and description
      let experienceLevel = "not_specified";
      if (titleLower.includes("senior") || titleLower.includes("sr.") || titleLower.includes("lead")) {
        experienceLevel = "senior";
      } else if (titleLower.includes("principal") || titleLower.includes("staff") || titleLower.includes("director")) {
        experienceLevel = "lead";
      } else if (titleLower.includes("mid") || titleLower.includes("ii ")) {
        experienceLevel = "mid";
      } else if (titleLower.includes("junior") || titleLower.includes("jr.") || titleLower.includes("entry") || titleLower.includes("graduate")) {
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

      // Extract skills from description
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

      // Posted date from updated_at
      const postedAt = j.updated_at || undefined;

      return {
        id: `greenhouse-${j.id}`,
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
        application_url: j.absolute_url,
        job_source: "Greenhouse",
        source_type: "company_careers",
        source_url: j.absolute_url,
        posted_at: postedAt,
        salary_range: undefined,
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

    // Deduplicate by job ID
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
      source: "Greenhouse",
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
