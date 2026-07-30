import { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import axios from "axios";
import {
  listDatasets,
  computeStat,
  getPlotData,
  type Dataset,
  type ComputeResult,
} from "../api/datasets";

type ChartType = "scatter" | "line" | "bar";

export default function AnalyticsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [computeColumn, setComputeColumn] = useState("");
  const [operation, setOperation] = useState<"min" | "max" | "sum">("sum");
  const [computeResult, setComputeResult] = useState<ComputeResult | null>(null);
  const [computeError, setComputeError] = useState("");

  const [col1, setCol1] = useState("");
  const [col2, setCol2] = useState("");
  const [chartType, setChartType] = useState<ChartType>("scatter");
  const [chartOption, setChartOption] = useState<Record<string, unknown> | null>(null);
  const [plotError, setPlotError] = useState("");

  useEffect(() => {
    listDatasets(1, 100).then((res) => setDatasets(res.items));
  }, []);

  const selectedDataset = datasets.find((d) => d.id === selectedId) ?? null;

  const handleSelectDataset = (id: number) => {
    setSelectedId(id);
    setComputeResult(null);
    setComputeError("");
    setChartOption(null);
    setPlotError("");
    setComputeColumn("");
    setCol1("");
    setCol2("");
  };

  const handleCompute = async () => {
    if (!selectedId || !computeColumn) return;
    setComputeError("");
    setComputeResult(null);
    try {
      const res = await computeStat(selectedId, computeColumn, operation);
      setComputeResult(res);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setComputeError(err.response?.data?.detail ?? "Compute failed");
      } else {
        setComputeError("Compute failed");
      }
    }
  };

  const handlePlot = async () => {
    if (!selectedId || !col1 || !col2) return;
    setPlotError("");
    setChartOption(null);
    try {
      const res = await getPlotData(selectedId, col1, col2);
      const xValues = res.data.map((p) => p.col1 as string | number);
      const yValues = res.data.map((p) => p.col2 as number);

      let option: Record<string, unknown>;
      if (chartType === "scatter") {
        option = {
          xAxis: { name: res.col1, type: "value" },
          yAxis: { name: res.col2, type: "value" },
          series: [{ data: res.data.map((p) => [p.col1, p.col2]), type: "scatter" }],
          tooltip: { trigger: "item" },
        };
      } else {
        option = {
          xAxis: { name: res.col1, type: "category", data: xValues },
          yAxis: { name: res.col2, type: "value" },
          series: [{ data: yValues, type: chartType }],
          tooltip: { trigger: "axis" },
        };
      }
      setChartOption(option);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setPlotError(err.response?.data?.detail ?? "Plot failed");
      } else {
        setPlotError("Plot failed");
      }
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Select dataset</h2>
        <select
          value={selectedId ?? ""}
          onChange={(e) => handleSelectDataset(Number(e.target.value))}
        >
          <option value="" disabled>
            Choose a dataset
          </option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {selectedDataset && (
        <>
          <div className="card">
            <h2>Compute a statistic</h2>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Column</label>
                <select value={computeColumn} onChange={(e) => setComputeColumn(e.target.value)}>
                  <option value="" disabled>
                    Choose column
                  </option>
                  {selectedDataset.column_names.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Operation</label>
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value as "min" | "max" | "sum")}
                >
                  <option value="min">Min</option>
                  <option value="max">Max</option>
                  <option value="sum">Sum</option>
                </select>
              </div>
              <button className="btn" onClick={handleCompute} disabled={!computeColumn}>
                Compute
              </button>
            </div>
            {computeError && <p className="error-text">{computeError}</p>}
            {computeResult && (
              <p style={{ marginTop: 12 }}>
                <strong>{computeResult.operation}</strong> of{" "}
                <strong>{computeResult.column}</strong> = <strong>{computeResult.result}</strong>
              </p>
            )}
          </div>

          <div className="card">
            <h2>Plot two columns</h2>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Column 1 (X)</label>
                <select value={col1} onChange={(e) => setCol1(e.target.value)}>
                  <option value="" disabled>
                    Choose column
                  </option>
                  {selectedDataset.column_names.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Column 2 (Y)</label>
                <select value={col2} onChange={(e) => setCol2(e.target.value)}>
                  <option value="" disabled>
                    Choose column
                  </option>
                  {selectedDataset.column_names.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Chart type</label>
                <select value={chartType} onChange={(e) => setChartType(e.target.value as ChartType)}>
                  <option value="scatter">Scatter</option>
                  <option value="line">Line</option>
                  <option value="bar">Bar</option>
                </select>
              </div>
              <button className="btn" onClick={handlePlot} disabled={!col1 || !col2}>
                Plot
              </button>
            </div>
            {plotError && <p className="error-text">{plotError}</p>}
            {chartOption && (
              <div style={{ marginTop: 16 }}>
                <ReactECharts option={chartOption} style={{ height: 400 }} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}