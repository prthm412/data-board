import { useState, useEffect, type FormEvent } from "react";
import axios from "axios";
import {
  uploadDataset,
  listDatasets,
  deleteDataset,
  previewDataset,
  type Dataset,
  type DatasetPreview,
} from "../api/datasets";

const PAGE_SIZE = 5;

export default function DataPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [previewFor, setPreviewFor] = useState<Dataset | null>(null);
  const [previewData, setPreviewData] = useState<DatasetPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadDatasets = async (targetPage: number) => {
    const res = await listDatasets(targetPage, PAGE_SIZE);
    setDatasets(res.items);
    setTotal(res.total);
    setPage(res.page);
  };

  useEffect(() => {
    const load = async () => {
      await loadDatasets(1);
    };
    load();
  }, []);

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError("");
    if (!file) {
      setUploadError("Please choose a CSV file");
      return;
    }
    setUploading(true);
    try {
      await uploadDataset(name, file);
      setName("");
      setFile(null);
      (e.target as HTMLFormElement).reset();
      await loadDatasets(1);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setUploadError(err.response?.data?.detail ?? "Upload failed");
      } else {
        setUploadError("Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const openPreview = async (dataset: Dataset) => {
    setPreviewFor(dataset);
    setPreviewLoading(true);
    try {
      const data = await previewDataset(dataset.id);
      setPreviewData(data);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewFor(null);
    setPreviewData(null);
  };

  const handleDelete = async (id: number) => {
    await deleteDataset(id);
    setConfirmDeleteId(null);
    const nextPage = datasets.length === 1 && page > 1 ? page - 1 : page;
    await loadDatasets(nextPage);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Upload dataset</h2>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>Dataset name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>CSV file</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          {uploadError && <p className="error-text">{uploadError}</p>}
          <button className="btn" type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Your datasets</h2>
        {datasets.length === 0 && <p>No datasets yet. Upload one above.</p>}
        {datasets.map((d) => (
          <div className="dataset-row" key={d.id}>
            <div>
              <strong>{d.name}</strong>
              <div style={{ fontSize: 12, color: "#777" }}>
                {d.column_names.join(", ")}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => openPreview(d)}>
                Preview
              </button>
              {confirmDeleteId === d.id ? (
                <>
                  <button className="btn btn-danger" onClick={() => handleDelete(d.id)}>
                    Confirm delete
                  </button>
                  <button className="btn btn-secondary" onClick={() => setConfirmDeleteId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn btn-danger" onClick={() => setConfirmDeleteId(d.id)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}

        {total > PAGE_SIZE && (
          <div className="pagination">
            <button
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => loadDatasets(page - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              disabled={page >= totalPages}
              onClick={() => loadDatasets(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {previewFor && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={closePreview}
        >
          <div
            className="card"
            style={{ maxWidth: 800, maxHeight: "80vh", overflow: "auto", width: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Preview: {previewFor.name}</h3>
            {previewLoading && <p>Loading...</p>}
            {previewData && (
              <>
                <p style={{ fontSize: 13, color: "#777" }}>
                  Showing {previewData.rows.length} of {previewData.total_rows} rows
                </p>
                <table>
                  <thead>
                    <tr>
                      {previewData.columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row, i) => (
                      <tr key={i}>
                        {previewData.columns.map((c) => (
                          <td key={c}>{String(row[c] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={closePreview}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}