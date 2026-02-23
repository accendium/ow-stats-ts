import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  MAPS,
  TIERS,
  ROLES,
  OWMap,
  OWTier,
  OWRole,
  OWRegion,
  REGIONS,
} from '@/lib/overwatch-constants'

type HeroQueryFieldsProps = {
  role: OWRole
  tier: OWTier
  map: OWMap
  region: OWRegion
  onSelectRole?: (role: OWRole) => void
  onSelectTier?: (tier: OWTier) => void
  onSelectMap?: (map: OWMap) => void
  onSelectRegion?: (region: OWRegion) => void
}

export function HeroQueryFields({
  role,
  tier,
  map,
  region,
  onSelectRole,
  onSelectTier,
  onSelectMap,
  onSelectRegion,
}: HeroQueryFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Field>
        <FieldLabel>Role</FieldLabel>
        <Select
          value={role}
          onValueChange={(value) => onSelectRole?.(value as OWRole)}
        >
          <SelectTrigger className="w-full">
            <SelectValue>{role}</SelectValue>
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
      </Field>
      <Field>
        <FieldLabel>Tier</FieldLabel>
        <Select
          value={tier}
          onValueChange={(value) => onSelectTier?.(value as OWTier)}
        >
          <SelectTrigger className="w-full">
            <SelectValue>{tier}</SelectValue>
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
      <Field>
        <FieldLabel>Map</FieldLabel>
        <Select
          value={map}
          onValueChange={(value) => onSelectMap?.(value as OWMap)}
        >
          <SelectTrigger className="w-full">
            <SelectValue>{map.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</SelectValue>
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              <SelectLabel>Map</SelectLabel>
              {MAPS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Region</FieldLabel>
        <Select
          value={region}
          onValueChange={(value) => onSelectRegion?.(value as OWRegion)}
        >
          <SelectTrigger className="w-full">
            <SelectValue>{region}</SelectValue>
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              <SelectLabel>Region</SelectLabel>
              {REGIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}
