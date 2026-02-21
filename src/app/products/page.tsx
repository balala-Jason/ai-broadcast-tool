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
  DialogTrigger,
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

  // 加载产品列表
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

  // 打开新增/编辑对话框
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

  // 保存产品
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

  // 删除产品
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
      <div className="p-6">
        <PageHeader title="产品管理" description="管理农产品信息，为话术生成提供素材">
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            添加产品
          </Button>
        </PageHeader>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无产品，点击上方按钮添加</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{product.category}</Badge>
                            {product.origin && (
                              <span className="text-sm text-slate-500">{product.origin}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleOpenDialog(product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {product.price && (
                        <p className="text-2xl font-bold text-emerald-600 mb-2">
                          ¥{product.price}
                        </p>
                      )}
                      {product.specification && (
                        <p className="text-sm text-slate-500 mb-2">{product.specification}</p>
                      )}
                      {product.selling_points && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-400 mb-1">卖点：</p>
                          <div className="flex flex-wrap gap-1">
                            {JSON.parse(product.selling_points).map((point: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {point}
                              </Badge>
                            ))}
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "编辑产品" : "添加产品"}</DialogTitle>
              <DialogDescription>
                填写产品信息，用于生成直播话术
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">产品名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：山东烟台红富士苹果"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">品类 *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">产地</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="如：山东烟台"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">价格</Label>
                  <Input
                    id="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="如：39.9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specification">规格</Label>
                <Input
                  id="specification"
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  placeholder="如：5斤装/箱，单果重200g以上"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPoints">卖点（每行一个）</Label>
                <Textarea
                  id="sellingPoints"
                  value={formData.sellingPoints}
                  onChange={(e) => setFormData({ ...formData, sellingPoints: e.target.value })}
                  placeholder="脆甜多汁&#10;产地直发&#10;新鲜采摘"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificates">资质证书（每行一个）</Label>
                <Textarea
                  id="certificates"
                  value={formData.certificates}
                  onChange={(e) => setFormData({ ...formData, certificates: e.target.value })}
                  placeholder="有机认证&#10;绿色食品认证"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prohibitedWords">禁用宣传语（每行一个）</Label>
                <Textarea
                  id="prohibitedWords"
                  value={formData.prohibitedWords}
                  onChange={(e) => setFormData({ ...formData, prohibitedWords: e.target.value })}
                  placeholder="最甜&#10;第一&#10;绝对"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">产品描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="详细的产品介绍..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={!formData.name || !formData.category}>
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
