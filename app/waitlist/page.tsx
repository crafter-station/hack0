import { Waitlist } from '@clerk/nextjs'

export default function WaitlistPage() {
  return (
    <div className="bg-muted flex w-full flex-1 items-center justify-center p-6 md:p-10">
      <Waitlist />
    </div>
  )
}
