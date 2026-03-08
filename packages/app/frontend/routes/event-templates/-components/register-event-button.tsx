import { Button } from '@frontend/components/ui/button'
import { Link } from '@tanstack/react-router'
import { CalendarPlusIcon } from 'lucide-react'

type Props = {
  id: string
  size?: React.ComponentProps<typeof Button>['size']
}

export const RegisterEventButton: React.FC<Props> = ({ id, size }) => {
  return (
    <Button asChild size={size}>
      <Link to="/event-templates/$id/register" params={{ id }}>
        <CalendarPlusIcon />
        イベントを作成
      </Link>
    </Button>
  )
}
