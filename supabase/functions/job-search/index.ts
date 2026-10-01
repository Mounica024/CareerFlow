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
  full_time?: boolean;
  permanent?: boolean;
  country?: string;
  experience_level?: string;
  work_arrangement?: string;
  sort?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get("ADZUNA_APP_ID");
    const appKey = Deno.env.get("ADZUNA_APP_KEY");

    if (!appId || !appKey) {
      return new Response(
        JSON.stringify({
          error: "Adzuna API credentials are not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY as edge function secrets.",
          configured: false,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
        full_time: url.searchParams.get("full_time") === "true",
        permanent: url.searchParams.get("permanent") === "true",
        country: url.searchParams.get("country") || "in",
      };
    }

    const country = body.country || "in";
    const page = Math.max(1, body.page || 1);
    const resultsPerPage = Math.min(Math.max(1, body.results_per_page || 10), 50);

    // Build Adzuna API URL — only include parameters that have valid non-empty values
    const baseUrl = `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/${page}`;
    const params = new URLSearchParams();
    params.set("app_id", appId);
    params.set("app_key", appKey);
    params.set("results_per_page", resultsPerPage.toString());

    if (body.query && body.query.trim()) {
      params.set("what", body.query.trim());
    }
    if (body.location && body.location.trim()) {
      params.set("where", body.location.trim());
    }
    if (body.full_time === true) {
      params.set("full_time", "1");
    }
    if (body.permanent === true) {
      params.set("permanent", "1");
    }
    // Adzuna supports sort by date or relevance
    if (body.sort === "latest") {
      params.set("sort_by", "date");
      params.set("sort_dir", "down");
    } else if (body.sort === "deadline") {
      // Adzuna does not natively sort by deadline; use date as closest proxy
      params.set("sort_by", "date");
      params.set("sort_dir", "up");
    }

    const apiUrl = `${baseUrl}?${params.toString()}`;

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        headers: { Accept: "application/json" },
      });
    } catch (fetchErr) {
      return new Response(
        JSON.stringify({
          error: "Failed to connect to Adzuna API.",
          configured: true,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: `Adzuna API returned HTTP ${response.status}`,
          configured: true,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    // Deduplicate by Adzuna job ID — sometimes the API returns the same listing twice
    const seenIds = new Set<string>();
    const rawResults: Record<string, unknown>[] = (data.results || []).filter((r: Record<string, unknown>) => {
      const adzunaId = String(r.id || "");
      if (seenIds.has(adzunaId)) return false;
      seenIds.add(adzunaId);
      return true;
    });

    // Map Adzuna results to CareerFlow Job shape
    const allJobs = rawResults.map((r: Record<string, unknown>) => {
      const id = String(r.id || "");
      const title = String(r.title || "Untitled Position");
      const companyRaw = r.company;
      let company: string;
      if (typeof companyRaw === 'string') {
        company = companyRaw.trim() || 'Unknown Company';
      } else if (companyRaw && typeof companyRaw === 'object') {
        const cobj = companyRaw as Record<string, unknown>;
        const cname = cobj.display_name || cobj.name || cobj.label;
        company = (typeof cname === 'string' && cname.trim()) ? cname.trim() : 'Unknown Company';
      } else {
        company = 'Unknown Company';
      }
      const locationObj = r.location as Record<string, unknown> | undefined;
      const location = locationObj?.display_name ? String(locationObj.display_name) : undefined;
      const description = String(r.description || "");
      const contractTime = String(r.contract_time || "");
      const contractType = String(r.contract_type || "");
      const category = (r.category as Record<string, unknown>)?.label ? String((r.category as Record<string, unknown>).label) : undefined;
      const salaryMin = r.salary_min as number | undefined;
      const salaryMax = r.salary_max as number | undefined;
      const created = r.created ? String(r.created) : undefined;
      const redirectUrl = String(r.redirect_url || r.url || "");

      // Determine employment type
      let employmentType: string = "full_time";
      if (contractTime === "part_time") employmentType = "part_time";
      else if (contractType === "contract") employmentType = "contract";
      else if (title.toLowerCase().includes("intern") || description.toLowerCase().includes("internship")) employmentType = "internship";

      // Determine work arrangement from description
      const descLower = description.toLowerCase();
      let workArrangement: string = "on_site";
      if (descLower.includes("remote") || descLower.includes("work from home")) workArrangement = "remote";
      else if (descLower.includes("hybrid")) workArrangement = "hybrid";

      // Determine experience level from title and description
      const titleLower = title.toLowerCase();
      const descLowerForLevel = description.toLowerCase();
      let experienceLevel: string = "entry_level";
      if (titleLower.includes("senior") || titleLower.includes("sr.") || titleLower.includes("lead")) {
        experienceLevel = "senior";
      } else if (titleLower.includes("principal") || titleLower.includes("staff") || titleLower.includes("director")) {
        experienceLevel = "lead";
      } else if (titleLower.includes("mid") || titleLower.includes("ii ")) {
        experienceLevel = "mid";
      } else if (titleLower.includes("junior") || titleLower.includes("jr.") || titleLower.includes("entry") || titleLower.includes("graduate") || titleLower.includes("fresher")) {
        experienceLevel = "entry_level";
      } else if (descLowerForLevel.match(/(7\+|8\+|9\+|10\+)\s*years?/)) {
        experienceLevel = "lead";
      } else if (descLowerForLevel.match(/(5\+|6\+)\s*years?/)) {
        experienceLevel = "senior";
      } else if (descLowerForLevel.match(/(3\+|4\+)\s*years?/)) {
        experienceLevel = "mid";
      } else if (descLowerForLevel.match(/(1\+|2\+)\s*years?/)) {
        experienceLevel = "junior";
      } else {
        experienceLevel = "entry_level";
      }

      // Build salary range string
      let salaryRange: string | undefined;
      if (salaryMin && salaryMax) {
        salaryRange = `${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}`;
      } else if (salaryMin) {
        salaryRange = `From ${salaryMin.toLocaleString()}`;
      } else if (salaryMax) {
        salaryRange = `Up to ${salaryMax.toLocaleString()}`;
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

      // Extract application deadline from description if mentioned
      let applicationDeadline: string | null = null;
      const deadlineMatch = description.match(/(?:deadline|apply by|last date|closes? on)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\w+ \d{1,2},? \d{4})/i);
      if (deadlineMatch) {
        const parsed = new Date(deadlineMatch[1]);
        if (!isNaN(parsed.getTime())) {
          applicationDeadline = parsed.toISOString();
        }
      }

      return {
        id: `adzuna-${id}`,
        title,
        company: String(company),
        location,
        employment_type: employmentType,
        work_arrangement: workArrangement,
        experience_level: experienceLevel,
        description: description.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim(),
        requirements: skills.map((s) => ({ skill: s, required: false })),
        skills,
        application_deadline: applicationDeadline,
        application_url: redirectUrl,
        job_source: "Adzuna",
        source_type: "job_aggregator",
        source_url: "https://www.adzuna.com",
        posted_at: created,
        salary_range: salaryRange,
        category,
      };
    });

    // Post-map filtering: experience_level and work_arrangement are derived
    // from title/description heuristics, so we filter after mapping.
    let filteredJobs = allJobs;
    if (body.experience_level) {
      filteredJobs = filteredJobs.filter((j) => j.experience_level === body.experience_level);
    }
    if (body.work_arrangement) {
      filteredJobs = filteredJobs.filter((j) => j.work_arrangement === body.work_arrangement);
    }

    // Filter out expired jobs (deadline in the past)
    const now = Date.now();
    filteredJobs = filteredJobs.filter((j) => {
      if (!j.application_deadline) return true;
      return new Date(j.application_deadline).getTime() > now;
    });

    const result = {
      jobs: filteredJobs,
      total: data.count || filteredJobs.length,
      has_more: (data.count || 0) > page * resultsPerPage,
      source: "Adzuna",
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
