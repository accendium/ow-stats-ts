import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Field } from "@/components/ui/field";

const ROLES = ["All", "Tank", "Damage", "Support"];
const TIERS = [
  "All",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Master",
  "Grandmaster",
];
const MAPS = [
  "all-maps",
  "busan",
  "ilios",
  "lijiang-tower",
  "nepal",
  "oasis",
  "samoa",
  "circuit-royal",
  "dorado",
  "havana",
  "junkertown",
  "rialto",
  "route-66",
  "shambali-monastery",
  "watchpoint-gibraltar",
  "aatlis",
  "new-junk-city",
  "suravasa",
  "blizzard-world",
  "eichenwalde",
  "hollywood",
  "kings-row",
  "midtown",
  "numbani",
  "paraiso",
  "colosseo",
  "esperanca",
  "new-queen-street",
  "runasapi",
];

type HeroData = {
  id: string;
  cells: {
    name: string;
    pickrate: number;
    winrate: number;
  };
  hero: {
    color: string;
    name: string;
    portrait: string;
    role: string;
    roleIcon: string;
  };
};

type HeroTableProps = {
  initialData: { rates: HeroData[] };
  onSelectTier?: (tier: string) => void
};

export function HeroTable({ initialData, onSelectTier: onSelectTier }: HeroTableProps) {
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedTier, setSelectedTier] = useState("All");
  const handleSelectedTier = (tier: string) => {
    setSelectedTier(tier);
    onSelectTier?.(tier);
  }

  return (
    <>
      <Field orientation="horizontal">
        <Select onValueChange={(value) => setSelectedRole(value ?? "All")}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              <SelectLabel>Role</SelectLabel>
              {ROLES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => handleSelectedTier(value ?? "All")}>
          <SelectTrigger>
            <SelectValue placeholder="Select a tier" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              <SelectLabel>Tier</SelectLabel>
              {TIERS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Table>
        <TableCaption>
          Sourced from Blizzard's API. Hero data is updated every patch.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Hero</TableHead>
            <TableHead>Pick Rate</TableHead>
            <TableHead>Win Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialData.rates
            .filter(
              (entry) =>
                selectedRole === "All" ||
                entry.hero.role === selectedRole.toUpperCase(),
            )
            .map((hero: HeroData) => (
              <TableRow key={hero.id}>
                <TableCell>{hero.cells.name}</TableCell>
                <TableCell>{hero.cells.pickrate / 2}%</TableCell>
                <TableCell>{hero.cells.winrate}%</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </>
  );
}
