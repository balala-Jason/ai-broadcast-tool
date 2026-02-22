"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Package,
  Loader2
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  category: string;
  origin: string | null;
  price: string | null;
  specification: string | null;
  selling_points: string | null;
  certificates: string | null;
  prohibited_words: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    origin: "",
    price: "",
    specification: "",
    sellingPoints: "",
    certificates: "",
    prohibitedWords: "",
    description: "",
  });

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Load products failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        origin: product.origin || "",
        price: product.price || "",
        specification: product.specification || "",
        sellingPoints: product.selling_points || "",
        certificates: product.certificates || "",
        prohibitedWords: product.prohibited_words || "",
        description: product.description || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        category: "",
        origin: "",
        price: "",
        specification: "",
        sellingPoints: "",
        certificates: "",
        prohibitedWords: "",
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...(editingProduct ? { id: editingProduct.id } : {}),
        name: formData.name,
        category: formData.category,
        origin: formData.origin || null,
        price: formData.price || null,
        specification: formData.specification || null,
        sellingPoints: formData.sellingPoints ? formData.sellingPoints.split("\n").filter(Boolean) : null,
        certificates: formData.certificates ? formData.certificates.split("\n").filter(Boolean) : null,
        prohibitedWords: formData.prohibitedWords ? formData.prohibitedWords.split("\n").filter(Boolean) : null,
        description: formData.description || null,
      };

      const response = await fetch("/api/products", {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setIsDialogOpen(false);
        loadProducts();
      }
    } catch (error) {
      console.error("Save product failed:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个产品吗？")) return;
    
    try {
      await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      loadProducts();
    } catch (error) {
      console.error("Delete product failed:", error);
    }
  };

  const categories = [
    "水果", "蔬菜", "粮食", "肉类", "禽蛋", "水产", "茶叶", "干货", "其他"
  ];

  return (
    <MainLayout>
      <div className="p-4 md:p-6 pb-20 md:pb-6">
        <PageHeader title="产品管理" description="管理农产品信息，为话术生成提供素材">
          <Button size="sm" onClick={() => handleOpenDialog()} className="h-9">
            <Plus className="w-4 h-4 mr-1" />
            添加产品
          </Button>
        </PageHeader>

        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-slate-500">
                <Package className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">暂无产品，点击上方按钮添加</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden shadow-sm">
                    <CardHeader className="p-3 md:p-4 pb-2 md:pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base md:text-lg line-clamp-1">{product.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                            {product.origin && (
                              <span className="text-xs text-slate-500 truncate">{product.origin}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 pt-0">
                      {product.price && (
                        <p className="text-xl md:text-2xl font-bold text-emerald-600 mb-2">
                          ¥{product.price}
                        </p>
                      )}
                      {product.specification && (
                        <p className="text-xs md:text-sm text-slate-500 mb-2 line-clamp-1">{product.specification}</p>
                      )}
                      {product.selling_points && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-400 mb-1">卖点：</p>
                          <div className="flex flex-wrap gap-1">
                            {JSON.parse(product.selling_points).slice(0, 3).map((point: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {point}
                              </Badge>
                            ))}
                            {JSON.parse(product.selling_points).length > 3 && (
                              <Badge variant="outline" className="text-xs text-slate-400">
                                +{JSON.parse(product.selling_points).length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 新增/编辑对话框 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] md:max-w-2xl max-h-[85vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{editingProduct ? "编辑产品" : "添加产品"}</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                填写产品信息，用于生成直播话术
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-3 md:gap-4 py-3 md:py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="name" className="text-sm">产品名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：山东烟台红富士苹果"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="category" className="text-sm">品类 *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="选择品类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="origin" className="text-sm">产地</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="如：山东烟台"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="price" className="text-sm">价格</Label>
                  <Input
                    id="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="如：39.9"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="specification" className="text-sm">规格</Label>
                <Input
                  id="specification"
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  placeholder="如：5斤装/箱，单果重200g以上"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="sellingPoints" className="text-sm">卖点（每行一个）</Label>
                <Textarea
                  id="sellingPoints"
                  value={formData.sellingPoints}
                  onChange={(e) => setFormData({ ...formData, sellingPoints: e.target.value })}
                  placeholder="脆甜多汁&#10;产地直发&#10;新鲜采摘"
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="certificates" className="text-sm">资质证书（每行一个）</Label>
                <Textarea
                  id="certificates"
                  value={formData.certificates}
                  onChange={(e) => setFormData({ ...formData, certificates: e.target.value })}
                  placeholder="有机认证&#10;绿色食品认证"
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="prohibitedWords" className="text-sm">禁用宣传语（每行一个）</Label>
                <Textarea
                  id="prohibitedWords"
                  value={formData.prohibitedWords}
                  onChange={(e) => setFormData({ ...formData, prohibitedWords: e.target.value })}
                  placeholder="最甜&#10;第一&#10;绝对"
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="description" className="text-sm">产品描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="详细的产品介绍..."
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!formData.name || !formData.category}>
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
