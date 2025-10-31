import React, { useState } from "react";
import { X, Search } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { toast } from "react-toastify";

export default function UploadPrescriptionModal({ open, onClose, onSuccess }) {
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return setFile(null);
    // optional: limit file size to 5MB
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB allowed.");
      e.target.value = "";
      return setFile(null);
    }
    // optional: allow images + pdf only
    const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!allowed.includes(f.type)) {
      toast.error("Only PNG/JPG/PDF files allowed.");
      e.target.value = "";
      return setFile(null);
    }
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please attach a prescription file.");
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("notes", notes);

      // axiosClient should have baseURL set; we just call your route
      const token = localStorage.getItem("token"); // adapt to your auth flow
      const res = await axiosClient.post("/prescription/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res?.data?.success) {
        toast.success(res.data.message || "Uploaded successfully");
        setNotes("");
        setFile(null);
        onSuccess && onSuccess(res.data.prescription);
        onClose();
      } else {
        toast.error(res?.data?.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      const msg = err?.response?.data?.message || "Server error during upload";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* overlay */}
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-prescription-title"
          className="w-full max-w-md bg-white rounded-lg shadow-lg p-5 relative"
        >
          <button
            aria-label="Close"
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>

          <h3 id="upload-prescription-title" className="text-lg font-semibold text-emerald-600 mb-3">
            Upload Prescription
          </h3>

          <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any instructions for pharmacist (e.g. urgent, brand preference)..."
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prescription file</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="w-full"
                required
              />
              {file && <p className="text-xs mt-1 text-gray-500">Selected: {file.name}</p>}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-md text-white ${submitting ? "bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"}`}
                disabled={submitting}
              >
                {submitting ? "Uploading..." : "Upload"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
