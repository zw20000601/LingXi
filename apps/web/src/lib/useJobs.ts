"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiJson, type Job } from "@/lib/api";

type JobFilter = {
  types?: string[];
  limit?: number;
};

export function useJobs({ types, limit = 30 }: JobFilter = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const typeKey = useMemo(() => (types ? types.join(",") : ""), [types]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiJson<Job[]>(`/api/jobs?limit=${limit}`);
      const allowed = typeKey ? new Set(typeKey.split(",")) : null;
      setJobs(allowed ? data.filter((job) => allowed.has(job.type)) : data);
    } catch (err) {
      setJobs([]);
      setError(err instanceof Error ? err.message : "任务读取失败");
    } finally {
      setLoading(false);
    }
  }, [limit, typeKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!jobs.some((job) => job.status === "PENDING" || job.status === "RUNNING")) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [jobs, refresh]);

  return { jobs, loading, error, refresh };
}

export async function deleteJob(jobId: string) {
  await apiJson<{ ok: boolean }>(`/api/jobs/${jobId}`, { method: "DELETE" });
}

export function jobStatusText(status: Job["status"]) {
  const map: Record<Job["status"], string> = {
    PENDING: "排队中",
    RUNNING: "处理中",
    SUCCEEDED: "已完成",
    FAILED: "失败",
  };
  return map[status];
}

export function jobStatusClass(status: Job["status"]) {
  const map: Record<Job["status"], string> = {
    PENDING: "bg-[#eef4ff] text-[#176bff]",
    RUNNING: "bg-[#eef4ff] text-[#176bff]",
    SUCCEEDED: "bg-[#e8fff4] text-[#18b878]",
    FAILED: "bg-[#fff0f0] text-[#ef3340]",
  };
  return map[status];
}
