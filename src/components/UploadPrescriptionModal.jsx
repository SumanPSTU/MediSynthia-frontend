import React, { useState, useCallback } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { toast } from "react-hot-toast";

export default function UploadPrescriptionModal({ open, onClose, onSuccess }) {
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setErrors((prev) => ({
        ...prev,
        file: "Only PNG, JPG, or PDF files are allowed",
      }));
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        file: "File too large. Max 5MB allowed",
      }));
      return;
    } 

    setFile(selectedFile);
    setFilePreview(
      selectedFile.type.startsWith("image/")
        ? URL.createObjectURL(selectedFile)
        : null
    );
    setErrors((prev) => ({ ...prev, file: null }));
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!file) {
      newErrors.file = "Please attach a prescription file";
    }
    if (!notes.trim()) {
      newErrors.notes = "Please add some notes or instructions";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("notes", notes.trim());

      const token = localStorage.getItem("token");
      const res = await axiosClient.post("/prescription/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res?.data?.success) {
        toast.success(res.data.message || "Prescription uploaded successfully!");
        setNotes("");
        setFile(null);
        setFilePreview(null);
        onSuccess && onSuccess(res.data.prescription);
        onClose();
      } else {
        toast.error(res?.data?.message || "Upload failed");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Server error during upload";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-prescription-title"
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3
                  id="upload-prescription-title"
                  className="text-lg font-semibold text-gray-800"
                >
                  Upload Prescription
                </h3>
                <p className="text-sm text-gray-500">
                  Upload your prescription for review
                </p>
              </div>
            </div>
            <button
              aria-label="Close"
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              disabled={submitting}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* File Upload Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Prescription File <span className="text-red-500">*</span>
                </label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300
                    ${
                      isDragging
                        ? "border-emerald-500 bg-emerald-50"
                        : errors.file
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300 hover:border-emerald-400 hover:bg-gray-50"
                    }
                    ${file ? "border-solid" : ""}
                  `}
                >
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    disabled={submitting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  {file ? (
                    <div className="relative">
                      {filePreview ? (
                        <div className="relative inline-block">
                          <img
                            src={filePreview}
                            alt="Prescription preview"
                            className="max-h-40 rounded-lg object-contain shadow-md"
                          />
                          <button
                            type="button"
                            onClick={removeFile}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100 transition"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-8 h-8 text-emerald-600" />
                          </div>
                          <p className="text-gray-700 font-medium truncate max-w-xs mx-auto">
                            {file.name}
                          </p>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100 transition"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-center gap-2 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-4">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors ${
                          isDragging ? "bg-emerald-100" : "bg-gray-100"
                        }`}
                      >
                        <Upload
                          className={`w-8 h-8 ${
                            isDragging ? "text-emerald-600" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <p className="text-gray-600 font-medium">
                        Drop file here or click to upload
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Supports PNG, JPG, PDF (Max 5MB)
                      </p>
                    </div>
                  )}
                </div>

                {errors.file && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.file}
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notes / Instructions{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors((prev) => ({ ...prev, notes: null }));
                    }
                  }}
                  placeholder="Any instructions for the pharmacist (e.g., urgent, brand preference, dosage changes...)"
                  rows={4}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl appearance-none resize-none
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                    transition-all duration-200
                    ${
                      errors.notes
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 hover:border-emerald-300"
                    }
                  `}
                  disabled={submitting}
                />
                {errors.notes && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.notes}
                  </div>
                )}
                <p className="text-xs text-gray-400 text-right">
                  {notes.length}/500 characters
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl
                    hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium transition-all
                    ${
                      submitting
                        ? "bg-emerald-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg transform hover:-translate-y-0.5"
                    }
                  `}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload Prescription
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

