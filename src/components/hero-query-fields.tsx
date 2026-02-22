import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field } from '@/components/ui/field'
import { MAPS, TIERS, ROLES } from '@/lib/blizzard-params'

type HeroQueryFieldsProps = {
  onSelectRole?: (role: string) => void
  onSelectTier?: (tier: string) => void
  onSelectMap?: (map: string) => void
}

export function HeroQueryFields({
  onSelectRole,
  onSelectTier,
  onSelectMap,
}: HeroQueryFieldsProps) {
  return (
    <Field orientation="horizontal">
      <Select onValueChange={(value) => onSelectRole?.(value ?? 'All')}>
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

      <Select onValueChange={(value) => onSelectTier?.(value ?? 'All')}>
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

      <Select onValueChange={(value) => onSelectMap?.(value ?? 'all-maps')}>
        <SelectTrigger>
          <SelectValue placeholder="Select a map" />
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
  )
}
