"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Camera, Plus, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface ProgressEntry {
  id: string;
  photo_url: string | null;
  weight_kg: number | null;
  body_fat_pct: number | null;
  notes: string | null;
  logged_at: string;
}

export default function ProgressPage() {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("progress_entries")
        .select("*")
        .order("logged_at", { ascending: false })
        .limit(50);
      if (data) setEntries(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let photoUrl: string | null = null;
    if (base64) {
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { data: upload } = await supabase.storage
        .from("progress")
        .upload(fileName, Buffer.from(base64, "base64"), { contentType: "image/jpeg" });
      if (upload) {
        const { data: urlData } = supabase.storage.from("progress").getPublicUrl(upload.path);
        photoUrl = urlData.publicUrl;
      }
    }

    const { data: entry } = await supabase
      .from("progress_entries")
      .insert({
        user_id: user.id,
        photo_url: photoUrl,
        weight_kg: weight ? parseFloat(weight) : null,
        body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
        notes: notes || null,
      })
      .select()
      .single();

    if (entry) {
      setEntries((prev) => [entry, ...prev]);
    }

    setShowForm(false);
    setPreview(null);
    setBase64(null);
    setWeight("");
    setBodyFat("");
    setNotes("");
    setSaving(false);
  }

  if (loading) {
    return <div className="py-12 text-center text-zinc-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Progress</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Track your transformation over time</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Log Progress
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Progress Entry</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <PhotoUpload
              onUpload={(_file, b64) => { setBase64(b64); setPreview(`data:image/jpeg;base64,${b64}`); }}
              preview={preview}
              onClear={() => { setPreview(null); setBase64(null); }}
              label="Progress photo"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input id="weight" label="Weight (kg)" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
              <Input id="bf" label="Body Fat %" type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
            </div>
            <Input id="notes" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How are you feeling?" />
            <Button onClick={handleSave} className="w-full" loading={saving}>
              Save Entry
            </Button>
          </div>
        </Card>
      )}

      {entries.length === 0 && !showForm ? (
        <EmptyState
          icon={TrendingUp}
          title="No progress entries yet"
          description="Log your first progress photo and measurements"
          action={
            <Button onClick={() => setShowForm(true)}>
              <Camera className="h-4 w-4" /> Log Progress
            </Button>
          }
        />
      ) : (
        <>
          {/* Weight trend */}
          {entries.some((e) => e.weight_kg) && (
            <Card>
              <CardHeader>
                <CardTitle>Weight Trend</CardTitle>
              </CardHeader>
              <div className="flex items-end gap-1 h-24">
                {entries
                  .filter((e) => e.weight_kg)
                  .slice(0, 20)
                  .reverse()
                  .map((entry, i, arr) => {
                    const min = Math.min(...arr.map((e) => e.weight_kg!));
                    const max = Math.max(...arr.map((e) => e.weight_kg!));
                    const range = max - min || 1;
                    const height = ((entry.weight_kg! - min) / range) * 100;
                    return (
                      <div
                        key={entry.id}
                        className="flex-1 rounded-t bg-zinc-900 dark:bg-white transition-all"
                        style={{ height: `${Math.max(height, 10)}%` }}
                        title={`${entry.weight_kg} kg — ${formatDate(entry.logged_at)}`}
                      />
                    );
                  })}
              </div>
            </Card>
          )}

          {/* Photo grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {entries.map((entry) => (
              <div key={entry.id} className="space-y-2">
                {entry.photo_url ? (
                  <img
                    src={entry.photo_url}
                    alt="Progress"
                    className="aspect-[3/4] w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                    <Camera className="h-8 w-8 text-zinc-300" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-zinc-900 dark:text-white">
                    {entry.weight_kg && `${entry.weight_kg} kg`}
                    {entry.weight_kg && entry.body_fat_pct && " • "}
                    {entry.body_fat_pct && `${entry.body_fat_pct}% BF`}
                  </p>
                  <p className="text-xs text-zinc-400">{formatDate(entry.logged_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
