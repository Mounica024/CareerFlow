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

interface LeverPosting {
  id: string;
  text: string;
  descriptionPlain?: string;
  description?: string;
  categories: Record<string, string>;
  createdAt: number;
  hostedUrl: string;
  applyUrl?: string;
  salaryDescription?: string;
  salaryRange?: { min: number; max: number; currency: string };
  workplaceType?: string;
  country?: string;
  region?: string;
  city?: string;
  location?: string;
  team?: string;
  commitment?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    let body: SearchRequest = {};
    if (req.method === "POST") {
      body = await req.json();
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      body = {
        query: url.searchParams.get("query") || undefined,
        location: url.searchParams.get("location") || undefined,
        page: url.searchParams.get("page") ? parseInt(url.searchParams.get("page")!) : 1,
        results_per_page: url.searchParams.get("results_per_page") ? parseInt(url.searchParams.get("results_per_page")!) : 10,
      };
    }

    const page = Math.max(1, body.page || 1);
    const resultsPerPage = Math.min(Math.max(1, body.results_per_page || 10), 50);

    // A curated set of companies that use Lever as their ATS.
    // These are public, unauthenticated endpoints — no API key needed.
    // Each returns all active postings for that company.
    const leverCompanies = [
      "lever",
      "netlify",
      "figma",
      "vercel",
      "linear",
      "notion",
      "loom",
      "plaid",
      "segment",
      "mixpanel",
    ];

    // Fetch all postings from all companies in parallel
    const fetches = leverCompanies.map(async (handle) => {
      const apiUrl = `https://api.lever.co/v0/postings/${handle}?mode=json`;
      try {
        const resp = await fetch(apiUrl, { headers: { Accept: "application/json" } });
        if (!resp.ok) return [];
        const data = await resp.json();
        if (!Array.isArray(data)) return [];
        return data as LeverPosting[];
      } catch {
        return [];
      }
    });

    const allPostingsNested = await Promise.all(fetches);
    const allPostings = allPostingsNested.flat();

    // Apply query filter
    let filtered = allPostings;
    if (body.query && body.query.trim()) {
      const q = body.query.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const title = (p.text || "").toLowerCase();
        const desc = (p.descriptionPlain || p.description || "").toLowerCase();
        const team = (p.categories?.team || "").toLowerCase();
        return title.includes(q) || desc.includes(q) || team.includes(q);
      });
    }

    // Apply location filter
    if (body.location && body.location.trim()) {
      const loc = body.location.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const jobLoc = [p.location, p.city, p.region, p.country].filter(Boolean).join(", ").toLowerCase();
        return jobLoc.includes(loc);
      });
    }

    // Map to CareerFlow Job shape
    const mappedJobs = filtered.map((p) => {
      // Extract the actual company name. Lever postings don't include the
      // employer name directly, so we use the handle from the posting's hostedUrl
      // as a fallback. The categories.team field is a department, not a company.
      const company = p.categories?.company || "Lever Employer";
      const location = [p.location, p.city, p.region, p.country].filter(Boolean).join(", ") || undefined;
      const description = (p.descriptionPlain || p.description || "").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
      const title = p.text || "Untitled Position";
      const titleLower = title.toLowerCase();
      const descLower = description.toLowerCase();

      // Determine employment type
      let employmentType = "full_time";
      const commitment = (p.commitment || p.categories?.commitment || "").toLowerCase();
      if (commitment.includes("part") || commitment.includes("contract")) {
        employmentType = commitment.includes("part") ? "part_time" : "contract";
      } else if (titleLower.includes("intern") || descLower.includes("internship")) {
        employmentType = "internship";
      }

      // Determine work arrangement
      let workArrangement = "on_site";
      const wpType = (p.workplaceType || "").toLowerCase();
      if (wpType.includes("remote") || descLower.includes("remote")) {
        workArrangement = "remote";
      } else if (wpType.includes("hybrid") || descLower.includes("hybrid")) {
        workArrangement = "hybrid";
      }

      // Determine experience level from title and description
      let experienceLevel = "entry_level";
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
      } else {
        experienceLevel = "entry_level";
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

      // Build salary range
      let salaryRange: string | undefined;
      if (p.salaryRange?.min && p.salaryRange?.max) {
        salaryRange = `${p.salaryRange.min.toLocaleString()} - ${p.salaryRange.max.toLocaleString()} ${p.salaryRange.currency || ""}`.trim();
      } else if (p.salaryDescription) {
        salaryRange = p.salaryDescription;
      }

      // Posted date
      const postedAt = p.createdAt ? new Date(p.createdAt).toISOString() : undefined;

      return {
        id: `lever-${p.id}`,
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
        application_url: p.applyUrl || p.hostedUrl,
        job_source: "Lever",
        source_type: "company_careers",
        source_url: p.hostedUrl,
        posted_at: postedAt,
        salary_range: salaryRange,
        category: p.categories?.team || p.team,
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

    // Filter out expired jobs
    const now = Date.now();
    resultJobs = resultJobs.filter((j) => {
      if (!j.application_deadline) return true;
      return new Date(j.application_deadline).getTime() > now;
    });

    // Sort
    if (body.sort === "latest") {
      resultJobs.sort((a, b) => {
        const da = a.posted_at ? new Date(a.posted_at).getTime() : 0;
        const db = b.posted_at ? new Date(b.posted_at).getTime() : 0;
        return db - da;
      });
    } else if (body.sort === "deadline") {
      resultJobs.sort((a, b) => {
        const da = a.application_deadline ? new Date(a.application_deadline).getTime() : Infinity;
        const db = b.application_deadline ? new Date(b.application_deadline).getTime() : Infinity;
        return da - db;
      });
    }

    // Deduplicate by Lever job ID
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
      source: "Lever",
      configured: true,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        configured: true,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
