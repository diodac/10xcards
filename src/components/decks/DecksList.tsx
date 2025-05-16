import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // TODO: Uncomment after adding Table component via Shadcn/ui
import { PlusCircle } from "lucide-react"; // Icon for the button

// Define the type for a single deck based on the API plan
interface Deck {
  id: string;
  name: string;
  created_at: string; // Assuming string representation for simplicity, adjust if Date objects are used
  updated_at: string; // Assuming string representation
  // user_id: string; // Not displayed in the table for now
}

// Mock data for now, will be replaced by API call
const mockDecks: Deck[] = [
  // { id: '1', name: 'Przykladowy Zestaw 1', created_at: '2024-07-01', updated_at: '2024-07-02' },
  // { id: '2', name: 'Słówka z Angielskiego', created_at: '2024-06-25', updated_at: '2024-06-28' },
  // { id: '3', name: 'Historia Polski - Daty', created_at: '2024-05-10', updated_at: '2024-05-12' },
];

const DecksList: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [decks, setDecks] = React.useState<Deck[]>(mockDecks);

  // In the future, decks would be fetched here using useEffect and an API call
  // React.useEffect(() => {
  //   // fetchDecksApi().then(data => setDecks(data));
  // }, []);

  const handleNavigateToGenerate = () => {
    // Astro uses file-based routing, so a simple anchor tag or window.location is often sufficient
    // For client-side components potentially used in different contexts, ensure this aligns with Astro's navigation patterns.
    window.location.href = "/ai/generate";
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Twoje Zestawy Fiszek</h1>
        <Button onClick={handleNavigateToGenerate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Stwórz Nowy Zestaw (AI)
        </Button>
      </div>
      <Table>
        <TableCaption>Lista Twoich zestawów fiszek.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Nazwa Zestawu</TableHead>
            <TableHead>Data Utworzenia</TableHead>
            <TableHead>Ostatnia Modyfikacja</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Nie masz jeszcze żadnych zestawów fiszek.
              </TableCell>
            </TableRow>
          ) : (
            decks.map((deck) => (
              <TableRow key={deck.id}>
                <TableCell className="font-medium">{deck.name}</TableCell>
                <TableCell>{new Date(deck.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(deck.updated_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="mr-2">
                    Pokaż
                  </Button>
                  <Button variant="outline" size="sm">
                    Edytuj
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DecksList;
