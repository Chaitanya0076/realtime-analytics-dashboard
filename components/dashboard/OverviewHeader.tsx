"use client";

import { useEffect, useState } from "react";
import TrafficPieChart from "./TrafficPieChart";

type DomainView = {
  domain: string;
  views: number;
};

export default function OverviewHeader() {
  const [data, setData] = useState<{
    totalViews: number;
    domains: DomainView[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/analytics/overview")
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="card">
      <h2>Total Page Views</h2>

      <div className="flex gap-6">
        <TrafficPieChart domains={data.domains} />

        <div className="flex-1">
          <div className="stat-card">
            <p>Total Views</p>
            <h1>{data.totalViews.toLocaleString()}</h1>
          </div>

          <ul>
            {data.domains.map(d => (
              <li key={d.domain} className="flex justify-between">
                <span>{d.domain}</span>
                <span>{d.views.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
