import type { LucideProps } from 'lucide-react'
import {
  Baby,
  Book,
  Briefcase,
  Bus,
  Car,
  Coffee,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Music,
  PiggyBank,
  Plane,
  Plus,
  Shirt,
  ShoppingCart,
  Tag,
  TrendingDown,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react'

import type { CategoryColor, CategoryIcon } from './types'

const iconMap: Record<string, React.FC<LucideProps>> = {
  tag: Tag,
  wallet: Wallet,
  trending_up: TrendingUp,
  trending_down: TrendingDown,
  piggy_bank: PiggyBank,
  house: House,
  utensils: Utensils,
  shopping_cart: ShoppingCart,
  car: Car,
  bus: Bus,
  plane: Plane,
  heart_pulse: HeartPulse,
  graduation_cap: GraduationCap,
  briefcase: Briefcase,
  music: Music,
  zap: Zap,
  wifi: Wifi,
  shirt: Shirt,
  dumbbell: Dumbbell,
  coffee: Coffee,
  gift: Gift,
  book: Book,
  baby: Baby,
  plus: Plus,
}

type Props = LucideProps & {
  icon: CategoryIcon
  color: CategoryColor
}

export function CategoryIcon({ icon, color, ...props }: Props) {
  const Icon = iconMap[icon] ?? Tag
  const iconColor = `var(--category-${color})`

  return <Icon {...props} color={iconColor} />
}
