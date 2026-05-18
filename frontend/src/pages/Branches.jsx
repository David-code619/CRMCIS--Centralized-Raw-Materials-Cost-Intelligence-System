import { useState, useEffect } from "react";
import { Building2, Plus, Loader2 } from "lucide-react";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { useToast } from "../components/ui/Toast";
import { Modal } from "../components/ui/Modal";
import { DataTable } from "../components/ui/DataTable";
import { apiFetch } from "../lib/api";

export function Branches() {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
  });
  const { addToast } = useToast();

  const fetchBranches = async () => {
    try {
      const res = await apiFetch("/api/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      } else {
        throw new Error("Failed to fetch branches");
      }
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) throw new Error(data?.error || "Failed to create branch");

      addToast("Branch created successfully", "success");
      setBranches((prev) => [...prev, data]);
      setIsModalOpen(false);
      setFormData({ name: "", location: "", contactInfo: "" });
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { accessor: "name", header: "Branch Name", sortable: true },
    { accessor: "location", header: "Location", sortable: true },
    {
      accessor: (item) => new Date(item.createdAt).toLocaleDateString(),
      header: "Created At",
      sortable: true,
      sortKey: "createdAt",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={[{ label: "Branches" }]} />
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Branches
          </h1>
          <p className="text-text-tertiary mt-1 font-medium">
            Manage organization branches.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="stitch-button-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Branch</span>
        </button>
      </div>

      <div className="stitch-card overflow-hidden">
        <div className="p-4 border-b border-border bg-background/50 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-text-secondary" />
          <h2 className="font-bold text-text-primary">Branch List</h2>
        </div>

        <DataTable
          columns={columns}
          data={branches}
          keyField="id"
          searchPlaceholder="Search branches..."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Branch"
        description="Add a new branch to the organization"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
              Branch Name
            </label>
            <input
              required
              type="text"
              className="stitch-input w-full"
              placeholder="e.g. Downtown Branch"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
              Location
            </label>
            <input
              type="text"
              className="stitch-input w-full"
              placeholder="e.g. 123 Main St, City"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 stitch-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 stitch-button-primary disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Create Branch"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
