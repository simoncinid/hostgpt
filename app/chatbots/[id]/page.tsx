import { redirect } from 'next/navigation'

interface Params {
  params: { id: string }
}

export default function Page({ params }: Params) {
  redirect(`/dashboard/chatbots/${params.id}`)
}


