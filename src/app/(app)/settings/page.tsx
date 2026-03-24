"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Check, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goal, setGoal] = useState("");
  const [dietType, setDietType] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setName(profile.full_name || "");
        setAge(profile.age ? String(profile.age) : "");
        setGender(profile.gender || "");
        setHeightCm(profile.height_cm ? String(profile.height_cm) : "");
        setWeightKg(profile.weight_kg ? String(profile.weight_kg) : "");
        setGoal(profile.goal || "");
        setDietType(profile.diet_type || "");
        setCalories(profile.calorie_target ? String(profile.calorie_target) : "");
        setProtein(profile.protein_g ? String(profile.protein_g) : "");
        setCarbs(profile.carbs_g ? String(profile.carbs_g) : "");
        setFat(profile.fat_g ? String(profile.fat_g) : "");
        setPhilosophy(profile.training_philosophy || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      full_name: name || null,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      goal: goal || null,
      diet_type: dietType || null,
      calorie_target: calories ? parseInt(calories) : null,
      protein_g: protein ? parseInt(protein) : null,
      carbs_g: carbs ? parseInt(carbs) : null,
      fat_g: fat ? parseInt(fat) : null,
      training_philosophy: philosophy || null,
    }).eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <div className="py-12 text-center text-zinc-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage your profile and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <Input id="name" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <Input id="age" label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            <div className="space-y-1.5">
              <label htmlFor="gender" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Gender</label>
              <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input id="height" label="Height (cm)" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          </div>
          <Input id="weightkg" label="Weight (kg)" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nutrition Goals</CardTitle>
          <CardDescription>Your daily targets</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="goal" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Goal</label>
              <select id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <option value="">Select</option>
                <option value="cut">Cut</option>
                <option value="bulk">Bulk</option>
                <option value="recomp">Recomp</option>
                <option value="maintain">Maintain</option>
              </select>
            </div>
            <Input id="diettype" label="Diet Type" value={dietType} onChange={(e) => setDietType(e.target.value)} placeholder="e.g., Keto, Vegan" />
          </div>
          <Input id="cals" label="Daily Calorie Target" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <Input id="prot" label="Protein (g)" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
            <Input id="carb" label="Carbs (g)" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            <Input id="fats" label="Fat (g)" type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training</CardTitle>
          <CardDescription>Your training preferences</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <Input id="phil" label="Training Philosophy" value={philosophy} onChange={(e) => setPhilosophy(e.target.value)} placeholder="e.g., Push/Pull/Legs, Starting Strength" />
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving} className="flex-1">
          {saved ? <><Check className="h-4 w-4" /> Saved!</> : "Save Changes"}
        </Button>
        <Button variant="ghost" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
