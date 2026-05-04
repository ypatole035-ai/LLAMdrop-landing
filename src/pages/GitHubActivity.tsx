import { useState, useEffect } from "react";
import {
  GitCommit, GitPullRequest, AlertCircle, Users,
  Tag, Activity, Clock, ExternalLink, ArrowLeft, Github
} from "lucide-react";

const REPO = "ypatole035-ai/llamdrop";
const API = "https://api.github.com/repos/" + REPO;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  return `${mins}m ago`;
}

function Blink() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 14,
        background: "hsl(70 100% 50%)",
        marginLeft: 2,
        verticalAlign: "middle",
        animation: "blink 1s step-end infinite",
      }}
    />
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "hsl(0 0% 6%)",
        border: `1px solid ${accent ? "hsl(70 100% 50% / 0.4)" : "hsl(0 0% 15%)"}`,
        padding: "1.25rem",
        boxShadow: accent ? "4px 4px 0 0 hsl(70 100% 50% / 0.15)" : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {accent && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "hsl(70 100% 50%)",
        }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Icon size={14} color={accent ? "hsl(70 100% 50%)" : "hsl(0 0% 60%)"} />
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "hsl(0 0% 60%)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 28, fontWeight: 700, color: accent ? "hsl(70 100% 50%)" : "hsl(0 0% 90%)", lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "hsl(0 0% 40%)", marginTop: 6 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function CommitRow({ commit }: { commit: any }) {
  const msg = commit.commit.message.split("\n")[0];
  const author = commit.commit.author.name;
  const date = commit.commit.author.date;
  const sha = commit.sha.slice(0, 7);

  return (
    <a
      href={commit.html_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "0.75rem 1rem",
        borderBottom: "1px solid hsl(0 0% 10%)",
        textDecoration: "none",
        transition: "background 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "hsl(0 0% 8%)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <GitCommit size={14} color="hsl(70 100% 50% / 0.6)" style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 12,
          color: "hsl(0 0% 85%)", whiteSpace: "nowrap", overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {msg}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "hsl(70 100% 50%)" }}>{sha}</span>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "hsl(0 0% 40%)" }}>{author}</span>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "hsl(0 0% 35%)" }}>{timeAgo(date)}</span>
        </div>
      </div>
      <ExternalLink size={12} color="hsl(0 0% 30%)" style={{ flexShrink: 0 }} />
    </a>
  );
}

function ContributorCard({ contributor }: { contributor: any }) {
  return (
    <a
      href={contributor.html_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        padding: "1rem", border: "1px solid hsl(0 0% 12%)",
        background: "hsl(0 0% 6%)", textDecoration: "none",
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "hsl(70 100% 50% / 0.4)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "hsl(0 0% 12%)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <img
        src={contributor.avatar_url}
        alt={contributor.login}
        style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid hsl(0 0% 15%)" }}
      />
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "hsl(0 0% 75%)", textAlign: "center" }}>
        {contributor.login}
      </div>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "hsl(70 100% 50%)" }}>
        {contributor.contributions} commits
      </div>
    </a>
  );
}

