import React, { useState, useEffect, useMemo } from "react";
import { Building2, Plus, Loader2, Search } from "lucide-react";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { useToast } from "../components/ui/Toast";
import { Modal } from "../components/ui/Modal";
import { DataTable } from "../components/ui/DataTable";
import { branchesApi } from "../lib/api";

export function Branches() {
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
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
      setIsLoading(true);
      const data = await branchesApi.list();
      setBranches(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      addToast(error.message || "Failed to fetch branches", "error");
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
      const newBranch = await branchesApi.create(formData);
      addToast("Branch created successfully", "success");
      setBranches((prev) => [...prev, newBranch]);
      setIsModalOpen(false);
      setFormData({ name: "", location: "" });
    } catch (error) {
      addToast(error.message || "Failed to create branch", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBranches = useMemo(() => {
    if (!search.trim()) return branches;
    const term = search.toLowerCase();
    return branches.filter(
      (b) =>
        b.name?.toLowerCase().includes(term) ||
        b.location?.toLowerCase().includes(term)
    );
  }, [branches, search]);

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
      <div className="flex h-64 items-center justify-center">
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
        <div className="p-4 border-b border-border bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-text-secondary" />
            <h2 className="font-bold text-text-primary">Branch List</h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="stitch-input pl-9 w-full text-xs py-1.5"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredBranches}
          keyField="id"
          emptyState={{
            title: search ? "No matching branches" : "No branches found",
            description: search
              ? "Try adjusting your search keyword."
              : "Create your first branch using the button above.",
          }}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Branch"
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
