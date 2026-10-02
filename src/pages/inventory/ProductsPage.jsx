import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LuPackage, LuTag } from "react-icons/lu";
import { productsService, categoriesService, brandsService } from "../../services/inventoryService";
import { suppliersService } from "../../services/suppliersService";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => productsService.list({ search }),
  });

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => categoriesService.list() });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: () => brandsService.list() });
  const { data: suppliers } = useQuery({ queryKey: ["suppliers"], queryFn: () => suppliersService.list() });

  const createMutation = useMutation({
    mutationFn: productsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setModalOpen(false);
    },
  });

  const products = data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Everything you sell, with stock, pricing, and supplier info in one place."
        search={search}
        onSearchChange={setSearch}
        onAdd={() => setModalOpen(true)}
        addLabel="Add product"
      />

      <DataTable
        isLoading={isLoading}
        rows={products}
        rowKey={(p) => p.id}
        emptyState={
          <EmptyState
            title="No products yet"
            message="Add your first product to start tracking stock and pricing."
            action={
              <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-lg bg-till-500 text-ink-950 text-sm font-medium">
                Add product
              </button>
            }
          />
        }
        columns={[
          { key: "image", header: "", accessor: (p) => (
            p.image ? (
              <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-paper-200" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-paper-100 border border-paper-200 flex items-center justify-center text-ink-700/30">
                <LuPackage className="w-4 h-4" />
              </div>
            )
          )},
          { key: "name", header: "Product", accessor: (p) => (
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-ink-700/50">{p.sku}{p.barcode ? ` · ${p.barcode}` : ""}</p>
            </div>
          )},
          { key: "category", header: "Category", accessor: (p) => p.category_name || "—" },
          { key: "brand", header: "Brand", accessor: (p) => p.brand_name || "—" },
          { key: "stock", header: "Stock", accessor: (p) => (
            <div className="flex items-center gap-2">
              <span>{p.current_stock} {p.unit}</span>
              {p.is_low_stock && <Badge tone="rose">Low stock</Badge>}
            </div>
          )},
          { key: "price", header: "Selling price", accessor: (p) => (
            <div>
              <span className={p.is_offer_active ? "line-through text-ink-700/40 text-xs mr-1.5" : ""}>
                KES {p.selling_price}
              </span>
              {p.is_offer_active && (
                <span className="font-medium text-till-600">
                  KES {(p.selling_price * (1 - p.effective_discount_percent / 100)).toFixed(2)}
                </span>
              )}
            </div>
          )},
          { key: "offer", header: "Offer", accessor: (p) => (
            p.is_offer_active ? (
              <Badge tone="mint">
                <LuTag className="w-3 h-3 inline mr-1" />
                {p.discount_type === "fixed" ? `KES ${p.discount_amount} off` : `${p.discount_percent}% off`}
              </Badge>
            ) : "—"
          )},
          { key: "status", header: "Status", accessor: (p) => (
            <Badge tone={p.status === "active" ? "mint" : "neutral"}>{p.status}</Badge>
          )},
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add product" width="max-w-lg">
        <ProductForm
          categories={categories?.results ?? []}
          brands={brands?.results ?? []}
          suppliers={suppliers?.results ?? []}
          onSubmit={(values) => createMutation.mutate(values)}
          loading={createMutation.isPending}
          serverError={createMutation.error?.response?.data}
        />
      </Modal>
    </div>
  );
}

function ProductForm({ categories, brands, suppliers, onSubmit, loading, serverError }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { discount_type: "percentage", is_on_offer: false },
  });
  const [imagePreview, setImagePreview] = useState(null);
  const discountType = watch("discount_type");
  const isOnOffer = watch("is_on_offer");

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const submit = (values) => {
    onSubmit({ ...values, image: values.image?.[0] || undefined });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Product name</label>
          <input {...register("name", { required: true })} className="input" />
          {errors.name && <p className="text-rose-500 text-xs mt-1">Required</p>}
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">SKU</label>
          <input {...register("sku", { required: true })} className="input" />
          {errors.sku && <p className="text-rose-500 text-xs mt-1">Required</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Barcode</label>
          <input {...register("barcode")} className="input" placeholder="Scan or type barcode" />
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Product image</label>
          <input type="file" accept="image/*" {...register("image", { onChange: handleImageChange })} className="input py-1.5" />
          {imagePreview && <img src={imagePreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover mt-1.5 border border-paper-200" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Category</label>
          <select {...register("category")} className="input">
            <option value="">None</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Brand</label>
          <select {...register("brand")} className="input">
            <option value="">None</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Supplier</label>
        <select {...register("supplier")} className="input">
          <option value="">None</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Buying price</label>
          <input type="number" step="0.01" {...register("buying_price", { required: true })} className="input" />
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Selling price</label>
          <input type="number" step="0.01" {...register("selling_price", { required: true })} className="input" />
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Current stock</label>
          <input type="number" step="0.01" {...register("current_stock")} className="input" defaultValue={0} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Minimum stock</label>
          <input type="number" step="0.01" {...register("minimum_stock")} className="input" defaultValue={0} />
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Unit</label>
          <select {...register("unit")} className="input" defaultValue="piece">
            <option value="piece">Piece</option>
            <option value="kg">Kilogram</option>
            <option value="litre">Litre</option>
            <option value="box">Box</option>
            <option value="pack">Pack</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-paper-200 p-3.5 space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-ink-900">
          <input type="checkbox" {...register("is_on_offer")} className="rounded" />
          Discount / offer on this product
        </label>
        {isOnOffer && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-ink-700/70 mb-1.5">Discount type</label>
              <select {...register("discount_type")} className="input">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount (KES)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink-700/70 mb-1.5">
                {discountType === "fixed" ? "Amount off (KES)" : "Percent off (%)"}
              </label>
              <input
                type="number" step="0.01"
                {...register(discountType === "fixed" ? "discount_amount" : "discount_percent")}
                className="input"
                placeholder={discountType === "fixed" ? "e.g. 50" : "e.g. 10"}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-ink-700/70 mb-1.5">Offer expires (optional)</label>
              <input type="date" {...register("offer_expires_at")} className="input" />
            </div>
          </div>
        )}
      </div>

      {serverError && (
        <p className="text-rose-500 text-sm">{Object.values(serverError).flat().join(" ")}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm hover:bg-till-400 transition-colors disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