function IssueRow({ issue, type }: { issue: any; type: "issue" | "pr" }) {
  const isPR = type === "pr";
  return (
    <a
      href={issue.html_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "0.75rem 1rem", borderBottom: "1px solid hsl(0 0% 10%)",
        textDecoration: "none", transition: "background 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "hsl(0 0% 8%)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {isPR
        ? <GitPullRequest size={14} color="hsl(270 80% 70%)" style={{ marginTop: 2, flexShrink: 0 }} />
        : <AlertCircle size={14} color="hsl(0 84% 60%)" style={{ marginTop: 2, flexShrink: 0 }} />
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 12,
          color: "hsl(0 0% 85%)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {issue.title}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "hsl(0 0% 40%)" }}>
            #{issue.number} · {issue.user.login} · {timeAgo(issue.created_at)}
          </span>
        </div>
      </div>
      <ExternalLink size={12} color="hsl(0 0% 30%)" style={{ flexShrink: 0 }} />
    </a>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: "1rem", paddingBottom: "0.5rem",
        borderBottom: "1px solid hsl(0 0% 12%)",
      }}>
        <Icon size={14} color="hsl(70 100% 50%)" />
        <span style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 11,
          color: "hsl(0 0% 60%)", textTransform: "uppercase", letterSpacing: "0.12em",
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function GitHubActivity() {
  const [repo, setRepo] = useState<any>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [contributors, setContributors] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [prs, setPrs] = useState<any[]>([]);
  const [release, setRelease] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [repoRes, commitsRes, contribRes, issuesRes, prsRes, releaseRes] = await Promise.all([
          fetch(API),
          fetch(`${API}/commits?per_page=10`),
          fetch(`${API}/contributors?per_page=12`),
          fetch(`${API}/issues?state=open&per_page=5&labels=`),
          fetch(`${API}/pulls?state=open&per_page=5`),
          fetch(`${API}/releases/latest`),
        ]);

        const [repoData, commitsData, contribData, issuesData, prsData] = await Promise.all([
          repoRes.json(),
          commitsRes.json(),
          contribRes.json(),
          issuesRes.json(),
          prsRes.json(),
        ]);

        setRepo(repoData);
        setCommits(Array.isArray(commitsData) ? commitsData : []);
        setContributors(Array.isArray(contribData) ? contribData : []);
        setIssues(Array.isArray(issuesData) ? issuesData.filter((i: any) => !i.pull_request) : []);
        setPrs(Array.isArray(prsData) ? prsData : []);

        if (releaseRes.ok) {
          setRelease(await releaseRes.json());
        }
      } catch (e) {
        setError("Failed to fetch GitHub data. Rate limit or network error.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "hsl(0 0% 4%)",
      color: "hsl(0 0% 90%)",
      fontFamily: "Space Grotesk, sans-serif",
    }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: hsl(0 0% 6%); }
        ::-webkit-scrollbar-thumb { background: hsl(0 0% 20%); }
      `}</style>

      {/* Navbar */}
      <nav style={{
        borderBottom: "1px solid hsl(0 0% 12%)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
        background: "hsl(0 0% 4% / 0.95)",
        backdropFilter: "blur(8px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "hsl(0 0% 60%)", textDecoration: "none",
            fontFamily: "JetBrains Mono, monospace", fontSize: 12,
            transition: "color 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "hsl(70 100% 50%)")}
            onMouseLeave={e => (e.currentTarget.style.color = "hsl(0 0% 60%)")}
          >
            <ArrowLeft size={14} /> back
          </a>
          <span style={{ color: "hsl(0 0% 20%)" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 14,
              fontWeight: 700, color: "hsl(70 100% 50%)",
            }}>
              [&gt;_]
            </span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "hsl(0 0% 80%)" }}>
              llamdrop
            </span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "hsl(0 0% 40%)" }}>
              / activity
            </span>
          </div>
        </div>
        <a
          href={`https://github.com/${REPO}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "JetBrains Mono, monospace", fontSize: 12,
            color: "hsl(0 0% 0%)", background: "hsl(70 100% 50%)",
            padding: "0.4rem 0.9rem", textDecoration: "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          <Github size={13} /> GitHub
        </a>
      </nav>

      {/* Hero */}
      <div style={{
        padding: "3rem 1.5rem 2rem",
        borderBottom: "1px solid hsl(0 0% 10%)",
        animation: "fadeUp 0.5s ease",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 11,
            color: "hsl(0 0% 40%)", textTransform: "uppercase",
            letterSpacing: "0.15em", marginBottom: "0.75rem",
          }}>
            $ git log --all --oneline
          </div>
          <h1 style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
            fontWeight: 700, color: "hsl(0 0% 95%)", margin: 0, lineHeight: 1.1,
          }}>
            GitHub Activity<Blink />
          </h1>
          <p style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 13,
            color: "hsl(0 0% 45%)", marginTop: "0.75rem",
          }}>
            Live data from <span style={{ color: "hsl(70 100% 50%)" }}>{REPO}</span> — updates on every visit
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {loading && (
          <div style={{
            textAlign: "center", padding: "4rem",
            fontFamily: "JetBrains Mono, monospace", fontSize: 13,
            color: "hsl(0 0% 40%)",
          }}>
            <div style={{ marginBottom: 8 }}>fetching repository data</div>
            <Blink />
          </div>
        )}

        {error && (
          <div style={{
            padding: "1rem", border: "1px solid hsl(0 84% 60% / 0.3)",
            background: "hsl(0 84% 60% / 0.05)",
            fontFamily: "JetBrains Mono, monospace", fontSize: 12,
            color: "hsl(0 84% 60%)",
          }}>
            ✗ {error}
          </div>
        )}

        {!loading && !error && repo && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>

            {/* Stats Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "1rem", marginBottom: "2.5rem",
            }}>
              {release && (
                <StatCard icon={Tag} label="Latest Release" value={release.tag_name} sub={timeAgo(release.published_at)} accent />
              )}
              <StatCard icon={GitCommit} label="Commits" value={commits.length > 0 ? `${commits.length}+` : "—"} sub="recent" />
              <StatCard icon={Users} label="Contributors" value={contributors.length} sub="total" />
              <StatCard icon={AlertCircle} label="Open Issues" value={issues.length} sub="needs attention" />
              <StatCard icon={GitPullRequest} label="Open PRs" value={prs.length} sub="in review" />
              <StatCard icon={Activity} label="Watchers" value={repo.watchers_count ?? 0} sub="watching" />
            </div>

            {/* Release notes */}
            {release && release.body && (
              <Section title="Latest Release Notes" icon={Tag}>
                <div style={{
                  background: "hsl(0 0% 6%)", border: "1px solid hsl(70 100% 50% / 0.2)",
                  padding: "1rem 1.25rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "hsl(70 100% 50%)", fontWeight: 700 }}>
                      {release.tag_name}
                    </span>
                    <a href={release.html_url} target="_blank" rel="noopener noreferrer" style={{
                      fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                      color: "hsl(0 0% 40%)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
                    }}>
                      view on github <ExternalLink size={10} />
                    </a>
                  </div>
                  <pre style={{
                    fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                    color: "hsl(0 0% 65%)", whiteSpace: "pre-wrap", margin: 0,
                    lineHeight: 1.6, maxHeight: 200, overflow: "auto",
                  }}>
                    {release.body.slice(0, 600)}{release.body.length > 600 ? "..." : ""}
                  </pre>
                </div>
              </Section>
            )}

            {/* Recent Commits */}
            {commits.length > 0 && (
              <Section title="Recent Commits" icon={GitCommit}>
                <div style={{ border: "1px solid hsl(0 0% 12%)", overflow: "hidden" }}>
                  {commits.map((c: any) => (
                    <CommitRow key={c.sha} commit={c} />
                  ))}
                </div>
              </Section>
            )}

            {/* Contributors */}
            {contributors.length > 0 && (
              <Section title="Contributors" icon={Users}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                  gap: "0.75rem",
                }}>
                  {contributors.map((c: any) => (
                    <ContributorCard key={c.id} contributor={c} />
                  ))}
                </div>
              </Section>
            )}

            {/* Open Issues */}
            {issues.length > 0 && (
              <Section title="Open Issues" icon={AlertCircle}>
                <div style={{ border: "1px solid hsl(0 0% 12%)", overflow: "hidden" }}>
                  {issues.map((i: any) => (
                    <IssueRow key={i.id} issue={i} type="issue" />
                  ))}
                </div>
              </Section>
            )}

            {/* Open PRs */}
            {prs.length > 0 && (
              <Section title="Open Pull Requests" icon={GitPullRequest}>
                <div style={{ border: "1px solid hsl(0 0% 12%)", overflow: "hidden" }}>
                  {prs.map((p: any) => (
                    <IssueRow key={p.id} issue={p} type="pr" />
                  ))}
                </div>
              </Section>
            )}

            {/* Footer */}
            <div style={{
              borderTop: "1px solid hsl(0 0% 10%)", paddingTop: "1.5rem", marginTop: "1rem",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 8,
            }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "hsl(0 0% 30%)" }}>
                <Clock size={10} style={{ display: "inline", marginRight: 4 }} />
                fetched live · refreshes on each visit
              </span>
              <a
                href={`https://github.com/${REPO}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                  color: "hsl(0 0% 40%)", textDecoration: "none",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <Github size={10} /> {REPO}
              </a>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
