import { Suspense } from "react"

import { SigninForm } from "./signinForm"

export default function Page() {
  return (
    <Suspense>
      <SigninForm />
    </Suspense>
  )
}
