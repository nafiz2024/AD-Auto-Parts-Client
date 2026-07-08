"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { routes } from "@/constants/routes";
import { useLanguage } from "@/hooks/use-language";

const fallbackModels = [
  { value: "corolla", label: "Corolla" },
  { value: "camry", label: "Camry" },
  { value: "civic", label: "Civic" },
  { value: "patrol", label: "Patrol" },
];

const fallbackYears = ["2024", "2022", "2020", "2018", "2016", "2014"];
const fallbackPartCategories = [
  "Headlight",
  "Alternator",
  "Brake Rotor",
  "Suspension Arm",
  "Engine Mount",
];

export function CompatibilityFinder({ brands = [] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({
    brand: brands[0]?.slug ?? brands[0]?.id ?? "",
    model: fallbackModels[0].value,
    year: fallbackYears[0],
    category: fallbackPartCategories[0],
  });

  function updateField(name, value) {
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (form.brand) params.set("brand", form.brand);
    if (form.model) params.set("model", form.model);
    if (form.year) params.set("year", form.year);
    if (form.category) params.set("partCategory", form.category);
    router.push(`${routes.public.compatibility}?${params.toString()}`);
  }

  return (
    <Card className="relative -mt-8 rounded-[2rem] px-5 py-4 sm:px-6 lg:-mt-10">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-2xl">{t("findCompatibleParts")}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <form className="grid gap-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t("selectCarBrand")}</label>
            <Select value={form.brand} onChange={(event) => updateField("brand", event.target.value)}>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.slug ?? brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t("selectCarModel")}</label>
            <Select value={form.model} onChange={(event) => updateField("model", event.target.value)}>
              {fallbackModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t("selectYear")}</label>
            <Select value={form.year} onChange={(event) => updateField("year", event.target.value)}>
              {fallbackYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t("selectPartCategory")}</label>
            <Select value={form.category} onChange={(event) => updateField("category", event.target.value)}>
              {fallbackPartCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" size="lg" className="w-full xl:w-auto">
              {t("findMatchingParts")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
