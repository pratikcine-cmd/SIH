import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DoctorRecipeGenerator() {
  const navigate = useNavigate();
  const { requests } = useAppState();

  const search = new URLSearchParams(location.search);
  const pid = search.get("pid") || "";

  const [patientId, setPatientId] = useState<string>(pid);
  const [fetchedName, setFetchedName] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [mealName, setMealName] = useState("");

  type Recipe = {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    vitamins: string[];
    ayur: { rasa: string; virya: string; vipaka: string; guna: string[] };
    ingredients: string[];
    steps: string[];
  };

  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const fetchPatient = () => {
    const match = requests.find(
      (r) => r.userId.toLowerCase() === patientId.trim().toLowerCase(),
    );
    if (match) {
      setFetchedName(match.patientName || `Patient ${match.userId}`);
      setFetchError(null);
      setConfirmed(false);
    } else {
      setFetchedName(null);
      setFetchError("No patient found with that ID. Please re-enter.");
      setConfirmed(false);
    }
  };

  const macros = (kcal: number) => ({
    protein: Math.round((kcal * 0.2) / 4),
    carbs: Math.round((kcal * 0.55) / 4),
    fat: Math.round((kcal * 0.25) / 9),
  });

  const generateSingle = (meal: string): Recipe => {
    const base = 400 + Math.floor(Math.random() * 300);
    return {
      name: meal,
      calories: base,
      ...macros(base),
      vitamins: ["A", "B", "C"],
      ayur: {
        rasa: "Madhura",
        virya: "Ushna",
        vipaka: "Madhura",
        guna: ["Sattvic", "Light"],
      },
      ingredients: [
        `${meal} base ingredient`,
        "Seasonal vegetables",
        "Spices (cumin, turmeric, coriander)",
        "Ghee or oil",
        "Herbs (coriander/parsley)",
      ],
      steps: [
        "Prepare and wash ingredients.",
        "Heat pan and temper spices.",
        `Add ingredients to create ${meal}.`,
        "Simmer until cooked and flavors blend.",
        "Garnish and serve warm.",
      ],
    };
  };

  const onGenerate = () => {
    if (!confirmed || !mealName.trim()) return;
    setRecipe(generateSingle(mealName.trim()))
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recipe Generator</h1>
          <p className="text-muted-foreground">Enter Patient ID, confirm, then provide a meal name to get a single detailed recipe</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Identification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              placeholder="Enter Patient ID"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
            <Button onClick={fetchPatient}>Fetch Patient</Button>
          </div>
          {fetchedName && (
            <div className="mt-3 rounded-md border bg-secondary/30 p-3">
              <div className="font-medium">{fetchedName}</div>
              <div className="mt-2 text-sm">Is this the correct patient?</div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => setConfirmed(true)}>
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFetchedName(null);
                    setPatientId("");
                    setConfirmed(false);
                  }}
                >
                  No
                </Button>
              </div>
            </div>
          )}
          {fetchError && (
            <div className="mt-3 text-sm text-destructive">{fetchError}</div>
          )}
        </CardContent>
      </Card>

      <Card className={!confirmed ? "opacity-60 pointer-events-none" : ""}>
        <CardHeader>
          <CardTitle>Recipe Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              placeholder="Enter Meal Name (e.g., Moong Dal Khichdi)"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
            />
            <Button onClick={onGenerate}>Generate Recipe</Button>
          </div>
        </CardContent>
      </Card>

      {recipe && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">{recipe.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border mb-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Calories</TableHead>
                    <TableHead>Protein</TableHead>
                    <TableHead>Carbs</TableHead>
                    <TableHead>Fat</TableHead>
                    <TableHead>Vitamins</TableHead>
                    <TableHead>Ayurveda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{recipe.calories} kcal</TableCell>
                    <TableCell>{recipe.protein} g</TableCell>
                    <TableCell>{recipe.carbs} g</TableCell>
                    <TableCell>{recipe.fat} g</TableCell>
                    <TableCell>{recipe.vitamins.join(", ")}</TableCell>
                    <TableCell>
                      Rasa {recipe.ayur.rasa}, Virya {recipe.ayur.virya}, Vipaka {recipe.ayur.vipaka}, Guna {recipe.ayur.guna.join(", ")}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="mb-2 font-medium">Ingredients</div>
            <ul className="mb-3 list-disc pl-6 text-sm">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx}>{ing}</li>
              ))}
            </ul>
            <div className="mb-2 font-medium">Steps</div>
            <ol className="list-decimal pl-6 text-sm space-y-1">
              {recipe.steps.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    </div>
  );
}
